import { calculateNutriGuardScore } from './scoreCalculator';
import { getNutrient, setNutrient } from './normalizeNutrient';

const gradeToNumber = (grade: string) => {
  const map: Record<string, number> = {
    'E': 0, 'D': 1, 'D+': 2, 'C-': 3, 'C': 4, 'C+': 5, 'B': 6, 'B+': 7, 'A': 8, 'A+': 9
  };
  return map[grade] || -1;
};

export interface RecommendationAction {
  text: string;
  impact: string;
  impactColor: string;
  description: string;
}

export interface ManufacturerActionData {
  summary: string;
  actions: RecommendationAction[];
  potentialScore: number;
  potentialGrade: string;
  iterations: number;
}

export const getManufacturerCounterfactual = (product: any, ageGroup: 'child'|'teen'|'adult'|'elderly'): ManufacturerActionData | null => {
  const originalBreakdown = calculateNutriGuardScore(product);
  const originalGradeStr = originalBreakdown.ageWise[ageGroup].grade;
  const originalScore = originalBreakdown.ageWise[ageGroup].score;
  const originalGradeNum = gradeToNumber(originalGradeStr);
  
  if (originalGradeNum >= 9) return null; // Already A+, can't improve
  if (originalBreakdown.flags?.includes('mandatory_nutrient_undeclared')) return null;

  let testProduct = JSON.parse(JSON.stringify(product));
  let reductions: Record<string, number> = {};

  for (let step = 1; step <= 20; step++) {
    let currentBreakdown = calculateNutriGuardScore(testProduct);
    let currentGrade = currentBreakdown.ageWise[ageGroup].grade;
    let currentGradeNum = gradeToNumber(currentGrade);
    let currentScore = currentBreakdown.ageWise[ageGroup].score;
    
    if (currentGradeNum > originalGradeNum) {
      let statements = [];
      let actions: RecommendationAction[] = [];
      
      for (const [nut, pct] of Object.entries(reductions)) {
         let pctRounded = Math.round(pct * 100);
         statements.push(`${nut} by ${pctRounded}%`);
         
         // Try to estimate individual impact for UI
         actions.push({
           text: `Reduce ${nut.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`,
           impact: `+${((currentScore - originalScore) / Object.keys(reductions).length).toFixed(1)}`,
           impactColor: "text-green-600",
           description: `Requires a ${pctRounded}% reduction to achieve this grade boundary.`
         });
      }
      
        return {
          summary: `Successfully found counterfactual improvements to reach grade ${currentGrade} by modifying ${Object.keys(reductions).length} dominant nutritional factors.`,
          actions,
          potentialScore: currentScore,
          potentialGrade: currentGrade,
          iterations: step
        };
    }
    
    let worstKey = currentBreakdown.ageWise[ageGroup].dominantNutrient?.key;
    if (!worstKey) break;

    if (!reductions[worstKey]) reductions[worstKey] = 0;
    reductions[worstKey] += 0.05;
    
    let originalVal = getNutrient(product.nutrition, worstKey as any);
    let newVal = Math.max(0, originalVal * (1 - reductions[worstKey]));
    setNutrient(testProduct.nutrition, worstKey as any, newVal);
    
    if (worstKey === 'totalSugar') {
       let addedOrig = getNutrient(product.nutrition, 'addedSugar');
       let addedOrigRatio = originalVal > 0 ? (addedOrig / originalVal) : 0;
       setNutrient(testProduct.nutrition, 'addedSugar', newVal * addedOrigRatio);
    }
  }
  
  return null;
};

