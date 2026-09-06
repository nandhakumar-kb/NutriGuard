import { useState, useEffect } from 'react';
import { SearchBar, ProductCard } from './components';
import { Package, LayoutGrid, BarChart2, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import productsJsonFallback from '@/data/products.json';
import { calculateNutriGuardScore } from '@/utils';

export function Products() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Most Popular');
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (!isSupabaseConfigured) {
        setProductsData(productsJsonFallback);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.warn("Could not fetch from Supabase (maybe keys are missing). Falling back to local JSON.");
        setProductsData(productsJsonFallback);
      } else if (data) {
        setProductsData(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const processedProducts = productsData.map(p => {
    const scoreData = calculateNutriGuardScore(p);
    return { ...p, score: scoreData.overall, grade: scoreData.grade };
  });

  const filteredProducts = processedProducts.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'Highest Score') {
      return (b.score || 0) - (a.score || 0);
    } else if (sortOption === 'Lowest Score') {
      return (a.score || 0) - (b.score || 0);
    }
    // Alphabetical (default)
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  const uniqueCategories = Array.from(new Set(productsData.map(p => p.category))).filter(Boolean);

  const categoryIcons: Record<string, any> = {
    'Biscuits': '🍪',
    'Chips': '🥔',
    'Drinks': '🧋',
    'Chocolates': '🍫',
    'Ice Cream': '🍦',
  };

  const categories = [
    { name: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    ...uniqueCategories.map(cat => ({
      name: cat,
      icon: categoryIcons[cat] || '📦'
    }))
  ];

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-24">

      {/* Header section */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8 py-8">

          {/* Top Row: Title & Stats */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 lg:gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[32px] font-bold text-gray-900 leading-tight">All Products</h1>
                <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-100">{productsData.length} Products</span>
              </div>
              <p className="text-[15px] text-gray-600">Explore and analyze packaged foods with age-aware NutriGuard scores.</p>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Package className="w-6 h-6" strokeWidth={1.5} /></div>
                <div><p className="font-bold text-gray-900 text-[17px] leading-tight">{productsData.length}</p><p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Products</p></div>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl"><LayoutGrid className="w-6 h-6" strokeWidth={1.5} /></div>
                <div><p className="font-bold text-gray-900 text-[17px] leading-tight">{uniqueCategories.length}</p><p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Categories</p></div>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><BarChart2 className="w-6 h-6" strokeWidth={1.5} /></div>
                <div><p className="font-bold text-gray-900 text-[17px] leading-tight">100%</p><p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Deterministic Scores</p></div>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><Shield className="w-6 h-6" strokeWidth={1.5} /></div>
                <div><p className="font-bold text-gray-900 text-[17px] leading-tight">100%</p><p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">India Focused</p></div>
              </div>
            </div>
          </div>

          {/* Middle Row: Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div className="w-full md:max-w-md relative">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shrink-0">
                <span className="text-sm font-medium text-gray-500">Sort:</span>
                <select
                  className="bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option>Alphabetical</option>
                  <option>Highest Score</option>
                  <option>Lowest Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Row: Category Chips*/}
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all shrink-0 ${activeCategory === cat.name
                  ? 'bg-primary text-white shadow-md shadow-green-500/20 border border-primary'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                <span className={activeCategory === cat.name ? 'text-white' : 'text-gray-600'}>{cat.icon}</span>
                {cat.name}
              </button>
            ))}

          </div>
        </div>
      </div>

      {/* Grid section */}
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-12">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
