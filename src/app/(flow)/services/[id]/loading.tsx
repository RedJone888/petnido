export default function ServiceDetailLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      {/* Header and title */}
      <div className="space-y-4">
        <div className="h-5 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-2/3 bg-slate-200 rounded-lg" />
        <div className="flex gap-4">
          <div className="h-5 w-32 bg-slate-100 rounded" />
          <div className="h-5 w-28 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-72 sm:h-96 rounded-2xl bg-slate-200" />
          <div className="h-36 rounded-2xl bg-slate-100 p-6 space-y-3">
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
            <div className="h-16 w-full bg-slate-200/60 rounded" />
          </div>
        </div>

        {/* Right Action Card */}
        <div className="h-80 rounded-2xl bg-white border border-[#ece4ec] p-6 space-y-5">
          <div className="h-8 w-1/2 bg-slate-200 rounded" />
          <div className="h-12 w-full bg-slate-100 rounded-xl" />
          <div className="h-12 w-full bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
