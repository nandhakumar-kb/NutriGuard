import { Link } from 'react-router-dom';
import { getImageUrl } from '../../../services/supabaseClient';

interface ProductCardProps {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  nutrition: any;
  score?: number;
  grade?: string;
}

export function ProductCard(props: ProductCardProps) {
  const { id, name, brand, category, image, nutrition, score, grade } = props;

  // Use dynamic scores if available, otherwise default
  const displayScore = score ?? 50;
  const displayGrade = grade ?? 'C';

  // Category Color Map (Subdued, professional colors)
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Chips': return 'bg-gray-100 text-gray-700';
      case 'Drinks': return 'bg-gray-100 text-gray-700';
      case 'Chocolates': return 'bg-gray-100 text-gray-700';
      case 'Biscuits': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Grade Colors (Professional indicators)
  const getGradeColor = (g: string) => {
    if (g.startsWith('A') || g.startsWith('B')) return 'bg-emerald-600 text-white';
    if (g === 'C' || g === 'C+') return 'bg-amber-500 text-white';
    if (g === 'C-') return 'bg-amber-600 text-white';
    if (g === 'D+') return 'bg-orange-600 text-white';
    return 'bg-red-700 text-white';
  };

  return (
    <Link to={`/product/${id}`} className="group flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden h-full">

      {/* Product Image */}
      <div className="w-full h-36 sm:h-56 overflow-hidden bg-white border-b border-gray-100 flex items-center justify-center p-3 sm:p-4">
        <img src={getImageUrl(image)} alt={name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" />
      </div>

      <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-3 sm:pt-4">
        {/* Title & Brand */}
        <div className="mb-3 sm:mb-4 flex flex-col min-h-12.5 sm:min-h-15">
          <h3 className="font-semibold text-[13px] sm:text-[14px] text-gray-900 leading-snug mb-1 group-hover:text-emerald-700 transition-colors line-clamp-2 pr-2 sm:pr-4">
            {name}
          </h3>
          <p className="text-[11px] sm:text-[12px] text-gray-500 mb-2 line-clamp-1">{brand}</p>
          <div className="mt-auto">
            <span className={`inline-block px-1.5 sm:px-2 py-0.5 ${getCategoryColor(category)} text-[9px] sm:text-[10px] font-semibold rounded border border-gray-200`}>
              {category}
            </span>
          </div>
        </div>

        {/* NutriGuard Score */}
        <div className="flex items-end justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
          <div>
            <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">NutriGuard     Score</p>
            <div className="flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 leading-none tracking-tight">{displayScore}</span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 ml-1">/ 100</span>
            </div>
          </div>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[13px] sm:text-[15px] font-bold shadow-sm ${getGradeColor(displayGrade)}`}>
            {displayGrade}
          </div>
        </div>

        {/* Nutrition Row */}
        <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
          <div className="text-center">
            <p className="text-[10px] sm:text-[12px] font-semibold text-gray-900 leading-none mb-1 sm:mb-1.5">{nutrition.calories}</p>
            <p className="text-[8px] sm:text-[9px] font-medium text-gray-500 uppercase">kcal</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-[10px] sm:text-[12px] font-semibold text-gray-900 leading-none mb-1 sm:mb-1.5">{nutrition.sugar}g</p>
            <p className="text-[8px] sm:text-[9px] font-medium text-gray-500 uppercase">Sugar</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-[10px] sm:text-[12px] font-semibold text-gray-900 leading-none mb-1 sm:mb-1.5">{nutrition.sodium}mg</p>
            <p className="text-[8px] sm:text-[9px] font-medium text-gray-500 uppercase">Sodium</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-[10px] sm:text-[12px] font-semibold text-gray-900 leading-none mb-1 sm:mb-1.5">{nutrition.saturatedFat}g</p>
            <p className="text-[8px] sm:text-[9px] font-medium text-gray-500 uppercase">Sat. Fat</p>
          </div>
        </div>
      </div>



    </Link>
  );
}
