/**
 * 02_sentinel1_composites.js
 *
 * Builds April-May Sentinel-1 GRD (IW, VV+VH, ascending) composites per AOI
 * per year, with:
 *   - border noise removal (handled by GRD collection preprocessing)
 *   - Refined Lee speckle filter
 *   - approximate terrain correction using Copernicus GLO-30 DEM
 *     (radiometric slope correction via local incidence angle)
 *
 * NOTE ON TERRAIN CORRECTION: this is an approximate radiometric terrain
 * flattening (cosine correction using local incidence angle from the DEM),
 * not a full SAR geometric terrain correction (RTC) pipeline. It is a
 * reasonable first pass given GEE's built-in tools, but if reviewers push
 * back on SAR terrain noise, the documented next step is to preprocess
 * through a dedicated RTC toolchain (e.g. SNAP or the GEE community RTC
 * dataset 'COPERNICUS/S1_GRD_FLOAT' + external correction) rather than
 * relying solely on this in-script cosine correction.
 *
 * WORKFLOW: same as script 01 -- inspect image counts and visually check
 * AOI_1/AOI_8 VV/VH composites before ever setting RUN_MODE = 'export'.
 */

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

var EXPORT_CRS = 'EPSG:32643';
var EXPORT_SCALE = 10;
var DRIVE_FOLDER = 'deforestation_s1_composites';

var DEM = ee.Image('COPERNICUS/DEM/GLO30').select('DEM');

// ---------------------------------------------------------------------------
// Refined Lee speckle filter (standard GEE community implementation)
// ---------------------------------------------------------------------------
function refinedLee(image) {
  var bandNames = image.bandNames();

  function filterBand(b) {
    var img = image.select([b]);
    var weights3 = ee.List.repeat(ee.List.repeat(1, 3), 3);
    var kernel3 = ee.Kernel.fixed(3, 3, weights3, 1, 1, false);

    var mean3 = img.reduceNeighborhood(ee.Reducer.mean(), kernel3);
    var variance3 = img.reduceNeighborhood(ee.Reducer.variance(), kernel3);

    var sample_weights = ee.List([
      [0,0,0,0,0,0,0], [0,1,0,1,0,1,0], [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0], [0,0,0,0,0,0,0], [0,1,0,1,0,1,0], [0,0,0,0,0,0,0]
    ]);
    var sample_kernel = ee.Kernel.fixed(7, 7, sample_weights, 3, 3, false);

    var sample_mean = mean3.neighborhoodToBands(sample_kernel);
    var sample_var = variance3.neighborhoodToBands(sample_kernel);

    var gradients = sample_mean.select(1).subtract(sample_mean.select(7)).abs();
    gradients = gradients.addBands(sample_mean.select(6).subtract(sample_mean.select(2)).abs());
    gradients = gradients.addBands(sample_mean.select(3).subtract(sample_mean.select(5)).abs());
    gradients = gradients.addBands(sample_mean.select(0).subtract(sample_mean.select(8)).abs());

    var max_gradient = gradients.reduce(ee.Reducer.max());
    var gradmask = gradients.eq(max_gradient);
    gradmask = gradmask.addBands(gradmask);

    var directions = sample_mean.select(1).subtract(sample_mean.select(4)).gt(
        sample_mean.select(4).subtract(sample_mean.select(7))).multiply(1);
    directions = directions.addBands(
      sample_mean.select(6).subtract(sample_mean.select(4)).gt(
        sample_mean.select(4).subtract(sample_mean.select(2))).multiply(2));
    directions = directions.addBands(
      sample_mean.select(3).subtract(sample_mean.select(4)).gt(
        sample_mean.select(4).subtract(sample_mean.select(5))).multiply(3));
    directions = directions.addBands(
      sample_mean.select(0).subtract(sample_mean.select(4)).gt(
        sample_mean.select(4).subtract(sample_mean.select(8))).multiply(4));
    directions = directions.addBands(directions.select(0).not().multiply(5));
    directions = directions.addBands(directions.select(1).not().multiply(6));
    directions = directions.addBands(directions.select(2).not().multiply(7));
    directions = directions.addBands(directions.select(3).not().multiply(8));

    directions = directions.updateMask(gradmask.select(0));
    directions = directions.reduce(ee.Reducer.sum());

    var sample_stats = sample_var.divide(sample_mean.multiply(sample_mean));
    var sigmaV = sample_stats.toArray().arraySort().arraySlice(0, 0, 5)
      .arrayReduce(ee.Reducer.mean(), [0]);

    var rect_weights = ee.List.repeat(ee.List.repeat(0, 7), 3).cat(
        ee.List.repeat(ee.List.repeat(1, 7), 4));
    var diag_weights = ee.List([
      [1,0,0,0,0,0,0], [1,1,0,0,0,0,0], [1,1,1,0,0,0,0],
      [1,1,1,1,0,0,0], [1,1,1,1,1,0,0], [1,1,1,1,1,1,0], [1,1,1,1,1,1,1]
    ]);

    var rect_kernel = ee.Kernel.fixed(7, 7, rect_weights, 3, 3, false);
    var diag_kernel = ee.Kernel.fixed(7, 7, diag_weights, 3, 3, false);

    var dir_mean = img.reduceNeighborhood(ee.Reducer.mean(), rect_kernel)
      .updateMask(directions.eq(1));
    var dir_var = img.reduceNeighborhood(ee.Reducer.variance(), rect_kernel)
      .updateMask(directions.eq(1));

    dir_mean = dir_mean.addBands(
      img.reduceNeighborhood(ee.Reducer.mean(), diag_kernel).updateMask(directions.eq(2)));
    dir_var = dir_var.addBands(
      img.reduceNeighborhood(ee.Reducer.variance(), diag_kernel).updateMask(directions.eq(2)));

    for (var d = 3; d < 9; d++) {
      var kk = (d % 2 === 1) ? rect_kernel.rotate(Math.floor(d / 2)) : diag_kernel.rotate(Math.floor(d / 2));
      dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), kk).updateMask(directions.eq(d)));
      dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), kk).updateMask(directions.eq(d)));
    }

    dir_mean = dir_mean.reduce(ee.Reducer.sum());
    dir_var = dir_var.reduce(ee.Reducer.sum());

    var varX = dir_var.subtract(dir_mean.multiply(dir_mean).multiply(sigmaV))
      .divide(sigmaV.add(1.0));
    var b = varX.divide(dir_var);

    return dir_mean.add(b.multiply(img.subtract(dir_mean)))
      .arrayProject([0]).arrayFlatten([['sum']]).float();
  }

  var result = ee.ImageCollection(bandNames.map(filterBand)).toBands().rename(bandNames);
  return result;
}

