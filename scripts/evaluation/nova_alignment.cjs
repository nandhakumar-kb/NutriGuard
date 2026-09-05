const fs = require('fs');

const baselineData = JSON.parse(fs.readFileSync('scripts/evaluation/baseline_scores.json', 'utf8'));
const productsData = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

const getRanks = (arr, desc = false) => {
  const sorted = [...arr].map((v, i) => ({v, i})).sort((a, b) => desc ? b.v - a.v : a.v - b.v);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].v === sorted[i].v) {
      j++;
    }
    let avgRank = ((i + 1) + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      ranks[sorted[k].i] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
};

const getRankCorrelation = (arr1, arr2) => {
  const rank1 = getRanks(arr1);
  const rank2 = getRanks(arr2);
  const mean1 = rank1.reduce((a,b)=>a+b,0) / rank1.length;
  const mean2 = rank2.reduce((a,b)=>a+b,0) / rank2.length;
  let num = 0, den1 = 0, den2 = 0;
  for (let i = 0; i < rank1.length; i++) {
    const d1 = rank1[i] - mean1;
    const d2 = rank2[i] - mean2;
    num += d1 * d2;
    den1 += d1 * d1;
    den2 += d2 * d2;
  }
  return num / Math.sqrt(den1 * den2);
};

const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C-', 'D+', 'D', 'E'];
const getGradeRank = (g) => grades.indexOf(g) + 1;

let scores = [];
let novaGroups = [];
let gradeRanks = [];
let matrix = {
  1: { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'E': 0 },
  2: { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'E': 0 },
  3: { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'E': 0 },
  4: { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'E': 0 }
};

let divergenceCases = [];

for (const prod of baselineData) {
  const rawProd = productsData.find(p => p.id === prod.id);
  // Re-estimate NOVA if missing, though dataset_audit said nova missing=0
  const nova = rawProd.nova;
  const score = prod.baselineScore;
  const grade = prod.baselineGrade;
  
  scores.push(score);
  novaGroups.push(nova);
  gradeRanks.push(getGradeRank(grade));
  
  if (matrix[nova] !== undefined) {
    matrix[nova][grade]++;
  }

  // Define major divergence: e.g., NOVA 4 but Grade A/B, or NOVA 1 but Grade D/E
  const isDivergent = (nova === 4 && ['A+', 'A', 'B+', 'B'].includes(grade)) ||
                      (nova === 1 && ['D+', 'D', 'E'].includes(grade)) ||
                      (nova === 3 && ['A+', 'A'].includes(grade));
  
  if (isDivergent) {
    divergenceCases.push({
      name: prod.name,
      nova,
      grade,
      score,
      components: prod.components
    });
  }
}

// Compute Spearman between Score (higher is better) and NOVA (lower is better) => expect negative correlation
// Compute Spearman between Grade Rank (1 is A+, 10 is E) and NOVA (1 to 4) => expect positive correlation
const scoreNovaRho = getRankCorrelation(scores, novaGroups.map(v => -v)); // negate nova so both are "higher is better"
const gradeNovaRho = getRankCorrelation(gradeRanks, novaGroups);

console.log('Spearman ρ (Score vs. inverted NOVA):', scoreNovaRho.toFixed(3));
console.log('Spearman ρ (Grade Rank vs. NOVA):', gradeNovaRho.toFixed(3));

console.log('Confusion Matrix (NOVA class vs NutriGuard Grade):');
console.table(matrix);

console.log('Major Divergence Cases:', divergenceCases.length);
const csvLines = ['NOVA_Group,A+,A,B+,B,C+,C,C-,D+,D,E'];
for (const [nova, counts] of Object.entries(matrix)) {
  csvLines.push(nova + ',' + counts['A+'] + ',' + counts['A'] + ',' + counts['B+'] + ',' + counts['B'] + ',' + counts['C+'] + ',' + counts['C'] + ',' + counts['C-'] + ',' + counts['D+'] + ',' + counts['D'] + ',' + counts['E']);
}
fs.writeFileSync('scripts/results/nova_confusion_matrix.csv', csvLines.join('\\n'));
console.log('Saved confusion matrix to scripts/results/nova_confusion_matrix.csv');
