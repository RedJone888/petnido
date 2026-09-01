export default function LocalizedKnowledgeLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-44 bg-slate-200 rounded-lg" />
        <div className="h-4 w-80 bg-slate-100 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 p-6 space-y-3">
            <div className="h-6 w-2/3 bg-slate-200 rounded" />
            <div className="h-16 w-full bg-slate-200/60 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
