import { calculateNutriGuardScore } from '../../src/utils/scoreCalculator.js';

export function runCategoryAnalysis(products: any[]) {
  const cats: Record<string, {
    scores: number[], N: number[], I: number[], P: number[], A: number[], grades: Record<string, number>
  }> = {};

  for (const product of products) {
    const s = calculateNutriGuardScore(product);
    if (s.flags && (s.flags.includes('ingredients_undeclared') || s.flags.includes('mandatory_nutrient_undeclared'))) continue;

    const cat = product.category || 'Unknown';
    if (!cats[cat]) {
      cats[cat] = { scores: [], N: [], I: [], P: [], A: [], grades: {} };
    }

    const o = s.ageWise.adult;
    cats[cat].scores.push(o.score);
    cats[cat].N.push(o.components.N);
    cats[cat].I.push(o.components.I);
    cats[cat].P.push(o.components.P);
    cats[cat].A.push(o.components.A);
    cats[cat].grades[o.grade] = (cats[cat].grades[o.grade] || 0) + 1;
  }

  return cats; // Will be formatted by reportGenerator / statistics
}
