const fs = require('fs');

const productsFile = './src/data/products.json';
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

// A robust dictionary built to closely mirror real-world Indian packaged food metrics
const marketData = {
  // Biscuits
  'Britannia Good Day Butter': { price: 20, net_weight: '75g', serve_size: '15g' },
  'Britannia Good Day Cashew': { price: 20, net_weight: '75g', serve_size: '15g' },
  'Britannia Good Day Choco Chip': { price: 20, net_weight: '75g', serve_size: '15g' },
  'Britannia Good Day Pista Badam': { price: 20, net_weight: '75g', serve_size: '15g' },
  'Britannia Marie Gold': { price: 10, net_weight: '80g', serve_size: '20g' },
  'Britannia NutriChoice Digestive': { price: 30, net_weight: '100g', serve_size: '25g' },
  'Parle G': { price: 5, net_weight: '65g', serve_size: '20g' },
  'Parle Krack Jack': { price: 10, net_weight: '60g', serve_size: '20g' },
  'Parle Monaco': { price: 10, net_weight: '60g', serve_size: '20g' },
  'Sunfeast Marie Light': { price: 10, net_weight: '80g', serve_size: '20g' },
  'Sunfeast Mom\'s Magic Cashew & Almond': { price: 20, net_weight: '75g', serve_size: '15g' },
  
  // Cream Biscuits
  'Britannia Bourbon': { price: 20, net_weight: '120g', serve_size: '25g' },
  'Britannia Jim Jam': { price: 25, net_weight: '100g', serve_size: '25g' },
  'Cadbury Oreo Vanilla': { price: 30, net_weight: '120g', serve_size: '20g' },
  'Cadbury Oreo Choco': { price: 30, net_weight: '120g', serve_size: '20g' },
  'Sunfeast Dark Fantasy Choco Fills': { price: 35, net_weight: '75g', serve_size: '25g' },
  'Sunfeast Bounce Choco': { price: 10, net_weight: '50g', serve_size: '25g' },
  
  // Chips & Snacks
  'Balaji Wafers Cream & Onion': { price: 20, net_weight: '70g', serve_size: '20g' },
  'Balaji Wafers Simply Salted': { price: 20, net_weight: '70g', serve_size: '20g' },
  'Balaji Wafers Masala Masti': { price: 20, net_weight: '70g', serve_size: '20g' },
  'Bikano Aloo Bhujia': { price: 50, net_weight: '200g', serve_size: '30g' },
  'Bikano Bikaneri Bhujia': { price: 50, net_weight: '200g', serve_size: '30g' },
  'Bikano Moong Dal': { price: 50, net_weight: '200g', serve_size: '30g' },
  'Bingo Mad Angles Tomato Madness': { price: 10, net_weight: '40g', serve_size: '20g' },
  'Bingo Tedhe Medhe Masala Tadka': { price: 10, net_weight: '45g', serve_size: '20g' },
  'Doritos Cheese Supreme': { price: 20, net_weight: '60g', serve_size: '30g' },
  'Doritos Sweet Chilli': { price: 20, net_weight: '60g', serve_size: '30g' },
  'Haldiram\'s Aloo Bhujia': { price: 55, net_weight: '200g', serve_size: '35g' },
  'Haldiram\'s Moong Dal': { price: 55, net_weight: '200g', serve_size: '35g' },
  'Haldiram\'s Nut Cracker': { price: 55, net_weight: '200g', serve_size: '35g' },
  'Haldiram\'s Bhujia Sev': { price: 55, net_weight: '200g', serve_size: '35g' },
  'Haldiram\'s Khatta Meetha': { price: 55, net_weight: '200g', serve_size: '35g' },
  'Haldiram\'s Plain Bhujia': { price: 55, net_weight: '200g', serve_size: '35g' },
  'Haldiram\'s Lite Chiwda': { price: 50, net_weight: '200g', serve_size: '35g' },
  'Kurkure Masala Munch': { price: 10, net_weight: '45g', serve_size: '20g' },
  'Kurkure Chilli Chatka': { price: 10, net_weight: '45g', serve_size: '20g' },
  'Kurkure Solid Masti': { price: 10, net_weight: '45g', serve_size: '20g' },
  'Lay\'s American Style Cream & Onion': { price: 20, net_weight: '50g', serve_size: '25g' },
  'Lay\'s Classic Salted': { price: 20, net_weight: '50g', serve_size: '25g' },
  'Lay\'s India\'s Magic Masala': { price: 20, net_weight: '50g', serve_size: '25g' },
  'Lay\'s Spanish Tomato Tango': { price: 20, net_weight: '50g', serve_size: '25g' },
  'Lays Maxx Macho Chilli': { price: 20, net_weight: '50g', serve_size: '25g' },
  'Uncle Chipps Spicy Treat': { price: 20, net_weight: '50g', serve_size: '25g' },
  
  // Chocolates
  'Amul Dark Chocolate': { price: 100, net_weight: '150g', serve_size: '20g' },
  'Amul Fruit N Nut': { price: 100, net_weight: '150g', serve_size: '20g' },
  'Amul Bitter Chocolate': { price: 110, net_weight: '150g', serve_size: '20g' },
  'Amul 99% Cacao': { price: 120, net_weight: '120g', serve_size: '20g' },
  'Cadbury Dairy Milk': { price: 20, net_weight: '24g', serve_size: '24g' },
  'Cadbury Dairy Milk Silk': { price: 70, net_weight: '60g', serve_size: '20g' },
  'Cadbury Dairy Milk Fruit & Nut': { price: 40, net_weight: '36g', serve_size: '18g' },
  'Cadbury Dairy Milk Roast Almond': { price: 40, net_weight: '36g', serve_size: '18g' },
  'Cadbury Bournville Rich Cocoa': { price: 100, net_weight: '80g', serve_size: '20g' },
  '5 Star': { price: 10, net_weight: '22g', serve_size: '22g' },
  'Snickers': { price: 50, net_weight: '45g', serve_size: '45g' },
  'Mars': { price: 50, net_weight: '51g', serve_size: '51g' },
  'Ferrero Rocher': { price: 150, net_weight: '50g', serve_size: '25g' },
  'Kinder Joy': { price: 45, net_weight: '20g', serve_size: '20g' },
  'Milkybar': { price: 20, net_weight: '25g', serve_size: '25g' },
  'Munch': { price: 10, net_weight: '18g', serve_size: '18g' },
  'KitKat': { price: 20, net_weight: '27.5g', serve_size: '27.5g' },
  'Perk': { price: 10, net_weight: '28g', serve_size: '14g' },
  
  // Drinks / Health Drinks / Milkshakes
  'Coca-Cola': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Pepsi': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Sprite': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Thums Up': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Fanta': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Limca': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Mirinda': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  '7UP': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Mountain Dew': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Maaza': { price: 45, net_weight: '600ml', serve_size: '200ml' },
  'Slice': { price: 45, net_weight: '600ml', serve_size: '200ml' },
  'Frooti': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Tropicana 100% Orange': { price: 110, net_weight: '1L', serve_size: '200ml' },
  'Real Fruit Power Mixed Fruit': { price: 110, net_weight: '1L', serve_size: '200ml' },
  'Paper Boat Aamras': { price: 30, net_weight: '250ml', serve_size: '250ml' },
  'Red Bull': { price: 115, net_weight: '250ml', serve_size: '250ml' },
  'Monster Energy': { price: 110, net_weight: '350ml', serve_size: '350ml' },
  'Sting Energy': { price: 20, net_weight: '250ml', serve_size: '250ml' },
  'Gatorade Blue Bolt': { price: 50, net_weight: '500ml', serve_size: '250ml' },
  'Amul Kool Cafe': { price: 30, net_weight: '200ml', serve_size: '200ml' },
  'Amul Kool Kesar': { price: 30, net_weight: '200ml', serve_size: '200ml' },
  'Amul Lassi': { price: 20, net_weight: '250ml', serve_size: '250ml' },
  'Amul Masti Buttermilk': { price: 15, net_weight: '200ml', serve_size: '200ml' },
  'Hershey\'s Milkshake Chocolate': { price: 40, net_weight: '200ml', serve_size: '200ml' },
  'Cavins Milkshake Vanilla': { price: 35, net_weight: '200ml', serve_size: '200ml' },
  'Bournvita': { price: 220, net_weight: '500g', serve_size: '20g' },
  'Horlicks': { price: 240, net_weight: '500g', serve_size: '25g' },
  'Complan': { price: 280, net_weight: '500g', serve_size: '33g' },
  'Boost': { price: 250, net_weight: '500g', serve_size: '20g' },
  
  // Ice Cream
  'Amul Vanilla Magic': { price: 100, net_weight: '500ml', serve_size: '100ml' },
  'Kwality Wall\'s Cornetto': { price: 50, net_weight: '120ml', serve_size: '120ml' },
  'Magnum Classic': { price: 90, net_weight: '80ml', serve_size: '80ml' },
  'Mother Dairy Choco Bite': { price: 40, net_weight: '80ml', serve_size: '80ml' },
  'Vadilal Rajbhog': { price: 150, net_weight: '500ml', serve_size: '100ml' },
  
  // Seeds
  'Happilo Premium Californian Almonds': { price: 350, net_weight: '200g', serve_size: '30g' },
  'Tata Sampann Premium Almonds': { price: 340, net_weight: '200g', serve_size: '30g' },
  'Nutraj Signature Cashews': { price: 380, net_weight: '200g', serve_size: '30g' },
  'True Elements Pumpkin Seeds': { price: 200, net_weight: '250g', serve_size: '30g' },
  'Farmley Roasted Makhana': { price: 120, net_weight: '100g', serve_size: '20g' },
  
  // Protein Bars & Cereals
  'Kellogg\'s Corn Flakes': { price: 180, net_weight: '475g', serve_size: '30g' },
  'Kellogg\'s Chocos': { price: 160, net_weight: '375g', serve_size: '30g' },
  'Kellogg\'s Muesli Fruit & Nut': { price: 320, net_weight: '500g', serve_size: '40g' },
  'Quaker Oats': { price: 190, net_weight: '1kg', serve_size: '35g' },
  'Saffola Masala Oats': { price: 180, net_weight: '500g', serve_size: '39g' },
  'Yoga Bar Multigrain Energy Bar': { price: 40, net_weight: '38g', serve_size: '38g' },
  'RiteBite Max Protein Daily Choco Almond': { price: 65, net_weight: '50g', serve_size: '50g' },
  'MuscleBlaze Protein Bar': { price: 80, net_weight: '50g', serve_size: '50g' }
};

