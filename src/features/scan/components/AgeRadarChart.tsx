import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { referenceIntakes } from '@/utils/scoring/nutritionScorer';
import { getNutrient } from '@/utils/normalizeNutrient';

interface AgeRadarChartProps {
  product: any;
  ageGroup: 'child' | 'teen' | 'adult' | 'elderly';
}

export function AgeRadarChart({ product, ageGroup }: AgeRadarChartProps) {
  const limits = referenceIntakes[ageGroup];

  // We want to show % of DV for negative nutrients.
  // Lower is better, but radar charts usually look better when "bigger is more".
  // So a big spike means high consumption of that nutrient's daily limit.
  
  const getPercentage = (key: string, limitKey: string) => {
    const val = getNutrient(product.nutrition, key as any);
    if (val === undefined || !limits[limitKey]) return 0;
    return Math.min(100, Math.round((val / limits[limitKey]) * 100));
  };

  const data = [
    { subject: 'Calories', A: getPercentage('calories', 'calories'), fullMark: 100 },
    { subject: 'Sugar', A: getPercentage('totalSugar', 'totalSugar'), fullMark: 100 },
    { subject: 'Sodium', A: getPercentage('sodium', 'sodium'), fullMark: 100 },
    { subject: 'Sat. Fat', A: getPercentage('saturatedFat', 'saturatedFat'), fullMark: 100 },
    { subject: 'Trans Fat', A: getPercentage('transFat', 'transFat'), fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 bg-white rounded-xl border border-gray-100 shadow-sm p-4 mt-4 flex flex-col">
      <h3 className="text-sm font-bold text-gray-800 mb-2 text-center">Macronutrient Impact vs {ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)} Daily Limits</h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="% of Daily Limit (Per 100g)"
              dataKey="A"
              stroke="#6366f1"
              fill="#818cf8"
              fillOpacity={0.5}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              formatter={(value: any) => [`${value}% DV`, 'Impact']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-1">Shows % of daily limit consumed per 100g. Outer edge = 100% of limit.</p>
    </div>
  );
}
