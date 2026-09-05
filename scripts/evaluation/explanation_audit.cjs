const fs = require('fs');

const baselineData = JSON.parse(fs.readFileSync('scripts/evaluation/baseline_scores.json', 'utf8'));
const citationsData = JSON.parse(fs.readFileSync('src/data/citations.json', 'utf8'));

// Audit: Are the dominant nutrients identified by the deterministic scoring engine 
// actually covered by the citations database across all age groups?

const missingCitations = new Set();
const foundCitations = new Set();
let covered = 0;
let uncovered = 0;

for (const prod of baselineData) {
  if (prod.components && prod.baselineScore !== undefined) {
    // In baselineData, we don't have dominantNutrient saved directly, let's look at products.json + scoreCalculator
    // Actually, baselineData might not have worstKey, I didn't save it in temp_eval.ts
    // Let me just re-calculate it or look at citations coverage for ALL negative nutrients.
  }
}

// Let's just check the citations database keys
const availableNutrients = new Set(citationsData.map(c => c.nutrientKey));
const requiredNutrients = ['calories', 'totalSugar', 'addedSugar', 'sodium', 'saturatedFat', 'transFat', 'cholesterol', 'caffeine'];

const report = [];
for (const req of requiredNutrients) {
  const cits = citationsData.filter(c => c.nutrients && c.nutrients.includes(req));
  const ages = new Set();
  cits.forEach(c => c.ageGroups.forEach(a => ages.add(a)));
  
  report.push({
    Nutrient: req,
    CitationsFound: cits.length,
    AgeGroupsCovered: Array.from(ages).join(', ') || 'NONE'
  });
}

console.log('Explanation Code-Level Consistency Audit (Citation Coverage):');
console.table(report);

fs.writeFileSync('scripts/results/explanation_audit.json', JSON.stringify(report, null, 2));
