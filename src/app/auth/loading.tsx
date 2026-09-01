export default function AuthLoading() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 animate-pulse space-y-6">
      <div className="text-center space-y-2">
        <div className="h-8 w-44 mx-auto bg-slate-200 rounded-lg" />
        <div className="h-4 w-60 mx-auto bg-slate-100 rounded" />
      </div>

      <div className="rounded-3xl bg-white border border-[#ece4ec] p-8 space-y-5">
        <div className="h-11 w-full bg-slate-100 rounded-xl" />
        <div className="h-11 w-full bg-slate-100 rounded-xl" />
        <div className="h-11 w-full bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
