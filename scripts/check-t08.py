"""Meaningful WGS84 vector checks, including the real missing-data gate."""
import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.score import score
from src.vector import calculate


def fails(config, result, capitals):
    try:
        calculate(config, result, capitals)
    except ValueError:
        return
    raise AssertionError("expected validation error")


def main():
    config = json.loads((ROOT / "model-config.json").read_text(encoding="utf-8"))
    with (ROOT / "data/countries.csv").open(encoding="utf-8-sig", newline="") as f:
        ids = [r["country_id"] for r in csv.DictReader(f)]
    with (ROOT / "data/capitals.csv").open(encoding="utf-8-sig", newline="") as f:
        capitals = list(csv.DictReader(f))
    rows = json.loads((ROOT / "data/processed/selected-observations.json").read_text(encoding="utf-8"))
    blocked = calculate(config, score(config, ids, rows), capitals)
    assert blocked["status"] == "blocked_missing_data" and blocked["latitude"] is None
    synthetic = [{**r, "value": 1, "status": "reported"} for r in rows]
    scored = score(config, ids, synthetic)
    result = calculate(config, scored, capitals)
    reverse = calculate(config, scored, list(reversed(capitals)))
    assert result == reverse and result["status"] == "ready"
    assert 0 < result["displacement_km"] <= config["budget_km"] + 1e-9
    assert -90 <= result["latitude"] <= 90 and -180 <= result["longitude"] < 180
    two = {"status": "ready", "attraction_shares": {"E": .5, "W": .5}}
    opposite = [{"country_id": "E", "latitude": 0, "longitude": 1},
                {"country_id": "W", "latitude": 0, "longitude": -1}]
    zero = calculate(config, two, opposite)
    assert zero["status"] == "zero_result" and zero["bearing_degrees"] is None
    assert zero["latitude"] == zero["longitude"] == zero["displacement_km"] == 0
    east = calculate({**config, "budget_km": 1000}, {"status": "ready", "attraction_shares": {"E": 1}}, opposite[:1])
    assert math.isclose(east["displacement_km"], 1000)
    assert math.isclose(east["latitude"], 0, abs_tol=1e-10)
    assert math.isclose(east["longitude"], 8.983152841, abs_tol=1e-8)
    assert math.isclose(east["bearing_degrees"], 90, abs_tol=1e-9)
    long_east = calculate(config, {"status": "ready", "attraction_shares": {"E": 1}}, opposite[:1])
    assert math.isclose(long_east["displacement_km"], 10000)
    assert math.isclose(long_east["longitude"], 89.831528411, abs_tol=1e-8)
    fails(config, two, opposite + opposite[:1])
    fails(config, two, [{"country_id": "E", "latitude": 0, "longitude": 0}, opposite[1]])
    fails(config, two, [{"country_id": "E", "latitude": 0, "longitude": 180}, opposite[1]])
    fails(config, two, opposite[:1])
    fails(config, {"status": "ready", "attraction_shares": {"E": .4}}, opposite[:1])
    fails({**config, "budget_km": 20000}, two, opposite)
    print("T08 passed: real data blocked; synthetic 195-country order, WGS84 1000/10000 km, "
          "opposing zero, units, scope and ambiguous bearings checked")


if __name__ == "__main__":
    main()
