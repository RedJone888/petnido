export default function LocalizedLoading() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 animate-pulse">
      <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
      <div className="h-4 w-32 bg-slate-200 rounded-full" />
    </div>
  );
}
