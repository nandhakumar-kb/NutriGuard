import { calculateNutriGuardScore } from '../../src/utils/scoreCalculator.js';

function getStats(arr: number[]) {
  if (arr.length === 0) return { mean: 0, median: 0, sd: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = arr.reduce((a, b) => a + b, 0);
  const mean = sum / arr.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  const sd = Math.sqrt(variance);
  
  return { mean, median, sd, min, max };
}

export function runAgeSensitivity(products: any[]) {
  const scores = {
    child: [] as number[],
    teen: [] as number[],
    adult: [] as number[],
    elderly: [] as number[]
  };

  const diffs = {
    adultVsChild: [] as number[],
    adultVsElderly: [] as number[],
    adultVsTeen: [] as number[]
  };

  for (const product of products) {
    const s = calculateNutriGuardScore(product);
    if (s.flags && (s.flags.includes('ingredients_undeclared') || s.flags.includes('mandatory_nutrient_undeclared'))) continue;
    
    // Infant product exclusion check
    if (s.ageWise.child.grade === 'N/A') continue;

    scores.child.push(s.ageWise.child.score);
    scores.teen.push(s.ageWise.teen.score);
    scores.adult.push(s.ageWise.adult.score);
    scores.elderly.push(s.ageWise.elderly.score);

    diffs.adultVsChild.push(s.ageWise.adult.score - s.ageWise.child.score);
    diffs.adultVsElderly.push(s.ageWise.adult.score - s.ageWise.elderly.score);
    diffs.adultVsTeen.push(s.ageWise.adult.score - s.ageWise.teen.score);
  }

  return {
    stats: {
      child: getStats(scores.child),
      teen: getStats(scores.teen),
      adult: getStats(scores.adult),
      elderly: getStats(scores.elderly)
    },
    pairedDiffs: {
      adultVsChild: { ...getStats(diffs.adultVsChild), rawDiffs: diffs.adultVsChild },
      adultVsElderly: { ...getStats(diffs.adultVsElderly), rawDiffs: diffs.adultVsElderly },
      adultVsTeen: { ...getStats(diffs.adultVsTeen), rawDiffs: diffs.adultVsTeen }
    }
  };
}
