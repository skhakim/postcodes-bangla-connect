const fs = require('fs');
const path = require('path');

const norm = (s) => s ? s.toLowerCase().replace(/\bupazila\b/g, '').replace(/\bthana\b/g, '').replace(/[^a-z0-9]/g, '') : '';

// Load hierarchical data for name alignment
const hj = JSON.parse(fs.readFileSync('src/data/bangladesh_post_codes_hierarchical.json', 'utf8'));
const div_map = {};
const dist_map = {};
const up_map = {};

hj.forEach(div => {
    const dn = norm(div.division);
    div_map[dn] = div.division;
    div.districts.forEach(dist => {
        const dsn = norm(dist.district);
        dist_map[dsn + '|' + dn] = dist.district;
        dist.police_stations.forEach(ps => {
            const un = norm(ps.police_station);
            up_map[un + '|' + dsn + '|' + dn] = ps.police_station;
        });
    });
});

// Known mismatches that norm() alone doesn't solve
const SPECIAL_MAPPINGS = {
    // Divisions & Districts
    'chattogram': 'chittagong',
    'habiganj': 'hobiganj',
    'naogaon': 'nogaon',
    'chapainababganj': 'chapai',
    'khagrachhari': 'khagrachari',
    'jashore': 'jessore',
    'narsingdi': 'narshingdi',
    'cumilla': 'comilla',
    'bogura': 'bogra',
    'jhalokati': 'jhalakathi',
    'barishal': 'barisal',

    // Upazilas
    "charbhadrasan": "charbadrashan",
    "madhukhali": "madukhali",
    "muksudpur": "maksudpur",
    "tarail": "tarial",
    "hossainpur": "hossenpur",
    "mithamain": "mithamoin",
    "austagram": "ostagram",
    "harirampur": "hariampur",
    "ghior": "gheor",
    "shibalay": "shibaloy",
    "daulatpur": "doulatpur",
    "gazaria": "gajaria",
    "tongibari": "tangibari",
    "louhajang": "lohajong",
    "sreenagar": "srinagar",
    "narsingdisadar": "narshingdisadar",
    "manohardi": "monohordi",
    "raipura": "raypura",
    "zajira": "jajira",
    "bhedarganj": "badarganj",
    "bhuanpur": "bhuapur",
    "dhanbari": "dhonbari",
    "bandarbansadar": "bandorbansadar",
    "rowangchhari": "rowangchari",
    "faridganj": "faridgonj",
    "hajiganj": "hazigonj",
    "chandanaish": "chandanish",
    "patiya": "patia",
    "anwara": "anowara",
    "raozan": "rouzan",
    "mirsarai": "mirsharai",
    "banshkhali": "bashkhali",
    "nangalkot": "nangolkot",
    "chauddagram": "chouddagram",
    "titas": "titash",
    "burichang": "burichong",
    "eidgaon": "eidgah",
    "ukhia": "ukhiya",
    "maheshkhali": "moheskhali",
    "chhagalnaiya": "chagalnaia",
    "parashuram": "parshuram",
    "khagrachharisadar": "khagracharisadar",
    "panchhari": "panchari",
    "ramgarh": "ramgor",
    "manikchhari": "manikchari",
    "companiganj": "kompaniganj",
    "rajasthali": "rajsthali",
    "belaichhari": "bilaichhori",
    "jurachhari": "jurachori",
    "baghaichhari": "baghaichari",
    "morelganj": "morrelganj",
    "jashoresadar": "jessoresadar",
    "chaugachha": "chougachha",
    "sharsha": "sarsa",
    "manirampur": "monirampur",
    "keshabpur": "keshobpur",
    "harinakundu": "horinakundu",
    "shailkupa": "shailakupa",
    "terokhada": "tarokhada",
    "dighalia": "digalia",
    "debhata": "devhata",
    "bogurasadar": "bograsadar",
    "adamdighi": "adomdighi",
    "gabtali": "gabtoli",
    "kahaloo": "kahalu",
    "shibganj": "shibgonj",
    "sonatala": "sonatola",
    "shajahanpur": "sajahanpur",
    "naogaonsadar": "nogaonsadar",
    "baraigram": "boraigram",
    "naldanga": "noldanga",
    "faridpur": "faridpud",
    "paba": "poba",
    "bagmara": "baghmara",
    "mohanpur": "mohonpur",
    "ullapara": "ullapar",
    "sreemangal": "srimangal",
    "chhatak": "chatak",
    "dowarabazar": "duarabazar",
    "shantiganj": "santigonj",
    "dakkhinsurma": "dakshinsurma",
    "gowainghat": "goainghat",
    "zakiganj": "zakigonj",
    "ujirpur": "uzirpur",
    "gaurnadi": "gouranadi",
    "agailjhara": "agailzhara",
    "hijla": "hizla",
    "mehendiganj": "mahendiganj",
    "daulatkhan": "doulatkhan",
    "charfasson": "charfashion",
    "nalchhity": "nalchhiti",
    "kanthalia": "kathalia",
    "kawkhali": "kaukhali",
    "bakshiganj": "bakshigonj",
    "gafargaon": "gaforgaon",
    "fulpur": "phulpur",
    "ishwarganj": "isshwargonj",
    "purbadhala": "purbadhola",
    "jhenaigati": "jhinaigati",
    "birol": "biral",
    "bochaganj": "bachaganj",
    "chirirbandar": "chrirbandar",
    "fulbari": "phulbari",
    "gobindaganj": "gobindoganj",
    "palashbari": "palashbsri",
    "sadullapur": "saadullapur",
    "kishoreganj": "kishoriganj",
    "saidpur": "saidpur",
    "debiganj": "dabiganj",
    "atowari": "atwari",
    "tentulia": "telulia",
    "pirgachha": "pirgacha",
    "haripur": "horipur",
    "ranishankail": "ranisankail",
};

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

        // Align names with hierarchical JSON
        const div_norm = norm(props.ADM1_EN);
        const dist_norm = norm(props.ADM2_EN);
        
        const mapped_div = SPECIAL_MAPPINGS[div_norm] || div_norm;
        const mapped_dist = SPECIAL_MAPPINGS[dist_norm] || dist_norm;
        
        props.ADM1_EN = div_map[mapped_div] || props.ADM1_EN;
        props.ADM2_EN = dist_map[mapped_dist + '|' + norm(props.ADM1_EN)] || props.ADM2_EN;

        if (props.ADM3_EN) {
            const up_norm = norm(props.ADM3_EN);
            const mapped_up = SPECIAL_MAPPINGS[up_norm] || up_norm;
            props.ADM3_EN = up_map[mapped_up + '|' + norm(props.ADM2_EN) + '|' + norm(props.ADM1_EN)] || props.ADM3_EN;
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
    }, 2);
    fs.writeFileSync('src/data/upazilas.geojson.json', JSON.stringify({ type: 'FeatureCollection', features: upazilas }));

    console.log('Success! All files updated with aligned names.');
} catch (e) {
    console.error(e);
}
