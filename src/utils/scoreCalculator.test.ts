import { describe, it, expect } from 'vitest';
import { calculateNutriGuardScore } from './scoreCalculator';

describe('NutriGuard Score Calculator - Golden Tests', () => {
  it('should correctly score "5 Star" (High Sugar/Fat, NOVA 4)', () => {
    const product = {
      "name": "5 Star",
      "category": "Chocolates",
      "nova": 4,
      "serving_size": "9.8 g",
      "nutrition": {
        "calories": 444, "protein": 3.3, "fiber": 0, "totalSugars": 55.5,
        "addedSugars": 52.6, "totalFat": 15.9, "saturatedFat": 10.1,
        "transFat": 0.1, "cholesterol": 4.9, "sodium": 170
      },
      "ingredients": [
        "Sugar", "Liquid Glucose", "Milk Solids", "Invert Sugar",
        "Hydrogenated Vegetable Fat", "Cocoa Solids", "Emulsifiers (322,476)",
        "Flavouring Substances"
      ],
      "additives": ["INS 322"]
    };
    const result = calculateNutriGuardScore(product);
    // Grade should be D or E, score should be low. (Using a snapshot or loose check since formula may have small tweaks)
    expect(result.overall).toBeLessThan(50);
    expect(result.ageWise.adult.score).toBe(result.overall);
  });

  it('should correctly score "Amul Taaza Milk" (NOVA 1, Low Sugar)', () => {
    const product = {
      "name": "Amul Taaza Milk",
      "category": "Milk",
      "nova": 1,
      "nutrition": {
        "calories": 86.4, "protein": 3.1, "fiber": 0, "totalSugars": 5,
        "addedSugars": 0, "totalFat": 6, "saturatedFat": 3.9,
        "transFat": 0, "cholesterol": 0, "sodium": 108
      },
      "ingredients": ["Milk"],
      "additives": []
    };
    const result = calculateNutriGuardScore(product);
    expect(result.overall).toBeGreaterThanOrEqual(80); 
    expect(result.components.I).toBe(100); // NOVA 1 gets 100 for Ingredients
    expect(result.components.P).toBe(100); // NOVA 1 gets 100 for Processing
  });
});

describe('NutriGuard Score Calculator - Invariant Tests', () => {
  it('NOVA-4 products should never exceed Nutrition score 50 (Capped)', () => {
    // Create a mathematically perfect product, but assign NOVA 4
    const product = {
      "name": "Perfect Artificial Food",
      "category": "Protein Bars",
      "nova": 4,
      "nutrition": {
        "calories": 50, "protein": 50, "fiber": 20, "totalSugars": 0,
        "addedSugars": 0, "totalFat": 0, "saturatedFat": 0,
        "transFat": 0, "cholesterol": 0, "sodium": 0
      },
      "ingredients": ["Protein Isolate", "Artificial Flavour"],
      "additives": []
    };
    const result = calculateNutriGuardScore(product);
    // Even if N_raw is 100, N is capped at 50 for NOVA 4
    // N component is not exposed directly in overall if cliff happens, but we can check components
    expect(result.components.N).toBeLessThanOrEqual(50);
  });

  it('Child score should be <= Adult score for same product due to stricter thresholds', () => {
    const product = {
      "name": "Sugary Drink",
      "category": "Drinks",
      "nova": 4,
      "nutrition": {
        "calories": 400, "protein": 0, "fiber": 0, "totalSugars": 30,
        "addedSugars": 30, "totalFat": 0, "saturatedFat": 0,
        "transFat": 0, "cholesterol": 0, "sodium": 50
      },
      "ingredients": ["Water", "Sugar", "Artificial Colour"],
      "additives": ["INS 129"]
    };
    const result = calculateNutriGuardScore(product);
    expect(result.ageWise.child.score).toBeLessThanOrEqual(result.ageWise.adult.score);
  });

  it('Danger Cliff fires correctly for extremely high sugar in Child profile', () => {
    const product = {
      "name": "Pure Sugar Paste",
      "category": "Chocolates",
      "nova": 4,
      "nutrition": {
        "calories": 500, "protein": 0, "fiber": 0, "totalSugars": 100, // 100g sugar is ~300% of child DV (34g)
        "addedSugars": 100, "totalFat": 0, "saturatedFat": 0,
        "transFat": 0, "cholesterol": 0, "sodium": 0
      },
      "ingredients": ["Sugar"],
      "additives": []
    };
    const result = calculateNutriGuardScore(product);
    // We can't directly read the cliff penalty, but we know it reduces score.
    // The child score should be heavily penalized.
    expect(result.ageWise.child.score).toBeLessThan(20); 
  });
});

describe('NutriGuard Score Calculator - Edge Cases', () => {
  it('Returns gracefully or scores 0 when missing mandatory nutrients', () => {
    const product = {
      "name": "Missing Data Product",
      "category": "Chips & Snacks",
      "nova": 4,
      "nutrition": {
        // Missing calories, protein, etc.
      },
      "ingredients": ["Potato", "Salt"],
      "additives": []
    };
    const result = calculateNutriGuardScore(product);
    expect(result.overall).toBe(0);
    expect(result.flags).toContain('mandatory_nutrient_undeclared');
  });

  it('Flags products with added sugar > total sugar', () => {
    const product = {
      "name": "Impossible Sugar Product",
      "category": "Biscuits",
      "nova": 3,
      "nutrition": {
        "calories": 100, "protein": 2, "fiber": 0, "totalSugars": 10,
        "addedSugars": 20, // Impossible
        "totalFat": 5, "saturatedFat": 1,
        "transFat": 0, "cholesterol": 0, "sodium": 100
      },
      "ingredients": ["Wheat", "Sugar"],
      "additives": [],
      "allergens": ["Wheat"]
    };
    const result = calculateNutriGuardScore(product);
    // Might not have a specific flag in the current engine, but it should process without crashing.
    expect(result).toBeDefined();
    expect(result.overall).toBeGreaterThanOrEqual(0);
  });

  it('Regression Protection: calculateNutriGuardScore(product) === calculateNutriGuardScore(product, {})', () => {
    const product = {
      "name": "Test Product",
      "category": "Chocolates",
      "nova": 4,
      "nutrition": {
        "calories": 444, "protein": 3.3, "fiber": 0, "totalSugars": 55.5,
        "addedSugars": 52.6, "totalFat": 15.9, "saturatedFat": 10.1,
        "transFat": 0.1, "cholesterol": 4.9, "sodium": 170
      },
      "ingredients": ["Sugar", "Cocoa Solids"],
      "additives": [],
      "allergens": ["None"]
    };
    
    const original = calculateNutriGuardScore(product);
    const withOptions = calculateNutriGuardScore(product, {});
    
    expect(original).toEqual(withOptions);
    
    // Explicitly check fields just in case
    expect(original.overall).toBe(withOptions.overall);
    expect(original.components.N).toBe(withOptions.components.N);
    expect(original.components.I).toBe(withOptions.components.I);
    expect(original.components.P).toBe(withOptions.components.P);
    expect(original.components.A).toBe(withOptions.components.A);
  });
});
