const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/dropdevrahul/pincodes-india/main/pincode.csv';
const constantsDir = path.join(__dirname, '..', 'src', 'constants');

console.log('Fetching pincode.csv...');

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Processing data...');
        const lines = data.split('\n');

        const districtToPincodes = {};
        const pincodeToLocalities = {};

        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // The split '","' is used for this specific file format
            const parts = line.split('","');
            if (parts.length >= 8) {
                const locality = parts[3].replace(/"/g, '').trim();
                const pincode = parts[4].replace(/"/g, '').trim();
                const district = parts[7].replace(/"/g, '').trim();

                if (!pincode || !district || !locality) continue;

                // Title case district
                const districtFormatted = district.split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');

                // 1. District -> Pincodes Mapping
                if (!districtToPincodes[districtFormatted]) {
                    districtToPincodes[districtFormatted] = new Set();
                }
                districtToPincodes[districtFormatted].add(pincode);

                // 2. Pincode -> Localities Mapping (with coordinates)
                if (!pincodeToLocalities[pincode]) {
                    pincodeToLocalities[pincode] = {};
                }
                const lat = parts[9]?.replace(/"/g, '').trim();
                const lng = parts[10]?.replace(/"/g, '').trim();

                // Use the first coordinates found for each unique locality name under a pincode
                if (!pincodeToLocalities[pincode][locality]) {
                    pincodeToLocalities[pincode][locality] = { name: locality, lat, lng };
                }
            }
        }

        const finalDistToPincode = {};
        for (const dist in districtToPincodes) {
            finalDistToPincode[dist] = Array.from(districtToPincodes[dist]).sort();
        }

        const finalPincodeToLocalities = {};
        for (const pin in pincodeToLocalities) {
            // Sort localities by name and convert object back to array
            const localitiesObj = pincodeToLocalities[pin];
            finalPincodeToLocalities[pin] = Object.values(localitiesObj).sort((a, b) => a.name.localeCompare(b.name));
        }

        // Write both maps
        fs.writeFileSync(path.join(constantsDir, 'pincode_mapping.json'), JSON.stringify(finalDistToPincode, null, 2));
        fs.writeFileSync(path.join(constantsDir, 'locality_mapping.json'), JSON.stringify(finalPincodeToLocalities, null, 2));

        console.log(`Success!`);
        console.log(`- Generated pincode_mapping.json with ${Object.keys(finalDistToPincode).length} districts.`);
        console.log(`- Generated locality_mapping.json with ${Object.keys(finalPincodeToLocalities).length} pincodes.`);
    });
}).on('error', (err) => {
    console.error('Error fetching CSV:', err.message);
});
