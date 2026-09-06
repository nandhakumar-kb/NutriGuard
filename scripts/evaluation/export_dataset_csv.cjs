const fs = require('fs');

const products = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
const scores = JSON.parse(fs.readFileSync('scripts/evaluation/baseline_scores.json', 'utf8'));

// Convert scores array to map for fast lookup
const scoreMap = {};
scores.forEach(s => {
  scoreMap[s.id] = s;
});

const csvHeaders = [
  'ID', 'Name', 'Brand', 'Category', 'Barcode', 'Serving Size', 
  'Calories', 'Protein', 'Carbohydrates', 'Total Sugars', 'Added Sugars', 
  'Total Fat', 'Saturated Fat', 'Trans Fat', 'Cholesterol', 'Sodium', 'Fiber',
  'NOVA', 'Ingredients Count', 'Additives Count', 'Ingredients',
  'NutriGuard Score', 'NutriGuard Grade'
];

const csvRows = [csvHeaders.join(',')];

products.forEach(p => {
  const n = p.nutrition || {};
  const s = scoreMap[p.id] || {};
  
  // Clean string fields to avoid CSV issues (e.g. commas in names)
  const clean = (str) => {
    if (str === null || str === undefined) return '';
    const sStr = String(str);
    return sStr.includes(',') ? '"' + sStr.replace(/"/g, '""') + '"' : sStr;
  };
  
  let ingredientsStr = '';
  if (Array.isArray(p.ingredients)) {
    ingredientsStr = p.ingredients.join(', ');
  } else if (typeof p.ingredients === 'string') {
    ingredientsStr = p.ingredients;
  }

  const row = [
    p.id,
    clean(p.name),
    clean(p.brand),
    clean(p.category),
    clean(p.barcode),
    clean(p.serving_size || p.serve_size || p.net_weight),
    n.calories || 0,
    n.protein || 0,
    n.carbohydrates || 0,
    n.totalSugars || n.sugar || 0,
    n.addedSugars || n.addedSugar || 0,
    n.totalFat || n.fat || 0,
    n.saturatedFat || 0,
    n.transFat || 0,
    n.cholesterol || 0,
    n.sodium || 0,
    n.fiber || 0,
    p.nova || '',
    p.ingredients ? (Array.isArray(p.ingredients) ? p.ingredients.length : p.ingredients_count || 0) : 0,
    p.additives ? (Array.isArray(p.additives) ? p.additives.length : p.additives_count || 0) : 0,
    clean(ingredientsStr),
    s.baselineScore !== undefined ? s.baselineScore : '',
    s.baselineGrade || ''
  ];
  
  csvRows.push(row.join(','));
});

fs.writeFileSync('nutriguard_100_products_dataset.csv', csvRows.join('\\n'));
console.log('Dataset CSV generated successfully at nutriguard_100_products_dataset.csv');