let fallbackDefaults = {
  'Biscuits': { price: 20, net_weight: '75g', serve_size: '15g' },
  'Cream Biscuits': { price: 30, net_weight: '100g', serve_size: '25g' },
  'Chips & Snacks': { price: 20, net_weight: '50g', serve_size: '25g' },
  'Chocolates': { price: 40, net_weight: '40g', serve_size: '20g' },
  'Drinks': { price: 40, net_weight: '600ml', serve_size: '200ml' },
  'Ice Cream': { price: 80, net_weight: '100ml', serve_size: '100ml' },
  'Health Drinks': { price: 200, net_weight: '500g', serve_size: '25g' },
  'Seeds': { price: 300, net_weight: '200g', serve_size: '30g' },
  'Muesli & Cereals': { price: 200, net_weight: '400g', serve_size: '35g' },
  'Protein Bars': { price: 60, net_weight: '50g', serve_size: '50g' },
  'Dairy Drinks': { price: 30, net_weight: '200ml', serve_size: '200ml' },
  'Milkshakes': { price: 40, net_weight: '200ml', serve_size: '200ml' }
};

products.forEach(p => {
  const data = marketData[p.name];
  if (data) {
    p.price = data.price;
    p.net_weight = data.net_weight;
    p.serve_size = data.serve_size;
    p.serving_size = data.serve_size; // Ensure compatibility
  } else {
    // Fallback based on category
    const fb = fallbackDefaults[p.category] || { price: 50, net_weight: '100g', serve_size: '30g' };
    p.price = fb.price;
    p.net_weight = fb.net_weight;
    p.serve_size = fb.serve_size;
    p.serving_size = fb.serve_size;
  }
});

fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
console.log('Successfully updated real-world prices, net weight, and serve size!');
