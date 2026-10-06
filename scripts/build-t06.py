"""Build and validate selected-year observations from model-config.json."""
import argparse
import csv
import hashlib
import io
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/processed"
FIELDS = ["country_id", "indicator_id", "value", "unit", "reference_year",
          "source_url", "retrieved_at", "source_release", "source_raw_path",
          "source_raw_sha256", "status", "source_status", "methodology_note",
          "missing_reason"]


def rows(path):
    with (ROOT / path).open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def main(check):
    cfg = json.loads((ROOT / "model-config.json").read_text(encoding="utf-8"))
    assert cfg["decision_id"] and isinstance(cfg["reference_year"], int)
    assert cfg["missing_value_policy"] == "no_global_result_until_all_selected_observations_resolved"
    indicators = [c["indicator_id"] for c in cfg["categories"]]
    assert len(indicators) == len(set(indicators)) == 2
    countries = rows("data/countries.csv")
    ids = [c["country_id"] for c in countries]
    assert len(ids) == len(set(ids)) == cfg["country_count"] == 195
    source = json.loads((ROOT / "data/wdi-source-manifest.json").read_text(encoding="utf-8"))
    manifest = {s["indicator_id"]: s for s in source}
    assert all(i in manifest for i in indicators)
    for indicator in indicators:
        s = manifest[indicator]
        raw = ROOT / s["raw_path"]
        assert hashlib.sha256(raw.read_bytes()).hexdigest() == s["sha256"], raw
    selected = {}
    for r in rows("data/wdi-observations.csv"):
        if r["indicator_id"] not in indicators or r["reference_year"] != str(cfg["reference_year"]):
            continue
        key = (r["country_id"], r["indicator_id"])
        assert r["country_id"] in ids and key not in selected, key
        selected[key] = r
    output = []
    counts = {}
    missing = {}
    for indicator in indicators:
        s = manifest[indicator]
        missing[indicator] = []
        counts[indicator] = {"reported": 0, "source_blank": 0, "source_row_absent": 0}
        units = set()
        for country in ids:
            r = selected.get((country, indicator))
            value = r["value"] if r else ""
            if value:
                n = float(value)
                assert math.isfinite(n) and n >= 0, (country, indicator, value)
                status, reason = "reported", ""
            elif r:
                status, reason = "source_blank", "source row has an empty value"
            else:
                status, reason = "source_row_absent", "no source row for country, indicator and year"
            counts[indicator][status] += 1
            if reason:
                missing[indicator].append({"country_id": country, "reason": status})
            unit = r["unit"] if r else ("persons" if indicator == "population_total" else "current USD")
            units.add(unit)
            if r:
                assert r["source_url"] == s["url"] and r["retrieved_at"] == s["retrieved_at"]
            output.append({
                "country_id": country, "indicator_id": indicator, "value": value,
                "unit": unit, "reference_year": str(cfg["reference_year"]),
                "source_url": r["source_url"] if r else s["url"],
                "retrieved_at": r["retrieved_at"] if r else s["retrieved_at"],
                "source_release": s["release"], "source_raw_path": s["raw_path"],
                "source_raw_sha256": s["sha256"], "status": status,
                "source_status": r["status"] if r else "",
                "methodology_note": r["methodology_note"] if r else "",
                "missing_reason": reason,
            })
        assert len(units) == 1, (indicator, units)
    assert len(output) == 390
    complete = sum(all(selected.get((country, i), {}).get("value") for i in indicators) for country in ids)
    summary = {
        "schema_version": 1, "decision_id": cfg["decision_id"],
        "reference_year": cfg["reference_year"], "country_count": len(ids),
        "indicator_count": len(indicators), "observation_count": len(output),
        "complete_country_count": complete,
        "global_result_ready": complete == len(ids),
        "counts_by_indicator": counts, "missing_by_indicator": missing,
    }
    assert 0 <= complete <= len(ids)
    buf = io.StringIO(newline="")
    writer = csv.DictWriter(buf, FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(output)
    files = {
        OUT / "selected-observations.csv": buf.getvalue().encode("utf-8"),
        OUT / "selected-observations.json": (json.dumps([
            {**r, "value": r["value"] if r["value"] else None} for r in output
        ], ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
        OUT / "coverage.json": (json.dumps(summary, ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
    }
    if check:
        for path, content in files.items():
            assert path.read_bytes() == content, f"Outdated processed file: {path}"
    else:
        OUT.mkdir(parents=True, exist_ok=True)
        for path, content in files.items():
            path.write_bytes(content)
    print(f"T06 {'validated' if check else 'built'}: {len(output)} rows, {complete}/195 complete countries; global result ready: {summary['global_result_ready']}")
    print(json.dumps(counts, sort_keys=True))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--check", action="store_true", help="compare regenerated bytes with saved outputs")
    main(p.parse_args().check)
