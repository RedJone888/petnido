export default function LocalizedCareTypesLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-slate-100 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-2xl bg-slate-100 p-6 space-y-4">
            <div className="h-12 w-12 bg-slate-200 rounded-xl" />
            <div className="h-6 w-1/2 bg-slate-200 rounded" />
            <div className="h-24 w-full bg-slate-200/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
