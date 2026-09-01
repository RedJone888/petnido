export function DashboardHomeContentSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6 animate-pulse">
      {/* Section 1: Attention Items */}
      <section>
        <div className="mb-3 h-4 w-28 rounded bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-xs"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100" />
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="ml-auto h-6 w-6 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Activity & Messages */}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Left: Activity Stats Cards */}
        <section>
          <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-4 rounded bg-slate-200" />
                  <div className="h-3.5 w-3.5 rounded bg-slate-200" />
                </div>
                <div className="mt-3 h-7 w-12 rounded bg-slate-200" />
                <div className="mt-1.5 h-3 w-20 rounded bg-slate-200/80" />
              </div>
            ))}
          </div>
        </section>

        {/* Right: Recent Conversations List */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-200" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0"
              >
                <div className="h-2 w-2 shrink-0 rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-slate-200" />
                  <div className="h-3 w-48 max-w-full rounded bg-slate-100" />
                </div>
                <div className="h-3 w-12 shrink-0 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Section 3: Suggested Next Steps */}
      <section>
        <div className="mb-3 h-4 w-32 rounded bg-slate-200" />
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex min-w-0 flex-col justify-between rounded-2xl border border-purple-100 bg-white p-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-purple-50" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200/70" />
                  <div className="h-3 w-4/5 rounded bg-slate-200/70" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-9 flex-1 rounded-lg bg-purple-50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full w-full flex-col overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <header className="flex h-auto shrink-0 items-center border-b border-slate-200/70 px-2 py-3 md:h-[var(--dashboard-title-height)] md:py-0">
        <div className="min-w-0 space-y-2">
          <div className="h-7 w-28 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 max-w-full rounded bg-slate-200/70" />
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-8 pr-1 pt-4">
        <DashboardHomeContentSkeleton />
      </div>
    </div>
  );
}

export function DashboardSidebarSkeleton() {
  return (
    <>
      {/* Mobile Top Bar (< md) */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200" />
          <div className="space-y-1">
            <div className="h-3.5 w-20 rounded bg-slate-200" />
            <div className="h-2.5 w-14 rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-slate-200" />
      </div>

      {/* Desktop Sidebar (>= md) */}
      <aside className="hidden h-full w-60 shrink-0 md:block lg:w-64">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-md">
          {/* Identity Area */}
          <div className="flex h-32 shrink-0 flex-col items-center justify-center border-b border-slate-100 px-2 pt-2 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-200" />
            <div className="mt-2.5 h-4 w-24 rounded bg-slate-200" />
          </div>

          {/* Navigation Links Skeleton */}
          <div className="min-h-0 flex-1 space-y-3 overflow-hidden py-3">
            <div className="h-8 w-full rounded-xl bg-primary/10" />
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-16 rounded bg-slate-200/70" />
              <div className="h-7 w-full rounded-xl bg-slate-100" />
              <div className="h-7 w-full rounded-xl bg-slate-100" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-20 rounded bg-slate-200/70" />
              <div className="h-7 w-full rounded-xl bg-slate-100" />
              <div className="h-7 w-full rounded-xl bg-slate-100" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="h-3 w-16 rounded bg-slate-200/70" />
              <div className="h-7 w-full rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div aria-hidden="true" className="h-[calc(100vh-4rem)] overflow-hidden bg-[#f6f7fb] animate-pulse">
      <div
        data-dashboard-shell
        className="site-shell relative flex h-full flex-col gap-0 overflow-hidden py-3 [--dashboard-title-height:6rem] md:flex-row md:gap-5 md:py-4 lg:gap-6"
      >
        <DashboardSidebarSkeleton />
        <div
          data-dashboard-panel
          className="min-w-0 flex-1 h-full flex flex-col overflow-hidden"
        >
          <DashboardHomeSkeleton />
        </div>
      </div>
    </div>
  );
}
