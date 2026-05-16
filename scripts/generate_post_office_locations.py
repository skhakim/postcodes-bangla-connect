#!/usr/bin/env python3
"""
Generate deterministic synthetic lat/lng points for post offices.

The point for each post office is sampled inside the GeoJSON boundary for its
upazila/thana. This is useful when the source postcode list has the correct
administrative hierarchy but no exact office coordinates yet.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import sys
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_POSTCODES = ROOT / "src" / "data" / "bangladesh_post_codes_hierarchical.json"
DEFAULT_UPAZILAS = ROOT / "src" / "data" / "upazilas.geojson.json"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "post_office_locations.json"
DEFAULT_UNMATCHED = ROOT / "src" / "data" / "post_office_locations_unmatched.json"


SPECIAL_MAPPINGS = {
    # Divisions and districts
    "chattogram": "chittagong",
    "habiganj": "hobiganj",
    "naogaon": "nogaon",
    "chapainababganj": "chapai",
    "khagrachhari": "khagrachari",
    "jashore": "jessore",
    "narsingdi": "narshingdi",
    "cumilla": "comilla",
    "bogura": "bogra",
    "jhalokati": "jhalakathi",
    "barishal": "barisal",
    # Upazilas and thanas
    "charbhadrasan": "charbadrashan",
    "madhukhali": "madukhali",
    "muksudpur": "maksudpur",
    "tarail": "tarial",
    "hossainpur": "hossenpur",
    "mithamain": "mithamoin",
    "austagram": "ostagram",
    "harirampur": "hariampur",
    "ghior": "gheor",
    "shibalay": "shibaloy",
    "daulatpur": "doulatpur",
    "gazaria": "gajaria",
    "tongibari": "tangibari",
    "louhajang": "lohajong",
    "sreenagar": "srinagar",
    "narsingdisadar": "narshingdisadar",
    "manohardi": "monohordi",
    "raipura": "raypura",
    "zajira": "jajira",
    "bhedarganj": "badarganj",
    "bhuanpur": "bhuapur",
    "dhanbari": "dhonbari",
    "bandarbansadar": "bandorbansadar",
    "rowangchhari": "rowangchari",
    "faridganj": "faridgonj",
    "hajiganj": "hazigonj",
    "chandanaish": "chandanish",
    "patiya": "patia",
    "anwara": "anowara",
    "raozan": "rouzan",
    "mirsarai": "mirsharai",
    "banshkhali": "bashkhali",
    "nangalkot": "nangolkot",
    "chauddagram": "chouddagram",
    "titas": "titash",
    "burichang": "burichong",
    "eidgaon": "eidgah",
    "ukhia": "ukhiya",
    "maheshkhali": "moheskhali",
    "chhagalnaiya": "chagalnaia",
    "parashuram": "parshuram",
    "khagrachharisadar": "khagracharisadar",
    "panchhari": "panchari",
    "ramgarh": "ramgor",
    "manikchhari": "manikchari",
    "companiganj": "kompaniganj",
    "rajasthali": "rajsthali",
    "belaichhari": "bilaichhori",
    "jurachhari": "jurachori",
    "baghaichhari": "baghaichari",
    "morelganj": "morrelganj",
    "jashoresadar": "jessoresadar",
    "chaugachha": "chougachha",
    "sharsha": "sarsa",
    "manirampur": "monirampur",
    "keshabpur": "keshobpur",
    "harinakundu": "horinakundu",
    "shailkupa": "shailakupa",
    "terokhada": "tarokhada",
    "dighalia": "digalia",
    "debhata": "devhata",
    "bogurasadar": "bograsadar",
    "adamdighi": "adomdighi",
    "gabtali": "gabtoli",
    "kahaloo": "kahalu",
    "shibganj": "shibgonj",
    "sonatala": "sonatola",
    "shajahanpur": "sajahanpur",
    "naogaonsadar": "nogaonsadar",
    "baraigram": "boraigram",
    "naldanga": "noldanga",
    "faridpur": "faridpud",
    "paba": "poba",
    "bagmara": "baghmara",
    "mohanpur": "mohonpur",
    "ullapara": "ullapar",
    "sreemangal": "srimangal",
    "chhatak": "chatak",
    "dowarabazar": "duarabazar",
    "shantiganj": "santigonj",
    "dakkhinsurma": "dakshinsurma",
    "gowainghat": "goainghat",
    "zakiganj": "zakigonj",
    "ujirpur": "uzirpur",
    "gaurnadi": "gouranadi",
    "agailjhara": "agailzhara",
    "hijla": "hizla",
    "mehendiganj": "mahendiganj",
    "daulatkhan": "doulatkhan",
    "charfasson": "charfashion",
    "nalchhity": "nalchhiti",
    "kanthalia": "kathalia",
    "kawkhali": "kaukhali",
    "bakshiganj": "bakshigonj",
    "gafargaon": "gaforgaon",
    "fulpur": "phulpur",
    "ishwarganj": "isshwargonj",
    "purbadhala": "purbadhola",
    "jhenaigati": "jhinaigati",
    "birol": "biral",
    "bochaganj": "bachaganj",
    "chirirbandar": "chrirbandar",
    "fulbari": "phulbari",
    "gobindaganj": "gobindoganj",
    "palashbari": "palashbsri",
    "sadullapur": "saadullapur",
    "kishoreganj": "kishoriganj",
    "saidpur": "saidpur",
    "debiganj": "dabiganj",
    "atowari": "atwari",
    "tentulia": "telulia",
    "pirgachha": "pirgacha",
    "haripur": "horipur",
    "ranishankail": "ranisankail",
    "alfadanganga": "alfadanga",
    "naikhyongcharl": "naikkhongchhari",
    "motlobdokkhin": "matlabdakkhin",
    "motlobuttor": "matlabuttar",
    "cumillasadarsouth": "sadardakkhin",
    "monohorgonj": "manoharganj",
    "dagonbhuia": "daganbhuiyan",
    "laxmichari": "lakkhichhari",
    "suborno": "subarnachar",
    "patnitola": "patnitala",
    "dhamurhat": "dhamoirhat",
    "mohadebpur": "mahadebpur",
    "badalgachi": "badalgachhi",
    "niamotpur": "niamatpur",
    "chapaisadar": "chapainawabganjsadar",
    "gamostapur": "gomastapur",
    "nachol": "nachole",
    "hobiganjsadar": "habiganjsadar",
    "shaestaganj": "shayestaganj",
    "azmireeganj": "ajmiriganj",
    "baniachang": "baniachong",
    "biswombhorpur": "bishwambharpur",
    "moddonagar": "madhyanagar",
    "dormopasha": "dharmapasha",
    "barishalsadar": "barishalsadarkotwali",
    "tojumoddin": "tazumuddin",
    "swarupkathi": "nesarabadswarupkathi",
    "nasarabad": "nesarabadswarupkathi",
    "susungdurgapur": "durgapur",
    "shribardi": "sreebardi",
    "dinajpur": "dinajpursadar",
    "panchagarh": "panchagarhsadar",
    "thakurgaon": "thakurgaonsadar",
    "phulchari": "fulchhari",
}


UPAZILA_ONLY_MAPPINGS = {
    "satkhira": "satkhirasadar",
    "syedpur": "saidpur",
    "noapara": "abhaynagar",
}


def normalize(value: str | None) -> str:
    if not value:
        return ""
    value = value.lower()
    value = re.sub(r"\b(upazila|thana|upo|upzia|upzila|upizala)\b", "", value)
    return re.sub(r"[^a-z0-9]", "", value)


def canonical(value: str | None) -> str:
    normalized = normalize(value)
    return SPECIAL_MAPPINGS.get(normalized, normalized)


def canonical_upazila(value: str | None) -> str:
    normalized = canonical(value)
    return UPAZILA_ONLY_MAPPINGS.get(normalized, normalized)


def key(division: str, district: str, upazila: str) -> tuple[str, str, str]:
    return (canonical(division), canonical(district), canonical_upazila(upazila))


def seed_for(*parts: Any) -> int:
    text = "|".join(str(part) for part in parts)
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return int(digest[:16], 16)


def polygon_rings(geometry: dict[str, Any]) -> list[list[list[list[float]]]]:
    geometry_type = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if geometry_type == "Polygon":
        return [coords]
    if geometry_type == "MultiPolygon":
        return coords
    return []


def iter_points(geometry: dict[str, Any]) -> Iterable[tuple[float, float]]:
    for polygon in polygon_rings(geometry):
        for ring in polygon:
            for lon, lat, *_ in ring:
                yield (float(lon), float(lat))


def bbox(geometry: dict[str, Any]) -> tuple[float, float, float, float]:
    points = list(iter_points(geometry))
    if not points:
        raise ValueError("Geometry has no coordinates")
    lons = [point[0] for point in points]
    lats = [point[1] for point in points]
    return min(lons), min(lats), max(lons), max(lats)


def point_in_ring(lon: float, lat: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        intersects = (yi > lat) != (yj > lat)
        if intersects:
            x_at_lat = (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi
            if lon < x_at_lat:
                inside = not inside
        j = i
    return inside


def point_in_polygon(lon: float, lat: float, polygon: list[list[list[float]]]) -> bool:
    if not polygon or not point_in_ring(lon, lat, polygon[0]):
        return False
    return not any(point_in_ring(lon, lat, hole) for hole in polygon[1:])


def contains_point(geometry: dict[str, Any], lon: float, lat: float) -> bool:
    return any(point_in_polygon(lon, lat, polygon) for polygon in polygon_rings(geometry))


def representative_point(geometry: dict[str, Any]) -> tuple[float, float]:
    min_lon, min_lat, max_lon, max_lat = bbox(geometry)
    best = None
    best_margin = -1.0
    grid_size = 64
    for x_index in range(1, grid_size):
        lon = min_lon + (max_lon - min_lon) * x_index / grid_size
        for y_index in range(1, grid_size):
            lat = min_lat + (max_lat - min_lat) * y_index / grid_size
            if not contains_point(geometry, lon, lat):
                continue
            margin = min(lon - min_lon, max_lon - lon, lat - min_lat, max_lat - lat)
            if margin > best_margin:
                best = (lon, lat)
                best_margin = margin
    if best is not None:
        return best

    for lon, lat in iter_points(geometry):
        if contains_point(geometry, lon, lat):
            return lon, lat

    raise ValueError("Could not find a point inside geometry")


def random_point_in_geometry(
    geometry: dict[str, Any],
    seed: int,
    attempts: int,
) -> tuple[float, float, str]:
    min_lon, min_lat, max_lon, max_lat = bbox(geometry)
    rng = random.Random(seed)
    for _ in range(attempts):
        lon = rng.uniform(min_lon, max_lon)
        lat = rng.uniform(min_lat, max_lat)
        if contains_point(geometry, lon, lat):
            return lon, lat, "random"

    lon, lat = representative_point(geometry)
    return lon, lat, "representative"


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")


def build_boundary_index(upazilas_geojson: dict[str, Any]) -> dict[tuple[str, str, str], dict[str, Any]]:
    index = {}
    duplicate_keys = set()
    for feature in upazilas_geojson.get("features", []):
        props = feature.get("properties") or {}
        boundary_key = key(
            props.get("ADM1_EN", ""),
            props.get("ADM2_EN", ""),
            props.get("ADM3_EN", ""),
        )
        if boundary_key in index:
            duplicate_keys.add(boundary_key)
        index[boundary_key] = feature

    if duplicate_keys:
        print(f"Warning: {len(duplicate_keys)} duplicate boundary keys found; using the last feature.")
    return index


def flatten_post_offices(hierarchy: list[dict[str, Any]]) -> Iterable[dict[str, Any]]:
    for division_index, division_obj in enumerate(hierarchy):
        division = division_obj["division"]
        for district_index, district_obj in enumerate(division_obj.get("districts", [])):
            district = district_obj["district"]
            for station_index, station_obj in enumerate(district_obj.get("police_stations", [])):
                upazila = station_obj["police_station"]
                for office_index, office in enumerate(station_obj.get("post_offices", [])):
                    yield {
                        "id": f"{division_index}-{district_index}-{station_index}-{office_index}",
                        "division": division,
                        "district": district,
                        "upazila": upazila,
                        "office_name": office["office_name"],
                        "post_code": str(office["post_code"]),
                        "source_index": {
                            "division": division_index,
                            "district": district_index,
                            "police_station": station_index,
                            "post_office": office_index,
                        },
                    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate deterministic post office coordinates inside upazila boundaries."
    )
    parser.add_argument("--postcodes", type=Path, default=DEFAULT_POSTCODES)
    parser.add_argument("--upazilas", type=Path, default=DEFAULT_UPAZILAS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--unmatched-output", type=Path, default=DEFAULT_UNMATCHED)
    parser.add_argument("--attempts", type=int, default=2000)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with a non-zero status if any post offices cannot be matched to a boundary.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    hierarchy = load_json(args.postcodes)
    upazilas_geojson = load_json(args.upazilas)
    boundary_index = build_boundary_index(upazilas_geojson)

    records = []
    unmatched = []
    fallback_count = 0

    for office in flatten_post_offices(hierarchy):
        office_key = key(office["division"], office["district"], office["upazila"])
        feature = boundary_index.get(office_key)
        if not feature:
            unmatched.append(office)
            continue

        lon, lat, method = random_point_in_geometry(
            feature["geometry"],
            seed_for(
                office["division"],
                office["district"],
                office["upazila"],
                office["office_name"],
                office["post_code"],
                office["id"],
            ),
            args.attempts,
        )
        fallback_count += int(method == "representative")
        records.append(
            {
                **office,
                "lat": round(lat, 6),
                "lng": round(lon, 6),
                "location_method": method,
            }
        )

    output = {
        "generated_by": Path(__file__).name,
        "source_postcodes": str(args.postcodes.relative_to(ROOT)),
        "source_upazilas": str(args.upazilas.relative_to(ROOT)),
        "count": len(records),
        "unmatched_count": len(unmatched),
        "locations": records,
    }
    write_json(args.output, output)
    write_json(args.unmatched_output, {"count": len(unmatched), "items": unmatched})

    total = len(records) + len(unmatched)
    print(f"Processed {total} post offices.")
    print(f"Wrote {len(records)} generated locations to {args.output}")
    print(f"Wrote {len(unmatched)} unmatched records to {args.unmatched_output}")
    if fallback_count:
        print(f"Used representative-point fallback for {fallback_count} records.")

    if unmatched and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
