"""Rebuild the latest available observation for every country and indicator."""
import argparse
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ("data/wdi-observations.csv", "data/candidate-observations.csv",
           "data/supplemental-observations.csv")


def read(path):
    with (ROOT / path).open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def build():
    countries = [r["country_id"] for r in read("data/countries.csv")]
    indicators = [r["indicator_id"] for r in read("data/indicators.csv")]
    assert len(countries) == len(set(countries)) == 195
    assert len(indicators) == len(set(indicators)) == 8
    chosen = {}
    for source_rank, path in enumerate(SOURCES):
        for row in read(path):
            key = (row["country_id"], row["indicator_id"])
            if key[0] not in countries or key[1] not in indicators or not row["value"]:
                continue
            value = float(row["value"])
            if value < 0 or not (value < float("inf")):
                raise ValueError(f"Invalid value: {key}")
            year = int(row["reference_year"])
            old = chosen.get(key)
            # Newer year wins; same-year WDI/candidate observation beats supplemental estimate.
            if old is None or (year, -source_rank) > (old[0], -old[1]):
                chosen[key] = (year, source_rank, row)
    output = []
    for cid in countries:
        for indicator in indicators:
            item = chosen.get((cid, indicator))
            row = item[2] if item else None
            output.append({"country_id": cid, "indicator_id": indicator,
                           "value": float(row["value"]) if row else None,
                           "unit": row["unit"] if row else None,
                           "reference_year": int(row["reference_year"]) if row else None,
                           "source_url": row["source_url"] if row else None,
                           "status": row["status"] if row else "missing",
                           "methodology_note": row.get("methodology_note", "") if row else "",
                           "source_file": SOURCES[item[1]] if item else None})
    return output


def main(check):
    data = build()
    content = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    target = ROOT / "data/processed/latest-all-observations.json"
    if check:
        assert target.read_bytes() == content, "processed all-data file is stale"
    else:
        target.write_bytes(content)
    print(f"All-data {'validated' if check else 'built'}: {len(data)} rows, {sum(r['value'] is not None for r in data)} values")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    main(parser.parse_args().check)
