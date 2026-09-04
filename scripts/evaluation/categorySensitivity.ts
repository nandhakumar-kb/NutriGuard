import { calculateNutriGuardScore } from '../../src/utils/scoreCalculator.js';
import { PLAUSIBLE_CATEGORY_CONFUSION } from '../../src/utils/counterfactual.js';

export function runCategorySensitivity(products: any[]) {
  const swings: number[] = [];
  let gradeChanges = 0;
  let affectedProducts = 0;

  for (const product of products) {
    const s = calculateNutriGuardScore(product, {});
    if (s.flags && (s.flags.includes('ingredients_undeclared') || s.flags.includes('mandatory_nutrient_undeclared'))) continue;

    const currentScore = s.ageWise.adult.score;
    const currentGrade = s.ageWise.adult.grade;
    let max = currentScore;
    let min = currentScore;
    let gradeAffected = false;

    // Plausible alternatives
    const altCategories = PLAUSIBLE_CATEGORY_CONFUSION[product.category] || [];
    for (const altCategory of altCategories) {
      const testProduct = { ...product, category: altCategory };
      // disable age/NOVA so we isolate category influence if needed, actually we just want the overall score under Adult
      const altS = calculateNutriGuardScore(testProduct, {}).ageWise.adult;
      
      if (altS.score > max) max = altS.score;
      if (altS.score < min) min = altS.score;
      if (altS.grade !== currentGrade) gradeAffected = true;
    }

    const swing = max - min;
    swings.push(swing);
    
    if (swing > 0) affectedProducts++;
    if (gradeAffected) gradeChanges++;
  }

  return {
    swings,
    gradeChanges,
    percentageAffected: swings.length > 0 ? (affectedProducts / swings.length) * 100 : 0
  };
}
