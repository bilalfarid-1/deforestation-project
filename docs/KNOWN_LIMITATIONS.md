# Known Limitations / Required Manual Steps

This file exists so that assumptions made by an AI assistant during setup
are not silently treated as verified facts. Read this before trusting
anything downstream of Phase 0.

## AOI bounding boxes: geometry-consistent AND cross-checked against an independent geographic estimate, but still not human-map-verified

`config/project_config.py` defines 8 AOI bounding boxes. `config/verify_aois.py`
mechanically confirms:
- no pairwise overlaps
- no degenerate boxes (min < max)
- coordinates fall within Pakistan's general lon/lat range
- AOI_8 is correctly flagged as the OOD holdout
- each AOI's `anchor_point` (a real-world lat/lon for the named town/landmark)
  falls inside that AOI's bounding box

**Update:** The `anchor_point` values and 3 real placement errors (AOI_1,
AOI_5, AOI_6) were identified by asking Gemini to independently estimate the
real-world coordinates of each anchor town from its own knowledge and check
them against the original boxes. It found:
- AOI_5 (Kohala) was ~17km too far north of real Kohala (was centered near
  Muzaffarabad approach instead of the actual Jhelum crossing at ~34.09N).
- AOI_6 (Khanpur) was ~11-12km northeast of real Khanpur (was missing the
  actual dam/town at ~33.81N, 72.94E).
- AOI_1 required shrinking slightly (from 72.95-73.20E to 73.00-73.20E lon)
  to make genuine non-overlapping room for the corrected AOI_6, since real
  Khanpur sits very close to AOI_1's original western edge.

All three were fixed, propagated into `config/project_config.py` AND all
three `gee_scripts/*.js` files (which had the old hardcoded boxes and needed
separate correction), and re-verified mechanically -- overlap checks and
anchor-point containment checks both pass as of this commit.

**What is still NOT independently confirmed:** Gemini's anchor coordinates
are themselves an LLM's best estimate from training knowledge, not a live
lookup against authoritative map data (no satellite imagery was rendered
and inspected by any party in this loop). The boxes are now consistent with
two independent LLM-derived estimates (the original placement + Gemini's
correction), which is stronger evidence than a single unchecked assertion,
but it is not the same as a human clicking through real map tiles.

**Action still required before any GEE export is trusted:** open each of
the 8 Google Maps links printed by `verify_aois.py` and manually confirm the
named anchor town or landmark is visibly inside the box, and that the box
plausibly contains a forest/non-forest mosaic (not e.g. all-urban or
all-agricultural terrain). This has not yet been done by a human as of
this commit.

## GEE scripts: not yet executed

As of this commit, none of the Earth Engine scripts in `gee_scripts/` have
been run in the GEE Code Editor. Image counts, cloud cover in the April-May
composite window, and actual AOI_8 composite appearance are all unverified.
Run script 01 first, sanity-check image counts and a visual composite for
at least AOI_1 and AOI_8, before trusting the rest.

## Everything past Phase 1

Phase 2 (Dynamic World label construction), Phase 3-11 are not yet started.
