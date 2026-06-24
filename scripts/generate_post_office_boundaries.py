#!/usr/bin/env python3
"""
Generate full-coverage artificial post office boundary polygons.

For each upazila, the script creates clipped Voronoi-style cells from the
generated post office points. The cells partition the full upazila polygon:
every area inside an upazila is assigned to the nearest generated post office
in that same upazila, with no intentional overlap.

Requires:
  python -m pip install shapely
"""

from __future__ import annotations

import argparse
import math
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from shapely.geometry import GeometryCollection, MultiPolygon, Point, Polygon, mapping, shape
from shapely.ops import transform, unary_union
from shapely.validation import make_valid

from generate_post_office_locations import (
    ROOT,
    build_boundary_index,
    contains_point,
    key,
    load_json,
    write_json,
)


DEFAULT_LOCATIONS = ROOT / "src" / "data" / "post_office_locations.json"
DEFAULT_UPAZILAS = ROOT / "src" / "data" / "upazilas.geojson.json"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "post_office_boundaries.geojson.json"
DEFAULT_SKIPPED = ROOT / "src" / "data" / "post_office_boundaries_skipped.json"

METERS_PER_DEGREE_LAT = 111320
MIN_CELL_AREA_SQ_METERS = 1.0


def group_locations(locations: list[dict[str, Any]]) -> dict[tuple[str, str, str], list[dict[str, Any]]]:
    groups = defaultdict(list)
    for office in locations:
        groups[key(office["division"], office["district"], office["upazila"])].append(office)
    return groups


def lon_scale_for_lat(lat: float) -> float:
    return max(math.cos(math.radians(lat)), 0.1)


def projection_for(offices: list[dict[str, Any]]):
    origin_lat = sum(office["lat"] for office in offices) / len(offices)
    lon_scale = lon_scale_for_lat(origin_lat)

    def to_meters(x, y, z=None):
        return x * METERS_PER_DEGREE_LAT * lon_scale, y * METERS_PER_DEGREE_LAT

    def to_degrees(x, y, z=None):
        return x / (METERS_PER_DEGREE_LAT * lon_scale), y / METERS_PER_DEGREE_LAT

    return to_meters, to_degrees


def clean_geometry(geometry):
    geometry = make_valid(geometry)
    if geometry.is_empty:
        return geometry

    # buffer(0) resolves many tiny self-touching artifacts from source polygons.
    geometry = geometry.buffer(0)
    return make_valid(geometry)


def polygonal_parts(geometry):
    if geometry.is_empty:
        return []
    if isinstance(geometry, Polygon):
        return [geometry]
    if isinstance(geometry, MultiPolygon):
        return list(geometry.geoms)
    if isinstance(geometry, GeometryCollection):
        parts = []
        for part in geometry.geoms:
            parts.extend(polygonal_parts(part))
        return parts
    return []


def half_plane_for_site(site_xy: tuple[float, float], other_xy: tuple[float, float], extent: float) -> Polygon:
    sx, sy = site_xy
    ox, oy = other_xy
    dx = ox - sx
    dy = oy - sy
    distance = math.hypot(dx, dy)
    if distance == 0:
        return Polygon()

    ux = dx / distance
    uy = dy / distance
    tx = -uy
    ty = ux
    mx = (sx + ox) / 2
    my = (sy + oy) / 2

    # Candidate side: from the perpendicular bisector toward the site.
    side_x = -ux
    side_y = -uy
    candidate = Polygon(
        [
            (mx + tx * extent, my + ty * extent),
            (mx - tx * extent, my - ty * extent),
            (mx - tx * extent + side_x * extent * 2, my - ty * extent + side_y * extent * 2),
            (mx + tx * extent + side_x * extent * 2, my + ty * extent + side_y * extent * 2),
        ]
    )

    if candidate.contains(Point(site_xy)) or candidate.touches(Point(site_xy)):
        return candidate

    # Numerical fallback: use the opposite side if the first orientation failed.
    side_x = ux
    side_y = uy
    return Polygon(
        [
            (mx + tx * extent, my + ty * extent),
            (mx - tx * extent, my - ty * extent),
            (mx - tx * extent + side_x * extent * 2, my - ty * extent + side_y * extent * 2),
            (mx + tx * extent + side_x * extent * 2, my + ty * extent + side_y * extent * 2),
        ]
    )


