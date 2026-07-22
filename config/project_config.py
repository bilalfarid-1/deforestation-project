"""
Project-wide configuration for the 8-AOI Sub-Himalayan deforestation
change-detection study.

Everything downstream (GEE export scripts, patch extraction, training)
should import from this file rather than re-declaring constants, so
there is exactly one source of truth for seeds, CRS, dates, and AOIs.
"""

import random
import numpy as np

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
SEED = 42

def set_all_seeds(seed: int = SEED) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch
        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass

# ---------------------------------------------------------------------------
# Spatial reference
# ---------------------------------------------------------------------------
# UTM Zone 43N covers all 8 AOIs (roughly 72-78 deg E); this matches the
# study region longitude band. EPSG:32643 = WGS 84 / UTM zone 43N.
CRS = "EPSG:32643"
PIXEL_SIZE_M = 10

# ---------------------------------------------------------------------------
# Temporal scope
# ---------------------------------------------------------------------------
YEARS = list(range(2018, 2026))          # 2018..2025 inclusive
COMPOSITE_WINDOW = ("04-01", "05-31")    # April-May, per AOI per year
CONSECUTIVE_PAIRS = [(y, y + 1) for y in YEARS[:-1]]  # 7 pairs

# ---------------------------------------------------------------------------
# AOIs
# ---------------------------------------------------------------------------
# Bounding boxes as (min_lon, min_lat, max_lon, max_lat) in WGS84 (EPSG:4326).
# These are deliberately generous (city/region-scale) boxes around each named
# anchor town/landmark, NOT tight administrative boundaries -- the goal is to
# guarantee full coverage of the forest/non-forest mosaic around each anchor
# without overlapping a neighboring AOI's box.
#
# IMPORTANT: These must be visually verified on a map (Phase 0 requirement)
# before any GEE export is trusted. See verify_aois.py in this same folder --
# run it and actually look at the output before proceeding.
AOIS = {
    "AOI_1_Margalla_Islamabad": {
        "anchor": "Islamabad / Margalla Hills",
        "bbox": (72.95, 33.65, 73.20, 33.87),
    },
    "AOI_2_Lower_Murree_Ghoragali": {
        "anchor": "Ghoragali / Lower Murree",
        "bbox": (73.35, 33.82, 73.50, 33.93),
    },
    "AOI_3_Potohar_Kahuta": {
        "anchor": "Kahuta, Potohar Plateau",
        "bbox": (73.28, 33.55, 73.50, 33.72),
    },
    "AOI_4_AJK_Border_Foothills": {
        "anchor": "AJK border foothills (near Kotli/Rawalakot approach)",
        "bbox": (73.55, 33.55, 73.80, 33.75),
    },
    "AOI_5_Upper_Jhelum_Kohala": {
        "anchor": "Kohala, Upper Jhelum",
        "bbox": (73.36, 34.24, 73.55, 34.38),
    },
    "AOI_6_Haripur_Khanpur": {
        "anchor": "Khanpur, Haripur District",
        "bbox": (72.98, 33.90, 73.18, 34.04),
    },
    "AOI_7_Abbottabad_Havelian": {
        "anchor": "Abbottabad / Havelian",
        "bbox": (73.10, 34.04, 73.28, 34.19),
    },
    "AOI_8_Galyat": {
        "anchor": "Galyat (Nathia Gali / Ayubia belt)",
        "bbox": (73.30, 34.00, 73.48, 34.13),
        # AOI_8 is the designated out-of-distribution (OOD) holdout.
        # It must NEVER appear in training, validation, or k-fold rotation.
        "ood_holdout": True,
    },
}

OOD_HOLDOUT_AOI = "AOI_8_Galyat"

# Sanity assertion importable by any script that touches AOIs
def assert_ood_excluded(aoi_list):
    assert OOD_HOLDOUT_AOI not in aoi_list, (
        f"{OOD_HOLDOUT_AOI} must never appear in training/val/k-fold splits."
    )
