import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
const allowed = new Set(["snapshot", "calculate", "sensitivity"]);

async function forward(request: NextRequest, path: string[]) {
  if (path.length !== 1 || !allowed.has(path[0])) return new Response("Not found", { status: 404 });
  const origin = process.env.CAPITA_API_ORIGIN ?? "http://127.0.0.1:8000";
  try {
    const response = await fetch(`${origin}/api/${path[0]}`, {
      method: request.method,
      headers: request.method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: request.method === "POST" ? await request.text() : undefined,
      cache: "no-store",
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json; charset=utf-8" },
    });
  } catch {
    return Response.json({ error: "Python hesaplama servisine bağlanılamadı" }, { status: 502 });
  }
}

type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) { return forward(request, (await context.params).path); }
export async function POST(request: NextRequest, context: Context) { return forward(request, (await context.params).path); }
