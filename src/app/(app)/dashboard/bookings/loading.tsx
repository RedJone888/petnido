export default function BookingsLoading() {
  return (
    <div className="h-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 bg-[#f6f7fb]">
      <div className="space-y-2">
        <div className="h-8 w-36 bg-slate-200 rounded-lg" />
        <div className="h-4 w-56 bg-slate-200/60 rounded" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white border border-[#ece4ec] p-5 flex items-center justify-between">
            <div className="space-y-2.5">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-60 bg-slate-100 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
