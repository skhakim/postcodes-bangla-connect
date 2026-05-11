const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('64 District  Post Code Final Total 9803.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('Total rows:', data.length);
console.log('First 5 rows:', JSON.stringify(data.slice(0, 5), null, 2));

// Save it to a JSON file as well
fs.writeFileSync('postcodes.json', JSON.stringify(data, null, 2));
console.log('Data saved to postcodes.json');
