import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  UploadBox, AgeScoreCard, IngredientChip,
  ScoreBreakdown, RecommendationCard,
  ComparisonCard, CompareTable, AllergenBanner, ExplainabilityCard
} from './components';
import { getImageUrl } from '../../services/supabaseClient';
import { useAppStore } from '@/store/useAppStore';
import { Shield, Info } from 'lucide-react';
import { calculateNutriGuardScore, getGradeAndColor } from '@/utils';
import { getConsumerAlternative, getManufacturerCounterfactual } from '@/utils/counterfactual';
import { getNutrient } from '@/utils/normalizeNutrient';
import type { ScoreBreakdown as ScoreBreakdownType } from '@/types';

import productsData from '@/data/products.json';
import ingredientsData from '@/data/ingredients.json';
import additivesData from '@/data/additives.json';

const getNegativeBadge = (nutrient: string, value: number) => {
  let thresholdHigh = 0;
  let thresholdMed = 0;
  if (nutrient === 'Energy') { thresholdHigh = 400; thresholdMed = 150; }
  else if (nutrient === 'Fat') { thresholdHigh = 17.5; thresholdMed = 3; }
  else if (nutrient === 'Sugar') { thresholdHigh = 22.5; thresholdMed = 5; }
  else if (nutrient === 'Sodium') { thresholdHigh = 600; thresholdMed = 120; }

  if (value > thresholdHigh) return { label: 'HIGH', color: 'bg-[#d32f2f]' };
  if (value > thresholdMed) return { label: 'MED', color: 'bg-orange-500' };
  return { label: 'LOW', color: 'bg-green-600' };
};

const getPositiveBadge = (nutrient: string, value: number) => {
  let thresholdGood = 0;
  if (nutrient === 'Protein') thresholdGood = 5;
  if (nutrient === 'Fiber') thresholdGood = 3;
  if (nutrient === 'Calcium') thresholdGood = 10;

  if (value >= thresholdGood) return { label: 'GOOD', color: 'bg-[#00a85a]' };
  return { label: 'FAIR', color: 'bg-yellow-500' };
};

