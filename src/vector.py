"""T08: simultaneous capital bearings and WGS84 geodesic displacement."""
import math

A = 6378137.0
F = 1 / 298.257223563
B = A * (1 - F)


def _inverse(lat1, lon1, lat2, lon2):
    """Vincenty inverse: initial bearing and distance in metres."""
    u1 = math.atan((1 - F) * math.tan(math.radians(lat1)))
    u2 = math.atan((1 - F) * math.tan(math.radians(lat2)))
    L = math.radians(lon2 - lon1)
    lam = L
    for _ in range(200):
        sin_lam, cos_lam = math.sin(lam), math.cos(lam)
        sin_s = math.hypot(math.cos(u2) * sin_lam,
                           math.cos(u1) * math.sin(u2) - math.sin(u1) * math.cos(u2) * cos_lam)
        if sin_s < 1e-15:
            raise ValueError("coincident or antipodal capital has no unique bearing")
        cos_s = math.sin(u1) * math.sin(u2) + math.cos(u1) * math.cos(u2) * cos_lam
        sigma = math.atan2(sin_s, cos_s)
        sin_alpha = math.cos(u1) * math.cos(u2) * sin_lam / sin_s
        cos2_alpha = 1 - sin_alpha * sin_alpha
        cos2_sigma_m = cos_s - 2 * math.sin(u1) * math.sin(u2) / cos2_alpha if cos2_alpha > 1e-15 else 0
        C = F / 16 * cos2_alpha * (4 + F * (4 - 3 * cos2_alpha))
        next_lam = L + (1 - C) * F * sin_alpha * (sigma + C * sin_s *
                    (cos2_sigma_m + C * cos_s * (-1 + 2 * cos2_sigma_m ** 2)))
        if abs(next_lam - lam) < 1e-13:
            break
        lam = next_lam
    else:
        raise ValueError("WGS84 inverse ambiguous or failed to converge")
    usq = cos2_alpha * (A * A - B * B) / (B * B)
    big_a = 1 + usq / 16384 * (4096 + usq * (-768 + usq * (320 - 175 * usq)))
    big_b = usq / 1024 * (256 + usq * (-128 + usq * (74 - 47 * usq)))
    delta = big_b * sin_s * (cos2_sigma_m + big_b / 4 *
            (cos_s * (-1 + 2 * cos2_sigma_m ** 2) - big_b / 6 * cos2_sigma_m *
             (-3 + 4 * sin_s ** 2) * (-3 + 4 * cos2_sigma_m ** 2)))
    distance = B * big_a * (sigma - delta)
    bearing = math.atan2(math.cos(u2) * sin_lam,
                         math.cos(u1) * math.sin(u2) - math.sin(u1) * math.cos(u2) * cos_lam)
    return bearing, distance


