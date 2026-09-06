const { execSync } = require('child_process');

console.log('Starting full data synchronization pipeline...');

try {
  console.log('\n[1/4] Updating allergens based on ingredients...');
  execSync('node update_allergens.cjs', { stdio: 'inherit' });

  console.log('\n[2/4] Populating real-world prices and metrics...');
  execSync('node update_metrics.cjs', { stdio: 'inherit' });

  console.log('\n[3/4] Exporting dataset to CSV for evaluation...');
  execSync('node scripts/evaluation/export_dataset_csv.cjs', { stdio: 'inherit' });

  console.log('\n[4/4] Syncing local dataset to Supabase backend...');
  execSync('node sync.cjs', { stdio: 'inherit' });

  console.log('\n✅ All synchronization scripts completed successfully!');
} catch (error) {
  console.error('\n❌ Synchronization failed at one of the steps. Check logs above.');
  process.exit(1);
}
