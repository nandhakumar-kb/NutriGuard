const fs = require('fs');

const citationsFile = 'src/data/citations.json';
const additivesFile = 'src/data/additives.json';

const citations = JSON.parse(fs.readFileSync(citationsFile, 'utf8'));
const additives = JSON.parse(fs.readFileSync(additivesFile, 'utf8'));

const newCitations = [
  {
    "id": "who-calories-2015",
    "source": "WHO",
    "title": "Diet, nutrition and the prevention of chronic diseases",
    "year": 2015,
    "section": "Energy Balance",
    "nutrients": ["calories"],
    "ageGroups": ["all"],
    "passage": "Energy intake should balance energy expenditure. To avoid unhealthy weight gain, total fat should not exceed 30% of total energy intake.",
    "url": null
  },
  {
    "id": "who-satfat-2023",
    "source": "WHO",
    "title": "Saturated fatty acid and trans-fatty acid intake for adults and children",
    "year": 2023,
    "section": "Recommendation",
    "nutrients": ["saturatedFat"],
    "ageGroups": ["all"],
    "passage": "WHO recommends reducing saturated fatty acid intake to less than 10% of total energy intake.",
    "url": null
  },
  {
    "id": "who-cholesterol-2023",
    "source": "WHO",
    "title": "Diet and cardiovascular disease",
    "year": 2023,
    "section": "Dietary cholesterol",
    "nutrients": ["cholesterol"],
    "ageGroups": ["adult", "elderly"],
    "passage": "High dietary cholesterol can increase blood LDL cholesterol levels, a major risk factor for cardiovascular diseases.",
    "url": null
  },
  {
    "id": "fssai-caffeine-2020",
    "source": "FSSAI",
    "title": "Food Safety and Standards (Food Products Standards and Food Additives)",
    "year": 2020,
    "section": "Caffeinated Beverages",
    "nutrients": ["caffeine"],
    "ageGroups": ["all"],
    "passage": "High caffeine intake can lead to adverse health effects such as insomnia, nervousness, and elevated heart rate, especially in vulnerable groups.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-calories-child",
    "source": "ICMR-NIN",
    "title": "Dietary Guidelines for Indians",
    "year": 2020,
    "section": "Children and Adolescents",
    "nutrients": ["calories"],
    "ageGroups": ["child", "teen"],
    "passage": "Energy intake must be adequate for growth and development, but excess calories from highly processed foods contribute to childhood obesity.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-fiber-adult",
    "source": "ICMR-NIN",
    "title": "Dietary Guidelines for Indians",
    "year": 2020,
    "section": "Adults",
    "nutrients": ["fiber"],
    "ageGroups": ["adult", "elderly"],
    "passage": "Adequate dietary fiber is essential for bowel health and reducing the risk of chronic diseases such as type 2 diabetes and coronary heart disease.",
    "url": null
  },
  {
    "id": "who-protein-2007",
    "source": "WHO",
    "title": "Protein and amino acid requirements in human nutrition",
    "year": 2007,
    "section": "Executive Summary",
    "nutrients": ["protein"],
    "ageGroups": ["all"],
    "passage": "Proteins are essential for growth, repair, and maintenance of body tissues. Inadequate intake can lead to severe malnutrition.",
    "url": null
  },
  {
    "id": "who-iron-2001",
    "source": "WHO",
    "title": "Iron Deficiency Anaemia",
    "year": 2001,
    "section": "Consequences",
    "nutrients": ["iron"],
    "ageGroups": ["all"],
    "passage": "Iron deficiency is a leading cause of anemia, impacting cognitive development in children and work capacity in adults.",
    "url": null
  },
  {
    "id": "who-calcium-2004",
    "source": "WHO",
    "title": "Vitamin and mineral requirements in human nutrition",
    "year": 2004,
    "section": "Calcium",
    "nutrients": ["calcium"],
    "ageGroups": ["all"],
    "passage": "Calcium is crucial for bone health and muscle function. Low intake is linked to osteoporosis and bone fractures in later life.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-calcium-child",
    "source": "ICMR-NIN",
    "title": "Nutrient Requirements for Indians",
    "year": 2020,
    "section": "Bone Health",
    "nutrients": ["calcium"],
    "ageGroups": ["child", "teen"],
    "passage": "High calcium requirements during childhood and adolescence are critical for achieving peak bone mass.",
    "url": null
  },
  {
    "id": "who-zinc-2004",
    "source": "WHO",
    "title": "Vitamin and mineral requirements in human nutrition",
    "year": 2004,
    "section": "Zinc",
    "nutrients": ["zinc"],
    "ageGroups": ["all"],
    "passage": "Zinc plays a vital role in immune function, DNA synthesis, and cell division.",
    "url": null
  },
  {
    "id": "who-vitaminc-2004",
    "source": "WHO",
    "title": "Vitamin and mineral requirements in human nutrition",
    "year": 2004,
    "section": "Vitamin C",
    "nutrients": ["vitaminC"],
    "ageGroups": ["all"],
    "passage": "Vitamin C is an antioxidant that supports the immune system and enhances iron absorption.",
    "url": null
  },
  {
    "id": "who-vitamina-2004",
    "source": "WHO",
    "title": "Vitamin and mineral requirements in human nutrition",
    "year": 2004,
    "section": "Vitamin A",
    "nutrients": ["vitaminA"],
    "ageGroups": ["all"],
    "passage": "Vitamin A is essential for vision, immune function, and cell growth.",
    "url": null
  },
  {
    "id": "who-vitamind-2004",
    "source": "WHO",
    "title": "Vitamin and mineral requirements in human nutrition",
    "year": 2004,
    "section": "Vitamin D",
    "nutrients": ["vitaminD"],
    "ageGroups": ["all"],
    "passage": "Vitamin D is essential for calcium absorption and bone health.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-fats-adult",
    "source": "ICMR-NIN",
    "title": "Dietary Guidelines for Indians",
    "year": 2020,
    "section": "Fats and Oils",
    "nutrients": ["totalFat"],
    "ageGroups": ["adult", "elderly"],
    "passage": "Excessive intake of total fats, especially saturated and trans fats, is linked to obesity and metabolic syndrome.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-sugar-child",
    "source": "ICMR-NIN",
    "title": "Dietary Guidelines for Indians",
    "year": 2020,
    "section": "Sugar",
    "nutrients": ["totalSugar", "addedSugar"],
    "ageGroups": ["child", "teen"],
    "passage": "High consumption of sugar-sweetened beverages and snacks displacing nutritious foods is a major concern for children's dental and metabolic health.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-sodium-elderly",
    "source": "ICMR-NIN",
    "title": "Dietary Guidelines for Indians",
    "year": 2020,
    "section": "Elderly",
    "nutrients": ["sodium"],
    "ageGroups": ["elderly"],
    "passage": "Older adults are more susceptible to hypertension; reducing sodium intake is critical for managing cardiovascular risk.",
    "url": null
  },
  {
    "id": "fssai-transfat-2022",
    "source": "FSSAI",
    "title": "Trans Fat Regulations",
    "year": 2022,
    "section": "Limits",
    "nutrients": ["transFat"],
    "ageGroups": ["all"],
    "passage": "FSSAI mandates that industrial trans fats be limited to no more than 2% by mass of the total oils/fats present in a food product.",
    "url": null
  },
  {
    "id": "who-potassium-2012",
    "source": "WHO",
    "title": "Guideline: Potassium intake for adults and children",
    "year": 2012,
    "section": "Recommendation",
    "nutrients": ["potassium"],
    "ageGroups": ["adult", "elderly"],
    "passage": "WHO recommends an increase in potassium intake from food to reduce blood pressure and risk of cardiovascular disease.",
    "url": null
  },
  {
    "id": "icmr-nin-2020-protein-elderly",
    "source": "ICMR-NIN",
    "title": "Dietary Guidelines for Indians",
    "year": 2020,
    "section": "Elderly",
    "nutrients": ["protein"],
    "ageGroups": ["elderly"],
    "passage": "Adequate protein intake is essential for older adults to prevent sarcopenia and maintain muscle mass.",
    "url": null
  }
];

