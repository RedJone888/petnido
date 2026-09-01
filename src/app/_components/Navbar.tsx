"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Globe2, HandHelping, Menu, MessageCircleQuestion, NotebookText, X } from "lucide-react";
import { useState } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { localizedPublicPathname } from "@/domain/content/localized-public-route";
import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import cn from "@/lib/cn";
import InboxMenu from "./navbar/InboxMenu";
import UserMenu from "./navbar/UserMenu";

const languageItems = [
  { lang: "en", compactLabel: "EN", label: "English" },
  { lang: "zh", compactLabel: "中文", label: "简体中文" },
  { lang: "ja", compactLabel: "日本語", label: "日本語" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { openAuthModal } = useAuthModal();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const mobilePanelOpen = mobileOpen || inboxOpen || userMenuOpen;
  const publicPrefix = `/${lang}`;
  const links = [
    { href: `${publicPrefix}/needs`, label: t.nav.needs, icon: MessageCircleQuestion },
    { href: `${publicPrefix}/services`, label: t.nav.services, icon: HandHelping },
    { href: `${publicPrefix}/knowledge`, label: t.nav.knowledge, icon: NotebookText },
  ];
  const handleUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
    const open = typeof next === "function" ? next(userMenuOpen) : next;
    setUserMenuOpen(open);
    if (open) {
      setInboxOpen(false);
      setMobileOpen(false);
    }
  };
  const switchLanguage = (nextLanguage: (typeof languageItems)[number]["lang"]) => {
    if (nextLanguage === lang) return;
    setLang(nextLanguage);
    const nextPathname = localizedPublicPathname(pathname, nextLanguage);
    if (!nextPathname || nextPathname === pathname) return;
    window.history.replaceState(
      null,
      "",
      `${nextPathname}${window.location.search}${window.location.hash}`,
    );
  };

  const isLinkActive = (currentPath: string, linkHref: string) => {
    if (currentPath === linkHref) return true;
    if (
      currentPath.startsWith(`${linkHref}/create`) ||
      currentPath.startsWith(`${linkHref}/edit`) ||
      currentPath.startsWith(`${linkHref}/new`)
    ) {
      return false;
    }
    return currentPath.startsWith(`${linkHref}/`);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[999] border-b border-[#e7e0e8] bg-[#fffdf9]/95 backdrop-blur-lg transition-shadow",
        mobilePanelOpen && "shadow-[0_4px_16px_-12px_rgba(39,25,50,0.45)] lg:shadow-none",
      )}
    >
      <nav className="flex h-16 w-full items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t.nav.homeLabel}>
          <Image src="/favicon.svg" alt="" width={38} height={38} className="h-9 w-9" />
          <span className="hidden text-2xl font-bold tracking-tight text-[var(--primary)] min-[350px]:inline md:text-[1.7rem]">PetNido</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-2 text-sm font-semibold text-[#625a67] transition hover:text-[var(--primary)]",
                  active && "text-[var(--primary)] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--primary)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center rounded-full border border-[#ddd4df] bg-white p-1 md:flex">
            {languageItems.map((item) => (
              <button
                key={item.lang}
                type="button"
                aria-pressed={lang === item.lang}
                onClick={() => switchLanguage(item.lang)}
                className={cn(
                  "h-7 rounded-full px-2.5 text-[11px] font-bold transition",
                  lang === item.lang ? "bg-[#eee7f3] text-[var(--primary)]" : "text-[#817a85] hover:text-[var(--primary)]",
                )}
              >
                  {item.compactLabel}
              </button>
            ))}
          </div>

          {session ? (
            <>
              <InboxMenu
                open={inboxOpen}
                onOpenChange={(open) => {
                  setInboxOpen(open);
                  if (open) {
                    setUserMenuOpen(false);
                    setMobileOpen(false);
                  }
                }}
              />
              <UserMenu
                session={session}
                menuOpen={userMenuOpen}
                setMenuOpen={handleUserMenuOpen}
              />
            </>
          ) : sessionStatus === "unauthenticated" ? (
            <div>
              <button type="button" onClick={() => openAuthModal()} className="h-11 rounded-xl px-3 text-sm font-bold text-[var(--primary)] transition hover:bg-[#f2edf4] sm:px-4">
                {t.nav.signIn}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen((open) => !open);
              setInboxOpen(false);
              setUserMenuOpen(false);
            }}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border text-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden",
              mobileOpen
                ? "border-[#d7c7e0] bg-[#eee7f3] text-[var(--primary)]"
                : "border-transparent hover:bg-[#f2edf4] hover:text-[var(--primary)]",
            )}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label={t.nav.closeMenu}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-x-0 bottom-0 top-16 z-[1000] bg-slate-950/20 backdrop-blur-[1px] lg:hidden"
            />
            <div className="fixed left-3 right-3 top-[4.5rem] z-[1001] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_-20px_rgba(30,20,48,0.38)] lg:hidden">
              <div className="w-full p-3 sm:p-4">
                <div className="grid gap-1">
                  {links.map((link) => {
                    const Icon = link.icon;
                    const active = isLinkActive(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-[#f2edf4] hover:text-[var(--primary)]",
                          active && "bg-[#f3edf7] text-[var(--primary)]",
                        )}
                      >
                        <Icon size={18} aria-hidden="true" className="shrink-0 text-[var(--primary)]" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-2 border-t border-slate-100 px-4 pt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Globe2 size={16} aria-hidden="true" className="text-[var(--primary)]" />
                    <span>{t.settings.preferences.languageTitle}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-100/80 p-1" role="group" aria-label={t.settings.preferences.languageTitle}>
                    {languageItems.map((item) => (
                      <button
                        type="button"
                        key={item.lang}
                        aria-pressed={lang === item.lang}
                        onClick={() => switchLanguage(item.lang)}
                        className={cn(
                          "min-h-9 rounded-lg px-2 text-xs font-semibold transition",
                          lang === item.lang
                            ? "bg-white text-[var(--primary)] shadow-sm ring-1 ring-slate-200"
                            : "text-slate-500 hover:bg-white/70 hover:text-slate-700",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
