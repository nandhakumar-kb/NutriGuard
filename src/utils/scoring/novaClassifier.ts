export const familyAddedSugars = ['sugar', 'sucrose', 'glucose', 'fructose', 'hfcs', 'corn syrup', 'agave syrup', 'honey', 'invert sugar', 'maltose', 'dextrose', 'rice syrup', 'coconut sugar', 'date syrup', 'golden syrup', 'brown rice syrup', 'barley malt extract', 'liquid glucose'];
export const familyRefinedOilsFats = ['refined palm oil', 'palm oil', 'hydrogenated vegetable oil', 'hydrogenated fat', 'interesterified vegetable fat', 'refined vegetable oil', 'cottonseed oil', 'sunflower oil', 'soyabean oil'];
export const familyRefinedFlour = ['refined wheat flour', 'maida', 'wheat flour (maida)'];
export const genericProcessed = ['maltodextrin', 'corn syrup solids', 'modified starch', 'artificial flavour', 'nature identical flavouring substances', 'artificial vanilla', 'cocoa solids', 'milk solids', 'starch', 'edible vegetable fat'];
export const positiveIngredientsList = ['whole grain', 'whole wheat', 'oats', 'millets', 'nuts', 'seeds', 'fruits', 'vegetables', 'pulses', 'cashew', 'almond', 'peanut', 'fruit', 'vegetable', 'water', 'milk', 'curd', 'paneer', 'sattu', 'quinoa', 'amaranth', 'makhana'];

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
