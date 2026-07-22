# Multi-Sensor 3-Class Deforestation Change Detection
## 8 Sub-Himalayan AOIs (Pakistan), 2018-2025

Status: **Phase 0 (reproducibility scaffolding) and Phase 1 (GEE data
acquisition scripts) drafted. Nothing has been executed in the GEE Code
Editor yet.** See `docs/KNOWN_LIMITATIONS.md` before trusting anything here.

## Repo layout

```
config/
  project_config.py   Single source of truth: seed, CRS, years, AOI boxes
  verify_aois.py       Mechanical AOI sanity check (overlaps, ranges) --
                       run this after any AOI edit, before trusting it
gee_scripts/
  01_sentinel2_composites.js   S2 L2A April-May composites, SCL cloud mask
  02_sentinel1_composites.js   S1 GRD, Refined Lee filter, approx terrain correction
  03_dem_derivatives.js        Elevation/slope/aspect from Copernicus GLO-30
docs/
  KNOWN_LIMITATIONS.md  Honest list of what is and is not actually verified
```

## Required order of operations

1. Run `python3 config/verify_aois.py`. It must print "MECHANICAL CHECKS
   PASSED". Then **manually click all 8 Google Maps links it prints** and
   confirm each anchor town is visibly inside its box. This has NOT been
   done yet as of this commit -- see `docs/KNOWN_LIMITATIONS.md`.
2. Paste `gee_scripts/01_sentinel2_composites.js` into the GEE Code Editor
   with `RUN_MODE = 'inspect'`. Run it. Check the per-AOI/per-year image
   counts in the Console. Toggle on the AOI_1 and AOI_8 RGB layers and
   visually confirm they look like real satellite imagery of those places.
3. Repeat step 2 for `02_sentinel1_composites.js` and
   `03_dem_derivatives.js`.
4. Only after all three look right, flip each script's `RUN_MODE` to
   `'export'` and re-run to queue the Drive export tasks.
5. Once composites are exported and downloaded, Phase 2 (Dynamic World
   label construction) is next -- not yet started.

## Fixed parameters

- 8 AOIs, one of which (AOI_8 / Galyat) is a permanent out-of-distribution
  holdout -- never used in training, validation, or k-fold rotation.
- 2018-2025, April-May composite window per year.
- 3-class scheme: No Change / No Forest / Deforest.
- CRS: EPSG:32643 (UTM 43N). Pixel size: 10m.
- Fixed seed: 42 (see `set_all_seeds()` in `project_config.py`).

Full phase-by-phase research plan lives outside this repo (the project's
research plan document) -- this repo implements Phases 0-1 of that plan.
