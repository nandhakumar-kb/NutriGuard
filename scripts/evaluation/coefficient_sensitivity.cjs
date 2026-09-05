const fs = require('fs');

const run = async () => {
  // Use dynamic import for tsx to run typescript or just use child_process
  const { execSync } = require('child_process');
  
  // Write a temp TS file that imports the scoreCalculator
  const tsCode = `
import fs from 'fs';
import { calculateNutriGuardScore, getGradeAndColor } from '../../src/utils/scoreCalculator.ts';

const data = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));

const results = [];
for (const p of data) {
  const breakdown = calculateNutriGuardScore(p);
  if (breakdown.ageWise && breakdown.ageWise.adult) {
    const adult = breakdown.ageWise.adult;
    results.push({
      id: p.id,
      name: p.name,
      components: adult.components,
      scale: adult.scale,
      cliffPenalty: adult.cliffPenalty,
      baselineScore: adult.score,
      baselineGrade: adult.grade
    });
  }
}

fs.writeFileSync('scripts/evaluation/baseline_scores.json', JSON.stringify(results, null, 2));
`;

  fs.writeFileSync('scripts/evaluation/temp_eval.ts', tsCode);
  execSync('npx tsx scripts/evaluation/temp_eval.ts');
  fs.unlinkSync('scripts/evaluation/temp_eval.ts');

  const baselineData = JSON.parse(fs.readFileSync('scripts/evaluation/baseline_scores.json', 'utf8'));
  
  // Weights: I, P, A, N
  const baseWeights = { wI: 0.20, wP: 0.15, wA: 0.30, wN: 0.35 };
  
  const getGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'C-';
    if (score >= 20) return 'D+';
    if (score >= 10) return 'D';
    return 'E';
  };

  const getRanks = (arr, desc = false) => {
    const sorted = [...arr].map((v, i) => ({v, i})).sort((a, b) => desc ? b.v - a.v : a.v - b.v);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1].v === sorted[i].v) {
        j++;
      }
      let avgRank = ((i + 1) + (j + 1)) / 2;
      for (let k = i; k <= j; k++) {
        ranks[sorted[k].i] = avgRank;
      }
      i = j + 1;
    }
    return ranks;
  };

  const getRankCorrelation = (arr1, arr2, desc = false) => {
    const rank1 = getRanks(arr1, desc);
    const rank2 = getRanks(arr2, desc);
    const mean1 = rank1.reduce((a,b)=>a+b,0) / rank1.length;
    const mean2 = rank2.reduce((a,b)=>a+b,0) / rank2.length;
    let num = 0, den1 = 0, den2 = 0;
    for (let i = 0; i < rank1.length; i++) {
      const d1 = rank1[i] - mean1;
      const d2 = rank2[i] - mean2;
      num += d1 * d2;
      den1 += d1 * d1;
      den2 += d2 * d2;
    }
    return num / Math.sqrt(den1 * den2);
  };

  const perturbations = [-0.5, -0.4, -0.3, -0.2, 0, 0.2, 0.3, 0.4, 0.5];
  const keys = ['wI', 'wP', 'wA', 'wN'];
  
  const report = [];

  for (const key of keys) {
    for (const p of perturbations) {
      if (p === 0) continue; // skip baseline
      
      let wI = baseWeights.wI;
      let wP = baseWeights.wP;
      let wA = baseWeights.wA;
      let wN = baseWeights.wN;
      
      // Perturb target weight
      const targetWeight = baseWeights[key];
      const newWeight = targetWeight * (1 + p);
      
      // Distribute the difference proportionally among others to keep sum = 1
      const diff = newWeight - targetWeight;
      const otherSum = 1 - targetWeight;
      
      const newWeights = {
        wI: key === 'wI' ? newWeight : wI - diff * (wI / otherSum),
        wP: key === 'wP' ? newWeight : wP - diff * (wP / otherSum),
        wA: key === 'wA' ? newWeight : wA - diff * (wA / otherSum),
        wN: key === 'wN' ? newWeight : wN - diff * (wN / otherSum)
      };

      let gradeChanges = 0;
      let scoreChanges = [];
      const baseScores = [];
      const newScores = [];

      for (const prod of baselineData) {
        if (!prod.components) continue; // missing data
        
        const c = prod.components;
        let NGS_pre_cliff = prod.scale * (newWeights.wI * c.I + newWeights.wP * c.P + newWeights.wA * c.A) + newWeights.wN * c.N;
        let NGS_final = Math.max(0, NGS_pre_cliff - prod.cliffPenalty);
        let newScore = Math.max(0, Math.min(100, Math.round(NGS_final)));
        let newGrade = getGrade(newScore);
        
        if (newGrade !== prod.baselineGrade) gradeChanges++;
        scoreChanges.push(newScore - prod.baselineScore);
        baseScores.push(prod.baselineScore);
        newScores.push(newScore);
      }

      const absChanges = scoreChanges.map(Math.abs);
      const meanAbsDelta = absChanges.reduce((a,b)=>a+b,0) / absChanges.length;
      const maxChange = Math.max(...absChanges);
      absChanges.sort((a,b)=>a-b);
      const medianChange = absChanges[Math.floor(absChanges.length/2)];
      const rho = getRankCorrelation(baseScores, newScores, true);

      report.push({
        Component: key,
        Perturbation: (p > 0 ? '+' : '') + Math.round(p * 100) + '%',
        'Grade Changes': gradeChanges,
        '% Change': Math.round((gradeChanges / baseScores.length) * 100) + '%',
        'Mean |Δ|': meanAbsDelta.toFixed(2),
        'Median |Δ|': medianChange,
        'Max |Δ|': maxChange,
        'Spearman ρ': rho.toFixed(3)
      });
    }
  }

  console.table(report);
  
  const csvLines = ['Component,Perturbation,Grade Changes,% Change,Mean Abs Delta,Median Abs Delta,Max Abs Delta,Spearman Rho'];
  report.forEach(r => {
    csvLines.push(r.Component + ',' + r.Perturbation + ',' + r['Grade Changes'] + ',' + r['% Change'] + ',' + r['Mean |Δ|'] + ',' + r['Median |Δ|'] + ',' + r['Max |Δ|'] + ',' + r['Spearman ρ']);
  });
  fs.writeFileSync('scripts/results/coefficient_sensitivity_results.csv', csvLines.join('\\n'));
  console.log('Saved to scripts/results/coefficient_sensitivity_results.csv');
};

run();
