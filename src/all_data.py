"""Experimental eight-indicator score from latest available observations."""
import math
import statistics

CAPACITY = ("population_total", "gdp_current_usd", "manufacturing_va_usd",
            "agricultural_gpv", "military_expenditure", "merchandise_exports")
INDICATORS = CAPACITY + ("hdi", "disaster_mortality_rate")
METHODS = ("share", "max", "log", "minmax", "rank")


def ranks(values, lower_better=False):
    ordered = sorted(values.values())
    n = len(ordered)
    return {cid: (1 - (ordered.index(v) + (ordered.count(v) - 1) / 2) / (n - 1)
                  if lower_better and n > 1 else
                  (ordered.index(v) + (ordered.count(v) - 1) / 2) / (n - 1)
                  if n > 1 else 1.0)
            for cid, v in values.items()}


def score_all(country_ids, observations, method="share"):
    if method not in METHODS:
        raise ValueError("unsupported normalization")
    ids = list(country_ids)
    if len(ids) != len(set(ids)) or len(ids) != 195:
        raise ValueError("invalid country scope")
    indexed = {}
    for row in observations:
        key = (row["country_id"], row["indicator_id"])
        if key in indexed or key[0] not in ids or key[1] not in INDICATORS:
            raise ValueError("duplicate or out-of-scope observation")
        indexed[key] = row
    if len(indexed) != len(ids) * len(INDICATORS):
        raise ValueError("incomplete observation grid")
    shares, coverage, year_ranges = {}, {}, {}
    for indicator in INDICATORS:
        values = {}
        for cid in ids:
            value = indexed[(cid, indicator)]["value"]
            if value is None:
                continue
            if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
                raise ValueError("invalid observation")
            values[cid] = value
        coverage[indicator] = len(values)
        years = [indexed[(cid, indicator)]["reference_year"] for cid in values]
        year_ranges[indicator] = [min(years), max(years)]
        if not values:
            raise ValueError(f"no observations: {indicator}")
        if indicator == "hdi":
            lo, hi = min(values.values()), max(values.values())
            transformed = {cid: (v - lo) / (hi - lo) for cid, v in values.items()} if hi > lo else dict.fromkeys(values, 1.0)
        elif indicator == "disaster_mortality_rate":
            transformed = ranks(values, lower_better=True)
        elif method == "share":
            transformed = values
        elif method == "max":
            largest = max(values.values())
            transformed = {cid: v / largest for cid, v in values.items()} if largest else dict.fromkeys(values, 1.0)
        elif method == "log":
            positive = [v for v in values.values() if v > 0]
            if not positive:
                raise ValueError(f"no positive observations: {indicator}")
            scale = statistics.median(positive)
            transformed = {cid: math.log1p(v / scale) for cid, v in values.items()}
        elif method == "minmax":
            lo, hi = min(values.values()), max(values.values())
            transformed = {cid: (v - lo) / (hi - lo) for cid, v in values.items()} if hi > lo else dict.fromkeys(values, 1.0)
        else:
            transformed = ranks(values)
        total = math.fsum(transformed.values())
        if total <= 0 or not math.isfinite(total):
            raise ValueError(f"invalid transformed total: {indicator}")
        shares[indicator] = {cid: transformed[cid] / total if cid in transformed else None for cid in ids}
    weight = 1 / len(INDICATORS)
    attraction = {cid: math.fsum(weight * shares[ind][cid] for ind in INDICATORS if shares[ind][cid] is not None)
                  for cid in ids}
    if not math.isclose(math.fsum(attraction.values()), 1, abs_tol=1e-12):
        raise ValueError("attraction shares do not sum to one")
    return {"status": "ready", "missing": [{"country_id": cid, "indicator_id": ind, "status": "missing"}
                                            for cid in ids for ind in INDICATORS if shares[ind][cid] is None],
            "category_shares": shares, "attraction_shares": attraction,
            "coverage": coverage, "year_ranges": year_ranges,
            "method": method, "category_weight": weight}
