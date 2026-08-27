import type { ScoreBreakdown, AgeScore } from '@/types';
import { getNutrient, getDeclaredNutrient, type NutrientKey } from './normalizeNutrient';

const DANGER_CLIFF_CHILD_THRESHOLD = 150;
const DANGER_CLIFF_ELDERLY_THRESHOLD = 100;
const DANGER_CLIFF_PENALTY = 10;

// 1. NOVA Structural Multiplier
const novaScale: Record<number, number> = {
  1: 1.00,
  2: 0.90,
  3: 0.70,
  4: 0.50
};

// 2. Nutrition Score (N)
const referenceIntakes: Record<string, any> = {
  child: { 
    calories: 1350, 
    protein: 22, 
    fiber: 23, 
    totalSugar: 34, 
    addedSugar: 17, 
    sodium: 1200,   
    saturatedFat: 15, 
    transFat: 1.5,    
    cholesterol: 300,
    caffeine: 40
  },
  teen: { 
    calories: 2560, 
    protein: 48, 
    fiber: 33, 
    totalSugar: 64, 
    addedSugar: 32, 
    sodium: 1800,   
    saturatedFat: 28, 
    transFat: 2.8,    
    cholesterol: 300,
    caffeine: 100
  },
  adult: { 
    calories: 1865, 
    protein: 50, 
    fiber: 28, 
    totalSugar: 47, 
    addedSugar: 23, 
    sodium: 2000,   
    saturatedFat: 21, 
    transFat: 2.0,    
    cholesterol: 300,
    caffeine: 400
  },
  elderly: { 
    calories: 1925, 
    protein: 50, 
    fiber: 28, 
    totalSugar: 48, 
    addedSugar: 24, 
    sodium: 2000,   
    saturatedFat: 21, 
    transFat: 2.0,    
    cholesterol: 300,
    caffeine: 200
  }
};

const kValues: Record<string, number> = {
  calories: 0.0114,
  totalSugar: 0.0172,
  addedSugar: 0.0190,
  sodium: 0.0172,
  saturatedFat: 0.0151,
  transFat: 0.0599,
  cholesterol: 0.0135,
  caffeine: 0.0212
};
const kp = 0.0230;

// 3. Category Weight Matrix
const categoryWeights: Record<string, Record<string, number>> = {
  "Biscuits": { calories: 10, protein: 10, fiber: 10, totalSugar: 20, addedSugar: 15, sodium: 10, saturatedFat: 10, transFat: 5, cholesterol: 10, caffeine: 0 },
  "Cream Biscuits": { calories: 10, protein: 8, fiber: 8, totalSugar: 25, addedSugar: 20, sodium: 8, saturatedFat: 12, transFat: 4, cholesterol: 5, caffeine: 0 },
  "Chips & Snacks": { calories: 10, protein: 5, fiber: 10, totalSugar: 10, addedSugar: 5, sodium: 30, saturatedFat: 15, transFat: 10, cholesterol: 5, caffeine: 0 },
  "Chocolates": { calories: 8, protein: 5, fiber: 5, totalSugar: 30, addedSugar: 25, sodium: 5, saturatedFat: 15, transFat: 2, cholesterol: 5, caffeine: 0 },
  "Protein Bars": { calories: 8, protein: 20, fiber: 15, totalSugar: 10, addedSugar: 5, sodium: 10, saturatedFat: 8, transFat: 4, cholesterol: 20, caffeine: 0 },
  "Muesli & Cereals": { calories: 10, protein: 15, fiber: 20, totalSugar: 15, addedSugar: 5, sodium: 10, saturatedFat: 5, transFat: 5, cholesterol: 15, caffeine: 0 },
  "Drinks": { calories: 10, protein: 5, fiber: 5, totalSugar: 35, addedSugar: 20, sodium: 10, saturatedFat: 3, transFat: 2, cholesterol: 5, caffeine: 5 },
  "Milkshakes": { calories: 10, protein: 15, fiber: 5, totalSugar: 25, addedSugar: 15, sodium: 10, saturatedFat: 10, transFat: 5, cholesterol: 5, caffeine: 0 },
  "Ice Cream": { calories: 8, protein: 10, fiber: 2, totalSugar: 30, addedSugar: 20, sodium: 5, saturatedFat: 15, transFat: 5, cholesterol: 5, caffeine: 0 },
  "Milk": { calories: 10, protein: 25, fiber: 0, totalSugar: 15, addedSugar: 10, sodium: 5, saturatedFat: 25, transFat: 3, cholesterol: 7, caffeine: 0 },
  "Dairy Drinks": { calories: 10, protein: 15, fiber: 0, totalSugar: 20, addedSugar: 15, sodium: 15, saturatedFat: 15, transFat: 3, cholesterol: 7, caffeine: 0 },
  "Health Drinks": { calories: 10, protein: 15, fiber: 5, totalSugar: 25, addedSugar: 20, sodium: 5, saturatedFat: 8, transFat: 2, cholesterol: 5, caffeine: 5 },
  "Dry Fruits & Nuts": { calories: 10, protein: 15, fiber: 20, totalSugar: 10, addedSugar: 5, sodium: 10, saturatedFat: 20, transFat: 5, cholesterol: 5, caffeine: 0 },
  "Seeds": { calories: 8, protein: 15, fiber: 25, totalSugar: 5, addedSugar: 5, sodium: 10, saturatedFat: 22, transFat: 5, cholesterol: 5, caffeine: 0 }
};

