export default function HomeLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-12">
      {/* Hero section skeleton */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-4 pb-12">
        <div className="w-full lg:w-1/2 space-y-5">
          <div className="h-6 w-32 bg-slate-200 rounded-full" />
          <div className="h-12 w-4/5 bg-slate-200 rounded-xl" />
          <div className="h-20 w-full bg-slate-100 rounded-xl" />
          <div className="flex gap-4 pt-2">
            <div className="h-12 w-40 bg-slate-200 rounded-xl" />
            <div className="h-12 w-36 bg-slate-100 rounded-xl" />
          </div>
        </div>
        <div className="w-full lg:w-1/2 h-72 sm:h-96 bg-slate-200/80 rounded-2xl" />
      </div>

      {/* Feature section skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-100 p-6 space-y-4">
            <div className="h-10 w-10 bg-slate-200 rounded-xl" />
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-16 w-full bg-slate-200/60 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
