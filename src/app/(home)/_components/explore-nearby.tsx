"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { ArrowRight, ClipboardList, Users } from "lucide-react";
import Link from "next/link";

const exploreItems = [
  {
    href: "/public/sitters",
    icon: Users,
    tone: "purple",
  },
  {
    href: "/public/needs",
    icon: ClipboardList,
    tone: "sand",
  },
] as const;

export function ExploreNearby() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop">
      <div className="mb-5 max-w-2xl md:mb-7">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          {t.home.exploreNearby.label}
        </span>
        <h2 className="mb-3 mt-2 text-headline-lg-mobile text-on-surface md:text-headline-lg">
          {t.home.exploreNearby.title}
        </h2>
        <p className="hidden text-sm leading-relaxed text-on-surface-variant md:block md:text-base">
          {t.home.exploreNearby.text}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {exploreItems.map((item, index) => {
          const Icon = item.icon;
          const copy = t.home.exploreNearby.items[index];

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-32 items-center gap-4 rounded-[18px] border border-outline-variant bg-surface-container-lowest p-5 transition-colors hover:border-primary/35 hover:bg-primary-fixed/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:min-h-36 md:gap-5 md:p-6"
            >
              <span
                className={
                  item.tone === "purple"
                    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-primary-fixed text-primary"
                    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-secondary-fixed text-secondary"
                }
              >
                <Icon size={22} aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="mb-1 block text-base font-bold text-on-surface md:text-lg">
                  {copy.title}
                </span>
                <span className="block text-sm leading-relaxed text-on-surface-variant">
                  {copy.text}
                </span>
              </span>

              <ArrowRight
                size={20}
                className="shrink-0 text-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
