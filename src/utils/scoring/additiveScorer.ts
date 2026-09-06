export const additiveRisks: Record<string, number> = {
  '171': 8, '319': 8, '320': 8, '321': 8,
  '102': 5, '110': 5, '122': 5, '124': 5, '129': 5, '133': 5,
  '202': 2, '211': 2, '950': 2, '951': 2, '955': 2, '150c': 2, '150d': 2, '223': 2, '338': 2, '442': 2,
  '444': 1, '451i': 1, '466': 1, '476': 1, '477': 1, '621': 1, '627': 1, '631': 1, '1101i': 1, '1520': 1,
  '322': 0, '330': 0, '412': 0, '415': 0, '440': 0, '296': 0, '300': 0, '307b': 0, '331': 0, '334': 0, '336': 0, '339ii': 0, '339iii': 0, '385': 0, '407': 0, '410': 0, '460i': 0, '471': 0, '472e': 0, '500ii': 0, '503ii': 0, '516': 0
};

export const getAdditiveScore = (product: any, ageGroup: string) => {
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