const defaultCategoryWeights = categoryWeights["Biscuits"];

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

// 4. Ingredient Families
const familyAddedSugars = ['sugar', 'sucrose', 'glucose', 'fructose', 'hfcs', 'corn syrup', 'agave syrup', 'honey', 'invert sugar', 'maltose', 'dextrose', 'rice syrup', 'coconut sugar', 'date syrup', 'golden syrup', 'brown rice syrup', 'barley malt extract', 'liquid glucose'];
const familyRefinedOilsFats = ['refined palm oil', 'palm oil', 'hydrogenated vegetable oil', 'hydrogenated fat', 'interesterified vegetable fat', 'refined vegetable oil', 'cottonseed oil', 'sunflower oil', 'soyabean oil'];
const familyRefinedFlour = ['refined wheat flour', 'maida', 'wheat flour (maida)'];
const genericProcessed = ['maltodextrin', 'corn syrup solids', 'modified starch', 'artificial flavour', 'nature identical flavouring substances', 'artificial vanilla', 'cocoa solids', 'milk solids', 'starch', 'edible vegetable fat'];
const positiveIngredientsList = ['whole grain', 'whole wheat', 'oats', 'millets', 'nuts', 'seeds', 'fruits', 'vegetables', 'pulses', 'cashew', 'almond', 'peanut', 'fruit', 'vegetable', 'water', 'milk', 'curd', 'paneer', 'sattu', 'quinoa', 'amaranth', 'makhana'];

export const additiveRisks: Record<string, number> = {
  '171': 8, '319': 8, '320': 8, '321': 8,
  '102': 5, '110': 5, '122': 5, '124': 5, '129': 5, '133': 5,
  '202': 2, '211': 2, '950': 2, '951': 2, '955': 2, '150c': 2, '150d': 2, '223': 2, '338': 2, '442': 2,
  '444': 1, '451i': 1, '466': 1, '476': 1, '477': 1, '621': 1, '627': 1, '631': 1, '1101i': 1, '1520': 1,
  '322': 0, '330': 0, '412': 0, '415': 0, '440': 0, '296': 0, '300': 0, '307b': 0, '331': 0, '334': 0, '336': 0, '339ii': 0, '339iii': 0, '385': 0, '407': 0, '410': 0, '460i': 0, '471': 0, '472e': 0, '500ii': 0, '503ii': 0, '516': 0
};

