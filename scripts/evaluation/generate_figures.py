import os
import csv
# pyrefly: ignore [missing-import]
import matplotlib.pyplot as plt

# Ensure the output directory exists
results_dir = os.path.join(os.path.dirname(__file__), '../results')
fig_dir = os.path.join(results_dir, 'figures')
os.makedirs(fig_dir, exist_ok=True)

# ---------- Figure 1: Ablation Study ----------
ablation_csv = os.path.join(results_dir, 'ablation_results.csv')
components = []
mean_deltas = []
sd_vals = []

with open(ablation_csv, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        comp = row['Component']
        components.append(comp)
        mean_deltas.append(float(row['Mean_Delta']))
        sd_vals.append(float(row['SD']))

# Plot with error bars (using one‑standard‑error approximation)
plt.figure(figsize=(8, 5))
plt.bar(components, mean_deltas, color='#4A90E2', edgecolor='black')
error = [sd / (2 ** 0.5) for sd in sd_vals]  # approximate SE = SD / sqrt(2) for paired diff
plt.errorbar(components, mean_deltas, yerr=error, fmt='none', ecolor='black', capsize=5)
plt.title('Component Ablation Analysis')
plt.ylabel('Mean Score Difference (Full − Ablated)')
plt.xlabel('Removed Component')
plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'ablation_study.png'), dpi=300)
plt.close()

# ---------- Figure 2: Age Sensitivity ----------
age_csv = os.path.join(results_dir, 'age_sensitivity.csv')
comparisons = []
mean_diffs = []
sd_age = []

with open(age_csv, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        comp = row['Comparison']
        comparisons.append(comp)
        mean_diffs.append(float(row['Mean']))
        sd_age.append(float(row['SD']))

plt.figure(figsize=(8, 5))
plt.bar(comparisons, mean_diffs, color='#7ED321', edgecolor='black')
error_age = [sd / (2 ** 0.5) for sd in sd_age]
plt.errorbar(comparisons, mean_diffs, yerr=error_age, fmt='none', ecolor='black', capsize=5)
plt.title('Age‑Specific Score Sensitivity')
plt.ylabel('Mean Score Difference (Adult − Comparison)')
plt.xlabel('Comparison Group')
plt.tight_layout()
plt.savefig(os.path.join(fig_dir, 'age_sensitivity.png'), dpi=300)
plt.close()

print('Figures generated in', fig_dir)
