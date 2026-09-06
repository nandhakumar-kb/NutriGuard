const fs = require('fs');

const productsFile = './src/data/products.json';
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

const allergenKeywords = {
  'Milk': ['milk', 'butter', 'cheese', 'whey', 'casein', 'paneer', 'ghee', 'curd', 'lactose', 'skimmed', 'dairy'],
  'Wheat/Gluten': ['wheat', 'flour', 'maida', 'suji', 'semolina', 'atta', 'malt', 'barley', 'rye', 'oat'],
  'Soy': ['soy', 'soya', 'soybean', 'edamame'],
  'Peanuts': ['peanut', 'groundnut'],
  'Tree Nuts': ['almond', 'cashew', 'pistachio', 'walnut', 'hazelnut', 'pecan', 'macadamia', 'nut'],
  'Sesame': ['sesame', 'til'],
  'Egg': ['egg', 'albumen'],
  'Fish/Crustaceans': ['fish', 'prawn', 'shrimp', 'crab'],
  'Mustard': ['mustard'],
  'Sulphites': ['sulphite', 'sulfite', 'metabisulphite', '223']
};

products.forEach(p => {
  const currentAllergens = new Set();
  const ingredients = p.ingredients || [];
  
  // First, keep existing valid allergens if any (but typically we just replace or augment them)
  // Actually, to be safe, let's just rebuild the allergens based purely on ingredients 
  // (unless there are explicit ones already? The user said "update allergen information for all by ingredients", so let's rebuild it)
  
  ingredients.forEach(ing => {
    const lowerIng = ing.toLowerCase();
    
    for (const [allergen, keywords] of Object.entries(allergenKeywords)) {
      // Don't flag "coconut" as tree nut, or "nutmeg" as nut
      if (allergen === 'Tree Nuts' && (lowerIng.includes('coconut') || lowerIng.includes('nutmeg') || lowerIng.includes('peanut'))) {
          // If it matches exactly a tree nut, add it
          if (['almond', 'cashew', 'pistachio', 'walnut', 'hazelnut'].some(k => lowerIng.includes(k))) {
              currentAllergens.add(allergen);
          }
          continue;
      }
      
      // Don't flag "soya lecithin" if we just want "Soy" (actually we do want Soy for soya lecithin in India usually)
      if (keywords.some(k => lowerIng.includes(k))) {
        currentAllergens.add(allergen);
      }
    }
  });

  // Convert set to array
  p.allergens = Array.from(currentAllergens);
  if (p.allergens.length === 0) {
     p.allergens = ['None Declared'];
  }
});

fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
console.log('Successfully updated allergens in products.json!');
