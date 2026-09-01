function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-[#eee8f2] ${className}`} />;
}

export function NeedPublishingSkeleton({ stepCount = 8 }: { stepCount?: number }) {
  return (
    <div
      aria-busy="true"
      className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#fcfbf8] pt-16 text-[#211d27]"
    >
      {/* Mobile Top Bar Skeleton */}
      <div className="shrink-0 border-b border-[#e7e0e8] bg-[#fcfbf8] lg:hidden">
        <div className="site-shell py-3.5">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <div className="mt-1.5 flex min-h-9 items-center justify-between gap-2">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-28 rounded-xl" />
          </div>
          <div className="mt-0.5 flex min-h-9 items-center justify-between gap-2">
            <SkeletonBlock className="h-8 w-36 rounded-xl" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Grid Shell */}
      <div className="site-shell flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-9 lg:pb-5 lg:pt-7 xl:gap-11">
        {/* Left Sidebar */}
        <aside className="hidden min-h-0 min-w-0 lg:flex lg:h-full lg:flex-col">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden pr-1">
            {Array.from({ length: stepCount }, (_, index) => (
              <div
                key={index}
                className="flex h-11 items-center gap-2.5 rounded-xl border border-[#ebe4ee] bg-white px-3"
              >
                <SkeletonBlock className="h-6 w-6 shrink-0 rounded-full" />
                <SkeletonBlock className={`h-3 rounded-full ${index % 2 === 0 ? "w-20" : "w-24"}`} />
              </div>
            ))}
          </div>
          <div className="mt-3 shrink-0 space-y-2 border-t border-[#e7e0e8] pt-3">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </aside>

        {/* Right Content Panel */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative isolate mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col">
            {/* Step Header */}
            <div className="border-b border-[#e3dde5] pb-5 md:max-w-[calc(100%_-_215px)] lg:max-w-[calc(100%_-_225px)]">
              <SkeletonBlock className="h-8 w-64 rounded-xl" />
              <SkeletonBlock className="mt-3 h-4 w-96 max-w-full rounded-full" />
            </div>

            {/* Step Body Content - Matching StepCareType 3 Vertical Selection Cards */}
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden py-5 md:max-w-[calc(100%_-_215px)] lg:max-w-[calc(100%_-_225px)]">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-[16px] border border-[#ded9e0] bg-white p-4 md:p-5"
                >
                  <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-5 w-32 rounded-full" />
                    <SkeletonBlock className="h-3.5 w-64 max-w-full rounded-full" />
                  </div>
                  <SkeletonBlock className="h-6 w-6 shrink-0 rounded-full" />
                </div>
              ))}
            </div>

            {/* Bottom Footer Actions (Grouped on the left side) */}
            <div className="flex w-full shrink-0 items-center justify-start gap-4 border-t border-[#e3dde5] bg-[#fcfbf8] py-3 md:py-4 lg:pb-0 lg:pt-6">
              <SkeletonBlock className="h-12 w-28 rounded-[12px]" />
              <SkeletonBlock className="h-12 w-32 rounded-[12px]" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
