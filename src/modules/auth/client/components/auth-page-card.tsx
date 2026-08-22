export function AuthPageCard({
  title,
  children,
  panelClassName = "max-w-2xl",
}: {
  title: string;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full px-5 py-6 sm:py-8">
      <section className={`mx-auto my-auto w-full ${panelClassName} space-y-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9`}>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
        {children}
      </section>
    </main>
  );
}
