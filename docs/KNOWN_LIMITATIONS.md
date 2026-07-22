# Known Limitations / Required Manual Steps

This file exists so that assumptions made by an AI assistant during setup
are not silently treated as verified facts. Read this before trusting
anything downstream of Phase 0.

## AOI bounding boxes: geometry-consistent, NOT map-verified

`config/project_config.py` defines 8 AOI bounding boxes. `config/verify_aois.py`
confirms:
- no pairwise overlaps
- no degenerate boxes (min < max)
- coordinates fall within Pakistan's general lon/lat range
- AOI_8 is correctly flagged as the OOD holdout

**What verify_aois.py does NOT confirm:** that each anchor town/landmark
actually falls inside its assigned box on the ground. The coordinates were
placed from general geographic recollection, then adjusted algebraically
to eliminate overlaps between AOI_5 (Kohala), AOI_6 (Khanpur), AOI_7
(Abbottabad/Havelian), and AOI_8 (Galyat) -- these four are genuinely close
together in real life, so shrinking/repositioning boxes to avoid overlap
means their exact placement has NOT been independently confirmed against
real map/satellite imagery.

**Action required before any GEE export is trusted:** open each of the 8
Google Maps links printed by `verify_aois.py` and manually confirm the
named anchor town or landmark is visibly inside the box. If any AOI is
wrong, fix `project_config.py` and re-run `verify_aois.py` -- do not hand-edit
around the checker.

## GEE scripts: not yet executed

As of this commit, none of the Earth Engine scripts in `gee_scripts/` have
been run in the GEE Code Editor. Image counts, cloud cover in the April-May
composite window, and actual AOI_8 composite appearance are all unverified.
Run script 01 first, sanity-check image counts and a visual composite for
at least AOI_1 and AOI_8, before trusting the rest.

## Everything past Phase 1

Phase 2 (Dynamic World label construction), Phase 3-11 are not yet started.
