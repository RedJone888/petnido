export default function ProviderDetailLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-8">
      {/* Provider Hero */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-white border border-[#ece4ec]">
        <div className="h-28 w-28 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="h-7 w-48 bg-slate-200 rounded mx-auto sm:mx-0" />
          <div className="h-4 w-64 bg-slate-100 rounded mx-auto sm:mx-0" />
          <div className="flex justify-center sm:justify-start gap-2">
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
            <div className="h-6 w-24 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white border border-[#ece4ec] p-5 space-y-3">
              <div className="h-5 w-1/2 bg-slate-200 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
