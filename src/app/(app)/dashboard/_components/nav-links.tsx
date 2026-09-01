"use client";

import {
  UserStar,
  ClipboardList,
  PawPrint,
  Settings,
  Heart,
  ClipboardCheck,
  CalendarCheck,
  FilePenLine,
  Inbox,
  UserRound,
  ChevronDown,
  CircleUserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import cn from "@/lib/cn";
import { useLanguage } from "@/components/providers/language-provider";
import UserAvatar from "@/components/shared/user-avatar";
import { isDashboardNavItemActive } from "./nav-matching";

interface NavItem {
  href: string;
  labelKey: "overview" | "needs" | "drafts" | "services" | "serviceDrafts" | "favorites" | "favoriteNeeds" | "favoriteServices" | "applications" | "bookings" | "notifications" | "settings" | "messages" | "personalProfile" | "petProfiles";
  icon: React.ElementType;
  exact?: boolean;
}

interface NavGroup {
  id: string;
  titleKey?: "groupRequests" | "groupServices" | "groupFavorites" | "groupActivity" | "groupProfile";
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
    id: "account",
    titleKey: "groupProfile",
    items: [
      { href: "/dashboard/profile", labelKey: "personalProfile", icon: UserRound },
      { href: "/dashboard/profile/pets", labelKey: "petProfiles", icon: PawPrint },
    ],
  },
  {
    id: "requests",
    titleKey: "groupRequests",
    items: [
      { href: "/dashboard/needs", labelKey: "needs", icon: ClipboardList },
      { href: "/dashboard/needs?tab=drafts", labelKey: "drafts", icon: FilePenLine },
    ],
  },
  {
    id: "services",
    titleKey: "groupServices",
    items: [
      { href: "/dashboard/serviceprofile", labelKey: "services", icon: PawPrint },
      { href: "/dashboard/serviceprofile?tab=drafts", labelKey: "serviceDrafts", icon: FilePenLine },
    ],
  },
  {
    id: "favorites",
    titleKey: "groupFavorites",
    items: [
      { href: "/dashboard/favorites?type=needs", labelKey: "favoriteNeeds", icon: Heart },
      { href: "/dashboard/favorites?type=services", labelKey: "favoriteServices", icon: Heart },
    ],
  },
  {
    id: "activity",
    titleKey: "groupActivity",
    items: [
      { href: "/dashboard/messages", labelKey: "messages", icon: Inbox },
      { href: "/dashboard/bookings", labelKey: "bookings", icon: CalendarCheck },
      { href: "/dashboard/applications", labelKey: "applications", icon: ClipboardCheck },
    ],
  },
  {
    id: "settings",
    items: [
      { href: "/dashboard/settings/security", labelKey: "settings", icon: Settings },
    ],
  },
];