def projected_extent(upazila_geometry) -> float:
    minx, miny, maxx, maxy = upazila_geometry.bounds
    diagonal = math.hypot(maxx - minx, maxy - miny)
    return max(diagonal * 100, 10000)


def polygonal_geometry(geometry):
    parts = polygonal_parts(geometry)
    if not parts:
        return geometry
    if len(parts) == 1:
        return parts[0]
    return MultiPolygon(parts)


def assign_slivers_to_nearest_owner(cells: list[dict[str, Any]], upazila_geometry):
    union = unary_union([cell["geometry"] for cell in cells]).buffer(0)
    remainder = upazila_geometry.difference(union)
    if remainder.is_empty:
        return

    for sliver in polygonal_parts(remainder):
        representative = sliver.representative_point()
        owner = min(
            cells,
            key=lambda cell: representative.distance(Point(cell["site_xy"])),
        )
        owner["geometry"] = make_valid(owner["geometry"].union(sliver))


def build_cells_for_upazila(
    offices: list[dict[str, Any]],
    upazila_feature: dict[str, Any],
    min_area_sq_meters: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    skipped = []
    to_meters, to_degrees = projection_for(offices)
    upazila_degrees = clean_geometry(shape(upazila_feature["geometry"]))
    upazila_meters = clean_geometry(transform(to_meters, upazila_degrees))
    extent = projected_extent(upazila_meters)

    cells = []
    projected_offices = []
    for office in offices:
        if not contains_point(upazila_feature["geometry"], office["lng"], office["lat"]):
            skipped.append({**office, "reason": "post_office_point_outside_upazila"})
            continue

        site_xy = transform(to_meters, Point(office["lng"], office["lat"])).coords[0]
        projected_offices.append((office, site_xy))

    for office, site_xy in projected_offices:
        cell = upazila_meters
        for other_office, other_xy in projected_offices:
            if other_office["id"] == office["id"]:
                continue
            if site_xy == other_xy:
                continue

            half_plane = half_plane_for_site(site_xy, other_xy, extent)
            if half_plane.is_empty:
                continue

            cell = clean_geometry(cell.intersection(half_plane))
            if cell.is_empty:
                break

        if cell.is_empty or cell.area < min_area_sq_meters:
            skipped.append({**office, "reason": "degenerate_voronoi_cell"})
            continue

        cells.append(
            {
                "office": office,
                "site_xy": site_xy,
                "geometry": cell,
            }
        )

    if cells:
        assign_slivers_to_nearest_owner(cells, upazila_meters)

    for cell in cells:
        cell["geometry"] = clean_geometry(cell["geometry"].intersection(upazila_meters))
        cell["geometry"] = transform(to_degrees, cell["geometry"])

    return cells, skipped


def feature_from_cell(cell: dict[str, Any]) -> dict[str, Any]:
    office = cell["office"]
    geometry = polygonal_geometry(cell["geometry"])
    geojson_geometry = mapping(geometry)

    return {
        "type": "Feature",
        "properties": {
            "id": office["id"],
            "division": office["division"],
            "district": office["district"],
            "upazila": office["upazila"],
            "office_name": office["office_name"],
            "post_code": office["post_code"],
            "center_lat": office["lat"],
            "center_lng": office["lng"],
            "boundary_method": "synthetic_voronoi_partition_clipped_to_upazila",
        },
        "geometry": geojson_geometry,
    }


def fallback_feature_from_office(office: dict[str, Any], geometry) -> dict[str, Any]:
    return {
        "type": "Feature",
        "properties": {
            "id": office["id"],
            "division": office["division"],
            "district": office["district"],
            "upazila": office["upazila"],
            "office_name": office["office_name"],
            "post_code": office["post_code"],
            "center_lat": office["lat"],
            "center_lng": office["lng"],
            "boundary_method": "synthetic_fallback_micro_cell_clipped_to_upazila",
        },
        "geometry": mapping(polygonal_geometry(geometry)),
    }


def add_fallback_cells_for_skipped(
    features: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
    boundary_index: dict[tuple[str, str, str], dict[str, Any]],
    radius_meters: float = 35,
) -> list[dict[str, Any]]:
    still_skipped = []

    for office in skipped:
        if office.get("reason") not in {"degenerate_voronoi_cell"}:
            still_skipped.append(office)
            continue

        office_key = key(office["division"], office["district"], office["upazila"])
        upazila_feature = boundary_index.get(office_key)
        if not upazila_feature:
            still_skipped.append(office)
            continue

        to_meters, to_degrees = projection_for([office])
        upazila_degrees = clean_geometry(shape(upazila_feature["geometry"]))
        point_meters = transform(to_meters, Point(office["lng"], office["lat"]))
        patch_meters = point_meters.buffer(radius_meters, resolution=12)
        patch_degrees = transform(to_degrees, patch_meters).intersection(upazila_degrees)
        patch_degrees = make_valid(patch_degrees)

        if patch_degrees.is_empty:
            still_skipped.append({**office, "reason": "fallback_micro_cell_empty"})
            continue

        for feature in features:
            props = feature["properties"]
            if key(props["division"], props["district"], props["upazila"]) != office_key:
                continue

            geometry = make_valid(shape(feature["geometry"]).difference(patch_degrees))
            feature["geometry"] = mapping(polygonal_geometry(geometry))

        features.append(fallback_feature_from_office(office, patch_degrees))

    return still_skipped


def repair_feature_coverage(features: list[dict[str, Any]], boundary_index: dict[tuple[str, str, str], dict[str, Any]]) -> None:
    grouped_features = defaultdict(list)
    for feature in features:
        props = feature["properties"]
        grouped_features[key(props["division"], props["district"], props["upazila"])].append(feature)

    for office_key, group in grouped_features.items():
        upazila_feature = boundary_index.get(office_key)
        if not upazila_feature:
            continue

        upazila_geometry = clean_geometry(shape(upazila_feature["geometry"]))
        feature_geometries = [clean_geometry(shape(feature["geometry"])) for feature in group]
        union = unary_union(feature_geometries).buffer(0)
        remainder = upazila_geometry.difference(union)
        if remainder.is_empty:
            continue

        for missing_part in polygonal_parts(remainder):
            if missing_part.is_empty:
                continue

            representative = missing_part.representative_point()
            owner_index = min(
                range(len(group)),
                key=lambda index: representative.distance(
                    Point(
                        group[index]["properties"]["center_lng"],
                        group[index]["properties"]["center_lat"],
                    )
                ),
            )
            feature_geometries[owner_index] = make_valid(feature_geometries[owner_index].union(missing_part))

        for feature, geometry in zip(group, feature_geometries):
            feature["geometry"] = mapping(polygonal_geometry(geometry))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate full-coverage, non-overlapping artificial post office boundaries."
    )
    parser.add_argument("--locations", type=Path, default=DEFAULT_LOCATIONS)
    parser.add_argument("--upazilas", type=Path, default=DEFAULT_UPAZILAS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--skipped-output", type=Path, default=DEFAULT_SKIPPED)
    parser.add_argument("--min-area-sq-meters", type=float, default=MIN_CELL_AREA_SQ_METERS)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero if any generated-location record cannot be converted into a boundary.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    locations_data = load_json(args.locations)
    upazilas_geojson = load_json(args.upazilas)
    boundary_index = build_boundary_index(upazilas_geojson)
    locations = locations_data.get("locations", [])
    grouped = group_locations(locations)

    features = []
    skipped = []

    for office_key, offices in grouped.items():
        upazila_feature = boundary_index.get(office_key)
        if not upazila_feature:
            for office in offices:
                skipped.append({**office, "reason": "missing_upazila_boundary"})
            continue

        cells, skipped_for_upazila = build_cells_for_upazila(
            offices,
            upazila_feature,
            args.min_area_sq_meters,
        )
        skipped.extend(skipped_for_upazila)
        features.extend(feature_from_cell(cell) for cell in cells)

    skipped = add_fallback_cells_for_skipped(features, skipped, boundary_index)
    repair_feature_coverage(features, boundary_index)
    repair_feature_coverage(features, boundary_index)

    output = {
        "type": "FeatureCollection",
        "metadata": {
            "generated_by": Path(__file__).name,
            "source_locations": str(args.locations.relative_to(ROOT)),
            "source_upazilas": str(args.upazilas.relative_to(ROOT)),
            "count": len(features),
            "skipped_count": len(skipped),
            "note": "Artificial Voronoi partitions, not official postal boundaries.",
        },
        "features": features,
    }

    write_json(args.output, output)
    write_json(args.skipped_output, {"count": len(skipped), "items": skipped})

    print(f"Processed {len(locations)} generated post office locations.")
    print(f"Wrote {len(features)} artificial boundaries to {args.output}")
    print(f"Wrote {len(skipped)} skipped records to {args.skipped_output}")

    if skipped and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
