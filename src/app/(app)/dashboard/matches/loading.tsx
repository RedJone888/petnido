export default function MatchesLoading() {
  return (
    <div className="h-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 bg-[#f6f7fb]">
      <div className="space-y-2">
        <div className="h-8 w-36 bg-slate-200 rounded-lg" />
        <div className="h-4 w-56 bg-slate-200/60 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-white border border-[#ece4ec] p-5 space-y-3">
            <div className="h-5 w-1/2 bg-slate-200 rounded" />
            <div className="h-14 bg-slate-50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
