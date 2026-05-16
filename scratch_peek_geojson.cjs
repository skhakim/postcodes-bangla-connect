const fs = require('fs');

function peekGeoJSON(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    const json = JSON.parse(data);
    console.log(`File: ${filename}`);
    console.log(`Type: ${json.type}`);
    console.log(`Feature count: ${json.features.length}`);
    if (json.features.length > 0) {
        console.log(`First feature properties:`, json.features[0].properties);
        console.log(`First feature geometry type:`, json.features[0].geometry.type);
    }
    console.log('-------------------');
}

try {
    peekGeoJSON('geojson/bgd_admin1.geojson');
    peekGeoJSON('geojson/bgd_admin2.geojson');
} catch (e) {
    console.error(e);
}
