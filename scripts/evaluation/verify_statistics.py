import json
import os
import sys
from scipy.stats import wilcoxon

results_file = os.path.join(os.path.dirname(__file__), '../results/raw_results.json')
with open(results_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

diff_groups = {
    'adultVsChild': data['ageSensitivity']['pairedDiffs']['adultVsChild']['rawDiffs'],
    'adultVsTeen': data['ageSensitivity']['pairedDiffs']['adultVsTeen']['rawDiffs'],
    'adultVsElderly': data['ageSensitivity']['pairedDiffs']['adultVsElderly']['rawDiffs'],
    'ablationN': data['ablation']['rawDiffs']['N'],
    'ablationI': data['ablation']['rawDiffs']['I'],
    'ablationP': data['ablation']['rawDiffs']['P'],
    'ablationA': data['ablation']['rawDiffs']['A'],
    'ablationNova': data['ablation']['rawDiffs']['Nova'],
    'ablationAge': data['ablation']['rawDiffs']['Age'],
}

print(f"{'Comparison':<18} | {'TS W':<8} | {'SciPy W':<8} | {'TS p':<12} | {'SciPy p':<12} | {'Diff':<12} | Status")
print("-" * 90)

all_passed = True

for key, diffs in diff_groups.items():
    non_zero_diffs = [d for d in diffs if d != 0]
    
    ts_stats = data['statistics'][key]['wilcoxon']
    ts_w = ts_stats['W']
    ts_p = ts_stats['pValue']
    
    if len(non_zero_diffs) == 0:
        continue

    # Use Wilcox method for zero handling (discard zeros, then rank), which matches our TS implementation
    # Set correction=False to match our uncorrected asymptotic z-score calculation
    # mode='approx' forces asymptotic calculation (z-score), avoiding exact calculation for small N so we can compare apples to apples
    res = wilcoxon(non_zero_diffs, zero_method='wilcox', correction=False, mode='approx')
    scipy_w = res.statistic
    scipy_p = res.pvalue
    
    p_diff = abs(ts_p - scipy_p)
    status = "PASS" if p_diff < 1e-4 else "FAIL"
    if status == "FAIL":
        all_passed = False
        
    print(f"{key:<18} | {ts_w:<8.1f} | {scipy_w:<8.1f} | {ts_p:<12.3e} | {scipy_p:<12.3e} | {p_diff:<12.3e} | {status}")

print("-" * 90)
if all_passed:
    print("Verification SUCCESSFUL: TypeScript Wilcoxon matches SciPy mathematically.")
else:
    print("Verification FAILED: Discrepancies found.")
    sys.exit(1)
