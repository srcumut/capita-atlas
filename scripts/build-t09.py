"""Build the T09 capital map data from the accepted T01 CSV files."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def rows(name):
    with (ROOT / "data" / name).open(encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def main():
    countries = rows("countries.csv")
    capitals = rows("capitals.csv")
    names = {row["country_id"]: row["name"] for row in countries}
    if len(names) != 195 or len(countries) != 195 or len(capitals) != 195:
        raise ValueError("T01 kapsamı 195 benzersiz ülke ve başkent gerektirir")
    if {row["country_id"] for row in capitals} != set(names):
        raise ValueError("Başkent ve ülke kimlikleri eşleşmiyor")

    features = []
    for row in sorted(capitals, key=lambda item: item["country_id"]):
        lat, lon = float(row["latitude"]), float(row["longitude"])
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise ValueError(f"Geçersiz koordinat: {row['country_id']}")
        if not row["source_url"] or not row["selection_note"]:
            raise ValueError(f"Kaynak veya seçim notu eksik: {row['country_id']}")
        features.append({
            "type": "Feature",
            "id": row["country_id"],
            "properties": {
                "country_id": row["country_id"],
                "country_name": names[row["country_id"]],
                "capital_name": row["capital_name"],
                "source_url": row["source_url"],
                "selection_note": row["selection_note"],
            },
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })

    output = ROOT / "apps" / "web" / "public" / "capitals.geojson"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(features)} başkent yazıldı: {output}")


if __name__ == "__main__":
    main()
