"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Compass, ExternalLink, Globe2, Info, MapPin, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type CapitalFeature, type Mode, type Normalization, type Snapshot, formatNumber, indicatorLabels } from "@/lib/model";

const AtlasMap = dynamic(() => import("@/components/atlas-map").then(module => module.AtlasMap), { ssr: false });
const modeNames: Record<Mode, string> = { all_data: "Sekiz kategori", observed: "2025 gözlem modeli", exploratory: "Varsayımlı keşif" };
const normalizations: { value: Normalization; label: string }[] = [
  { value: "share", label: "Ham büyüklük payı" }, { value: "log", label: "Logaritmik" },
  { value: "minmax", label: "Min–max" }, { value: "rank", label: "Yüzdelik sıra" },
  { value: "max", label: "Maksimuma bölme" },
];

function CountryDetails({ country, snapshot }: { country: CapitalFeature; snapshot: Snapshot | null }) {
  const props = country.properties;
  const rows = snapshot?.observations[props.country_id];
  const contribution = snapshot?.contributions?.[props.country_id];
  return <Card className="border-stone-200/80 bg-white/95 shadow-sm">
    <CardHeader className="pb-2"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Seçilen başkent · {props.country_id}</p><CardTitle className="mt-1 text-xl">{props.capital_name}</CardTitle><p className="text-sm text-muted-foreground">{props.country_name}</p></div><MapPin className="mt-1 size-5 text-emerald-700" /></div></CardHeader>
    <CardContent className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2"><Badge variant="secondary">{country.geometry.coordinates[1].toFixed(3)}° enlem</Badge><Badge variant="secondary">{country.geometry.coordinates[0].toFixed(3)}° boylam</Badge><Badge variant="outline">Çekim payı {contribution ? `%${formatNumber(contribution.share * 100, 3)}` : "hesaplanmadı"}</Badge></div>
      <p className="text-xs text-muted-foreground">{props.selection_note} · <a className="inline-flex items-center gap-1 text-emerald-700 underline" href={props.source_url} target="_blank" rel="noopener noreferrer">Başkent kaynağı <ExternalLink className="size-3" /></a></p>
      <Separator />
      {rows ? <div className="space-y-2">{Object.entries(rows).map(([id, row]) => {
        const assumption = snapshot?.assumptions.find(item => item.country_id === props.country_id && item.indicator_id === id);
        const share = contribution?.category_shares[id];
        return <div className="rounded-lg border border-stone-100 bg-stone-50/80 p-2.5" key={id}>
          <div className="flex items-baseline justify-between gap-2"><span className="font-medium">{indicatorLabels[id] ?? id}</span><span className="text-right tabular-nums">{formatNumber(row.value)} <span className="text-xs text-muted-foreground">{row.unit}</span></span></div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground"><span>{row.reference_year ?? "Yıl yok"}</span><span>{row.status}</span><span>{share == null ? "Kategori katkısı yok" : `Kategori payı %${formatNumber(share * 100, 3)}`}</span>{row.source_url && <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">Kaynak</a>}</div>
          {assumption && <p className="mt-1 text-[11px] text-amber-800">Keşif girdisi: {assumption.kind}{assumption.actual_reference_year ? ` · gerçek yıl ${assumption.actual_reference_year}` : ""}</p>}
        </div>;
      })}</div> : <p className="text-muted-foreground">Veri yükleniyor…</p>}
      {contribution && <p className="text-xs text-muted-foreground">Bu başkentin vektör uzunluğu {formatNumber(contribution.length_km)} km.</p>}
    </CardContent>
  </Card>;
}

