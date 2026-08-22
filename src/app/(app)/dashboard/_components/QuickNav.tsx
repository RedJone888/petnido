"use client";

import Link from "next/link";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export default function QuickNav() {
  const { t } = useLanguage();
  const summary = trpc.dashboardSummary.getMine.useQuery();
  const data = summary.data;
  const navItems = [
    { label: t.core.dashboard.needs, icon: "🐾", count: data?.totals.needs, href: "/dashboard/needs" },
    { label: t.core.dashboard.services, icon: "💼", count: data?.totals.services, href: "/dashboard/serviceprofile" },
    { label: t.core.dashboard.favorites, icon: "💜", count: data?.counts.favorites, href: "/dashboard/favorites" },
    { label: t.core.dashboard.applications, icon: "📋", count: data ? data.counts.receivedApplications + data.counts.submittedApplications : undefined, href: "/dashboard/applications" },
    { label: t.core.dashboard.bookings, icon: "🗓️", count: data ? data.counts.receivedBookings + data.counts.requestedBookings : undefined, href: "/dashboard/bookings" },
    { label: t.core.dashboard.matches, icon: "✨", count: undefined, href: "/dashboard/matches" },
    { label: t.core.dashboard.notifications, icon: "🔔", count: data?.counts.unreadNotifications, href: "/dashboard/notifications" },
    { label: t.core.dashboard.settings, icon: "⚙️", count: undefined, href: "/dashboard/settings" },
  ];
  return (
    <section className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 px-6 py-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xs font-semibold text-primary">{t.core.dashboard.quickActions}</h2>{summary.error ? <button type="button" onClick={() => summary.refetch()} className="text-xs font-bold text-danger-text underline">{t.core.common.retry}</button> : null}</div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {navItems.map((item) => <Link key={item.label} href={item.href} className="relative flex min-h-11 items-center justify-center gap-3 rounded-full border border-primary/30 bg-white px-4 py-2 transition hover:border-primary"><span>{item.icon}</span><span className="text-sm font-bold text-primary/80">{item.label}</span>{typeof item.count === "number" && item.count > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-danger-bg0 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.count > 99 ? "99+" : item.count}</span> : null}</Link>)}
      </div>
    </section>
  );
}
