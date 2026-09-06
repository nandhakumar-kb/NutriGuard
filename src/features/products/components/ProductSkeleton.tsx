export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col h-[380px] animate-pulse">
      {/* Skeleton Image Area */}
      <div className="h-44 w-full bg-slate-100/80 relative">
        <div className="absolute top-3 left-3 flex gap-1.5 flex-col">
          <div className="h-5 w-24 bg-slate-200/80 rounded-md"></div>
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-6 w-10 bg-slate-200/80 rounded border-b-[3px] border-slate-300"></div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200/80 shadow-sm border border-white"></div>
      </div>

      <div className="p-4 flex flex-col flex-1 bg-white">
        {/* Skeleton Title */}
        <div className="h-5 w-3/4 bg-slate-200/80 rounded mb-1"></div>
        <div className="h-3 w-1/2 bg-slate-100 rounded mb-3"></div>

        {/* Skeleton Additives */}
        <div className="flex gap-1.5 mt-1">
          <div className="h-5 w-12 bg-slate-100 rounded"></div>
          <div className="h-5 w-12 bg-slate-100 rounded"></div>
          <div className="h-5 w-16 bg-slate-100 rounded"></div>
        </div>

        {/* Skeleton Score Footer */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-200/80"></div>
            <div className="h-4 w-12 bg-slate-100 rounded"></div>
          </div>
          <div className="h-6 w-16 bg-slate-200/80 rounded font-bold"></div>
        </div>
      </div>
    </div>
  );
}
