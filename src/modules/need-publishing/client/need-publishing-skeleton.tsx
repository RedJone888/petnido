function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-[#eee8f2] ${className}`} />;
}

export function NeedPublishingSkeleton({ stepCount = 7 }: { stepCount?: number }) {
  return (
    <main
      aria-busy="true"
      className="min-h-[calc(100dvh-4rem)] bg-[#fcfbf8] text-[#211d27]"
    >
      <div className="border-b border-[#e7e0e8] lg:hidden">
        <div className="site-shell py-3.5">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <div className="mt-1.5 flex min-h-9 items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-10 rounded-xl sm:w-32" />
          </div>
          <div className="mt-0.5 flex min-h-9 items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-32 rounded-full" />
          </div>
        </div>
      </div>

      <div className="site-shell grid gap-7 pb-7 pt-5 md:pb-9 md:pt-7 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-9 xl:gap-11">
        <aside className="hidden min-w-0 lg:flex lg:h-[calc(100dvh-84px)] lg:flex-col lg:pb-5">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <div className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-hidden">
            {Array.from({ length: stepCount }, (_, index) => (
              <div
                key={index}
                className="flex h-12 items-center gap-2.5 rounded-2xl border border-[#ebe4ee] bg-white px-3"
              >
                <SkeletonBlock className="h-7 w-7 shrink-0 rounded-full" />
                <SkeletonBlock className={`h-3 rounded-full ${index % 3 === 0 ? "w-16" : "w-20"}`} />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#e7e0e8] pt-3">
            <SkeletonBlock className="h-9 w-full rounded-full" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="relative mx-auto w-full max-w-[1120px]">
            <SkeletonBlock className="absolute right-0 top-0 hidden h-[185px] w-[185px] rounded-full opacity-70 md:block lg:h-[195px] lg:w-[195px]" />

            <div className="border-b border-[#e3dde5] pb-5 md:max-w-[calc(100%_-_215px)] lg:max-w-[calc(100%_-_225px)]">
              <SkeletonBlock className="h-10 w-[min(100%,590px)] rounded-2xl" />
              <SkeletonBlock className="mt-4 h-4 w-[min(88%,680px)] rounded-full" />
              <SkeletonBlock className="mt-2 h-4 w-[min(62%,480px)] rounded-full" />
            </div>

            <div className="space-y-5 py-5 md:py-7">
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="rounded-2xl border border-[#e6ddea] bg-white p-5">
                    <SkeletonBlock className="h-10 w-10 rounded-xl" />
                    <SkeletonBlock className="mt-5 h-5 w-28 rounded-full" />
                    <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
                    <SkeletonBlock className="mt-2 h-3 w-4/5 rounded-full" />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[#e6ddea] bg-white p-5">
                <SkeletonBlock className="h-4 w-36 rounded-full" />
                <SkeletonBlock className="mt-4 h-12 w-full rounded-xl" />
              </div>
            </div>

            <div className="flex gap-4 border-t border-[#e3dde5] py-4 md:py-6">
              <SkeletonBlock className="h-12 w-28 rounded-xl" />
              <SkeletonBlock className="h-12 w-32 rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
