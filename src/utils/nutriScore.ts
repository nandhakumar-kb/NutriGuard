export const calculateNutriScore2017 = (nutrition: any, category: string) => {
  if (!nutrition) return { score: null, grade: 'N/A' };

  // Convert kcal to kJ
  const energyKj = (nutrition.calories || 0) * 4.184;
  const sugars = nutrition.totalSugars || nutrition.sugar || 0;
  const satFat = nutrition.saturatedFat || 0;
  const sodium = nutrition.sodium || 0;
  const fiber = nutrition.fiber || 0;
  const protein = nutrition.protein || 0;

  let nPoints = 0;
  let pPoints = 0;

  // Drinks vs General Foods (Simplified 2017)
  const isBeverage = ['Drinks', 'Milkshakes', 'Health Drinks'].includes(category);

  if (isBeverage) {
    if (category === 'Water') return { score: -15, grade: 'A' };
    
    // Energy
    if (energyKj <= 0) nPoints += 0;
    else if (energyKj <= 30) nPoints += 1;
    else if (energyKj <= 60) nPoints += 2;
    else if (energyKj <= 90) nPoints += 3;
    else if (energyKj <= 120) nPoints += 4;
    else if (energyKj <= 150) nPoints += 5;
    else if (energyKj <= 180) nPoints += 6;
    else if (energyKj <= 210) nPoints += 7;
    else if (energyKj <= 240) nPoints += 8;
    else if (energyKj <= 270) nPoints += 9;
    else nPoints += 10;

    // Sugars
    if (sugars <= 0) nPoints += 0;
    else if (sugars <= 1.5) nPoints += 1;
    else if (sugars <= 3) nPoints += 2;
    else if (sugars <= 4.5) nPoints += 3;
    else if (sugars <= 6) nPoints += 4;
    else if (sugars <= 7.5) nPoints += 5;
    else if (sugars <= 9) nPoints += 6;
    else if (sugars <= 10.5) nPoints += 7;
    else if (sugars <= 12) nPoints += 8;
    else if (sugars <= 13.5) nPoints += 9;
    else nPoints += 10;

    // Saturated Fat and Sodium are generally not scored differently for drinks in 2017, but usually negligible.
    // We'll skip for beverages for the simplified version to avoid over-penalizing based on solid rules.
  } else {
    // Energy
    nPoints += Math.min(10, Math.floor(energyKj / 335.01)); // >335 = 1, etc.
    
    // Sugars
    nPoints += Math.min(10, Math.floor(sugars / 4.501));
    
    // Saturated Fat
    nPoints += Math.min(10, Math.floor(satFat / 1.001));
    
    // Sodium (mg)
    nPoints += Math.min(10, Math.floor(sodium / 90.01));
  }

  // Positive points
  const fiberPoints = Math.min(5, Math.floor(fiber / 0.901));
  const proteinPoints = Math.min(5, Math.floor(protein / 1.601));
  
  // Assume FVL = 0
  const fvlPoints = 0;

  if (nPoints >= 11 && fvlPoints < 5) {
    pPoints = fiberPoints + fvlPoints; // Protein ignored
  } else {
    pPoints = fiberPoints + proteinPoints + fvlPoints;
  }

  const score = nPoints - pPoints;

  let grade = 'E';
  if (isBeverage) {
    if (score <= 1) grade = 'B';
    else if (score <= 5) grade = 'C';
    else if (score <= 9) grade = 'D';
    else grade = 'E';
  } else {
    if (score <= -1) grade = 'A';
    else if (score <= 2) grade = 'B';
    else if (score <= 10) grade = 'C';
    else if (score <= 18) grade = 'D';
    else grade = 'E';
  }

  return { score, grade };
};
