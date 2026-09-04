// Calculate Mean, Median, SD (Sample)
export function getStats(arr: number[]) {
  if (arr.length === 0) return { mean: 0, median: 0, sd: 0, min: 0, max: 0, ci: [0, 0], n: 0 };
  if (arr.length === 1) {
    return { mean: arr[0], median: arr[0], sd: 0, min: arr[0], max: arr[0], ci: [arr[0], arr[0]], n: 1 };
  }
  
  const sorted = [...arr].sort((a, b) => a - b);
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  
  // Sample standard deviation (n - 1)
  const sumSqDiffs = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const sd = Math.sqrt(sumSqDiffs / (n - 1));
  
  // 95% CI using t-critical value approximation for df = n - 1
  // For n >= 100, t ~ 1.984. For large N, we can approximate, but providing a simple lookup for common Ns or fallback to 1.96 for n>100
  // Note: Since n=100 in our test, df=99. t(0.975, 99) = 1.984
  let tCrit = 1.96;
  if (n < 120) tCrit = 1.984; // good enough for N ~ 100
  if (n < 60) tCrit = 2.0; 
  if (n < 30) tCrit = 2.045;
  
  const marginError = tCrit * (sd / Math.sqrt(n));
  
  return { 
    mean, 
    median, 
    sd, 
    min: sorted[0], 
    max: sorted[n - 1],
    ci: [mean - marginError, mean + marginError],
    n
  };
}

// Basic Effect Size (Cohen's d) for paired differences
export function getEffectSize(meanDiff: number, sdDiff: number) {
  if (sdDiff === 0) return 0;
  return meanDiff / sdDiff;
}

// Wilcoxon Signed-Rank Test (with tie and zero correction)
export function wilcoxonSignedRankTest(diffs: number[]) {
  const nonZero = diffs.filter(d => d !== 0);
  if (nonZero.length === 0) return { pValue: 1, significant: false, W: 0, n: diffs.length };
  
  const absDiffs = nonZero.map(Math.abs);
  const sortedIndices = Array.from(absDiffs.keys()).sort((a, b) => absDiffs[a] - absDiffs[b]);
  
  let ranks = new Array(nonZero.length).fill(0);
  let i = 0;
  let tieCorrection = 0;

  while (i < sortedIndices.length) {
    let j = i;
    while (j < sortedIndices.length && absDiffs[sortedIndices[j]] === absDiffs[sortedIndices[i]]) {
      j++;
    }
    const tieCount = j - i;
    // Midrank
    const sumRanks = ((i + 1) + j) * tieCount / 2; // (first rank + last rank) / 2 * tieCount is the sum, wait actually:
    // formula for sum of ranks:
    let rankSum = 0;
    for (let k = i; k < j; k++) rankSum += (k + 1);
    const midRank = rankSum / tieCount;
    
    for (let k = i; k < j; k++) {
      ranks[sortedIndices[k]] = midRank;
    }

    if (tieCount > 1) {
      tieCorrection += (Math.pow(tieCount, 3) - tieCount);
    }
    i = j;
  }

  let W_plus = 0;
  let W_minus = 0;

  for (let i = 0; i < nonZero.length; i++) {
    if (nonZero[i] > 0) W_plus += ranks[i];
    else W_minus += ranks[i];
  }

  const W = Math.min(W_plus, W_minus);
  const n = nonZero.length;
  
  const expectedW = (n * (n + 1)) / 4;
  const varianceW = ((n * (n + 1) * (2 * n + 1)) / 24) - (tieCorrection / 48);
  
  let z = 0;
  if (varianceW > 0) {
    z = (W - expectedW) / Math.sqrt(varianceW);
  }
  
  // Two-tailed p-value approximation from Z score
  let pValue = 2 * (1 - cdf(Math.abs(z)));
  
  // Protect against underflow giving exactly 0
  pValue = Math.max(pValue, Number.EPSILON);
  
  return { pValue, significant: pValue < 0.05, W, z, n };
}

// Normal CDF approximation
function cdf(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

export function performStatisticalAnalysis(diffGroups: Record<string, number[]>) {
  const results: any = {};
  const pValues: { key: string, p: number }[] = [];
  
  // Calculate descriptive and inferential for each paired group
  for (const [key, diffs] of Object.entries(diffGroups)) {
    const stats = getStats(diffs);
    const wilcoxon = wilcoxonSignedRankTest(diffs);
    const cohensD = getEffectSize(stats.mean, stats.sd);
    
    results[key] = {
      stats,
      wilcoxon,
      effectSize: cohensD,
      n: diffs.length
    };
    pValues.push({ key, p: wilcoxon.pValue });
  }

  // Holm-Bonferroni correction (alpha = 0.05)
  pValues.sort((a, b) => a.p - b.p);
  const m = pValues.length;
  for (let i = 0; i < m; i++) {
    const adjustedAlpha = 0.05 / (m - i);
    // Calculate adjusted p-value directly: p_adj = min(1, max(p_adj_prev, p_i * (m - i)))
    let rawAdjustedP = pValues[i].p * (m - i);
    let finalAdjustedP = Math.min(1, rawAdjustedP);
    if (i > 0) {
       const prevAdjustedP = results[pValues[i-1].key].holmBonferroni.adjustedP;
       finalAdjustedP = Math.max(prevAdjustedP, finalAdjustedP);
    }
    
    const isSignificant = pValues[i].p < adjustedAlpha;
    results[pValues[i].key].holmBonferroni = {
      adjustedAlpha,
      adjustedP: finalAdjustedP,
      significant: isSignificant
    };
  }

  return results;
}
