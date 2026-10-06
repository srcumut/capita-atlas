"""Reproduce T11 sensitivity status without filling missing observations."""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.score import score
from src.vector import calculate


def main():
    config = json.loads((ROOT / "model-config.json").read_text(encoding="utf-8"))
    observations = json.loads((ROOT / "data/processed/selected-observations.json").read_text(encoding="utf-8"))
    with (ROOT / "data/countries.csv").open(encoding="utf-8-sig", newline="") as f:
        ids = [row["country_id"] for row in csv.DictReader(f)]
    with (ROOT / "data/capitals.csv").open(encoding="utf-8-sig", newline="") as f:
        capitals = list(csv.DictReader(f))
    scenarios = []
    for population_weight in (0, 0.25, 0.5, 0.75, 1):
        for budget in (0, 2500, 5000, 10000):
            changed = {**config, "budget_km": budget,
                       "categories": [{**category, "weight": population_weight if category["id"] == "population" else 1 - population_weight}
                                      for category in config["categories"]]}
            scores = score(changed, ids, observations)
            result = calculate(changed, scores, capitals)
            scenarios.append({"population_weight": population_weight,
                              "economy_weight": 1 - population_weight,
                              "budget_km": budget, "status": result["status"],
                              "missing_observation_count": len(scores["missing"]),
                              "missing_country_count": len({row["country_id"] for row in scores["missing"]}),
                              "latitude": result["latitude"], "longitude": result["longitude"],
                              "displacement_km": result["displacement_km"]})
    report = {"schema_version": 1, "reference_year": config["reference_year"],
              "country_count": len(ids), "baseline": {"population_weight": 0.5, "budget_km": 10000},
              "scenarios": scenarios,
              "analytic_sensitivity": {
                  "scope": "Only conditional on resolving every selected observation in the fixed 195-country scope",
                  "budget": "With fixed data and weights, the net vector and displacement scale linearly with budget; its bearing stays fixed for positive nonzero displacement. At zero budget the result is the origin without bearing.",
                  "weight": "At fixed data, the net vector is an affine combination of population and economy category vectors. For weight change Δw and budget B, its Euclidean shift is at most 2 B |Δw| km; the actual shift and coordinate remain unknown.",
                  "data": "Missing values have no accepted estimates or finite upper bounds; no numerical data-uncertainty radius or global coordinate is available."}}
    target = ROOT / "data/processed/t11-sensitivity.json"
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(scenarios)} scenarios; {scenarios[0]['missing_observation_count']} missing observations in {scenarios[0]['missing_country_count']} countries; {target}")


if __name__ == "__main__":
    main()
