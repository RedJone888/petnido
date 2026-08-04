export function OnboardingShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-81px)] bg-[#f6f3fa] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-purple-100 bg-white p-6 shadow-xl shadow-purple-100/50 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