// ---------------------------------------------------------------------------
// Approximate radiometric terrain correction (cosine correction)
// ---------------------------------------------------------------------------
function terrainCorrect(image, aoiGeom) {
  var demClipped = DEM.clip(aoiGeom.buffer(1000));
  var slopeRad = ee.Terrain.slope(demClipped).multiply(Math.PI / 180);
  var aspectRad = ee.Terrain.aspect(demClipped).multiply(Math.PI / 180);

  var angleRad = image.select('angle').multiply(Math.PI / 180);

  // Simplified local incidence angle cosine correction, assumes ascending
  // pass geometry; this is the "approximate" part documented in the header.
  var cosLocalInc = slopeRad.cos().multiply(angleRad.cos())
    .add(slopeRad.sin().multiply(angleRad.sin()).multiply(aspectRad.cos()));
  cosLocalInc = cosLocalInc.max(0.1); // avoid divide-by-near-zero on steep slopes

  var correctionFactor = angleRad.cos().divide(cosLocalInc);

  var corrected = image.select(['VV', 'VH'])
    .multiply(correctionFactor)
    .copyProperties(image, ['system:time_start']);

  return ee.Image(corrected);
}

// ---------------------------------------------------------------------------
// Build one composite for one AOI/year
// ---------------------------------------------------------------------------
function buildS1Composite(aoiGeom, year) {
  var start = ee.Date(year + '-' + COMPOSITE_START_MD);
  var end = ee.Date(year + '-' + COMPOSITE_END_MD);

  var col = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(aoiGeom)
    .filterDate(start, end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'));

  var count = col.size();

  var corrected = col.map(function(img) {
    return terrainCorrect(img, aoiGeom);
  });

  var median = corrected.median();
  var speckleFiltered = refinedLee(median).clip(aoiGeom);

  return {composite: speckleFiltered, count: count};
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
    var result = buildS1Composite(aoiGeom, year);

    if (RUN_MODE === 'inspect') {
      print(aoiName + ' ' + year + ' S1 image count:', result.count);
    }

    if (RUN_MODE === 'inspect' && (aoiName === 'AOI_1_Margalla_Islamabad' || aoiName === 'AOI_8_Galyat')) {
      Map.addLayer(
        result.composite.select('VV'),
        {min: -20, max: 0},
        aoiName + '_' + year + '_VV',
        false
      );
    }

    if (RUN_MODE === 'export') {
      Export.image.toDrive({
        image: result.composite,
        description: 'S1_' + aoiName + '_' + year,
        folder: DRIVE_FOLDER,
        fileNamePrefix: 'S1_' + aoiName + '_' + year,
        region: aoiGeom,
        scale: EXPORT_SCALE,
        crs: EXPORT_CRS,
        maxPixels: 1e10
      });
    }
  }
}

if (RUN_MODE === 'inspect') {
  print('RUN_MODE is "inspect" -- no exports queued. Check S1 image counts ' +
        'above (expect several images per AOI per 2-month window from a ' +
        '12-day repeat cycle satellite pair) before switching to export mode.');
}
