const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
console.log('Total Products:', data.length);
const categories = {};
let missingFields = { nutrition: 0, ingredients: 0, nova: 0 };
const barcodes = new Set();
let duplicates = 0;
data.forEach(p => {
  categories[p.category] = (categories[p.category] || 0) + 1;
  if (!p.nutrition) missingFields.nutrition++;
  if (!p.ingredients) missingFields.ingredients++;
  if (p.nova === undefined) missingFields.nova++;
  if (p.barcode) {
    if (barcodes.has(p.barcode)) duplicates++;
    barcodes.add(p.barcode);
  }
});
console.log('Categories:', categories);
console.log('Missing Fields:', missingFields);
console.log('Duplicates by Barcode:', duplicates);
