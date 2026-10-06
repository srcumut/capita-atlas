export const indicatorLabels: Record<string, string> = {
  population_total: "Nüfus", gdp_current_usd: "GSYH", manufacturing_va_usd: "İmalat",
  agricultural_gpv: "Tarım üretimi", military_expenditure: "Askerî harcama",
  merchandise_exports: "Mal ihracatı", hdi: "İnsani gelişme", disaster_mortality_rate: "Afet ölüm oranı",
};

export type Mode = "all_data" | "observed" | "exploratory";
export type Normalization = "share" | "log" | "minmax" | "rank" | "max";
export type Observation = { value: number | null; unit: string | null; reference_year: string | null; source_url: string | null; status: string; missing_reason: string | null };
export type Contribution = { share: number; length_km: number; category_shares: Record<string, number | null> };
export type Snapshot = {
  mode: Mode; normalization: Normalization;
  config: { budget_km: number; categories: { weight: number }[] };
  coverage: Record<string, number> | null;
  year_ranges: Record<string, [number, number]> | null;
  assumptions: { country_id: string; indicator_id: string; value: number; kind: string; actual_reference_year: number | null; source_url: string | null }[];
  score_status: string;
  missing: { country_id: string; indicator_id: string }[];
  result: { status: string; latitude: number | null; longitude: number | null; displacement_km: number | null; bearing_degrees: number | null };
  observations: Record<string, Record<string, Observation>>;
  contributions: Record<string, Contribution> | null;
};

export type CapitalFeature = GeoJSON.Feature<GeoJSON.Point, { country_id: string; country_name: string; capital_name: string; source_url: string; selection_note: string }>;
export type Capitals = GeoJSON.FeatureCollection<GeoJSON.Point, CapitalFeature["properties"]>;
export const formatNumber = (value: number | null | undefined, digits = 2) => value == null ? "—" : value.toLocaleString("tr-TR", { maximumFractionDigits: digits });
