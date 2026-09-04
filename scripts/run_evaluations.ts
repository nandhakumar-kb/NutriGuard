import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Run evaluations
import { runScoringVerification } from './evaluation/scoringVerification.js';
import { runAgeSensitivity } from './evaluation/ageSensitivity.js';
import { runAblationStudy } from './evaluation/ablation.js';
import { runNovaSensitivity } from './evaluation/novaSensitivity.js';
import { runCounterfactual } from './evaluation/counterfactual.js';
import { runBaselineComparison } from './evaluation/baselineComparison.js';
import { runCategoryAnalysis } from './evaluation/categoryAnalysis.js';
import { runCategorySensitivity } from './evaluation/categorySensitivity.js';
import { performStatisticalAnalysis } from './evaluation/statistics.js';
import { generateReport } from './evaluation/reportGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../src/data/products.json');

async function main() {
  console.log('Loading dataset...');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Loaded ${products.length} products.\n`);

  const results: any = {};

  console.log('--- E1 & E9: Scoring Verification & Missing Data ---');
  results.verification = runScoringVerification(products);

  console.log('--- E2: Age Sensitivity ---');
  results.ageSensitivity = runAgeSensitivity(products);

  console.log('--- E3: Ablation Study ---');
  results.ablation = runAblationStudy(products);

  console.log('--- E4: NOVA Sensitivity ---');
  results.novaSensitivity = runNovaSensitivity(products);

  console.log('--- E5: Counterfactual Analysis ---');
  results.counterfactual = runCounterfactual(products);

  console.log('--- E8: Baseline Comparison ---');
  results.baseline = runBaselineComparison(products);

  console.log('--- E10: Category Analysis & Sensitivity ---');
  results.category = runCategoryAnalysis(products);
  results.categorySensitivity = runCategorySensitivity(products);

  console.log('--- E11: Statistical Analysis ---');
  // Combine all paired differences we want to test
  const diffGroups = {
    // Age
    adultVsChild: results.ageSensitivity.pairedDiffs.adultVsChild.rawDiffs,
    adultVsTeen: results.ageSensitivity.pairedDiffs.adultVsTeen.rawDiffs,
    adultVsElderly: results.ageSensitivity.pairedDiffs.adultVsElderly.rawDiffs,
    // Ablation
    ablationN: results.ablation.rawDiffs.N,
    ablationI: results.ablation.rawDiffs.I,
    ablationP: results.ablation.rawDiffs.P,
    ablationA: results.ablation.rawDiffs.A,
    ablationNova: results.ablation.rawDiffs.Nova,
    ablationAge: results.ablation.rawDiffs.Age
  };
  results.statistics = performStatisticalAnalysis(diffGroups);

  console.log('\n--- Generating Reports ---');
  generateReport(results, products);
  
  console.log('\nAll evaluations complete. Check scripts/results for output.');
}

main().catch(console.error);