export const getConsumerAlternative = (product: any, ageGroup: 'child'|'teen'|'adult'|'elderly', allProducts: any[]): any[] => {
  const originalBreakdown = calculateNutriGuardScore(product);
  const originalGradeNum = gradeToNumber(originalBreakdown.ageWise[ageGroup].grade);
  
  if (originalGradeNum >= 9) return []; // Already A+
  
  // Paper Section IV-N constraint: category + indulgence tier + flavor profile
  const originalCalories = getNutrient(product.nutrition, 'calories') || 0;
  
  let candidates = allProducts
    .filter(p => {
      if (p.id === product.id) return false;
      if (p.category !== product.category) return false;
      
      // Exact match on indulgence tier and flavor profile
      if (p.indulgence_tier !== product.indulgence_tier) return false;
      if (p.flavor_profile !== product.flavor_profile) return false;
      
      let pCals = getNutrient(p.nutrition, 'calories') || 0;
      if (originalCalories > 0) {
        let ratio = pCals / originalCalories;
        if (ratio < 0.8 || ratio > 1.2) return false;
      }
      return true;
    })
    .map(p => {
      let pBreakdown = calculateNutriGuardScore(p);
      let pAgeScore = pBreakdown.ageWise[ageGroup];
      return { ...p, score: pAgeScore.score, grade: pAgeScore.grade, gradeNum: gradeToNumber(pAgeScore.grade) };
    })
    .filter(p => p.gradeNum > originalGradeNum);
  
  if (candidates.length === 0) return [];
  
  // Sort by highest grade, then highest score
  candidates.sort((a, b) => {
    if (a.gradeNum !== b.gradeNum) {
      return b.gradeNum - a.gradeNum;
    }
    return b.score - a.score;
  });
  
  return candidates;
};

// A small, explicit map of which categories are plausible mix-ups for which —
// i.e. categories a human or OCR step could realistically confuse this product
// with. This is deliberately curated rather than "nearest by name," since the
// point is "what could someone actually get wrong here," not textual similarity.
export const PLAUSIBLE_CATEGORY_CONFUSION: Record<string, string[]> = {
  'Biscuits': ['Cream Biscuits'],
  'Cream Biscuits': ['Biscuits', 'Chocolates'],
  'Chips & Snacks': ['Muesli & Cereals'],
  'Chocolates': ['Cream Biscuits', 'Ice Cream'],
  'Protein Bars': ['Muesli & Cereals'],
  'Muesli & Cereals': ['Protein Bars', 'Chips & Snacks'],
  'Drinks': ['Health Drinks', 'Dairy Drinks'],
  'Milkshakes': ['Dairy Drinks', 'Ice Cream'],
  'Ice Cream': ['Milkshakes', 'Chocolates'],
  'Milk': ['Dairy Drinks'],
  'Dairy Drinks': ['Milk', 'Milkshakes', 'Drinks'],
  'Health Drinks': ['Drinks'],
  'Dry Fruits & Nuts': ['Seeds'],
  'Seeds': ['Dry Fruits & Nuts'],
};

export interface ClassificationSensitivity {
  scoreUnderCurrentClassification: number;
  bestCaseScore: number;
  worstCaseScore: number;
  maxSwing: number;
  causedByNova: boolean;
  causedByCategory: boolean;
}

/**
 * Recomputes the real score under every plausible alternative NOVA tier and
 * category, and returns the actual swing — replacing the previously hardcoded
 * "could improve or drop by up to 20 points" string in ExplainabilityCard.
 */
export function getClassificationSensitivity(
  product: any,
  ageGroup: 'child' | 'teen' | 'adult' | 'elderly'
): ClassificationSensitivity {
  const currentScore = calculateNutriGuardScore(product).ageWise[ageGroup].score;

  const candidateScores: number[] = [currentScore];
  let causedByNova = false;
  let causedByCategory = false;

  // Alternative NOVA tiers: one step in each direction, clamped to [1, 4].
  const currentNova = product.nova || 4;
  for (const altNova of [currentNova - 1, currentNova + 1]) {
    if (altNova < 1 || altNova > 4) continue;
    const testProduct = { ...product, nova: altNova };
    const altScore = calculateNutriGuardScore(testProduct).ageWise[ageGroup].score;
    if (altScore !== currentScore) causedByNova = true;
    candidateScores.push(altScore);
  }

  // Alternative categories from the curated confusion map.
  const altCategories = PLAUSIBLE_CATEGORY_CONFUSION[product.category] || [];
  for (const altCategory of altCategories) {
    const testProduct = { ...product, category: altCategory };
    const altScore = calculateNutriGuardScore(testProduct).ageWise[ageGroup].score;
    if (altScore !== currentScore) causedByCategory = true;
    candidateScores.push(altScore);
  }

  return {
    scoreUnderCurrentClassification: currentScore,
    bestCaseScore: Math.max(...candidateScores),
    worstCaseScore: Math.min(...candidateScores),
    maxSwing: Math.max(...candidateScores) - Math.min(...candidateScores),
    causedByNova,
    causedByCategory,
  };
}