// Section 2a: Natural-Nutrient Dampening Whitelist
const naturalDampeningWhitelist: Record<string, string[]> = {
  "Milk": ["saturatedFat", "cholesterol"],
  "Dairy Drinks": ["saturatedFat"],
  "Dry Fruits & Nuts": ["saturatedFat"],
  "Seeds": ["saturatedFat"]
};

// 5. Deterministic NOVA Classifier
export const estimateNovaGroup = (product: any): number => {
  if (product.nova !== undefined) return product.nova;

  const ingredients = product.ingredients ? product.ingredients.map((ing: string) => ing.toLowerCase().trim()) : [];
  if (ingredients.length === 0) return 4; 

  let hasAdditives = false;
  let hasRefinedIngredients = false;
  let hasCulinaryIngredients = false;

  const culinaryKeywords = ['salt', 'sugar', 'oil', 'butter', 'vinegar', 'honey', 'syrup'];
  const processedKeywords = ['flavour', 'flavor', 'color', 'colour', 'emulsifier', 'preservative', 'stabilizer', 'acidity regulator', 'sweetener', 'raising agent', 'antioxidant', 'maltodextrin', 'ins', 'e ', 'starch', 'extract'];

  for (const ing of ingredients) {
    if (processedKeywords.some(k => ing.includes(k))) hasAdditives = true;
    if (familyAddedSugars.some(f => ing.includes(f))) hasRefinedIngredients = true;
    if (familyRefinedOilsFats.some(f => ing.includes(f))) hasRefinedIngredients = true;
    if (familyRefinedFlour.some(f => ing.includes(f))) hasRefinedIngredients = true;
    if (culinaryKeywords.some(k => ing.includes(k))) hasCulinaryIngredients = true;
  }

  if (product.additives && product.additives.length > 0) hasAdditives = true;

  if (hasAdditives || (hasRefinedIngredients && ingredients.length > 5)) return 4;
  if (hasRefinedIngredients || (hasCulinaryIngredients && ingredients.length > 2)) return 3;
  if (ingredients.length === 1 && hasCulinaryIngredients) return 2;
  return 1;
};

// 6. Nutrient Normalization Helper
// This function was moved to normalizeNutrient.ts

