"""Checks for latest-year selection and experimental eight-indicator scoring."""
import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.all_data import INDICATORS, METHODS, score_all
from src.vector import calculate


def main():
    with (ROOT / "data/countries.csv").open(encoding="utf-8-sig", newline="") as f:
        ids = [r["country_id"] for r in csv.DictReader(f)]
    with (ROOT / "data/capitals.csv").open(encoding="utf-8-sig", newline="") as f:
        capitals = list(csv.DictReader(f))
    rows = json.loads((ROOT / "data/processed/latest-all-observations.json").read_text(encoding="utf-8"))
    assert len(rows) == 195 * 8 and len({(r["country_id"], r["indicator_id"]) for r in rows}) == len(rows)
    indexed = {(r["country_id"], r["indicator_id"]): r for r in rows}
    assert indexed[("VAT", "population_total")]["value"] == 882
    assert indexed[("VAT", "gdp_current_usd")]["value"] is None
    config = json.loads((ROOT / "model-config.json").read_text(encoding="utf-8"))
    results = {}
    for method in METHODS:
        scored = score_all(ids, rows, method)
        assert scored["status"] == "ready" and len(scored["missing"]) == 129
        assert math.isclose(math.fsum(scored["attraction_shares"].values()), 1, abs_tol=1e-12)
        assert scored["category_shares"]["gdp_current_usd"]["VAT"] is None
        for ind in INDICATORS:
            assert math.isclose(math.fsum(v for v in scored["category_shares"][ind].values() if v is not None), 1, abs_tol=1e-12)
        result = calculate(config, scored, capitals)
        assert result["status"] == "ready" and 0 <= result["displacement_km"] <= 10000
        results[method] = scored
    for cid in ids:
        assert math.isclose(results["share"]["attraction_shares"][cid],
                            results["max"]["attraction_shares"][cid], abs_tol=1e-15)
    assert score_all(ids, list(reversed(rows)), "share")["attraction_shares"] == results["share"]["attraction_shares"]
    print("All-data passed: 1560 latest-year records, 129 missing, five modes, category sums, max/share equivalence and WGS84 result")


if __name__ == "__main__":
    main()
