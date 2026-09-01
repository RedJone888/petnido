export default function SettingsLoading() {
  return (
    <div className="h-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 bg-[#f6f7fb]">
      <div className="space-y-2">
        <div className="h-8 w-36 bg-slate-200 rounded-lg" />
        <div className="h-4 w-56 bg-slate-200/60 rounded" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl bg-white border border-[#ece4ec] p-6 space-y-4">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-72 bg-slate-100 rounded" />
            <div className="h-12 w-full bg-slate-50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