export function Scan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { scanResultId, setScanResultId, dynamicProduct } = useAppStore();

  // Use the ID from the URL if present, otherwise use the global scanResultId
  const activeId = id === 'custom' ? 'custom' : (id ? parseInt(id) : scanResultId);
  const [product, setProduct] = useState<any>(null);
  const [scoreData, setScoreData] = useState<ScoreBreakdownType | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<'child' | 'teen' | 'adult' | 'elderly'>('child');

  useEffect(() => {
    if (activeId) {
      const p = activeId === 'custom' ? dynamicProduct : (productsData as any[]).find(item => item.id === activeId);
      if (!p) return;

      // 1. Calculate Score Dynamically
      const calculatedScore = calculateNutriGuardScore(p);
      setScoreData(calculatedScore);

      // 2. Map Ingredients from lookup dictionary
      const rawIngredients = typeof p.ingredients === 'string' 
        ? p.ingredients.split(',').map((s: string) => s.trim()) 
        : (Array.isArray(p.ingredients) ? p.ingredients : []);

      const mappedIngredients = rawIngredients.map((ingName: string) => {
        const lowerIng = ingName.toLowerCase();
        
        // 1. Try to find in ingredients.json
        // Sort keys descending by length so longer specific names (e.g. "Milk Solids") match before generic ones ("Milk")
        const sortedIngKeys = Object.keys(ingredientsData).sort((a, b) => b.length - a.length);
        let matchedKey = sortedIngKeys.find(k => lowerIng.includes(k.toLowerCase()));
        let detail = matchedKey ? (ingredientsData as any)[matchedKey] : null;

        // 2. Try additives.json (Gemini often lumps E-numbers/additives into the ingredients array)
        if (!detail) {
          const sortedAddKeys = Object.keys(additivesData).sort((a, b) => b.length - a.length);
          matchedKey = sortedAddKeys.find(k => lowerIng.includes(k.toLowerCase()));
          if (matchedKey) {
            detail = (additivesData as any)[matchedKey];
            detail.isAdditiveFallback = true;
          }
        }

        const isAdditive = detail?.isAdditiveFallback || false;

        return {
          id: ingName,
          name: isAdditive && detail.name ? detail.name : ingName,
          role: detail ? (detail.type || 'Additive') : 'Unknown',
          description: detail ? (detail.concerns || detail.benefits || detail.description || '') : 'Analysis not available for this ingredient.',
          status: detail ? (detail.risk === 'High' ? 'bad' : detail.risk === 'Moderate' ? 'concern' : 'good') : 'neutral'
        };
      });

      // Map Additives
      const rawAdditives = typeof p.additives === 'string' 
        ? p.additives.split(',').map((s: string) => s.trim()) 
        : (Array.isArray(p.additives) ? p.additives : []);

      const mappedAdditives = rawAdditives.map((insCode: string) => {
        const lowerCode = insCode.toLowerCase();
        const sortedAddKeys = Object.keys(additivesData).sort((a, b) => b.length - a.length);
        const matchedKey = sortedAddKeys.find(k => lowerCode.includes(k.toLowerCase()));
        const detail = matchedKey ? (additivesData as any)[matchedKey] : null;
        return {
          id: insCode,
          name: detail ? detail.name : insCode,
          role: detail ? detail.type : 'Additive',
          description: detail ? (detail.description || detail.concerns || '') : 'Analysis not available for this additive.',
          status: detail ? (detail.risk === 'High' ? 'bad' : detail.risk === 'Moderate' ? 'concern' : 'good') : 'neutral'
        };
      });

      setIngredients([...mappedIngredients, ...mappedAdditives]);

      // 3. Dynamic Alternatives
      const betterAlts = getConsumerAlternative(p, selectedAgeGroup, productsData).slice(0, 4);

      setAlternatives(betterAlts);

      // 4. Dynamic Recommendations
      const mfrData = getManufacturerCounterfactual(p, selectedAgeGroup);
      
      let actions = mfrData?.actions || [];
      let newScore = mfrData?.potentialScore || calculatedScore.overall;
      let newGrade = mfrData?.potentialGrade || getGradeAndColor(calculatedScore.overall).grade;

      if (actions.length === 0) {
        actions.push({ text: `Maintain Current Profile`, impact: `+0.0`, impactColor: "text-gray-400", description: `Product is already highly rated or requires extensive multi-nutrient reformulation to improve grade.` });
      }

      setRecommendations({
        productId: p.id,
        actions,
        potentialScore: Math.round(newScore),
        potentialGrade: newGrade
      });

      setProduct(p);
    }
  }, [activeId, dynamicProduct, selectedAgeGroup]);

  if (!activeId || !product || !scoreData) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <Helmet>
          <title>Scan a Product - NutriGuard-AI</title>
        </Helmet>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Scan a Product</h2>
            <p className="text-gray-500">Upload an image of the front or back of the pack.</p>
          </div>
          <UploadBox onUploadSuccess={(newId) => {
            if (newId !== 'custom') {
              setScanResultId(newId as number);
            }
            navigate(`/product/${newId}`);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24">
      <Helmet>
        <title>{product?.name ? `${product.name} - NutriGuard Score` : 'Scan Results'}</title>
        <meta name="description" content={`Nutritional analysis and age-aware score for ${product?.name || 'product'}.`} />
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <AllergenBanner allergens={product.allergens} flags={scoreData.flags} />

        {/* Row 1: Scanned Product (Left) | Age-Wise Scores (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Scanned Product */}
          <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row p-6 lg:p-8 gap-6 lg:gap-8 lg:h-115">

            {/* Left Side: Image Box */}
            <div className="w-full h-56 sm:w-1/3 sm:h-full flex items-center justify-center shrink-0">
              <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
            </div>

            {/* Right Side: Details & Grid */}
            <div className="flex flex-col flex-1 h-full">
               {/* Product Name & Brand */}
               <div className="mb-3">
                  <h2 className="text-[28px] lg:text-[32px] font-extrabold text-[#0f172a] leading-tight mb-1 tracking-tight">{product.name}</h2>
                  <p className="text-sm font-medium text-slate-500">{product.category}</p>
               </div>

               {/* Tags */}
               <div className="flex flex-wrap gap-2 mb-5">
                 <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-green-100">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                   {product.category}
                 </span>
                 <span className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-orange-100">
                   <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                   Packaged Food
                 </span>
               </div>
               
               {/* Price */}
               <div className="mb-6">
                  <div className="text-[32px] font-black text-[#0f172a] leading-none mb-1 tracking-tight">
                    {typeof product.price === 'string' && product.price.startsWith('₹') ? product.price : `₹${product.price || 0}`}
                  </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                   MRP (Incl. of all taxes)
                 </div>
               </div>

               {/* Quick Facts Grid 3x2 */}
               <div className="border border-gray-100 rounded-xl overflow-hidden mt-auto text-left shrink-0">
                {/* Row 1 */}
                <div className="grid grid-cols-2 border-b border-gray-100 bg-white">
                  {/* Net Weight */}
                  <div className="flex items-center p-3 gap-3 border-r border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h21v11a2 2 0 0 1-2 2h-1v-1" /><path d="M16 16H8" /><path d="M12 12v4" /><circle cx="12" cy="8" r="4" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Net Weight</span>
                      <span className="text-sm font-bold text-slate-900 leading-none">{product.net_weight}</span>
                    </div>
                  </div>
                  {/* Serving Size */}
                  <div className="flex items-center p-3 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Serving Size</span>
                      <span className="text-sm font-bold text-slate-900 leading-none">{product.serve_size || product.serving_size}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 border-b border-slate-100 bg-white">
                  {/* Ingredients */}
                  <div className="flex items-center p-3 gap-3 border-r border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Ingredients</span>
                      <span className="text-sm font-bold text-slate-900 leading-none">{(product.ingredients || []).length}</span>
                    </div>
                  </div>
                  {/* Additives */}
                  <div className="flex items-center p-3 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31" /><path d="M14 9.3V1.99" /><path d="M8.5 2h7" /><path d="M14 9.3a6.5 6.5 0 1 1-4 0" /><line x1="5.52" y1="16" x2="18.48" y2="16" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Additives</span>
                      <span className="text-sm font-bold text-slate-900 leading-none">{(product.additives || []).length}</span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 bg-white">
                  {/* NOVA */}
                  <div className="flex items-center p-3 gap-3 border-r border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <div className="relative flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 2l3.09 1.62 3.46-.48 1.48 3.17 2.91 1.9L21.32 12l1.62 3.79-2.91 1.9-1.48 3.17-3.46-.48L12 22l-3.09-1.62-3.46.48-1.48-3.17-2.91-1.9L2.68 12l-1.62-3.79 2.91-1.9 1.48-3.17 3.46.48L12 2z" /></svg>
                        <span className="absolute text-[5px] font-bold text-white tracking-widest mt-0.5">NOVA</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">NOVA Level</span>
                      <span className="text-sm font-bold text-slate-900 leading-none flex flex-col sm:flex-row sm:gap-1">
                        {product.nova}
                        <span className="text-[9px] text-blue-500 font-semibold self-start sm:self-end">({product.nova === 4 ? 'Ultra Processed' : 'Processed'})</span>
                      </span>
                    </div>
                  </div>
                  {/* Form */}
                  <div className="flex items-center p-3 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Form</span>
                      <span className="text-sm font-bold text-slate-900 leading-none capitalize">{product.form || 'Solid'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Age-Wise NutriGuard Scores */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 flex flex-col lg:h-100">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2.5 rounded-xl shadow-sm">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">Age-Wise NutriGuard Scores</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Lower score means higher risk. Compare for your age.</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <AgeScoreCard ageGroup="Child" ageRange="4-12 yrs" {...scoreData.ageWise.child} isSelected={selectedAgeGroup === 'child'} onClick={() => setSelectedAgeGroup('child')} />
              <AgeScoreCard ageGroup="Teen" ageRange="13-18 yrs" {...scoreData.ageWise.teen} isSelected={selectedAgeGroup === 'teen'} onClick={() => setSelectedAgeGroup('teen')} />
              <AgeScoreCard ageGroup="Adult" ageRange="19-59 yrs" {...scoreData.ageWise.adult} isSelected={selectedAgeGroup === 'adult'} onClick={() => setSelectedAgeGroup('adult')} />
              <AgeScoreCard ageGroup="Elderly" ageRange="60+ yrs" {...scoreData.ageWise.elderly} isSelected={selectedAgeGroup === 'elderly'} onClick={() => setSelectedAgeGroup('elderly')} />
            </div>
          </div>
        </div>

        <ExplainabilityCard product={product} breakdown={scoreData} ageGroup={selectedAgeGroup} />

        {/* Row 2: Nutrition Grid (Left) | Ingredient Analysis (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
            <h3 className="font-bold text-gray-900 mb-6 text-lg tracking-tight uppercase flex items-center">
              Product Nutrition <span className="text-sm text-gray-400 font-normal normal-case ml-2">(Per 100g)</span>
            </h3>

            {/* Negative block */}
            <div className="mb-6">
              <div className="text-xs font-bold text-red-600 mb-3 border-b border-gray-100 pb-2">
                NEGATIVE <span className="font-semibold text-red-500">(LIMIT CONSUMPTION)</span>
              </div>
              <div className="bg-red-50/40 rounded-xl overflow-hidden flex flex-col gap-0.5">
                <div className="flex items-center justify-between p-3 sm:px-4 bg-red-50/60">
                  <span className="text-sm font-semibold text-gray-800">Energy</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'calories')} <span className="text-xs text-gray-500 font-medium">kcal</span></span>
                    {(() => {
                      const badge = getNegativeBadge('Energy', getNutrient(product.nutrition, 'calories'));
                      return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                    })()}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:px-4 bg-red-50/60">
                  <span className="text-sm font-semibold text-gray-800">Total Fat</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'fat')} <span className="text-xs text-gray-500 font-medium">g</span></span>
                    {(() => {
                      const badge = getNegativeBadge('Fat', getNutrient(product.nutrition, 'fat'));
                      return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                    })()}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:px-4 bg-red-50/60">
                  <span className="text-sm font-semibold text-gray-800">Total Sugar</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'totalSugar')} <span className="text-xs text-gray-500 font-medium">g</span></span>
                    {(() => {
                      const badge = getNegativeBadge('Sugar', getNutrient(product.nutrition, 'totalSugar'));
                      return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                    })()}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:px-4 bg-red-50/60">
                  <span className="text-sm font-semibold text-gray-800">Sodium</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'sodium')} <span className="text-xs text-gray-500 font-medium">mg</span></span>
                    {(() => {
                      const badge = getNegativeBadge('Sodium', getNutrient(product.nutrition, 'sodium'));
                      return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Positive block */}
            <div>
              <div className="text-xs font-bold text-green-600 mb-3 border-b border-gray-100 pb-2">
                POSITIVE <span className="font-semibold text-green-500">(GOOD FOR YOU)</span>
              </div>
              <div className="bg-green-50/40 rounded-xl overflow-hidden flex flex-col gap-0.5">
                <div className="flex items-center justify-between p-3 sm:px-4 bg-green-50/60">
                  <span className="text-sm font-semibold text-gray-800">Protein</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'protein')} <span className="text-xs text-gray-500 font-medium">g</span></span>
                    {(() => {
                      const badge = getPositiveBadge('Protein', getNutrient(product.nutrition, 'protein'));
                      return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                    })()}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:px-4 bg-green-50/60">
                  <span className="text-sm font-semibold text-gray-800">Dietary Fiber</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'fiber')} <span className="text-xs text-gray-500 font-medium">g</span></span>
                    {(() => {
                      const badge = getPositiveBadge('Fiber', getNutrient(product.nutrition, 'fiber'));
                      return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                    })()}
                  </div>
                </div>
                {getNutrient(product.nutrition, 'calcium') > 0 && (
                  <div className="flex items-center justify-between p-3 sm:px-4 bg-green-50/60">
                    <span className="text-sm font-semibold text-gray-800">Calcium</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">{getNutrient(product.nutrition, 'calcium')} <span className="text-xs text-gray-500 font-medium">mg</span></span>
                      {(() => {
                        const badge = getPositiveBadge('Calcium', getNutrient(product.nutrition, 'calcium'));
                        return <span className={`px-2 py-0.5 ${badge.color} text-white text-[10px] font-bold rounded`}>{badge.label}</span>;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-8">* Approximate values extracted from nutrition label.</p>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col max-h-142">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-lg tracking-tight uppercase">
                Ingredient Analysis
              </h3>
              <div className="flex gap-4 text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Good</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div> Neutral</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Concern</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 min-h-0 custom-scrollbar">
              {ingredients.map(ing => (
                <IngredientChip key={ing.id} {...ing} />
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-4 divide-x divide-gray-100 text-center">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 mb-1">Total Ingredients</span>
                <span className="text-xl font-bold text-gray-900">{ingredients.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-green-600 mb-1">Positives</span>
                <span className="text-xl font-bold text-green-600">{ingredients.filter(i => i.status === 'good').length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-orange-400 mb-1">Neutrals</span>
                <span className="text-xl font-bold text-orange-400">{ingredients.filter(i => i.status === 'neutral').length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-500 mb-1">Concerns</span>
                <span className="text-xl font-bold text-red-500">{ingredients.filter(i => i.status === 'concern' || i.status === 'bad').length}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Row 3: Unified Score Breakdown */}
        <div className="mb-6">
          <ScoreBreakdown product={product} scoreData={scoreData} ageGroup={selectedAgeGroup} />
        </div>

        {/* Row 5: Recommendations (Left) | Better Alternatives (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-full">
            {recommendations ? (
              <RecommendationCard {...recommendations} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex items-center justify-center text-gray-400 text-sm">
                No recommendations available.
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </span>
                Better Alternatives <span className="text-xs text-gray-400 font-normal ml-2">(Same Category / Top Picks)</span>
              </h3>
            
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              {alternatives.map((alt, index) => (
                <ComparisonCard key={alt.id} alt={alt} rank={index + 1} />
              ))}
            </div>
          </div>
        </div>

        {/* Row 6: Compare Products */}
        <CompareTable currentProduct={product} alternatives={alternatives} selectedAgeGroup={selectedAgeGroup} />

       
      </div>
    </div>
  );
}
