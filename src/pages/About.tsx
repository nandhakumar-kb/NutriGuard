import { ShieldCheck, Target, Users } from 'lucide-react';

export function About() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-snug">
          NutriGuard-AI: An Age-Aware, Evidence-Grounded Deterministic Framework for Indian Packaged Food Assessment
        </h1>
        
        <div className="mb-8 border-b border-gray-200 pb-8">
          <p className="text-lg font-semibold text-gray-800 mb-1">
            Nandha Kishore K B, Nandha Kumar K B, Raj Kumar Yadav, and Maulya H
          </p>
          <p className="text-gray-500">
            Department of Computer Science and Engineering<br/>
            KPR Institute of Engineering and Technology, Coimbatore, Tamil Nadu, India
          </p>
        </div>

        <div className="prose prose-lg prose-green max-w-none text-gray-600 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Abstract</h2>
          <p className="mb-4">
            Packaged-food labels contain nutritional, ingredient, additive, allergen, and processing information as separate signals that are difficult to integrate consistently. Existing AI nutrition systems commonly emphasize extraction, recommendation, or natural-language interpretation, while the numerical assessment pathway can remain difficult to inspect and reproduce.
          </p>
          <p className="mb-4">
            This paper presents NutriGuard-AI, an age-aware framework for deterministic assessment of Indian packaged-food labels. Multimodal label interpretation is used for information acquisition and evidence-oriented explanation, while a separate deterministic engine performs numerical assessment. The engine combines four assessment pillars—nutrition, ingredients, processing, and additive exposure—with age-specific reference-intake normalization, a NOVA-based processing adjustment, data-quality safeguards, and counterfactual score analysis.
          </p>
          <p className="mb-4">
            A reproducible evaluation was conducted on 100 structured product records using software verification, component ablation, age sensitivity, coefficient perturbation, controlled NOVA perturbation, counterfactual analysis, missing-data handling, category sensitivity, and paired statistical tests. All 100 records produced bounded and deterministic scores. Removing nutrition and NOVA components produced mean score changes of 20.52 and 16.50 points, respectively, while the age component produced a mean change of 3.31 points. Coefficient perturbation of ±50% preserved product-ranking correlations between 0.968 and 0.998. Controlled NOVA perturbation produced a mean score swing of 35.58 points and changed the grade of all records.
          </p>
          <p>
            On 56 products with robust Nutri-Score 2023 classification, the continuous NutriGuard score correlated with inverse Nutri-Score class at ρ = 0.687 (p = 4.86 × 10⁻⁹), while exact five-class agreement was 28.6% (κ = 0.193). These findings characterize reproducibility, sensitivity, and internal consistency of the implemented framework; they do not establish clinical validity, health-outcome superiority, or population-level effects.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Deterministic Scoring</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Separates generative AI extraction from numerical assessment, ensuring reproducible and transparent scoring across four pillars.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Age-Aware Normalization</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Dynamically scales penalties using age-specific reference-intake values for children, teens, adults, and the elderly.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Counterfactual Analysis</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Exposes how deterministic rules respond to controlled “what-if” nutritional modifications to uncover dominant impact factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
