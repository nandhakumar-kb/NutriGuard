import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateNutriGuardScore, estimateNovaGroup } from '../../src/utils/scoreCalculator.js';
import { getStats } from './statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resultsDir = path.resolve(__dirname, '../results');

function formatStats(stats: any) {
  let str = `Mean: ${stats.mean.toFixed(2)} | Median: ${stats.median.toFixed(2)} | SD: ${stats.sd.toFixed(2)}`;
  if (stats.ci) {
    str += ` | 95% t-distribution CI: [${stats.ci[0].toFixed(2)}, ${stats.ci[1].toFixed(2)}]`;
  }
  return str;
}

export function generateReport(results: any, products: any[]) {
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // 1. Central Dataset: product_scores.csv
  let productScoresCsv = 'product_id,product_name,category,age_group,nova,nutrition_score,ingredient_score,processing_score,additive_score,final_score,grade,cliff_penalty,dominant_nutrient,missing_data,flags\n';
  const ageGroups = ['child', 'teen', 'adult', 'elderly'];
  
  for (const product of products) {
    const s = calculateNutriGuardScore(product);
    const missingData = s.flags && (s.flags.includes('ingredients_undeclared') || s.flags.includes('mandatory_nutrient_undeclared')) ? 'true' : 'false';
    const flagsStr = s.flags ? `"${s.flags.join('|')}"` : '""';
    const nova = estimateNovaGroup(product);

    for (const age of ageGroups) {
      const aScore = s.ageWise[age as keyof typeof s.ageWise];
      if (aScore.grade === 'N/A') continue;
      
      const domNutrient = aScore.dominantNutrient ? aScore.dominantNutrient.key : 'none';
      productScoresCsv += `${product.id || 'N/A'},"${product.name}","${product.category || 'Unknown'}",${age},${nova},${aScore.components.N},${aScore.components.I},${aScore.components.P},${aScore.components.A},${aScore.score},${aScore.grade},${aScore.cliffPenalty},${domNutrient},${missingData},${flagsStr}\n`;
    }
  }
  fs.writeFileSync(path.join(resultsDir, 'product_scores.csv'), productScoresCsv, 'utf-8');

  // 2. Ablation Results: ablation_results.csv
  let ablationCsv = `Component,Mean_Delta,Median_Delta,SD,Min,Max,Grade_Change_Pct\n`;
  ['N', 'I', 'P', 'A', 'Nova', 'Age'].forEach(comp => {
    const stat = results.ablation[comp];
    ablationCsv += `${comp},${stat.mean},${stat.median},${stat.sd},${stat.min},${stat.max},${stat.gradeChangePct}\n`;
  });
  fs.writeFileSync(path.join(resultsDir, 'ablation_results.csv'), ablationCsv, 'utf-8');

  // 3. NOVA Sensitivity: nova_sensitivity.csv
  let novaCsv = `Metric,Mean,Median,SD,Min,Max,Grade_Changes,Percentage_Affected\n`;
  const ns = results.novaSensitivity;
  novaCsv += `Swing,${ns.swingStats.mean},${ns.swingStats.median},${ns.swingStats.sd},${ns.swingStats.min},${ns.swingStats.max},${ns.gradeChanges},${ns.percentageAffected}\n`;
  fs.writeFileSync(path.join(resultsDir, 'nova_sensitivity.csv'), novaCsv, 'utf-8');

  // E10 Category Sensitivity: classification_sensitivity.csv
  let catSensCsv = `Metric,Mean,Median,SD,Min,Max,Grade_Changes,Percentage_Affected\n`;
  const cs = results.categorySensitivity;
  const csStats = getStats(cs.swings);
  catSensCsv += `Swing,${csStats.mean},${csStats.median},${csStats.sd},${csStats.min},${csStats.max},${cs.gradeChanges},${cs.percentageAffected}\n`;
  fs.writeFileSync(path.join(resultsDir, 'classification_sensitivity.csv'), catSensCsv, 'utf-8');

  // 4. Age Sensitivity: age_sensitivity.csv
  let ageCsv = `Comparison,Mean,Median,SD,Min,Max\n`;
  ['adultVsChild', 'adultVsTeen', 'adultVsElderly'].forEach(comp => {
    const stat = results.ageSensitivity.pairedDiffs[comp];
    ageCsv += `${comp},${stat.mean},${stat.median},${stat.sd},${stat.min},${stat.max}\n`;
  });
  fs.writeFileSync(path.join(resultsDir, 'age_sensitivity.csv'), ageCsv, 'utf-8');

  // 5. Counterfactual Results: counterfactual_results.csv
  const cf = results.counterfactual;
  let cfCsv = `ProductID,OriginalScore,CounterfactualScore,ScoreImprovement,OriginalGrade,CounterfactualGrade,Iterations,DominantFactor\n`;
  cf.productResults.forEach((pr: any) => {
    cfCsv += `"${pr.id}",${pr.original_score},${pr.counterfactual_score},${pr.score_improvement},${pr.original_grade},${pr.counterfactual_grade},${pr.iterations},${pr.dominant_factor}\n`;
  });
  fs.writeFileSync(path.join(resultsDir, 'counterfactual_results.csv'), cfCsv, 'utf-8');

  // 6. Missing Data: missing_data.csv
  const ver = results.verification;
  let mdCsv = `ProductID,ProductName,MissingFields,EngineFlag,ScoreGenerated\n`;
  ver.datasetCompleteness.auditRecords.forEach((ar: any) => {
    mdCsv += `"${ar.id}","${ar.name}","${ar.missingFields}",${ar.engineFlag},${ar.scoreGenerated}\n`;
  });
  fs.writeFileSync(path.join(resultsDir, 'missing_data.csv'), mdCsv, 'utf-8');

  // 7. Baseline: baseline_comparison.csv
  let baselineCsv = `Product,B1_Score,B1_Grade,B2_Score,B2_Grade,B3_Score,B3_Grade,B4_Score,B4_Grade\n`;
  results.baseline.forEach((b: any) => {
    baselineCsv += `"${b.product}",${b.b1_score},${b.b1_grade},${b.b2_score},${b.b2_grade},${b.b3_score},${b.b3_grade},${b.b4_score},${b.b4_grade}\n`;
  });
  fs.writeFileSync(path.join(resultsDir, 'baseline_comparison.csv'), baselineCsv, 'utf-8');

  // 8. Category Analysis: category_analysis.csv
  let catCsv = `Category,Count,MeanScore,MedianScore,SD,MeanN,MeanI,MeanP,MeanA\n`;
  for (const cat in results.category) {
    const b = results.category[cat];
    const scoreStats = getStats(b.scores);
    const meanN = b.N.reduce((a:number,b:number)=>a+b,0)/b.N.length || 0;
    const meanI = b.I.reduce((a:number,b:number)=>a+b,0)/b.I.length || 0;
    const meanP = b.P.reduce((a:number,b:number)=>a+b,0)/b.P.length || 0;
    const meanA = b.A.reduce((a:number,b:number)=>a+b,0)/b.A.length || 0;
    catCsv += `"${cat}",${b.scores.length},${scoreStats.mean},${scoreStats.median},${scoreStats.sd},${meanN},${meanI},${meanP},${meanA}\n`;
  }
  fs.writeFileSync(path.join(resultsDir, 'category_analysis.csv'), catCsv, 'utf-8');

  // 9. Statistical Analysis: statistical_analysis.csv
  let statCsv = `Comparison,N,Mean,Median,SD,CI_Lower,CI_Upper,Cohen_d,Wilcoxon_W,Wilcoxon_p,HolmBonf_Alpha,Holm_Adjusted_p,Significant\n`;
  for (const [key, val] of Object.entries(results.statistics)) {
    const v = val as any;
    if (key.startsWith('cat_')) continue;
    statCsv += `${key},${v.n},${v.stats.mean},${v.stats.median},${v.stats.sd},${v.stats.ci[0]},${v.stats.ci[1]},${v.effectSize},${v.wilcoxon.W},${v.wilcoxon.pValue},${v.holmBonferroni.adjustedAlpha},${v.holmBonferroni.adjustedP},${v.holmBonferroni.significant}\n`;
  }
  fs.writeFileSync(path.join(resultsDir, 'statistical_analysis.csv'), statCsv, 'utf-8');

  // Markdown Report
  let md = `# NutriGuard Evaluation Report\n\n`;

  md += `## Reproducibility Metadata\n`;
  md += `- **Evaluation Date**: ${new Date().toISOString()}\n`;
  md += `- **Node Version**: ${process.version}\n`;
  md += `- **Dataset Size**: ${products.length} products\n`;
  md += `\n> The evaluation pipeline does not use pseudorandom number generation; all reported calculations are deterministic execution under a fixed software environment and input dataset.\n\n`;

  md += `## E1: Software Verification\n`;
  md += `- Total Products: ${ver.totalProducts}\n`;
  md += `- Passed Bounds (0-100): ${ver.passedBounds}\n`;
  md += `- Passed Grades: ${ver.passedGrades}\n`;
  md += `- Passed Determinism: ${ver.passedDeterminism}\n`;
  md += `- Crash Count: ${ver.crashCount}\n\n`;

  md += `## E2: Age Sensitivity\n`;
  md += `### Paired Differences (Adult vs X)\n`;
  ['adultVsChild', 'adultVsTeen', 'adultVsElderly'].forEach(comp => {
    md += `- ${comp}: ${formatStats(results.statistics[comp].stats)}\n`;
  });
  md += `\n`;

  md += `## E3: Component Ablation Study\n`;
  md += `Score Delta (AblatedScore - FullScore):\n`;
  ['ablationN', 'ablationI', 'ablationP', 'ablationA', 'ablationNova', 'ablationAge'].forEach(comp => {
    const rawComp = comp.replace('ablation', '');
    md += `- ${comp}: ${formatStats(results.statistics[comp].stats)} | Grade Changes: ${results.ablation[rawComp].gradeChangePct.toFixed(2)}%\n`;
  });
  md += `\n`;

  md += `## E4: NOVA Classification Perturbation Analysis\n`;
  md += `Score Swing across forced NOVA 1 to 4:\n`;
  md += `- Swing Stats: ${formatStats(results.novaSensitivity.swingStats)}\n`;
  md += `- Grade Changes: ${results.novaSensitivity.gradeChanges}\n`;
  md += `- Percentage Affected: ${results.novaSensitivity.percentageAffected.toFixed(2)}%\n\n`;

  md += `## E5: Counterfactual Analysis\n`;
  md += `- Total Products: ${cf.totalProducts}\n`;
  md += `- Eligible Products: ${cf.totalEligible}\n`;
  md += `- Successfully Processed: ${cf.successCount}\n`;
  md += `- No-counterfactual Cases: ${cf.noCounterfactualCount}\n`;
  md += `- Score Improvements: ${formatStats(cf.improvements)}\n`;
  md += `- Grade Transitions (Algorithmic crossing): ${cf.gradeTransitions}\n\n`;
  
  md += `### Qualitative Case Studies\n`;
  const cs_study = cf.caseStudies;
  if (cs_study.low) md += `- **Low**: ${cs_study.low.name} (${cs_study.low.orig} -> ${cs_study.low.new}) | Action: ${cs_study.low.actions[0]?.text}\n`;
  if (cs_study.medium) md += `- **Medium**: ${cs_study.medium.name} (${cs_study.medium.orig} -> ${cs_study.medium.new}) | Action: ${cs_study.medium.actions[0]?.text}\n`;
  if (cs_study.high) md += `- **High**: ${cs_study.high.name} (${cs_study.high.orig} -> ${cs_study.high.new}) | Action: ${cs_study.high.actions[0]?.text}\n\n`;

  md += `## E6: RAG Explanation Evaluation\n`;
  md += `> NOT EVALUATED quantitatively due to absence of a predefined ground-truth explanation benchmark.\n\n`;

  md += `## E7: OCR Evaluation\n`;
  md += `> NOT EVALUATED quantitatively as suitable ground truth is unavailable.\n\n`;

  md += `## E8: Baseline Comparison\n`;
  md += `Evaluated step-wise explicitly B1, B2, B3, B4 configurations. See \`baseline_comparison.csv\` for raw distributions.\n\n`;

  md += `## E9: Missing Data Robustness\n`;
  md += `### 1. Dataset Completeness\n`;
  md += `- Products with missing required fields: ${ver.datasetCompleteness.productsWithMissingRequiredFields}\n`;
  md += `- Missing Field Counts: ${JSON.stringify(ver.datasetCompleteness.missingFieldCounts)}\n\n`;
  md += `### 2. Engine Missing-Data Handling\n`;
  md += `- Flags Correctly Set: ${ver.engineMissingHandling.flagsCorrectlySet}\n`;
  md += `- Numeric score generated: ${ver.engineMissingHandling.scoresSafelyGenerated}/${ver.totalProducts}\n\n`;

  md += `## E10: Category Analysis & Sensitivity\n`;
  md += `See \`category_analysis.csv\` for detailed metrics per category.\n`;
  md += `Category perturbation sensitivity (score swings): ${formatStats(csStats)} | Grade Changes: ${cs.gradeChanges}\n\n`;

  md += `## E11: Statistical Analysis\n`;
  md += `Wilcoxon signed-rank tests were performed on paired variations (Age, Ablation). Holm-Bonferroni correction applied (α=0.05). See \`statistical_analysis.csv\` for detailed p-values and CIs.\n\n`;

  fs.writeFileSync(path.join(resultsDir, 'evaluation_report.md'), md, 'utf-8');
  fs.writeFileSync(path.join(resultsDir, 'raw_results.json'), JSON.stringify(results, null, 2), 'utf-8');
}
