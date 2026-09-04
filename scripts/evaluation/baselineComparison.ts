import { calculateNutriGuardScore } from '../../src/utils/scoreCalculator.js';

export function runBaselineComparison(products: any[]) {
  const baselines: any[] = [];
  
  for (const product of products) {
    const full = calculateNutriGuardScore(product, {});
    // Ignore incomplete products if necessary, but we will calculate baselines anyway
    if (full.flags && (full.flags.includes('ingredients_undeclared') || full.flags.includes('mandatory_nutrient_undeclared'))) continue;
    
    // B1: Nutrition only
    const b1 = calculateNutriGuardScore(product, {
      disableI: true,
      disableP: true,
      disableA: true,
      disableNova: true,
      disableAge: true
    }).ageWise.adult;

    // B2: Nutrition + Ingredients
    const b2 = calculateNutriGuardScore(product, {
      disableP: true,
      disableA: true,
      disableNova: true,
      disableAge: true
    }).ageWise.adult;

    // B3: Nutrition + Ingredients + Processing
    const b3 = calculateNutriGuardScore(product, {
      disableA: true,
      disableNova: true,
      disableAge: true
    }).ageWise.adult;

    // B4: Full NutriGuard (Adult)
    // Technically Full NutriGuard (Adult) is just the baseline with age evaluated
    // But disableAge: true sets profile to adult anyway for internal processing, 
    // so we can just use the adult score directly.
    const b4 = full.ageWise.adult;

    baselines.push({
      product: product.name,
      b1_score: b1.score, b1_grade: b1.grade,
      b2_score: b2.score, b2_grade: b2.grade,
      b3_score: b3.score, b3_grade: b3.grade,
      b4_score: b4.score, b4_grade: b4.grade
    });
  }

  return baselines;
}
