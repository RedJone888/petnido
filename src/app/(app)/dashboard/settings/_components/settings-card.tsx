import type { LucideIcon } from "lucide-react";
import cn from "@/lib/cn";

export function SettingsCard({
  id,
  icon: Icon,
  title,
  description,
  children,
  showHeader = true,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      {showHeader ? <div className="mb-6 flex items-start gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div> : null}
      {children}
    </section>
  );
}

export const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100";

export const textareaClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

export const softActionButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] px-4 py-2 text-sm font-bold text-primary transition hover:border-primary/30 hover:bg-primary/[0.13] disabled:cursor-not-allowed disabled:opacity-50";

export const settingsModalTitleClass = "text-xl font-bold text-slate-900";

export const settingsFieldLabelClass =
  "flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]";

const skeletonBlockClass = "rounded-lg bg-slate-200/80";

export function SettingsTabSkeleton({
  variant,
}: {
  variant: "account" | "pets" | "preferences";
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading settings"
      className="motion-safe:animate-pulse"
    >
      {variant === "account" ? (
        <div className="divide-y divide-slate-100">
          <SettingsRowSkeleton kind="avatar" />
          <SettingsRowSkeleton />
          <SettingsRowSkeleton wide />
          <SettingsRowSkeleton wide />
          <SettingsRowSkeleton />
        </div>
      ) : null}

      {variant === "pets" ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className={cn(skeletonBlockClass, "h-4 w-40")} />
            <div className={cn(skeletonBlockClass, "h-10 w-28 rounded-xl")} />
          </div>
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex w-full max-w-[290px] items-center gap-3 rounded-2xl border border-slate-100 p-4"
              >
                <div
                  className={cn(
                    skeletonBlockClass,
                    "h-14 w-14 shrink-0 rounded-xl",
                  )}
                />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className={cn(skeletonBlockClass, "h-4 w-2/3")} />
                  <div className={cn(skeletonBlockClass, "h-3 w-full")} />
                  <div className={cn(skeletonBlockClass, "h-3 w-3/4")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {variant === "preferences" ? (
        <div className="divide-y divide-slate-100">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between gap-5 py-5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className={cn(
                    skeletonBlockClass,
                    "h-5 w-5 shrink-0 rounded-full",
                  )}
                />
                <div className="w-full max-w-xl space-y-2.5">
                  <div className={cn(skeletonBlockClass, "h-4 w-36")} />
                  {item !== 1 ? (
                    <div className={cn(skeletonBlockClass, "h-3 w-4/5")} />
                  ) : null}
                </div>
              </div>
              <div
                className={cn(
                  skeletonBlockClass,
                  item === 1
                    ? "h-11 w-40 rounded-xl"
                    : "h-8 w-14 rounded-full",
                )}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsRowSkeleton({
  kind = "field",
  wide = false,
}: {
  kind?: "field" | "avatar";
  wide?: boolean;
}) {
  return (
    <div className="grid gap-3 py-4 first:pt-0 md:grid-cols-[112px_minmax(0,1fr)] md:items-center md:gap-5">
      <div className={cn(skeletonBlockClass, "h-4 w-20")} />
      {kind === "avatar" ? (
        <div className="flex items-center gap-4">
          <div
            className={cn(
              skeletonBlockClass,
              "h-16 w-16 shrink-0 rounded-full",
            )}
          />
          <div className={cn(skeletonBlockClass, "h-10 w-32 rounded-xl")} />
        </div>
      ) : (
        <div
          className={cn(
            skeletonBlockClass,
            "h-11 rounded-xl",
            wide ? "max-w-2xl" : "max-w-md",
          )}
        />
      )}
    </div>
  );
}
