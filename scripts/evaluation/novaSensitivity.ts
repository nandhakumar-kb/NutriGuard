import { calculateNutriGuardScore } from '../../src/utils/scoreCalculator.js';

function getStats(arr: number[]) {
  if (arr.length === 0) return { mean: 0, median: 0, sd: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const sd = Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length);
  return { mean, median, sd, min: sorted[0], max: sorted[sorted.length - 1] };
}

export function runNovaSensitivity(products: any[]) {
  const swings: number[] = [];
  let gradeChanges = 0;
  let totalValid = 0;
  
  for (const product of products) {
    const baseline = calculateNutriGuardScore(product, {});
    if (baseline.flags && (baseline.flags.includes('ingredients_undeclared') || baseline.flags.includes('mandatory_nutrient_undeclared'))) continue;

    totalValid++;
    const scores = [];
    const grades = new Set<string>();
    for (let nova = 1; nova <= 4; nova++) {
      const s = calculateNutriGuardScore(product, { forceNova: nova as 1 | 2 | 3 | 4 });
      scores.push(s.overall);
      grades.add(s.grade);
    }
    
    if (grades.size > 1) {
      gradeChanges++;
    }

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    swings.push(maxScore - minScore);
  }

  return {
    swingStats: getStats(swings),
    gradeChanges,
    percentageAffected: totalValid > 0 ? (gradeChanges / totalValid) * 100 : 0
  };
}
