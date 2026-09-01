export default function OnboardingLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 animate-pulse space-y-8">
      <div className="text-center space-y-3">
        <div className="h-8 w-56 mx-auto bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 mx-auto bg-slate-100 rounded" />
      </div>
      <div className="rounded-3xl bg-white border border-[#ece4ec] p-8 space-y-6">
        <div className="h-12 w-full bg-slate-100 rounded-xl" />
        <div className="h-12 w-full bg-slate-100 rounded-xl" />
        <div className="h-12 w-full bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
