import { getManufacturerCounterfactual } from '../../src/utils/counterfactual.js';
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

export function runCounterfactual(products: any[]) {
  const improvements: number[] = [];
  let eligibleCount = 0;
  let successCount = 0;
  let noCounterfactualCount = 0;
  let gradeTransitionsCount = 0;
  
  const productResults: any[] = [];
  let caseStudies: any = { low: null, medium: null, high: null };

  for (const product of products) {
    const s = calculateNutriGuardScore(product);
    if (s.flags && (s.flags.includes('ingredients_undeclared') || s.flags.includes('mandatory_nutrient_undeclared'))) continue;
    
    // Eligible product
    eligibleCount++;
    const origScore = s.ageWise.adult.score;
    const origGrade = s.ageWise.adult.grade;

    const cf = getManufacturerCounterfactual(product, 'adult');
    if (cf) {
      successCount++;
      const imp = cf.potentialScore - origScore;
      improvements.push(imp);
      
      if (origGrade !== cf.potentialGrade) {
        gradeTransitionsCount++;
      }

      // Record for CSV
      productResults.push({
        id: product.id || product.name,
        original_score: origScore,
        counterfactual_score: cf.potentialScore,
        score_improvement: imp,
        original_grade: origGrade,
        counterfactual_grade: cf.potentialGrade,
        iterations: cf.iterations,
        dominant_factor: s.ageWise.adult.dominantNutrient?.key || 'None'
      });

      // Case studies
      if (origScore < 40 && !caseStudies.low) caseStudies.low = { name: product.name, orig: origScore, new: cf.potentialScore, actions: cf.actions };
      else if (origScore >= 40 && origScore <= 60 && !caseStudies.medium) caseStudies.medium = { name: product.name, orig: origScore, new: cf.potentialScore, actions: cf.actions };
      else if (origScore > 60 && origScore < 90 && !caseStudies.high) caseStudies.high = { name: product.name, orig: origScore, new: cf.potentialScore, actions: cf.actions };
    } else {
      noCounterfactualCount++;
    }
  }

  return {
    totalProducts: products.length,
    totalEligible: eligibleCount,
    successCount,
    noCounterfactualCount,
    improvements: getStats(improvements),
    gradeTransitions: gradeTransitionsCount,
    percentageCrossingGrade: successCount > 0 ? (gradeTransitionsCount / successCount) * 100 : 0,
    caseStudies,
    productResults
  };
}
