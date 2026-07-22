/**
 * 03_dem_derivatives.js
 *
 * Exports elevation, slope, and aspect layers per AOI from Copernicus
 * GLO-30 DEM. These are static (non-temporal) layers -- one export per AOI,
 * not per year.
 *
 * Aspect is included because topographic shadow direction interacts with
 * both optical illumination and SAR local incidence angle -- dropping it
 * loses information relevant to the terrain-noise problem this whole
 * pipeline is trying to handle.
 *
 * WORKFLOW: same pattern as scripts 01/02 -- inspect first, confirm with
 * a visual check on AOI_1 and AOI_8, only then export.
 */

var RUN_MODE = 'inspect'; // 'inspect' | 'export'

var AOIS = {
  'AOI_1_Margalla_Islamabad':      [72.95, 33.65, 73.20, 33.87],
  'AOI_2_Lower_Murree_Ghoragali':  [73.35, 33.82, 73.50, 33.93],
  'AOI_3_Potohar_Kahuta':          [73.28, 33.55, 73.50, 33.72],
  'AOI_4_AJK_Border_Foothills':    [73.55, 33.55, 73.80, 33.75],
  'AOI_5_Upper_Jhelum_Kohala':     [73.36, 34.24, 73.55, 34.38],
  'AOI_6_Haripur_Khanpur':         [72.98, 33.90, 73.18, 34.04],
  'AOI_7_Abbottabad_Havelian':     [73.10, 34.04, 73.28, 34.19],
  'AOI_8_Galyat':                  [73.30, 34.00, 73.48, 34.13]
};

var EXPORT_CRS = 'EPSG:32643';
var EXPORT_SCALE = 10;
var DRIVE_FOLDER = 'deforestation_dem_layers';

var DEM = ee.Image('COPERNICUS/DEM/GLO30').select('DEM');

var aoiNames = Object.keys(AOIS);

for (var a = 0; a < aoiNames.length; a++) {
  var aoiName = aoiNames[a];
  var bbox = AOIS[aoiName];
  var aoiGeom = ee.Geometry.Rectangle(bbox);

  var demClipped = DEM.clip(aoiGeom);
  var slope = ee.Terrain.slope(demClipped);
  var aspect = ee.Terrain.aspect(demClipped);

  var stack = demClipped.rename('elevation')
    .addBands(slope.rename('slope'))
    .addBands(aspect.rename('aspect'));

  if (RUN_MODE === 'inspect') {
    print(aoiName + ' DEM stack band names:', stack.bandNames());
    if (aoiName === 'AOI_1_Margalla_Islamabad' || aoiName === 'AOI_8_Galyat') {
      Map.addLayer(stack.select('elevation'), {min: 300, max: 3000}, aoiName + '_elevation', false);
      Map.addLayer(stack.select('slope'), {min: 0, max: 60}, aoiName + '_slope', false);
    }
  }

  if (RUN_MODE === 'export') {
    Export.image.toDrive({
      image: stack,
      description: 'DEM_' + aoiName,
      folder: DRIVE_FOLDER,
      fileNamePrefix: 'DEM_' + aoiName,
      region: aoiGeom,
      scale: EXPORT_SCALE,
      crs: EXPORT_CRS,
      maxPixels: 1e10
    });
  }
}

if (RUN_MODE === 'inspect') {
  print('RUN_MODE is "inspect" -- no exports queued.');
}
