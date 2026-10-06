"""Archive WDI API responses and map the three T02 WDI candidates to T01 countries."""
import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "wdi"
RAW.mkdir(parents=True, exist_ok=True)
STAMP = datetime.now(timezone.utc).isoformat()
old_manifest_path = ROOT / "data" / "wdi-source-manifest.json"
old_manifest = {r["source_series"]: r for r in json.loads(old_manifest_path.read_text(encoding="utf-8"))} if old_manifest_path.exists() else {}
SERIES = {
    "population_total": ("SP.POP.TOTL", "persons"),
    "gdp_current_usd": ("NY.GDP.MKTP.CD", "current USD"),
    "manufacturing_va_usd": ("NV.IND.MANF.CD", "current USD"),
}
with (ROOT / "data" / "countries.csv").open(newline="", encoding="utf-8-sig") as f:
    countries = {r["country_id"] for r in csv.DictReader(f)}

manifest = []
observations = []
for indicator, (series, unit) in SERIES.items():
    url = f"https://api.worldbank.org/v2/country/all/indicator/{series}?format=json&per_page=20000&date=1960:2025"
    path = RAW / f"{series}-1960-2025.json"
    if path.exists():
        content = path.read_bytes()
        retrieved_at = old_manifest.get(series, {}).get("retrieved_at", datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat())
    else:
        with urlopen(url, timeout=120) as response:
            content = response.read()
        path.write_bytes(content)
        retrieved_at = STAMP
    payload = json.loads(content)
    if not isinstance(payload, list) or len(payload) != 2 or not isinstance(payload[1], list):
        raise ValueError(f"Unexpected WDI response for {series}")
    if int(payload[0]["pages"]) != 1:
        raise ValueError(f"WDI response for {series} has more than one page")
    manifest.append({
        "source_id": "WB_WDI", "indicator_id": indicator, "source_series": series,
        "url": url, "retrieved_at": retrieved_at, "release": "live API response; no fixed release",
        "license_url": "https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets",
        "raw_path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "sha256": hashlib.sha256(content).hexdigest(), "bytes": len(content),
        "source_rows": len(payload[1]), "pages": payload[0]["pages"],
    })
    for row in payload[1]:
        code = row.get("countryiso3code", "")
        if code not in countries:
            continue
        value = row.get("value")
        observations.append({
            "country_id": code, "source_country_code": row["country"]["id"],
            "indicator_id": indicator, "value": "" if value is None else value,
            "unit": unit, "reference_year": row["date"], "source_url": url,
            "retrieved_at": retrieved_at, "status": "missing" if value is None else "reported",
            "methodology_note": "Source API null retained" if value is None else "",
        })

out = ROOT / "data" / "wdi-observations.csv"
with out.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(observations[0]))
    writer.writeheader()
    writer.writerows(observations)
(ROOT / "data" / "wdi-source-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Archived {len(manifest)} responses; mapped {len(observations)} country-year rows")
