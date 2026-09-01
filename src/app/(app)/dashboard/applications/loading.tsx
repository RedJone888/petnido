export default function ApplicationsLoading() {
  return (
    <div className="h-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 bg-[#f6f7fb]">
      <div className="space-y-2">
        <div className="h-8 w-44 bg-slate-200 rounded-lg" />
        <div className="h-4 w-64 bg-slate-200/60 rounded" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-white border border-[#ece4ec] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-12 bg-slate-50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