export default function Home() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState<CapitalFeature | null>(null);
  const [mode, setMode] = useState<Mode>("all_data");
  const [normalization, setNormalization] = useState<Normalization>("share");
  const [budget, setBudget] = useState(10000);
  const [weight, setWeight] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const calculate = useCallback(async (initial = false) => {
    setBusy(true); setError(null);
    try {
      const response = await fetch(initial ? "/api/snapshot" : "/api/calculate", initial ? undefined : {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ population_weight: weight / 100, budget_km: budget, mode, normalization }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      setSnapshot(payload as Snapshot);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Hesaplama yüklenemedi"); }
    finally { setBusy(false); }
  }, [weight, budget, mode, normalization]);
  useEffect(() => { void fetch("/api/snapshot").then(async response => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
    setSnapshot(payload as Snapshot);
  }).catch(cause => setError(cause instanceof Error ? cause.message : "Veri yüklenemedi")); }, []);

  const result = snapshot?.result;
  const coverage = useMemo(() => snapshot?.coverage ? Object.values(snapshot.coverage).reduce((sum, count) => sum + count, 0) : null, [snapshot]);
  const blocked = result?.status === "blocked_missing_data";

  return <main className="atlas-shell">
    <header className="atlas-header">
      <div className="flex items-center gap-3"><div className="brand-mark"><Globe2 className="size-5" /></div><div><div className="text-lg font-bold tracking-tight">Capita Atlas</div><div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Dünya başkent modeli</div></div></div>
      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex"><span>195 ülke</span><span className="size-1 rounded-full bg-stone-300" /><span>8 gösterge</span><span className="size-1 rounded-full bg-stone-300" /><span>WGS84</span></div>
      <Button variant="outline" size="sm" onClick={() => setResetSignal(value => value + 1)}><RotateCcw className="size-4" /><span className="hidden sm:inline">Haritayı sıfırla</span></Button>
    </header>

    <div className="atlas-workspace">
      <section className="atlas-map-area" aria-label="Dünya haritası"><AtlasMap snapshot={snapshot} onCountry={setSelected} onError={setMapError} resetSignal={resetSignal} />
        <div className="map-label"><Compass className="size-4 text-emerald-700" /><span>0°, 0° <span className="text-muted-foreground">başlangıç noktası</span></span><span className="mx-1 text-stone-300">→</span><span className="text-orange-700">model sonucu</span></div>
        {mapError && <div className="map-error">Harita: {mapError}</div>}
      </section>

      <aside className="atlas-sidebar"><ScrollArea className="h-full"><div className="space-y-4 p-4 pb-10 md:p-5">
        <div><p className="eyebrow">Etkiyi keşfet</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Dünya nereye çekiliyor?</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Göstergeleri seç, sonucu haritada incele ve her başkentin katkısını gör.</p></div>

        <Card className="border-stone-200/80 bg-white shadow-sm"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="size-4 text-emerald-700" /> Model ayarları</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="mode">Hesap modu</Label><Select value={mode} onValueChange={value => setMode(value as Mode)}><SelectTrigger id="mode" className="w-full"><SelectValue>{mode === "all_data" ? "Sekiz kategori · en güncel veri" : mode === "observed" ? "2025 iki kategori · gözlem" : "İki kategori · varsayımlı keşif"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all_data">Sekiz kategori · en güncel veri</SelectItem><SelectItem value="observed">2025 iki kategori · gözlem</SelectItem><SelectItem value="exploratory">İki kategori · varsayımlı keşif</SelectItem></SelectContent></Select></div>
          {mode === "all_data" ? <div className="space-y-1.5"><Label htmlFor="normalization">Normalizasyon</Label><Select value={normalization} onValueChange={value => setNormalization(value as Normalization)}><SelectTrigger id="normalization" className="w-full"><SelectValue>{normalizations.find(item => item.value === normalization)?.label}</SelectValue></SelectTrigger><SelectContent>{normalizations.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><p className="text-[11px] leading-4 text-muted-foreground">HDI için min–max, afet oranı için ters sıra sabittir.</p></div> : <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="population-weight">Nüfus ağırlığı</Label><span className="text-xs font-semibold tabular-nums">%{weight}</span></div><Slider id="population-weight" min={0} max={100} step={1} value={[weight]} onValueChange={values => setWeight(typeof values === "number" ? values : values[0])} /><p className="text-xs text-muted-foreground">Ekonomi ağırlığı: %{100 - weight}</p></div>}
          <div className="space-y-1.5"><Label htmlFor="budget">Kilometre bütçesi</Label><div className="relative"><Input id="budget" type="number" min={0} max={10000} step={1} value={budget} onChange={event => setBudget(Number(event.target.value))} className="pr-12 tabular-nums" /><span className="absolute right-3 top-2.5 text-xs text-muted-foreground">km</span></div></div>
          <Button className="w-full" disabled={busy || !Number.isFinite(budget) || budget < 0 || budget > 10000} onClick={() => void calculate()}>{busy ? "Hesaplanıyor…" : "Sonucu hesapla"}<ArrowRight className="size-4" /></Button>
          {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}. Python API hizmetini başlatın.</p>}
        </CardContent></Card>

        <Card className="result-card"><CardHeader className="pb-2"><div className="flex items-center justify-between gap-2"><CardTitle className="text-base">Model sonucu</CardTitle><Badge variant="outline" className="text-[10px]">{snapshot ? modeNames[snapshot.mode] : "Yükleniyor"}</Badge></div></CardHeader><CardContent>{!snapshot ? <p className="text-sm text-muted-foreground">Veriler yükleniyor…</p> : blocked ? <div className="space-y-2"><p className="font-medium">Sonuç hesaplanamadı</p><p className="text-sm text-muted-foreground">2025 gözlem modunda {snapshot.missing.length} kayıt eksik. Koordinat üretilmedi.</p></div> : <div className="space-y-3"><div className="flex items-end gap-2"><span className="text-4xl font-semibold tracking-tight tabular-nums text-emerald-950">{formatNumber(result?.displacement_km)}</span><span className="pb-1 text-base text-muted-foreground">km</span></div><p className="text-xs text-muted-foreground">Başlangıç noktasından WGS84 uzaklığı</p><Separator /><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-muted-foreground">Koordinat</p><p className="mt-1 font-medium tabular-nums">{result?.latitude?.toFixed(5)}° · {result?.longitude?.toFixed(5)}°</p></div><div><p className="text-muted-foreground">Yön</p><p className="mt-1 font-medium tabular-nums">{result?.bearing_degrees == null ? "Yönsüz" : `${formatNumber(result.bearing_degrees)}°`}</p></div></div>{snapshot.mode === "all_data" && <p className="text-xs leading-5 text-muted-foreground">{coverage}/1.560 sayısal gözlem · {snapshot.missing.length} eksik kayıt. Ülke için eksik kategori katkı vermez; diğer ağırlıklar yükseltilmez.</p>}{snapshot.mode === "exploratory" && <p className="text-xs text-amber-800">Bu senaryo eski yıl verileri ve açık varsayım içerir.</p>}</div>}</CardContent></Card>

        {selected ? <CountryDetails country={selected} snapshot={snapshot} /> : <Card className="border-dashed border-stone-300 bg-white/75"><CardContent className="flex items-start gap-3 py-5"><MapPin className="mt-0.5 size-5 text-emerald-700" /><div><p className="text-sm font-medium">Bir başkent seçin</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Haritadaki yeşil noktalara tıklayarak gösterge değerlerini, yılları, kaynakları ve çekim payını görün.</p></div></CardContent></Card>}
        {snapshot?.mode === "all_data" && snapshot.coverage && <Card className="border-stone-200/80 bg-white/90"><CardHeader className="pb-2"><CardTitle className="text-sm">Kategori kapsamı</CardTitle></CardHeader><CardContent className="space-y-1.5">{Object.entries(snapshot.coverage).map(([id, count]) => <div key={id} className="flex justify-between gap-2 text-xs"><span>{indicatorLabels[id] ?? id}</span><span className="tabular-nums text-muted-foreground">{count}/195 · {snapshot.year_ranges?.[id]?.join("–")}</span></div>)}</CardContent></Card>}
        <p className="flex gap-2 px-1 text-[11px] leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />Farklı yıllar ve eksik kapsam nedeniyle sekiz kategori sonucu deneysel bir model çıktısıdır. Haritadaki nokta gerçek başkent önerisi değildir.</p>
      </div></ScrollArea></aside>
    </div>
  </main>;
}


