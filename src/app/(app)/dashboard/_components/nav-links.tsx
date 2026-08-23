"use client";

import {
  UserStar,
  ClipboardList,
  PawPrint,
  Bell,
  Settings,
  Heart,
  ClipboardCheck,
  CalendarCheck,
  Sparkles,
  FilePenLine,
} from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import cn from "@/lib/cn";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import UserAvatar from "@/components/shared/user-avatar";
import { isDashboardNavItemActive } from "./nav-matching";

interface NavItem {
  href: string;
  labelKey: "overview" | "needs" | "drafts" | "services" | "favorites" | "applications" | "bookings" | "matches" | "notifications" | "settings";
  icon: React.ElementType;
  exact?: boolean;
}

interface NavGroup {
  id: string;
  titleKey?: "groupRequests" | "groupServices" | "groupAccount";
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "overview",
    items: [
      { href: "/dashboard", labelKey: "overview", icon: UserStar, exact: true },
    ],
  },
  {
    id: "requests",
    titleKey: "groupRequests",
    items: [
      { href: "/dashboard/needs", labelKey: "needs", icon: ClipboardList },
      { href: "/dashboard/needs?tab=drafts", labelKey: "drafts", icon: FilePenLine },
      { href: "/dashboard/favorites", labelKey: "favorites", icon: Heart },
      { href: "/dashboard/matches", labelKey: "matches", icon: Sparkles },
    ],
  },
  {
    id: "services",
    titleKey: "groupServices",
    items: [
      { href: "/dashboard/serviceprofile", labelKey: "services", icon: PawPrint },
      { href: "/dashboard/applications", labelKey: "applications", icon: ClipboardCheck },
      { href: "/dashboard/bookings", labelKey: "bookings", icon: CalendarCheck },
    ],
  },
  {
    id: "account",
    titleKey: "groupAccount",
    items: [
      { href: "/dashboard/notifications", labelKey: "notifications", icon: Bell },
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export default function NavLinks({
  user,
}: {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = t.core.dashboard;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  const isLinkActive = (item: NavItem) => {
    return isDashboardNavItemActive(item, pathname, searchParams);
  };

  return (
    <>
      {/* 1. Mobile Top Horizontal Scroll Bar (visible < md) */}
      <div className="w-full overflow-x-auto pb-2 md:hidden no-scrollbar">
        <nav
          aria-label={copy.navigation}
          className="flex items-center gap-1.5 px-1 min-w-max"
        >
          {allNavItems.map((item) => {
            const LinkIcon = item.icon;
            const active = isLinkActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0",
                  active
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50",
                )}
              >
                <LinkIcon size={14} className="shrink-0" />
                <span>
                  {item.href === "/dashboard/needs"
                    ? `${copy.groupRequests} · ${copy.needs}`
                    : item.href === "/dashboard/needs?tab=drafts"
                    ? `${copy.groupRequests} · ${needMessages.dashboardNeeds.drafts}`
                    : item.href === "/dashboard/serviceprofile"
                    ? `${copy.groupServices} · ${copy.services}`
                    : copy[item.labelKey]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 2. Desktop Full-Height Sidebar (visible >= md) */}
      <aside
        className="hidden md:block w-60 lg:w-64 shrink-0 h-full overflow-hidden"
      >
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-md flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* User Profile Header at Top of Sidebar: Centered Large Avatar + Nickname */}
            <div className="flex flex-col items-center text-center px-2 pt-2 pb-4 border-b border-slate-100">
              <div className="relative shrink-0 drop-shadow-xs">
                <UserAvatar
                  size={68}
                  image={user?.image}
                  name={user?.name}
                  email={user?.email}
                />
              </div>
              <p className="mt-3 text-base font-bold text-slate-800 truncate max-w-full tracking-tight">
                {user?.name ?? t.core.dashboardHome.guest ?? "User"}
              </p>
            </div>

            <nav aria-label={copy.navigation} className="space-y-4">
            {navGroups.map((group, groupIdx) => (
              <div key={group.id} className="space-y-1">
                {group.titleKey ? (
                  <div className="px-3 pb-1 pt-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      {copy[group.titleKey]}
                    </p>
                  </div>
                ) : groupIdx > 0 ? (
                  <div className="my-1.5 border-t border-slate-100" />
                ) : null}

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const LinkIcon = item.icon;
                    const active = isLinkActive(item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                          active
                            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                        )}
                      >
                        <LinkIcon
                          size={17}
                          className={cn(
                            "shrink-0 transition-colors",
                            active
                              ? "text-[var(--primary)]"
                              : "text-slate-400 group-hover:text-slate-600",
                          )}
                        />
                        <span className="truncate">{copy[item.labelKey]}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
