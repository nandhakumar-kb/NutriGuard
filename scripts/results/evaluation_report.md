# NutriGuard Evaluation Report

## Reproducibility Metadata
- **Evaluation Date**: 2026-09-04T12:44:02.902Z
- **Node Version**: v22.17.0
- **Dataset Size**: 100 products

> The evaluation pipeline does not use pseudorandom number generation; all reported calculations are deterministic execution under a fixed software environment and input dataset.

## E1: Software Verification
- Total Products: 100
- Passed Bounds (0-100): 100
- Passed Grades: 100
- Passed Determinism: 100
- Crash Count: 0

## E2: Age Sensitivity
### Paired Differences (Adult vs X)
- adultVsChild: Mean: 4.31 | Median: 3.00 | SD: 3.83 | 95% t-distribution CI: [3.55, 5.07]
- adultVsTeen: Mean: -2.09 | Median: -2.00 | SD: 1.38 | 95% t-distribution CI: [-2.36, -1.82]
- adultVsElderly: Mean: -0.23 | Median: 0.00 | SD: 0.45 | 95% t-distribution CI: [-0.32, -0.14]

## E3: Component Ablation Study
Score Delta (AblatedScore - FullScore):
- ablationN: Mean: 20.52 | Median: 21.00 | SD: 7.47 | 95% t-distribution CI: [19.04, 22.00] | Grade Changes: 88.00%
- ablationI: Mean: 5.07 | Median: 6.00 | SD: 2.41 | 95% t-distribution CI: [4.59, 5.55] | Grade Changes: 61.00%
- ablationP: Mean: 0.28 | Median: 0.00 | SD: 0.45 | 95% t-distribution CI: [0.19, 0.37] | Grade Changes: 3.00%
- ablationA: Mean: 5.52 | Median: 5.00 | SD: 4.38 | 95% t-distribution CI: [4.65, 6.39] | Grade Changes: 56.00%
- ablationNova: Mean: 16.50 | Median: 19.00 | SD: 8.20 | 95% t-distribution CI: [14.87, 18.13] | Grade Changes: 85.00%
- ablationAge: Mean: 3.31 | Median: 3.00 | SD: 3.04 | 95% t-distribution CI: [2.71, 3.91] | Grade Changes: 23.00%

## E4: NOVA Classification Perturbation Analysis
Score Swing across forced NOVA 1 to 4:
- Swing Stats: Mean: 35.58 | Median: 35.00 | SD: 5.90
- Grade Changes: 100
- Percentage Affected: 100.00%

## E5: Counterfactual Analysis
- Total Products: 100
- Eligible Products: 100
- Successfully Processed: 55
- No-counterfactual Cases: 45
- Score Improvements: Mean: 3.36 | Median: 3.00 | SD: 1.95
- Grade Transitions (Algorithmic crossing): 55

### Qualitative Case Studies
- **Low**: 5 Star (23 -> 30) | Action: Reduce Added Sugar
- **Medium**: Makino Roasted Masala Cashews (55 -> 60) | Action: Reduce Saturated Fat
- **High**: Farmley Almond Kernels (89 -> 90) | Action: Reduce Saturated Fat

## E6: RAG Explanation Evaluation
> NOT EVALUATED quantitatively due to absence of a predefined ground-truth explanation benchmark.

## E7: OCR Evaluation
> NOT EVALUATED quantitatively as suitable ground truth is unavailable.

## E8: Baseline Comparison
Evaluated step-wise explicitly B1, B2, B3, B4 configurations. See `baseline_comparison.csv` for raw distributions.

## E9: Missing Data Robustness
### 1. Dataset Completeness
- Products with missing required fields: 0
- Missing Field Counts: {}

### 2. Engine Missing-Data Handling
- Flags Correctly Set: 100
- Numeric score generated: 100/100

## E10: Category Analysis & Sensitivity
See `category_analysis.csv` for detailed metrics per category.
Category perturbation sensitivity (score swings): Mean: 0.67 | Median: 1.00 | SD: 0.64 | 95% t-distribution CI: [0.54, 0.80] | Grade Changes: 10

## E11: Statistical Analysis
Wilcoxon signed-rank tests were performed on paired variations (Age, Ablation). Holm-Bonferroni correction applied (α=0.05). See `statistical_analysis.csv` for detailed p-values and CIs.

