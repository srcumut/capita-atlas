"""T07 fixed-scope category shares. No imputation or partial-scope scoring."""
import math


def score(config, country_ids, observations):
    """Return a blocked status or category shares and country attraction shares.

    Observations use the T06 JSON contract. The caller supplies the fixed T01
    country scope; an incomplete scope is never inferred from observed rows.
    """
    ids = list(country_ids)
    if len(ids) != config["country_count"] or len(set(ids)) != len(ids):
        raise ValueError("country scope differs from model configuration")
    categories = config["categories"]
    if not categories or len({c["id"] for c in categories}) != len(categories):
        raise ValueError("invalid categories")
    if any(c["normalization"] != "share_of_fixed_scope_total" or
           c["indicator_weight"] != 1 for c in categories):
        raise ValueError("unsupported normalization or indicator weight")
    weights = [c["weight"] for c in categories]
    if any(not isinstance(w, (int, float)) or not math.isfinite(w) or w < 0 for w in weights) or not math.isclose(sum(weights), 1, abs_tol=1e-12):
        raise ValueError("category weights must be nonnegative and sum to one")
    indicators = [c["indicator_id"] for c in categories]
    if len(set(indicators)) != len(indicators):
        raise ValueError("duplicate indicator")
    indexed = {}
    for row in observations:
        key = (row["country_id"], row["indicator_id"])
        if key in indexed or key[0] not in ids or key[1] not in indicators:
            raise ValueError(f"duplicate or out-of-scope observation: {key}")
        if str(row["reference_year"]) != str(config["reference_year"]):
            raise ValueError(f"wrong reference year: {key}")
        indexed[key] = row
    missing = []
    for country in ids:
        for indicator in indicators:
            row = indexed.get((country, indicator))
            if row is None or row["value"] is None:
                missing.append({"country_id": country, "indicator_id": indicator,
                                "status": row["status"] if row else "observation_absent"})
            elif row["status"] != "reported":
                raise ValueError(f"value/status conflict: {(country, indicator)}")
            else:
                value = row["value"]
                try:
                    value = float(value) if not isinstance(value, bool) else math.nan
                except (TypeError, ValueError):
                    value = math.nan
                if not math.isfinite(value) or value < 0:
                    raise ValueError(f"invalid value: {(country, indicator)}")
                indexed[(country, indicator)] = {**row, "value": value}
    if missing:
        return {"status": "blocked_missing_data", "missing": missing,
                "category_shares": None, "attraction_shares": None}
    shares = {}
    for category in categories:
        indicator = category["indicator_id"]
        total = math.fsum(indexed[(country, indicator)]["value"] for country in ids)
        if not math.isfinite(total) or total <= 0:
            raise ValueError(f"nonpositive or nonfinite category total: {indicator}")
        shares[category["id"]] = {country: indexed[(country, indicator)]["value"] / total for country in ids}
    attraction = {country: math.fsum(c["weight"] * shares[c["id"]][country] for c in categories) for country in ids}
    return {"status": "ready", "missing": [], "category_shares": shares,
            "attraction_shares": attraction}
