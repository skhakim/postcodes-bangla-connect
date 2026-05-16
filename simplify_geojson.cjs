const fs = require('fs');

function simplifyCoords(coords, precision = 3, skip = 2) {
    if (typeof coords[0] === 'number') {
        return [parseFloat(coords[0].toFixed(precision)), parseFloat(coords[1].toFixed(precision))];
    }
    const result = coords.map(c => simplifyCoords(c, precision, skip));
    
    if (Array.isArray(result) && Array.isArray(result[0]) && typeof result[0][0] === 'number') {
        const simplified = [];
        for (let i = 0; i < result.length; i++) {
            if (i === 0 || i === result.length - 1 || i % skip === 0) {
                if (simplified.length === 0 || 
                    result[i][0] !== simplified[simplified.length-1][0] || 
                    result[i][1] !== simplified[simplified.length-1][1]) {
                    simplified.push(result[i]);
                }
            }
        }
        return simplified.length >= 4 ? simplified : result;
    }
    return result;
}

function processFile(filename, mapping, skip = 2) {
    console.log(`Processing ${filename}...`);
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    return data.features.map(f => {
        const props = {};
        for (const [key, prop] of Object.entries(mapping)) {
            props[key] = f.properties[prop];
        }
        return {
            type: 'Feature',
            properties: props,
            geometry: {
                type: f.geometry.type,
                coordinates: simplifyCoords(f.geometry.coordinates, 3, skip)
            }
        };
    });
}

try {
    const districts = processFile('geojson/bgd_admin2.geojson', {
        ADM1_EN: 'adm1_name',
        ADM2_EN: 'adm2_name'
    }, 2);
    fs.writeFileSync('src/data/districts.geojson.json', JSON.stringify({ type: 'FeatureCollection', features: districts }));

    const upazilas = processFile('geojson/bgd_admin3.geojson', {
        ADM1_EN: 'adm1_name',
        ADM2_EN: 'adm2_name',
        ADM3_EN: 'adm3_name'
    }, 4);
    fs.writeFileSync('src/data/upazilas.geojson.json', JSON.stringify({ type: 'FeatureCollection', features: upazilas }));

    console.log('Success! All files updated.');
} catch (e) {
    console.error(e);
}
