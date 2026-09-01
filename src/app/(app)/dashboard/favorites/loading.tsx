export default function FavoritesLoading() {
  return (
    <div className="h-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 bg-[#f6f7fb]">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-slate-200 rounded-lg" />
          <div className="h-4 w-56 bg-slate-200/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          <div className="h-9 w-24 bg-slate-200 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-56 rounded-2xl bg-white border border-[#ece4ec] p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-6 w-6 rounded-full bg-slate-100" />
            </div>
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 w-20 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
