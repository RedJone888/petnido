export default function ProfileLoading() {
  return (
    <div className="h-full flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-pulse space-y-6 bg-[#f6f7fb]">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-slate-200 rounded-lg" />
        <div className="h-4 w-60 bg-slate-200/60 rounded" />
      </div>

      <div className="rounded-3xl bg-white border border-[#ece4ec] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-48 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
