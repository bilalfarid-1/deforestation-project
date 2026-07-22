/**
 * 01_sentinel2_composites.js
 *
 * Builds April-May median Sentinel-2 L2A composites for each of the 8 AOIs,
 * for each year 2018-2025.
 *
 * WORKFLOW (mandatory order):
 *   1. Paste into GEE Code Editor.
 *   2. Set RUN_MODE = 'inspect' first. Run. Check the printed image counts
 *      per AOI per year in the Console -- if any cell is 0 or unexpectedly
 *      low, STOP and investigate (cloud cover, AOI misplacement, wrong
 *      collection ID) before touching exports.
 *   3. Visually add at least AOI_1 and AOI_8 composites to the Map and
 *      eyeball them -- confirm no all-black/no-data tiles, confirm the
 *      visible landscape roughly matches the named place (forest cover on
 *      hillslopes, urban grid at Islamabad, etc).
 *   4. Only after both 2 and 3 look right, set RUN_MODE = 'export' and
 *      re-run to kick off the actual Drive export tasks.
 *
 * Exports are DISABLED by default (RUN_MODE = 'inspect') on purpose.
 */

// ---------------------------------------------------------------------------
// CONFIG -- keep in sync with config/project_config.py
// ---------------------------------------------------------------------------
var RUN_MODE = 'inspect'; // 'inspect' | 'export'

var YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
var COMPOSITE_START_MD = '04-01';
var COMPOSITE_END_MD = '05-31';

var AOIS = {
  'AOI_1_Margalla_Islamabad':      [73.00, 33.65, 73.20, 33.85],
  'AOI_2_Lower_Murree_Ghoragali':  [73.35, 33.82, 73.50, 33.93],
  'AOI_3_Potohar_Kahuta':          [73.28, 33.55, 73.50, 33.72],
  'AOI_4_AJK_Border_Foothills':    [73.55, 33.55, 73.80, 33.75],
  'AOI_5_Upper_Jhelum_Kohala':     [73.48, 34.00, 73.66, 34.18],
  'AOI_6_Haripur_Khanpur':         [72.78, 33.72, 72.98, 33.92],
  'AOI_7_Abbottabad_Havelian':     [73.10, 34.04, 73.28, 34.19],
  'AOI_8_Galyat':                  [73.30, 34.00, 73.48, 34.13]
};

var EXPORT_CRS = 'EPSG:32643'; // UTM 43N, must match project_config.py
var EXPORT_SCALE = 10;         // meters
var DRIVE_FOLDER = 'deforestation_s2_composites';

// ---------------------------------------------------------------------------
// Cloud/shadow masking using the Scene Classification Layer (SCL)
// ---------------------------------------------------------------------------
function maskS2clouds(image) {
  var scl = image.select('SCL');
  // Keep: 4 (vegetation), 5 (bare soil), 6 (water), 7 (unclassified),
  //       11 (snow) -- drop 3 (cloud shadow), 8/9/10 (cloud variants), 1 (saturated), 2 (dark area)
  var goodMask = scl.eq(4).or(scl.eq(5)).or(scl.eq(6)).or(scl.eq(7)).or(scl.eq(11));
  return image.updateMask(goodMask).divide(10000)
    .copyProperties(image, ['system:time_start']);
}

// ---------------------------------------------------------------------------
// Build one composite for one AOI/year
// ---------------------------------------------------------------------------
function buildComposite(aoiGeom, year) {
  var start = ee.Date(year + '-' + COMPOSITE_START_MD);
  var end = ee.Date(year + '-' + COMPOSITE_END_MD);

  var col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoiGeom)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
    .map(maskS2clouds)
    .select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12']);

  var count = col.size();
  var composite = col.median().clip(aoiGeom);

  return {composite: composite, count: count};
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
var aoiNames = Object.keys(AOIS);

for (var a = 0; a < aoiNames.length; a++) {
  var aoiName = aoiNames[a];
  var bbox = AOIS[aoiName];
  var aoiGeom = ee.Geometry.Rectangle(bbox);

  for (var y = 0; y < YEARS.length; y++) {
    var year = YEARS[y];
    var result = buildComposite(aoiGeom, year);

    if (RUN_MODE === 'inspect') {
      print(aoiName + ' ' + year + ' image count:', result.count);
    }

    if (RUN_MODE === 'inspect' && (aoiName === 'AOI_1_Margalla_Islamabad' || aoiName === 'AOI_8_Galyat')) {
      Map.addLayer(
        result.composite,
        {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3},
        aoiName + '_' + year + '_RGB',
        false // not shown by default, toggle on in Layers panel to inspect
      );
    }

    if (RUN_MODE === 'export') {
      Export.image.toDrive({
        image: result.composite,
        description: 'S2_' + aoiName + '_' + year,
        folder: DRIVE_FOLDER,
        fileNamePrefix: 'S2_' + aoiName + '_' + year,
        region: aoiGeom,
        scale: EXPORT_SCALE,
        crs: EXPORT_CRS,
        maxPixels: 1e10
      });
    }
  }
}

if (RUN_MODE === 'inspect') {
  Map.centerObject(ee.Geometry.Rectangle(AOIS['AOI_1_Margalla_Islamabad']), 9);
  print('RUN_MODE is "inspect" -- no exports queued. Check image counts above ' +
        'and toggle on the AOI_1/AOI_8 RGB layers before switching to export mode.');
}
