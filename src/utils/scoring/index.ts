import type { ScoreBreakdown, AgeScore } from '@/types';
import { getDeclaredNutrient } from '../normalizeNutrient';
import { estimateNovaGroup } from './novaClassifier';
import { getIngredientScore, getProcessingScore } from './ingredientScorer';
import { getAdditiveScore } from './additiveScorer';
export * from './additiveScorer';
import { getNutritionScore, referenceIntakes } from './nutritionScorer';
import { getNutrient, type NutrientKey } from '../normalizeNutrient';

export interface AblationOptions {
  disableN?: boolean;
  disableI?: boolean;
  disableP?: boolean;
  disableA?: boolean;
  disableNova?: boolean;
  disableAge?: boolean;
  forceNova?: 1 | 2 | 3 | 4;
}

const DANGER_CLIFF_CHILD_THRESHOLD = 150;
const DANGER_CLIFF_ELDERLY_THRESHOLD = 100;
const DANGER_CLIFF_PENALTY = 10;

const novaScale: Record<number, number> = {
  1: 1.00,
  2: 0.90,
  3: 0.70,
  4: 0.50
};

export const getGradeAndColor = (score: number) => {
  if (score >= 90) return { grade: 'A+', label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100' };
  if (score >= 80) return { grade: 'A', label: 'Very Good', color: 'text-green-600', bg: 'bg-green-50' };
  if (score >= 70) return { grade: 'B+', label: 'Good ', color: 'text-teal-600', bg: 'bg-teal-50' };
  if (score >= 60) return { grade: 'B', label: 'Healthy', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (score >= 50) return { grade: 'C+', label: 'Acceptable', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  if (score >= 40) return { grade: 'C', label: 'Moderate', color: 'text-orange-500', bg: 'bg-orange-50' };
  if (score >= 30) return { grade: 'C-', label: 'Occasionally', color: 'text-orange-600', bg: 'bg-orange-100' };
  if (score >= 20) return { grade: 'D+', label: 'Limit', color: 'text-red-500', bg: 'bg-red-50' };
  if (score >= 10) return { grade: 'D', label: 'Rarely ', color: 'text-red-600', bg: 'bg-red-100' };
  return { grade: 'E', label: 'Avoid ', color: 'text-red-700', bg: 'bg-red-200' };
};

export const calculateInternalNGS = (product: any, overrideNova?: number, overrideCategory?: string, options: AblationOptions = {}): { scoreBreakdown: ScoreBreakdown, missingDataError: boolean } => {
  const flags: string[] = [];
  const activeCategory = overrideCategory || product.category;
  let missingDataError = false;
  
  let novaForMissingCheck = overrideNova !== undefined ? overrideNova : estimateNovaGroup(product);
  if (novaForMissingCheck > 1 && (!product.ingredients || product.ingredients.length === 0)) {
    flags.push('ingredients_undeclared');
    missingDataError = true;
  } else if (!product.nutrition ||
      getDeclaredNutrient(product.nutrition, 'calories') === undefined ||
      getDeclaredNutrient(product.nutrition, 'protein') === undefined ||
      getDeclaredNutrient(product.nutrition, 'totalSugar') === undefined ||
      getDeclaredNutrient(product.nutrition, 'saturatedFat') === undefined ||
      getDeclaredNutrient(product.nutrition, 'transFat') === undefined ||
      getDeclaredNutrient(product.nutrition, 'sodium') === undefined) {
    flags.push('mandatory_nutrient_undeclared');
    missingDataError = true;
  }
  
  if (!product.allergens || product.allergens.length === 0) {
    flags.push('allergen_undeclared');
  }

  if (['Milkshakes', 'Drinks', 'Ice Cream', 'Health Drinks'].includes(activeCategory)) {
    flags.push('amplified_exposure_category');
  }

  let I = getIngredientScore(product, overrideNova, flags);
  let P = getProcessingScore(product, activeCategory, overrideNova);
  let nova = overrideNova !== undefined ? overrideNova : estimateNovaGroup(product);
  let scale = novaScale[nova] || 0.50;

  let adultDominantNutrient: { key: string, dv: number, subScore: number } | undefined;

  const calculateFinalAgeScore = (ageGroup: string): AgeScore => {
    let effectiveAgeGroup = options.disableAge ? 'adult' : ageGroup;
    let nutResult = getNutritionScore(product, activeCategory, effectiveAgeGroup, nova);
    let N = nutResult.score;
    let A_age = getAdditiveScore(product, effectiveAgeGroup);
    
    let domNutrient = {
      key: nutResult.worstKey,
      dv: Math.round(nutResult.worstDV),
      subScore: Math.round(nutResult.worstSubScore)
    };
    if (ageGroup === 'adult') {
      adultDominantNutrient = domNutrient;
    }

    if (ageGroup === 'child' && (product.category === 'Infant Formula' || product.isInfantProduct)) {
      return {
        score: 0,
        components: { N: 0, I: 0, P: 0, A: 0 },
        scale: scale,
        cliffPenalty: 0,
        serving_reality_check: undefined,
        dominantNutrient: undefined,
        grade: 'N/A',
        label: 'Excluded (Infant Product)',
        color: 'text-gray-500',
        bg: 'bg-gray-100'
      };
    }

    let N_capped = nova === 4 ? Math.min(N, 50) : N;
    let final_N = options.disableN ? 100 : N_capped;
    let final_I = options.disableI ? 100 : I;
    let final_P = options.disableP ? 100 : P;
    let final_A = options.disableA ? 100 : A_age;
    let final_scale = options.disableNova ? 1.0 : scale;

    let NGS_pre_cliff = final_scale * (0.20 * final_I + 0.15 * final_P + 0.30 * final_A) + 0.35 * final_N;
    
    let cliffPenalty = 0;
    let pMap = nutResult.pMap;
    if (ageGroup === 'child') {
      if (pMap.totalSugar >= DANGER_CLIFF_CHILD_THRESHOLD || pMap.addedSugar >= DANGER_CLIFF_CHILD_THRESHOLD || pMap.sodium >= DANGER_CLIFF_CHILD_THRESHOLD || 
          pMap.saturatedFat >= DANGER_CLIFF_CHILD_THRESHOLD || pMap.transFat >= DANGER_CLIFF_CHILD_THRESHOLD || pMap.caffeine >= DANGER_CLIFF_CHILD_THRESHOLD) {
        cliffPenalty = DANGER_CLIFF_PENALTY;
      }
    } else if (ageGroup === 'elderly') {
      if (pMap.sodium >= DANGER_CLIFF_ELDERLY_THRESHOLD || pMap.caffeine >= DANGER_CLIFF_ELDERLY_THRESHOLD) {
        cliffPenalty = DANGER_CLIFF_PENALTY;
      }
    }

    let NGS_final = Math.max(0, NGS_pre_cliff - cliffPenalty);
    
    let servingRealityCheck: number | undefined;
    if (product.serve_size || product.serving_size) {
      let servingVal = parseFloat(product.serve_size || product.serving_size);
      if (!isNaN(servingVal)) {
         let worstNut = nutResult.worstKey;
         let ref = referenceIntakes[ageGroup][worstNut];
         let valPer100 = getNutrient(product.nutrition, worstNut as NutrientKey);
         let valPerServing = (valPer100 / 100) * servingVal;
         servingRealityCheck = Math.round((valPerServing / ref) * 100);
      }
    }

    if (missingDataError) NGS_final = 0;

    return { 
      score: Math.max(0, Math.min(100, Math.round(NGS_final))), 
      components: { N: Math.round(N_capped), I: Math.round(I), P: Math.round(P), A: Math.round(A_age) }, 
      scale: scale,
      cliffPenalty: cliffPenalty,
      serving_reality_check: servingRealityCheck,
      dominantNutrient: domNutrient,
      ...getGradeAndColor(Math.round(NGS_final)) 
    };
  };

  const adultScore = calculateFinalAgeScore('adult');
  
  return {
    scoreBreakdown: {
      overall: adultScore.score,
      grade: adultScore.grade,
      components: adultScore.components,
      flags,
      dominantNutrient: adultDominantNutrient,
      ageWise: {
        child: calculateFinalAgeScore('child'),
        teen: calculateFinalAgeScore('teen'),
        adult: adultScore,
        elderly: calculateFinalAgeScore('elderly')
      }
    },
    missingDataError
  };
};

export const calculateNutriGuardScore = (product: any, options: AblationOptions = {}): ScoreBreakdown => {
  let result = calculateInternalNGS(product, options.forceNova, undefined, options);
  let breakdown = result.scoreBreakdown;
  let missing = result.missingDataError;

  if (missing) return breakdown;

  if (breakdown.flags) {
    breakdown.flags = Array.from(new Set(breakdown.flags));
  }

  return breakdown;
};