def _direct(lat, lon, bearing, distance):
    u1 = math.atan((1 - F) * math.tan(math.radians(lat)))
    sin_u1, cos_u1 = math.sin(u1), math.cos(u1)
    sin_a, cos_a = math.sin(bearing), math.cos(bearing)
    sigma1 = math.atan2(math.tan(u1), cos_a)
    sin_alpha = cos_u1 * sin_a
    cos2_alpha = 1 - sin_alpha ** 2
    usq = cos2_alpha * (A * A - B * B) / B ** 2
    big_a = 1 + usq / 16384 * (4096 + usq * (-768 + usq * (320 - 175 * usq)))
    big_b = usq / 1024 * (256 + usq * (-128 + usq * (74 - 47 * usq)))
    sigma = distance / (B * big_a)
    for _ in range(200):
        cos2m = math.cos(2 * sigma1 + sigma)
        sin_s, cos_s = math.sin(sigma), math.cos(sigma)
        delta = big_b * sin_s * (cos2m + big_b / 4 *
                (cos_s * (-1 + 2 * cos2m ** 2) - big_b / 6 * cos2m *
                 (-3 + 4 * sin_s ** 2) * (-3 + 4 * cos2m ** 2)))
        next_sigma = distance / (B * big_a) + delta
        if abs(next_sigma - sigma) < 1e-13:
            sigma = next_sigma
            break
        sigma = next_sigma
    else:
        raise ValueError("WGS84 direct failed to converge")
    sin_s, cos_s = math.sin(sigma), math.cos(sigma)
    lat2 = math.atan2(sin_u1 * cos_s + cos_u1 * sin_s * cos_a,
                      (1 - F) * math.hypot(sin_alpha, sin_u1 * sin_s - cos_u1 * cos_s * cos_a))
    lam = math.atan2(sin_s * sin_a, cos_u1 * cos_s - sin_u1 * sin_s * cos_a)
    C = F / 16 * cos2_alpha * (4 + F * (4 - 3 * cos2_alpha))
    L = lam - (1 - C) * F * sin_alpha * (sigma + C * sin_s *
        (math.cos(2 * sigma1 + sigma) + C * cos_s * (-1 + 2 * math.cos(2 * sigma1 + sigma) ** 2)))
    return math.degrees(lat2), ((lon + math.degrees(L) + 180) % 360) - 180


def calculate(config, score_result, capitals):
    """Return blocked status or WGS84 result; capitals are T01 CSV style rows."""
    if score_result["status"] == "blocked_missing_data":
        return {"status": "blocked_missing_data", "latitude": None, "longitude": None,
                "displacement_km": None, "bearing_degrees": None}
    if score_result["status"] != "ready":
        raise ValueError("unsupported score status")
    if config.get("geodesic") != "WGS84" or config.get("distance_multiplier") != 1:
        raise ValueError("unsupported geodesic or distance multiplier")
    origin = config["origin"]
    lat0, lon0 = origin["latitude"], origin["longitude"]
    budget = config["budget_km"]
    if any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v)
           for v in (lat0, lon0, budget)) or not (-90 <= lat0 <= 90 and -180 <= lon0 <= 180):
        raise ValueError("invalid origin or budget")
    if not (0 <= budget <= 10000):
        raise ValueError("budget outside accepted range 0–10000 km")
    shares = score_result["attraction_shares"]
    if not isinstance(shares, dict) or not shares:
        raise ValueError("missing attraction shares")
    if any(not isinstance(q, (int, float)) or isinstance(q, bool) or not math.isfinite(q) or q < 0
           for q in shares.values()) or not math.isclose(math.fsum(shares.values()), 1, abs_tol=1e-10):
        raise ValueError("invalid attraction shares")
    cap = {}
    for row in capitals:
        key = row["country_id"]
        if key in cap:
            raise ValueError("duplicate capital")
        lat, lon = float(row["latitude"]), float(row["longitude"])
        if not math.isfinite(lat) or not math.isfinite(lon) or not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError("invalid capital coordinate")
        cap[key] = (lat, lon)
    if cap.keys() != shares.keys():
        raise ValueError("capital and attraction scopes differ")
    east, north = [], []
    for key in sorted(shares):
        q = shares[key]
        if q == 0:
            continue
        lat, lon = cap[key]
        azimuth, _ = _inverse(lat0, lon0, lat, lon)
        east.append(budget * q * math.sin(azimuth))
        north.append(budget * q * math.cos(azimuth))
    x, y = math.fsum(east), math.fsum(north)
    displacement = math.hypot(x, y)
    if displacement <= 1e-10:
        return {"status": "zero_result", "latitude": lat0, "longitude": lon0,
                "displacement_km": 0.0, "bearing_degrees": None}
    bearing = math.atan2(x, y)
    lat, lon = _direct(lat0, lon0, bearing, displacement * 1000)
    return {"status": "ready", "latitude": lat, "longitude": lon,
            "displacement_km": displacement, "bearing_degrees": math.degrees(bearing) % 360}
