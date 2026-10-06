"""Check the T07 engine on real blocked data and complete synthetic data."""
import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.score import score


def expect_error(config, ids, rows):
    try:
        score(config, ids, rows)
    except ValueError:
        return
    raise AssertionError("expected validation error")


def main():
    config = json.loads((ROOT / "model-config.json").read_text(encoding="utf-8"))
    with (ROOT / "data/countries.csv").open(encoding="utf-8-sig", newline="") as f:
        ids = [r["country_id"] for r in csv.DictReader(f)]
    rows = json.loads((ROOT / "data/processed/selected-observations.json").read_text(encoding="utf-8"))
    actual = score(config, ids, rows)
    assert actual["status"] == "blocked_missing_data"
    assert actual["category_shares"] is None and actual["attraction_shares"] is None
    assert len(actual["missing"]) == 15
    assert len({m["country_id"] for m in actual["missing"]}) == 14
    synthetic = [{**r, "value": (1 if r["country_id"] == ids[0] else 3) if r["indicator_id"] == "population_total" else (2 if r["country_id"] == ids[0] else 4), "status": "reported"} for r in rows]
    result = score(config, ids, synthetic)
    assert result["status"] == "ready"
    for category in config["categories"]:
        shares = result["category_shares"][category["id"]]
        assert math.isclose(math.fsum(shares.values()), 1, abs_tol=1e-12)
    assert math.isclose(math.fsum(result["attraction_shares"].values()), 1, abs_tol=1e-12)
    pop = result["category_shares"]["population"]
    assert math.isclose(pop[ids[1]] / pop[ids[0]], 3)
    assert score(config, list(reversed(ids)), list(reversed(synthetic)))["attraction_shares"] == result["attraction_shares"]
    expect_error(config, ids, synthetic + [synthetic[0]])
    expect_error(config, ids, [{**synthetic[0], "value": -1}] + synthetic[1:])
    expect_error(config, ids, [{**r, "value": 0} if r["indicator_id"] == "population_total" else r for r in synthetic])
    expect_error(config, ids[:-1], synthetic)
    print("T07 passed: 195-country real data blocked (15 observations / 14 countries); synthetic shares, ratios, order and invalid inputs checked")


if __name__ == "__main__":
    main()
