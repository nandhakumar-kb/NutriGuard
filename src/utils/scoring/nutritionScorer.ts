import { getNutrient, getDeclaredNutrient, type NutrientKey } from '../normalizeNutrient';

export const referenceIntakes: Record<string, any> = {
  child: { calories: 1350, protein: 22, fiber: 23, totalSugar: 34, addedSugar: 17, sodium: 1200, saturatedFat: 15, transFat: 1.5, cholesterol: 300, caffeine: 40 },
  teen: { calories: 2560, protein: 48, fiber: 33, totalSugar: 64, addedSugar: 32, sodium: 1800, saturatedFat: 28, transFat: 2.8, cholesterol: 300, caffeine: 100 },
  adult: { calories: 1865, protein: 50, fiber: 28, totalSugar: 47, addedSugar: 23, sodium: 2000, saturatedFat: 21, transFat: 2.0, cholesterol: 300, caffeine: 400 },
  elderly: { calories: 1925, protein: 50, fiber: 28, totalSugar: 48, addedSugar: 24, sodium: 2000, saturatedFat: 21, transFat: 2.0, cholesterol: 300, caffeine: 200 }
};

export const kValues: Record<string, number> = {
  calories: 0.0114, totalSugar: 0.0172, addedSugar: 0.0190, sodium: 0.0172, saturatedFat: 0.0151, transFat: 0.0599, cholesterol: 0.0135, caffeine: 0.0212
};
export const kp = 0.0230;

export const categoryWeights: Record<string, Record<string, number>> = {
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

export const defaultCategoryWeights = categoryWeights["Biscuits"];

const naturalDampeningWhitelist: Record<string, string[]> = {
  "Milk": ["saturatedFat", "cholesterol"],
  "Dairy Drinks": ["saturatedFat"],
  "Dry Fruits & Nuts": ["saturatedFat"],
  "Seeds": ["saturatedFat"]
};

export const getNutritionScore = (product: any, activeCategory: string, ageGroup: string, nova: number) => {
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
  
  let isDampened = false;
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
