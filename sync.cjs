const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?\r?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase keys in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const products = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf8'));

async function updateDb() {
  console.log('Upserting ' + products.length + ' products to Supabase...');
  const { data, error } = await supabase.from('products').upsert(products);
  if (error) {
    console.error('Error upserting:', error);
  } else {
    console.log('Successfully updated Supabase!');
  }
}
updateDb();
