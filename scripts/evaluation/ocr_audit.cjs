const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

let results = {
  total: data.length,
  schemaValid: 0,
  schemaInvalid: 0,
  numericErrors: 0,
  missingUnits: 0,
  missingIngredientsList: 0,
  invalidAdditivesList: 0
};

data.forEach(p => {
  let valid = true;
  
  if (!p.id || !p.name || !p.brand || !p.category || !p.nutrition) {
    valid = false;
  }
  
  // Numeric checks
  if (p.nutrition) {
    const checkNum = (val) => typeof val === 'number' && !isNaN(val) && val >= 0;
    if (
      !checkNum(p.nutrition.calories) ||
      !checkNum(p.nutrition.protein) ||
      !checkNum(p.nutrition.sodium)
    ) {
      results.numericErrors++;
      valid = false;
    }
  }

  // Missing ingredients
  if (!p.ingredients || !Array.isArray(p.ingredients) || p.ingredients.length === 0) {
    results.missingIngredientsList++;
    // Some products like plain milk might not have ingredients listed, but we check if it's missing the array
  }

  // Additives schema
  if (p.additives && !Array.isArray(p.additives)) {
    results.invalidAdditivesList++;
  }

  // Units
  if (!p.serving_size && !p.serve_size && !p.net_weight) {
    results.missingUnits++;
  }

  if (valid) results.schemaValid++;
  else results.schemaInvalid++;
});

console.log('OCR Robustness Audit:');
console.table(results);

fs.writeFileSync('scripts/results/ocr_audit.json', JSON.stringify(results, null, 2));
