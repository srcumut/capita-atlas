"""Serve the Capita Atlas calculation API with the accepted Python model."""
import csv
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.score import score
from src.all_data import INDICATORS, score_all
from src.vector import calculate, _inverse

CONFIG = json.loads((ROOT / "model-config.json").read_text(encoding="utf-8"))
ROWS = json.loads((ROOT / "data/processed/selected-observations.json").read_text(encoding="utf-8"))
ALL_ROWS = json.loads((ROOT / "data/processed/latest-all-observations.json").read_text(encoding="utf-8"))
with (ROOT / "data/countries.csv").open(encoding="utf-8-sig", newline="") as f:
    IDS = [r["country_id"] for r in csv.DictReader(f)]
with (ROOT / "data/capitals.csv").open(encoding="utf-8-sig", newline="") as f:
    CAPITALS = list(csv.DictReader(f))

with (ROOT / "data/wdi-observations.csv").open(encoding="utf-8-sig", newline="") as f:
    HISTORICAL = list(csv.DictReader(f))
with (ROOT / "data/supplemental-observations.csv").open(encoding="utf-8-sig", newline="") as f:
    SUPPLEMENTAL = {(r["country_id"], r["indicator_id"]): r for r in csv.DictReader(f)}


def scenario_rows():
    """Explicit exploratory assumptions; never written into selected observations."""
    latest = {}
    for row in HISTORICAL:
        if row["indicator_id"] != "gdp_current_usd" or not row["value"]:
            continue
        cid = row["country_id"]
        if cid not in latest or int(row["reference_year"]) > int(latest[cid]["reference_year"]):
            latest[cid] = row
    assumptions = {("VAT", "gdp_current_usd"): (1_000_000_000, "illustrative_assumption", None)}
    output, disclosures = [], []
    for row in ROWS:
        copy = dict(row)
        if copy["value"] is None:
            key = (row["country_id"], row["indicator_id"])
            if key in SUPPLEMENTAL:
                item = SUPPLEMENTAL[key]
                value, kind, year = float(item["value"]), f'supplemental_{item["status"]}', int(item["reference_year"])
                source = item["source_url"]
            elif key in assumptions:
                value, kind, year = assumptions[key]
                source = None
            else:
                archived = latest[row["country_id"]]
                value, kind, year = float(archived["value"]), "latest_archived_year_proxy", int(archived["reference_year"])
                source = archived["source_url"]
            copy.update(value=value, status="reported", reference_year=str(CONFIG["reference_year"]))
            disclosures.append({"country_id": key[0], "indicator_id": key[1], "value": value,
                                "kind": kind, "actual_reference_year": year, "source_url": source})
        output.append(copy)
    assert len(disclosures) == 15
    return output, disclosures


def snapshot(population_weight=0.5, budget_km=10000, mode="all_data", normalization="share"):
    if type(population_weight) not in (int, float) or not 0 <= population_weight <= 1:
        raise ValueError("Nüfus ağırlığı 0–1 arasında olmalı")
    if type(budget_km) not in (int, float) or not 0 <= budget_km <= 10000:
        raise ValueError("Bütçe 0–10.000 km arasında olmalı")
    if mode not in ("all_data", "observed", "exploratory"):
        raise ValueError("Geçersiz hesap modu")
    config = {**CONFIG, "budget_km": budget_km,
              "categories": [{**c, "weight": population_weight if c["id"] == "population" else 1 - population_weight}
                             for c in CONFIG["categories"]]}
    if mode == "all_data":
        config["categories"] = [{"id": indicator, "weight": 1 / len(INDICATORS), "indicator_id": indicator,
                                 "normalization": normalization} for indicator in INDICATORS]
        scores = score_all(IDS, ALL_ROWS, normalization)
        scoring_rows, assumptions = ALL_ROWS, []
    else:
        scoring_rows, assumptions = scenario_rows() if mode == "exploratory" else (ROWS, [])
        scores = score(config, IDS, scoring_rows)
    result = calculate(config, scores, CAPITALS)
    observations = {r["country_id"]: {} for r in CAPITALS}
    for row in (ALL_ROWS if mode == "all_data" else ROWS):
        observations[row["country_id"]][row["indicator_id"]] = {
            key: row.get(key) for key in ("value", "unit", "reference_year", "source_url", "status", "missing_reason")
        }
    contributions = None
    if scores["status"] == "ready":
        contributions = {}
        for capital in CAPITALS:
            cid = capital["country_id"]
            q = scores["attraction_shares"][cid]
            bearing = None if q == 0 else _inverse(0, 0, float(capital["latitude"]), float(capital["longitude"]))[0]
            contributions[cid] = {"share": q, "length_km": budget_km * q,
                                  "bearing_radians": bearing,
                                  "category_shares": {category: values[cid] for category, values in scores["category_shares"].items()}}
    return {"config": config, "mode": mode, "normalization": normalization,
            "coverage": scores.get("coverage"), "year_ranges": scores.get("year_ranges"),
            "assumptions": assumptions,
            "score_status": scores["status"], "missing": scores["missing"],
            "result": result, "observations": observations, "contributions": contributions}


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/snapshot":
            self.reply(200, snapshot())
            return
        if self.path == "/api/sensitivity":
            self.reply(200, json.loads((ROOT / "data/processed/t11-sensitivity.json").read_text(encoding="utf-8")))
            return
        self.send_error(404)

    def do_POST(self):
        if self.path != "/api/calculate":
            self.send_error(404)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size > 10000:
                raise ValueError("İstek çok büyük")
            options = json.loads(self.rfile.read(size))
            self.reply(200, snapshot(options["population_weight"], options["budget_km"],
                                     options.get("mode", "all_data"), options.get("normalization", "share")))
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            self.reply(400, {"error": str(error)})


if __name__ == "__main__":
    port = int(os.environ.get("CAPITA_PORT", "8000"))
    if not 1 <= port <= 65535:
        raise ValueError("Geçersiz port")
    print(f"Capita Atlas API: http://127.0.0.1:{port}/api/snapshot")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
