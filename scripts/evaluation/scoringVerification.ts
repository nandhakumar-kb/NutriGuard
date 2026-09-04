import { calculateNutriGuardScore, estimateNovaGroup } from '../../src/utils/scoreCalculator.js';
import { getDeclaredNutrient, type NutrientKey } from '../../src/utils/normalizeNutrient.js';

export function runScoringVerification(products: any[]) {
  const results = {
    totalProducts: products.length,
    passedBounds: 0,
    passedGrades: 0,
    passedDeterminism: 0,
    crashCount: 0,
    
    // Dataset Completeness Audit
    datasetCompleteness: {
      productsWithMissingRequiredFields: 0,
      missingFieldCounts: {} as Record<string, number>,
      auditRecords: [] as any[]
    },
    
    // Engine Handling
    engineMissingHandling: {
      flagsCorrectlySet: 0,
      scoresSafelyGenerated: 0
    }
  };

  const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'N/A'];
  const requiredNutrients: NutrientKey[] = ['calories', 'protein', 'totalSugar', 'saturatedFat', 'transFat', 'sodium'];

  for (const product of products) {
    try {
      // 1. Dataset Completeness Audit
      const missingFields = [];
      
      // Nutrition
      if (!product.nutrition) {
        missingFields.push('nutrition');
      } else {
        for (const key of requiredNutrients) {
          if (getDeclaredNutrient(product.nutrition, key) === undefined) {
            missingFields.push(`nutrition.${key}`);
          }
        }
      }
      
      if (!product.ingredients || product.ingredients.length === 0) missingFields.push('ingredients');
      if (product.nova === undefined || product.nova === null) missingFields.push('nova');

      if (missingFields.length > 0) {
        results.datasetCompleteness.productsWithMissingRequiredFields++;
        for (const f of missingFields) {
          results.datasetCompleteness.missingFieldCounts[f] = (results.datasetCompleteness.missingFieldCounts[f] || 0) + 1;
        }
      }

      // 2. Engine processing
      const s1 = calculateNutriGuardScore(product);
      const s2 = calculateNutriGuardScore(product);
      if (JSON.stringify(s1) === JSON.stringify(s2)) results.passedDeterminism++;

      const score = s1.overall;
      if (score >= 0 && score <= 100 && !isNaN(score) && isFinite(score)) results.passedBounds++;
      if (validGrades.includes(s1.grade)) results.passedGrades++;

      // 3. Engine missing-data handling logic
      const engineFlagged = s1.flags && (s1.flags.includes('ingredients_undeclared') || s1.flags.includes('mandatory_nutrient_undeclared'));
      if (missingFields.length > 0) {
        if (engineFlagged) results.engineMissingHandling.flagsCorrectlySet++;
      } else {
        if (!engineFlagged) results.engineMissingHandling.flagsCorrectlySet++;
      }
      
      // If it has flags, it should still produce a valid 0 score gracefully, or if not flagged, produce a normal score
      if (typeof s1.overall === 'number' && !isNaN(s1.overall)) {
        results.engineMissingHandling.scoresSafelyGenerated++;
      }

      // Record for E9 output
      results.datasetCompleteness.auditRecords.push({
        id: product.id || product.name,
        name: product.name,
        missingFields: missingFields.join('|'),
        engineFlag: engineFlagged ? 1 : 0,
        scoreGenerated: 1
      });

    } catch (e) {
      results.crashCount++;
      // Even if crashed, we record it
      results.datasetCompleteness.auditRecords.push({
        id: product.id || product.name,
        name: product.name,
        missingFields: "CRASH",
        engineFlag: 0,
        scoreGenerated: 0
      });
    }
  }

  return results;
}