export default function NavLinks({
  user,
}: {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { lang, t } = useLanguage();
  const copy = t.core.dashboard;
  const mobileCopy = {
    en: { menu: "Personal center menu", trigger: "Personal center", open: "Open personal center menu", close: "Close menu" },
    zh: { menu: "个人中心菜单", trigger: "个人中心", open: "打开个人中心菜单", close: "关闭菜单" },
    ja: { menu: "マイページメニュー", trigger: "マイページ", open: "マイページメニューを開く", close: "メニューを閉じる" },
  }[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(navGroups.filter((group) => group.titleKey).map((group) => [group.id, false])),
  );
  const menuRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const activeGroupId = navGroups.find((group) => group.items.some((item) => isDashboardNavItemActive(item, pathname, searchParams)))?.id;

  useEffect(() => {
    const activeGroup = navGroups.find((group) => group.items.some((item) => isDashboardNavItemActive(item, pathname, searchParams)));
    if (activeGroup?.titleKey) {
      setExpandedGroups((current) => ({ ...current, [activeGroup.id]: true }));
    }
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        menuRef.current?.querySelector<HTMLElement>('[data-dashboard-active="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, search, searchParams]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLElement>('[data-dashboard-active="true"]')?.scrollIntoView({ block: "nearest" });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const isLinkActive = (item: NavItem) => {
    return isDashboardNavItemActive(item, pathname, searchParams);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: groupId === activeGroupId ? true : !current[groupId],
    }));
  };

  return (
    <>
      {/* Mobile: a page-level directory control sits in the title area. */}
      <div className="absolute right-2 top-3 z-20 md:hidden">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileCopy.open}
          onClick={() => setMobileMenuOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 text-xs font-bold text-primary shadow-sm backdrop-blur transition hover:border-primary/30 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          <CircleUserRound size={18} strokeWidth={1.9} />
          <span>{mobileCopy.trigger}</span>
        </button>
      </div>

      {mobileMenuOpen ? <div className="fixed inset-0 z-[90] md:hidden"><button type="button" aria-label={mobileCopy.close} onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" /><section role="dialog" aria-modal="true" aria-label={mobileCopy.menu} className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl"><div className="flex shrink-0 justify-center pt-2"><span className="h-1 w-10 rounded-full bg-slate-300" /></div><div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 pb-4 pt-3"><UserAvatar size={44} image={user?.image} name={user?.name} email={user?.email} /><div className="min-w-0 flex-1"><h2 className="text-base font-bold text-slate-900">{mobileCopy.menu}</h2><p className="mt-0.5 truncate text-xs text-slate-500">{user?.name ?? t.core.dashboardHome.guest ?? "User"}</p></div><button type="button" aria-label={mobileCopy.close} onClick={() => setMobileMenuOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500"><X size={19} /></button></div><nav ref={mobileMenuRef} aria-label={copy.navigation} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">{navGroups.map((group) => <div key={group.id} className="space-y-1">{group.titleKey ? <button type="button" onClick={() => toggleGroup(group.id)} aria-expanded={expandedGroups[group.id]} className="flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"><span>{copy[group.titleKey]}</span><ChevronDown className={cn("h-4 w-4 transition-transform", expandedGroups[group.id] && "rotate-180")} /></button> : null}{!group.titleKey || expandedGroups[group.id] ? <div className={cn("space-y-1", group.titleKey && "ml-4")}>{group.items.map((item) => { const ItemIcon = item.icon; const active = isLinkActive(item); return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={active ? "page" : undefined} data-dashboard-active={active ? "true" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition", active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><ItemIcon size={18} className={active ? "text-primary" : "text-slate-400"} /><span>{copy[item.labelKey]}</span></Link>; })}</div> : null}</div>)}</nav></section></div> : null}

      {/* 2. Desktop Full-Height Sidebar (visible >= md) */}
      <aside className="hidden h-full w-60 shrink-0 md:block lg:w-64">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-md">
          {/* The identity area stays fixed while only the menu below scrolls. */}
          <div className="flex h-32 shrink-0 flex-col items-center justify-center border-b border-slate-100 px-2 pt-2 text-center">
            <div className="relative shrink-0 drop-shadow-xs">
              <UserAvatar
                size={56}
                image={user?.image}
                name={user?.name}
                email={user?.email}
              />
            </div>
            <p className="mt-2 max-w-full truncate text-sm font-bold tracking-tight text-slate-800">
              {user?.name ?? t.core.dashboardHome.guest ?? "User"}
            </p>
          </div>

          <nav
            ref={menuRef}
            aria-label={copy.navigation}
            className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-4 pr-1 pt-3"
          >
            {navGroups.map((group) => (
              <div key={group.id} className="space-y-0.5">
                {group.titleKey ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={expandedGroups[group.id]}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    <span>{copy[group.titleKey]}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        expandedGroups[group.id] && "rotate-180",
                      )}
                    />
                  </button>
                ) : null}

                {!group.titleKey || expandedGroups[group.id] ? (
                  <div className={cn("space-y-0.5", group.titleKey && "ml-5")}>
                  {group.items.map((item) => {
                    const LinkIcon = item.icon;
                    const active = isLinkActive(item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        data-dashboard-active={active ? "true" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl py-2 text-xs font-bold transition-all",
                          group.titleKey ? "px-2" : "px-3",
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
                ) : null}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
