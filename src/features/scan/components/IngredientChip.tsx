import { Info } from 'lucide-react';

interface IngredientChipProps {
  name: string;
  role: string;
  description: string;
  status: 'good' | 'neutral' | 'concern' | 'bad';
}

export function IngredientChip({ name, role, description, status }: IngredientChipProps) {
  const statusConfig = {
    good: { border: 'bg-green-500', badge: 'bg-green-100 text-green-700', text: 'GOOD' },
    neutral: { border: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', text: 'NEUTRAL' },
    concern: { border: 'bg-red-500', badge: 'bg-red-100 text-red-700', text: 'CONCERN' },
    bad: { border: 'bg-red-600', badge: 'bg-red-100 text-red-800', text: 'BAD' }
  };

  const conf = statusConfig[status];

  return (
    <div className="flex items-stretch gap-4 py-3 border-b border-gray-100 last:border-0 relative group">
      <div className={`w-1 rounded-full shrink-0 ${conf.border}`}></div>
      <div className="flex-1 flex items-center justify-between cursor-default">
         <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{name}</span>
            {role !== 'Unknown' && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${conf.badge.replace('text-', 'text-opacity-70 text-')}`}>
                {role}
              </span>
            )}
            <Info className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
         </div>
         <div className={`px-2 py-1 rounded text-[10px] font-extrabold tracking-wide uppercase shrink-0 ${conf.badge}`}>
            {conf.text}
         </div>
      </div>

      {/* Interactive Hover Tooltip */}
      <div className="absolute left-0 bottom-full mb-1 w-[90%] sm:w-[110%] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
        <div className="bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 shadow-slate-900/20">
          <p className="text-slate-300 leading-relaxed font-medium">{description}</p>
        </div>
        {/* Triangle pointer */}
        <div className="absolute -bottom-1 left-6 w-3 h-3 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
      </div>
    </div>
  );
}
