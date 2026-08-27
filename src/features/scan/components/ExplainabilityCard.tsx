import { useState, useEffect } from 'react';
import { Sparkles, Target, AlertTriangle, Scale, Quote, Shield, RefreshCw, ShieldCheck } from 'lucide-react';

import productsData from '@/data/products.json'; // We'll keep this as a fallback if DB fails, or fetch inside
import { getManufacturerCounterfactual, getConsumerAlternative, getClassificationSensitivity } from '@/utils/counterfactual';
import { generateRagExplanation, type RagExplanation } from '@/services/geminiService';

interface ExplainabilityCardProps {
  product: any;
  breakdown: any;
  ageGroup: 'child' | 'teen' | 'adult' | 'elderly';
}

export function ExplainabilityCard({ product, breakdown, ageGroup }: ExplainabilityCardProps) {
  const domNutrient = breakdown.ageWise[ageGroup].dominantNutrient;
  const grade = breakdown.ageWise[ageGroup].grade;
  const recommendation = breakdown.ageWise[ageGroup].label;
  const score = breakdown.ageWise[ageGroup].score;
  const flags = breakdown.flags || [];

  const [aiExplanation, setAiExplanation] = useState<RagExplanation | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(true);

  useEffect(() => {
    if (domNutrient) {
      setLoadingAi(true);
      generateRagExplanation(domNutrient.key as any, ageGroup)
        .then((res: RagExplanation) => {
          setAiExplanation(res);
          setLoadingAi(false);
        })
        .catch((err: Error) => {
          console.error(err);
          setAiExplanation({ text: "General health recommendation: Balance macro and micro nutrient intake.", citations: [], grounded: false });
          setLoadingAi(false);
        });
    }
  }, [domNutrient, ageGroup]);

  // 2. Fetch Counterfactuals
  const mfrCounterfactual = getManufacturerCounterfactual(product, ageGroup);
  
  const [consumerAlternative, setConsumerAlternative] = useState<any>(null);
  
  useEffect(() => {
    async function fetchAlternative() {
      // In a real app, query supabase for alternative: same category, better score
      // For now, fallback to static JSON or specific DB query if needed
      const alts = getConsumerAlternative(product, ageGroup, productsData);
      setConsumerAlternative(alts.length > 0 ? alts[0] : null);
    }
    fetchAlternative();
  }, [product, ageGroup]);

  // 3. Compute Classification Sensitivity
  const sensitivity = getClassificationSensitivity(product, ageGroup);

  if (!domNutrient) return null;

  // Formatting helper
  const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  return (
    <div className="glass-panel rounded-3xl p-8 mb-6 hover:shadow-lg transition-shadow duration-300">

      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
             <Sparkles className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-xl font-bold text-gray-900">AI Explanation & Evidence</h3>
              <p className="text-sm text-gray-500 mt-1">Science-backed insights and recommendations</p>
           </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
            aiExplanation?.grounded
              ? 'bg-purple-50 text-purple-700 border-purple-100'
              : 'bg-gray-50 text-gray-500 border-gray-100'
          }`}>
            <ShieldCheck className="w-4 h-4" /> {aiExplanation?.grounded ? 'Evidence Based' : 'AI-Generated'}
          </div>
       
        </div>
      </div>
  
      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
         {/* Left Column */}
         <div className="flex flex-col gap-8 lg:border-r border-gray-100 lg:pr-8">
            
            {/* Recommendation */}
            <div className="flex gap-4">
               <div className="mt-1 w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
               </div>
               <div>
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                     <h4 className="font-bold text-gray-900 text-base">Recommendation</h4>
                     <span className="px-3 py-1 bg-orange-50 text-orange-700 text-[11px] font-bold rounded-full border border-orange-100">
                       {recommendation} (Grade {grade}, Score {score})
                     </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                     This product is best consumed {recommendation.toLowerCase()} in small portions.
                  </p>
               </div>
            </div>
  
            {/* Key Driver */}
            <div className="flex gap-4">
               <div className="mt-1 w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">Key Driver</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                     The primary negative factor is <span className="font-semibold text-red-500">{formatKey(domNutrient.key)}</span>, which reaches <span className="font-bold text-red-500">{domNutrient.dv}%</span> of the daily limit for a {ageGroup}.
                  </p>
               </div>
            </div>
  
            {/* Serving Reality Check */}
            {breakdown.ageWise[ageGroup].serving_reality_check && (
            <div className="flex gap-4">
               <div className="mt-1 w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">Serving Reality Check</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                     While scored per 100g, a typical serving ({product.serve_size || product.serving_size}) actually exposes a {ageGroup} to <span className="font-bold text-orange-500">{breakdown.ageWise[ageGroup].serving_reality_check}%</span> of their daily limit.
                     {flags.includes('amplified_exposure_category') && <span className="block mt-1"><strong className="text-orange-500">Caution:</strong> Liquid/large-portion categories often amplify intake.</span>}
                  </p>
               </div>
            </div>
            )}

            {/* Classification Sensitivity */}
            <div className="flex gap-4">
               <div className="mt-1 w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">Classification Sensitivity</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {sensitivity.maxSwing > 0 ? (
                      <>
                        Under the next most plausible {sensitivity.causedByNova && sensitivity.causedByCategory ? 'category or NOVA classification' : sensitivity.causedByNova ? 'NOVA classification' : 'category'},
                        this product's score could range from <span className="font-bold">{sensitivity.worstCaseScore}</span> to <span className="font-bold">{sensitivity.bestCaseScore}</span> — a swing of <span className="font-bold">{sensitivity.maxSwing} points</span>.
                      </>
                    ) : (
                      'This product\'s score is stable across every plausible alternative category or NOVA classification we checked.'
                    )}
                  </p>
               </div>
            </div>
         </div>
  
         {/* Right Column */}
         <div className="flex flex-col gap-6">
            
            {/* WHO Guideline */}
            <div className="bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-xl p-5 relative overflow-hidden transition-all hover:bg-blue-50/80">
               <Quote className="w-8 h-8 text-blue-200 absolute top-4 left-4 transition-transform hover:scale-110 duration-300" />
               <div className="relative z-10 pl-10">
                  <h4 className="font-bold text-blue-800 text-sm mb-2">AI Explanation:</h4>
                  {loadingAi ? (
                     <div className="flex items-center gap-2 text-blue-500 text-sm mb-4">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Fetching evidence-based explanation...
                     </div>
                  ) : (
                     <p className="text-blue-900/80 italic text-sm leading-relaxed mb-4">
                       '{aiExplanation?.text}'
                     </p>
                  )}
                  {aiExplanation?.citations && aiExplanation.citations.length > 0 ? (
                    <div className="text-xs text-blue-400 space-y-0.5">
                      {aiExplanation.citations.map(c => (
                        <p key={c.id}>
                          Source: {c.source} {c.year}{c.section ? `, ${c.section}` : ''}
                          {c.url && <> — <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">view source</a></>}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Not yet linked to a specific cited passage.</p>
                  )}
               </div>
            </div>
            {/* Consumer Alternative */}
            {consumerAlternative && (
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 flex gap-4">
               <RefreshCw className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
               <div>
                  <h4 className="font-bold text-orange-800 text-sm mb-1">Healthier Alternative</h4>
                  <p className="text-orange-700 text-sm leading-relaxed">
                    Try <span className="font-semibold">{consumerAlternative.name}</span> instead. It shares the same indulgence tier and flavour, but scores a better grade.
                  </p>
               </div>
            </div>
            )}
  
            {/* Manufacturer Action */}
            {mfrCounterfactual && (
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-5 flex gap-4">
               <Shield className="w-6 h-6 text-green-600 shrink-0 mt-1" />
               <div>
                  <h4 className="font-bold text-green-800 text-sm mb-1">Manufacturer Action</h4>
                  <p className="text-green-700 text-sm leading-relaxed">
                    {mfrCounterfactual.summary}
                  </p>
               </div>
            </div>
            )}
         </div>
      </div>
    </div>
  );
}
