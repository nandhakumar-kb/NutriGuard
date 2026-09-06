import { estimateNovaGroup, familyAddedSugars, familyRefinedFlour, familyRefinedOilsFats, genericProcessed, positiveIngredientsList } from './novaClassifier';

export const getIngredientScore = (product: any, overrideNova?: number, flags: string[] = []) => {
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

export const getProcessingScore = (product: any, activeCategory: string, overrideNova?: number) => {
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