// Append citations
const updatedCitations = [...citations, ...newCitations];
fs.writeFileSync(citationsFile, JSON.stringify(updatedCitations, null, 2));

const newAdditives = {
  "INS 171": { "name": "Titanium Dioxide", "type": "Colour", "description": "White food colour; concerns over nanoparticle toxicity", "risk": "High" },
  "INS 319": { "name": "Tert-butylhydroquinone (TBHQ)", "type": "Antioxidant", "description": "Synthetic antioxidant; potential immune effects", "risk": "High" },
  "INS 102": { "name": "Tartrazine", "type": "Colour", "description": "Yellow food colour; potential allergic reactions and hyperactivity", "risk": "Medium" },
  "INS 110": { "name": "Sunset Yellow FCF", "type": "Colour", "description": "Orange food colour; associated with hyperactivity in children", "risk": "Medium" },
  "INS 122": { "name": "Carmoisine", "type": "Colour", "description": "Red food colour; associated with hyperactivity", "risk": "Medium" },
  "INS 211": { "name": "Sodium Benzoate", "type": "Preservative", "description": "Common preservative; can form benzene in presence of Vitamin C", "risk": "Low" },
  "INS 955": { "name": "Sucralose", "type": "Sweetener", "description": "Artificial sweetener; may affect gut microbiome", "risk": "Low" },
  "INS 951": { "name": "Aspartame", "type": "Sweetener", "description": "Artificial sweetener; caution advised for PKU patients", "risk": "Low" },
  "INS 330": { "name": "Citric Acid", "type": "Acidity Regulator", "description": "Natural acidity regulator and preservative", "risk": "Low" },
  "INS 412": { "name": "Guar Gum", "type": "Thickener", "description": "Natural thickener and stabilizer from guar beans", "risk": "Low" },
  "INS 415": { "name": "Xanthan Gum", "type": "Thickener", "description": "Common stabilizer and thickener", "risk": "Low" },
  "INS 440": { "name": "Pectins", "type": "Gelling Agent", "description": "Natural gelling agent from fruits", "risk": "Low" },
  "INS 300": { "name": "Ascorbic Acid", "type": "Antioxidant", "description": "Vitamin C; used as an antioxidant", "risk": "Low" },
  "INS 471": { "name": "Mono- and di-glycerides of fatty acids", "type": "Emulsifier", "description": "Common emulsifier; usually plant or animal derived", "risk": "Low" },
  "INS 621": { "name": "Monosodium Glutamate (MSG)", "type": "Flavour Enhancer", "description": "Savoury flavour enhancer; some people report sensitivity", "risk": "Low" },
  "INS 338": { "name": "Phosphoric Acid", "type": "Acidity Regulator", "description": "Provides tartness in colas; high intake linked to lower bone density", "risk": "Low" },
  "INS 150c": { "name": "Ammonia Caramel", "type": "Colour", "description": "Brown food colour; contains low levels of 4-MEI", "risk": "Low" },
  "INS 150d": { "name": "Sulphite Ammonia Caramel", "type": "Colour", "description": "Brown food colour; contains low levels of 4-MEI", "risk": "Low" },
  "INS 223": { "name": "Sodium Metabisulphite", "type": "Preservative", "description": "Sulphite preservative; can trigger asthma in sensitive individuals", "risk": "Low" },
  "INS 320": { "name": "Butylated Hydroxyanisole (BHA)", "type": "Antioxidant", "description": "Synthetic antioxidant; potential endocrine disruptor", "risk": "High" }
};

// Merge additives
const updatedAdditives = { ...additives, ...newAdditives };
fs.writeFileSync(additivesFile, JSON.stringify(updatedAdditives, null, 2));

console.log('Successfully added 20 citations and 20 additives.');
