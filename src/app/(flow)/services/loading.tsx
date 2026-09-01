export default function ServicesLoading() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#faf8f5] animate-pulse">
      {/* Top Filter Bar */}
      <div className="h-16 border-b border-[#e7e0e8] bg-white px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-full" />
          <div className="h-9 w-28 bg-slate-200 rounded-full" />
          <div className="h-9 w-24 bg-slate-200 rounded-full" />
        </div>
        <div className="h-9 w-48 bg-slate-200 rounded-lg hidden sm:block" />
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Card List */}
        <div className="w-full lg:w-[58%] h-full overflow-y-auto p-4 sm:p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white border border-[#ece4ec] p-5 flex gap-4">
              <div className="h-24 w-24 bg-slate-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
                <div className="h-8 w-full bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Map Placeholder */}
        <div className="hidden lg:block lg:w-[42%] h-full bg-slate-200/70 border-l border-[#e7e0e8]" />
      </div>
    </div>
  );
}