// Helper: Calculate internal NGS
export const calculateInternalNGS = (product: any, overrideNova?: number, overrideCategory?: string): { scoreBreakdown: ScoreBreakdown, missingDataError: boolean } => {
  const flags: string[] = [];
  
  const activeCategory = overrideCategory || product.category;
  
  // Section 8 & 14: Missing & Implausible Data Check
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
  
  // Section 12: Allergen Flag
  if (!product.allergens || product.allergens.length === 0) {
    flags.push('allergen_undeclared');
  }

  // Section 14: Amplified Exposure Category
  if (['Milkshakes', 'Drinks', 'Ice Cream', 'Health Drinks'].includes(activeCategory)) {
    flags.push('amplified_exposure_category');
  }

  const getNutritionScore = (ageGroup: string) => {
    const weights = categoryWeights[activeCategory] || defaultCategoryWeights;
    const refIntakes = referenceIntakes[ageGroup];

    const NUTRIENT_KEYS: NutrientKey[] = [
      'calories', 'protein', 'fiber', 'totalSugar', 'addedSugar',
      'sodium', 'saturatedFat', 'transFat', 'cholesterol', 'caffeine',
    ];
    let nut: Record<string, number> = Object.fromEntries(
      NUTRIENT_KEYS.map(k => [k, getNutrient(product.nutrition, k)])
    );

    let p: Record<string, number> = {};
    for (const key in refIntakes) {
      p[key] = (nut[key] / refIntakes[key]) * 100;
    }

    let negativeKeys = ['calories', 'totalSugar', 'addedSugar', 'sodium', 'saturatedFat', 'transFat', 'cholesterol', 'caffeine'];
    let totalWNeg = 0;
    let weightedSumLnSNeg = 0;
    let worstSNegScore = 100;
    let worstNutrientKey = 'calories';
    
    for (const key of negativeKeys) {
      let w = weights[key];
      if (w > 0) {
        if ((key === 'cholesterol' || key === 'caffeine') && getDeclaredNutrient(product.nutrition, key as NutrientKey) === undefined) {
          continue;
        }
        totalWNeg += w;
        let s_i = 100 * Math.exp(-kValues[key] * p[key]);
        if ((key === 'calories' || key === 'totalSugar' || key === 'sodium' || key === 'saturatedFat' || key === 'transFat') && 
            getDeclaredNutrient(product.nutrition, key as NutrientKey) === undefined) {
          s_i = 0; 
        }
        let safe_s_i = Math.max(s_i, 1e-10);
        if (s_i < worstSNegScore) {
          worstSNegScore = s_i;
          worstNutrientKey = key;
        }
        weightedSumLnSNeg += w * Math.log(safe_s_i);
      }
    }

    let N_neg = totalWNeg > 0 ? Math.exp(weightedSumLnSNeg / totalWNeg) : 100;

    let positiveKeys = ['protein', 'fiber'];
    let totalWPos = 0;
    let N_pos_sum = 0;
    for (const key of positiveKeys) {
      let w = weights[key];
      if (w > 0) {
        if (key === 'fiber' && product.nutrition && product.nutrition[key] === undefined) {
          continue;
        }
        totalWPos += w;
        let p_eff = Math.min(p[key], 100); 
        let s_i = 100 * (1 - Math.exp(-kp * p_eff));
        N_pos_sum += w * s_i;
      }
    }
    let N_pos = totalWPos > 0 ? N_pos_sum / totalWPos : 0;

    let totalActiveWeight = totalWNeg + totalWPos;
    let N_weighted_average = totalActiveWeight > 0 ? (N_neg * (totalWNeg / totalActiveWeight) + N_pos * (totalWPos / totalActiveWeight)) : 0;
    
    // Section 2a: Natural-Nutrient Dampening
    let isDampened = false;
    let nova = overrideNova !== undefined ? overrideNova : estimateNovaGroup(product);
    if (nova <= 2 && naturalDampeningWhitelist[activeCategory] && naturalDampeningWhitelist[activeCategory].includes(worstNutrientKey)) {
      isDampened = true;
    }
    
    let N = isDampened 
      ? 0.5 * N_weighted_average + 0.5 * worstSNegScore
      : 0.3 * N_weighted_average + 0.7 * worstSNegScore;

    return {
      score: Math.max(0, Math.min(100, N)),
      worstKey: worstNutrientKey,
      worstDV: p[worstNutrientKey],
      worstSubScore: worstSNegScore,
      pMap: p
    };
  };

  const getIngredientScore = () => {
    let nova = overrideNova !== undefined ? overrideNova : estimateNovaGroup(product);
    if (nova === 1) return 100;
    if (!product.ingredients || product.ingredients.length === 0) return 0;
    let i_score = 50;
    const ingredients = product.ingredients.map((ing: string) => ing.toLowerCase().trim());
    let familiesFound = new Set<string>();
    let familyPositions: Record<string, number> = { 'addedSugars': Infinity, 'refinedOilsFats': Infinity, 'refinedFlour': Infinity };
    let positiveContribution = 0;
    let genericProcessedCount = 0;
    let positiveFoundCount = 0;
    let sugarAliasesFound = new Set<string>();

    for (let idx = 0; idx < ingredients.length; idx++) {
      let ing = ingredients[idx];
      let pos = idx + 1;
      
      familyAddedSugars.forEach(sugar => {
        if (ing.includes(sugar)) {
          familiesFound.add('addedSugars');
          familyPositions['addedSugars'] = Math.min(familyPositions['addedSugars'], pos);
          sugarAliasesFound.add(sugar);
        }
      });
      
      if (familyRefinedOilsFats.some(f => ing.includes(f))) { familiesFound.add('refinedOilsFats'); familyPositions['refinedOilsFats'] = Math.min(familyPositions['refinedOilsFats'], pos); }
      if (familyRefinedFlour.some(f => ing.includes(f))) { familiesFound.add('refinedFlour'); familyPositions['refinedFlour'] = Math.min(familyPositions['refinedFlour'], pos); }
      if (genericProcessed.some(g => ing.includes(g))) genericProcessedCount++;
      if (positiveIngredientsList.some(p => ing.includes(p))) {
        if (positiveFoundCount < 3) {
          let contrib = pos === 1 ? 5 : pos === 2 ? 4 : pos === 3 ? 3 : pos === 4 ? 2 : 1;
          positiveContribution += contrib;
          positiveFoundCount++;
        }
      }
    }

    positiveContribution = Math.min(15, positiveContribution);
    let positionPenaltyTotal = 0;
    for (let family of Array.from(familiesFound)) {
      let pos = familyPositions[family];
      positionPenaltyTotal += (pos === 1 ? 10 : pos === 2 ? 8 : pos === 3 ? 6 : pos === 4 ? 4 : pos === 5 ? 2 : 0);
    }

    i_score = 50 + positiveContribution - (4 * genericProcessedCount) - positionPenaltyTotal;
    
    if (sugarAliasesFound.size >= 3) {
      i_score -= 10;
      flags.push('sugar_split');
    }
    
    if (familiesFound.size >= 3) i_score = Math.min(i_score, 20);
    else if (familiesFound.size === 2) i_score = Math.min(i_score, 35);
    return Math.max(0, Math.min(100, i_score));
  };

  const getProcessingScore = () => {
    let nova = overrideNova !== undefined ? overrideNova : estimateNovaGroup(product);
    if (nova === 1) return 100;
    
    let penalties = 0;
    const firstIng = product.ingredients && product.ingredients.length > 0 ? product.ingredients[0].toLowerCase() : '';
    let isHighlyRefined = familyRefinedFlour.some(f => firstIng.includes(f)) || familyAddedSugars.some(f => firstIng.includes(f)) || firstIng.includes('starch');
    let isFormulatedBase = false;
    if (firstIng.includes('water') || firstIng.includes('syrup') || firstIng.includes('concentrate')) {
      if (product.ingredients.some((i: string) => ['flavour', 'colour', 'sweetener', 'flavor', 'color'].some(k => i.toLowerCase().includes(k)))) isFormulatedBase = true;
    }
    const isInstant = activeCategory === 'Muesli & Cereals' || product.isInstant;

    if (isInstant) penalties += 10;
    if (isHighlyRefined) penalties += 10;
    if (isFormulatedBase) penalties += 10;
    
    return Math.max(0, Math.min(100, 100 - penalties));
  };

  const getAdditiveScore = (ageGroup: string) => {
    const hasAdditiveKeyword = (product.ingredients || []).some((ing: string) => {
      let lower = ing.toLowerCase();
      return ['emulsifier', 'colour', 'color', 'preservative', 'stabilizer', 'acidity regulator', 'sweetener', 'raising agent', 'flavour enhancer', 'sequestrant', 'antioxidant', 'ins', 'e '].some(k => lower.includes(k));
    });

    if (!hasAdditiveKeyword && (!product.additives || product.additives.length === 0)) return 100;

    let totalRisk = 0;
    let count = 0;
    let hasCritical = false;
    let hasHigh = false;
    let detectedCodes = new Set<string>();
    
    if (product.additives) {
      product.additives.forEach((add: string) => {
        let match = add.match(/\b(\d{3,4}[a-z]?)\b/i);
        if (match) detectedCodes.add(match[1].toLowerCase());
      });
    }
    
    (product.ingredients || []).forEach((ing: string) => {
      let matches = ing.match(/\d{3,4}[a-z]?/gi);
      if (matches) matches.forEach(m => detectedCodes.add(m.toLowerCase()));
    });

    let sweetenerRiskMultiplier = 1.0;
    if (ageGroup === 'child') sweetenerRiskMultiplier = 2.0;
    else if (ageGroup === 'teen') sweetenerRiskMultiplier = 1.5;
    else if (ageGroup === 'elderly') sweetenerRiskMultiplier = 1.2;

    count = detectedCodes.size;
    if (count === 0 && hasAdditiveKeyword) {
      let keywordCount = 0;
      product.ingredients.forEach((ing: string) => {
          let lower = ing.toLowerCase();
          if (['emulsifier', 'colour', 'color', 'preservative', 'stabilizer', 'acidity regulator', 'sweetener', 'raising agent', 'flavour enhancer', 'sequestrant', 'antioxidant'].some(k => lower.includes(k))) keywordCount++;
      });
      count = Math.max(1, keywordCount);
      totalRisk = count * 2;
    } else {
      detectedCodes.forEach(code => {
        let risk = 2; // Precautionary Medium
        if (additiveRisks[code] !== undefined) risk = additiveRisks[code];
        else if (additiveRisks[code.replace(/[a-z]+$/i, '')] !== undefined) risk = additiveRisks[code.replace(/[a-z]+$/i, '')];
        
        let isSweetener = ['950', '951', '955'].includes(code);
        if (!isSweetener) {
          isSweetener = (product.ingredients || []).some((ing: string) => ing.toLowerCase().includes(code) && ing.toLowerCase().includes('sweetener'));
        }

        let finalRisk = isSweetener ? risk * sweetenerRiskMultiplier : risk;
        totalRisk += finalRisk;

        if (risk >= 8) hasCritical = true;
        if (risk === 5) hasHigh = true;
      });
    }

    let A = 100 * Math.exp(-0.12 * totalRisk) - (4 * count);
    
    let criticalCeiling = 30;
    let highCeiling = 50;
    if (ageGroup === 'child') {
      criticalCeiling = 15;
      highCeiling = 30;
    } else if (ageGroup === 'elderly') {
      criticalCeiling = 20;
      highCeiling = 35;
    }

    if (hasCritical) A = Math.min(A, criticalCeiling);
    else if (hasHigh) A = Math.min(A, highCeiling);
    return Math.max(0, A);
  };

  let I = getIngredientScore();
  let P = getProcessingScore();
  let nova = overrideNova !== undefined ? overrideNova : estimateNovaGroup(product);
  let scale = novaScale[nova] || 0.50;

  // Track the adult dominant nutrient for the root response
  let adultDominantNutrient: { key: string, dv: number, subScore: number } | undefined;

  const calculateFinalAgeScore = (ageGroup: string): AgeScore => {
    let nutResult = getNutritionScore(ageGroup);
    let N = nutResult.score;
    let A_age = getAdditiveScore(ageGroup);
    
    let domNutrient = {
      key: nutResult.worstKey,
      dv: Math.round(nutResult.worstDV),
      subScore: Math.round(nutResult.worstSubScore)
    };
    if (ageGroup === 'adult') {
      adultDominantNutrient = domNutrient;
    }

    // Section 16: Exclude Infant Products
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

    // Section 1: Decoupled Structure
    let N_capped = nova === 4 ? Math.min(N, 50) : N;
    let NGS_pre_cliff = scale * (0.20 * I + 0.15 * P + 0.30 * A_age) + 0.35 * N_capped;
    
    // Section 1a: Danger Cliff
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
    
    // Section 14: Serving Reality Check
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

    let res = { 
      score: Math.max(0, Math.min(100, Math.round(NGS_final))), 
      components: { N: Math.round(N_capped), I: Math.round(I), P: Math.round(P), A: Math.round(A_age) }, 
      scale: scale,
      cliffPenalty: cliffPenalty,
      serving_reality_check: servingRealityCheck,
      dominantNutrient: domNutrient,
      ...getGradeAndColor(Math.round(NGS_final)) 
    };
    
    return res;
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

export const calculateNutriGuardScore = (product: any): ScoreBreakdown => {
  let result = calculateInternalNGS(product);
  let breakdown = result.scoreBreakdown;
  let missing = result.missingDataError;

  // If missing data, return immediately
  if (missing) return breakdown;



  // Deduplicate flags
  if (breakdown.flags) {
    breakdown.flags = Array.from(new Set(breakdown.flags));
  }

  return breakdown;
};
