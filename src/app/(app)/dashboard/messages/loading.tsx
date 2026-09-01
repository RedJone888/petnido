export default function MessagesLoading() {
  return (
    <div className="h-full flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 animate-pulse bg-[#f6f7fb]">
      <div className="h-full flex rounded-3xl bg-white border border-[#ece4ec] overflow-hidden">
        {/* Left conversation list */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#ece4ec] p-4 space-y-4">
          <div className="h-9 w-full bg-slate-100 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                <div className="h-12 w-12 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right chat window skeleton */}
        <div className="hidden md:flex flex-1 flex-col justify-between p-6 bg-slate-50/50">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="space-y-4 py-8">
            <div className="h-14 w-64 bg-slate-200/80 rounded-2xl" />
            <div className="h-14 w-64 bg-slate-200/80 rounded-2xl ml-auto" />
          </div>
          <div className="h-12 w-full bg-white border border-[#ece4ec] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
