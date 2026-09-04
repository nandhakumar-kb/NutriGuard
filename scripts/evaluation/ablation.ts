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

export function runAblationStudy(products: any[]) {
  const diffs = {
    N: [] as number[],
    I: [] as number[],
    P: [] as number[],
    A: [] as number[],
    Nova: [] as number[],
    Age: [] as number[]
  };
  const gradeChanges = {
    N: 0, I: 0, P: 0, A: 0, Nova: 0, Age: 0, total: 0, ageTotal: 0
  };

  for (const product of products) {
    const full = calculateNutriGuardScore(product, {});
    if (full.flags && (full.flags.includes('ingredients_undeclared') || full.flags.includes('mandatory_nutrient_undeclared'))) continue;

    gradeChanges.total++;
    const sFull = full.overall;
    const gFull = full.grade;

    const resN = calculateNutriGuardScore(product, { disableN: true });
    const resI = calculateNutriGuardScore(product, { disableI: true });
    const resP = calculateNutriGuardScore(product, { disableP: true });
    const resA = calculateNutriGuardScore(product, { disableA: true });
    const resNova = calculateNutriGuardScore(product, { disableNova: true });
    
    if (gFull !== resN.grade) gradeChanges.N++;
    if (gFull !== resI.grade) gradeChanges.I++;
    if (gFull !== resP.grade) gradeChanges.P++;
    if (gFull !== resA.grade) gradeChanges.A++;
    if (gFull !== resNova.grade) gradeChanges.Nova++;

    const childFullScore = full.ageWise.child.score;
    const childFullGrade = full.ageWise.child.grade;
    if (childFullGrade !== 'N/A') {
      gradeChanges.ageTotal++;
      const resAge = calculateNutriGuardScore(product, { disableAge: true });
      diffs.Age.push(resAge.ageWise.child.score - childFullScore);
      if (childFullGrade !== resAge.ageWise.child.grade) gradeChanges.Age++;
    }

    diffs.N.push(resN.overall - sFull);
    diffs.I.push(resI.overall - sFull);
    diffs.P.push(resP.overall - sFull);
    diffs.A.push(resA.overall - sFull);
    diffs.Nova.push(resNova.overall - sFull);
  }

  const formatWithGrade = (stats: any, gradeCount: number, total: number) => {
    return { ...stats, gradeChangePct: total > 0 ? (gradeCount / total) * 100 : 0 };
  };

  return {
    N: formatWithGrade(getStats(diffs.N), gradeChanges.N, gradeChanges.total),
    I: formatWithGrade(getStats(diffs.I), gradeChanges.I, gradeChanges.total),
    P: formatWithGrade(getStats(diffs.P), gradeChanges.P, gradeChanges.total),
    A: formatWithGrade(getStats(diffs.A), gradeChanges.A, gradeChanges.total),
    Nova: formatWithGrade(getStats(diffs.Nova), gradeChanges.Nova, gradeChanges.total),
    Age: formatWithGrade(getStats(diffs.Age), gradeChanges.Age, gradeChanges.ageTotal),
    rawDiffs: diffs
  };
}
