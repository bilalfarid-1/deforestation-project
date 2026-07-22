"""
Phase 0 AOI sanity check.

This does NOT replace visually eyeballing each box on a real map (Google
Maps / Earth Engine geometry viewer) -- it catches the mechanical errors
(overlaps, degenerate boxes, wrong hemisphere/sign) that a human skim can
miss, and prints center coordinates + a Google Maps link per AOI so the
visual check is fast rather than tedious.

Run: python3 verify_aois.py
"""

from shapely.geometry import box, Point
from itertools import combinations
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from project_config import AOIS, OOD_HOLDOUT_AOI


def to_shapely_box(bbox):
    min_lon, min_lat, max_lon, max_lat = bbox
    return box(min_lon, min_lat, max_lon, max_lat)


def check_degenerate(name, bbox):
    min_lon, min_lat, max_lon, max_lat = bbox
    problems = []
    if min_lon >= max_lon:
        problems.append(f"min_lon ({min_lon}) >= max_lon ({max_lon})")
    if min_lat >= max_lat:
        problems.append(f"min_lat ({min_lat}) >= max_lat ({max_lat})")
    # Pakistan sub-Himalayan region sanity range check
    if not (69 <= min_lon <= 78 and 69 <= max_lon <= 78):
        problems.append(f"longitude out of expected Pakistan range (69-78E): {min_lon}, {max_lon}")
    if not (30 <= min_lat <= 37 and 30 <= max_lat <= 37):
        problems.append(f"latitude out of expected Pakistan range (30-37N): {min_lat}, {max_lat}")
    return problems


def main():
    print("=" * 78)
    print("AOI VERIFICATION REPORT")
    print("=" * 78)

    all_ok = True
    geoms = {}

    # 1. Degenerate / out-of-range checks
    print("\n--- Degenerate / range checks ---")
    for name, spec in AOIS.items():
        problems = check_degenerate(name, spec["bbox"])
        geoms[name] = to_shapely_box(spec["bbox"])
        if problems:
            all_ok = False
            print(f"[FAIL] {name}: {problems}")
        else:
            print(f"[ OK ] {name}")

    # 2. Pairwise overlap checks
    print("\n--- Pairwise overlap checks ---")
    any_overlap = False
    for (name_a, geom_a), (name_b, geom_b) in combinations(geoms.items(), 2):
        if geom_a.intersects(geom_b):
            overlap_area = geom_a.intersection(geom_b).area
            if overlap_area > 1e-9:  # ignore floating-point edge touches
                any_overlap = True
                all_ok = False
                print(f"[FAIL] OVERLAP: {name_a} <-> {name_b} "
                      f"(intersection area = {overlap_area:.6f} deg^2)")
    if not any_overlap:
        print("[ OK ] No pairwise overlaps detected among the 8 AOI boxes.")

    # 3. OOD holdout sanity
    print("\n--- OOD holdout check ---")
    if OOD_HOLDOUT_AOI in AOIS and AOIS[OOD_HOLDOUT_AOI].get("ood_holdout") is True:
        print(f"[ OK ] {OOD_HOLDOUT_AOI} is flagged ood_holdout=True.")
    else:
        all_ok = False
        print(f"[FAIL] {OOD_HOLDOUT_AOI} is not correctly flagged as the OOD holdout.")

    # 4. Anchor-point containment checks (where anchor_point is provided)
    print("\n--- Anchor-point containment checks ---")
    any_anchor_fail = False
    for name, spec in AOIS.items():
        if "anchor_point" not in spec:
            print(f"[SKIP] {name}: no anchor_point recorded, manual map check still required.")
            continue
        lon, lat = spec["anchor_point"]
        pt = Point(lon, lat)
        geom = geoms[name]
        if geom.contains(pt):
            print(f"[ OK ] {name}: anchor_point ({lat:.4f}, {lon:.4f}) is inside its box.")
        else:
            any_anchor_fail = True
            all_ok = False
            print(f"[FAIL] {name}: anchor_point ({lat:.4f}, {lon:.4f}) is NOT inside its box "
                  f"{spec['bbox']}.")
    if not any_anchor_fail:
        print("All recorded anchor points fall inside their assigned boxes.")

    # 5. Print center coords + Google Maps link for manual visual verification
    # THIS STEP IS STILL RECOMMENDED even with anchor_point checks passing --
    # a single point being inside a box doesn't guarantee the box's overall
    # extent/orientation makes sense (e.g. it could be inside but skewed
    # entirely to one corner). Anchor-point checks catch gross placement
    # errors; they don't replace a human sanity look at the full box.
    print("\n--- Manual visual verification links (REQUIRED, not optional) ---")
    for name, spec in AOIS.items():
        min_lon, min_lat, max_lon, max_lat = spec["bbox"]
        center_lon = (min_lon + max_lon) / 2
        center_lat = (min_lat + max_lat) / 2
        maps_url = f"https://www.google.com/maps/@{center_lat},{center_lon},11z"
        print(f"{name:35s} anchor='{spec['anchor']}'")
        print(f"    bbox={spec['bbox']}  center=({center_lat:.4f}, {center_lon:.4f})")
        print(f"    check: {maps_url}")

    print("\n" + "=" * 78)
    if all_ok:
        print("MECHANICAL CHECKS PASSED. You still must click each link above")
        print("and visually confirm the anchor town falls inside its box before")
        print("trusting these AOIs for data export.")
    else:
        print("MECHANICAL CHECKS FAILED -- fix project_config.py before proceeding.")
    print("=" * 78)

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
