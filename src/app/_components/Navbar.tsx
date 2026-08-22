"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { LogoutButton } from "@/components/shared/buttons";
import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import cn from "@/lib/cn";
import NotificationBell from "./navbar/NotificationBell";
import UserMenu from "./navbar/UserMenu";
import { useRef } from "react";

const languageItems = [
  { lang: "en", label: "EN" },
  { lang: "zh", label: "中文" },
  { lang: "ja", label: "日本語" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const routeLanguage = pathname.match(/^\/(en|zh|ja)(?=\/|$)/)?.[1];
  const publicPrefix = routeLanguage ? `/${routeLanguage}` : "";
  const links = [
    { href: `${publicPrefix}/needs`, label: t.nav.needs },
    { href: `${publicPrefix}/providers`, label: t.nav.sitters },
    { href: `${publicPrefix}/how-it-works`, label: t.nav.howItWorks },
    { href: `${publicPrefix}/knowledge`, label: t.nav.knowledge },
  ];
  const switchLanguage = (nextLanguage: (typeof languageItems)[number]["lang"]) => {
    setLang(nextLanguage);
    if (/^\/(en|zh|ja)(?:\/|$)/.test(pathname)) {
      router.push(pathname.replace(/^\/(en|zh|ja)(?=\/|$)/, `/${nextLanguage}`));
    } else if (/^\/(knowledge|care-types|how-it-works|needs|services|providers)(?:\/|$)/.test(pathname)) {
      router.push(`/${nextLanguage}${pathname}`);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[999] border-b border-[#e7e0e8] bg-[#fffdf9]/95 backdrop-blur-lg">
      <nav className="flex h-16 w-full items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t.nav.homeLabel}>
          <Image src="/favicon.svg" alt="" width={38} height={38} className="h-9 w-9" />
          <span className="text-2xl font-bold tracking-[0.015em] text-[var(--primary)] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed] md:text-[1.7rem]">PetNido</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
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
                {item.label}
              </button>
            ))}
          </div>

          {session ? (
            <>
              <NotificationBell />
              <div className="hidden md:block">
                <UserMenu
                  session={session}
                  avatarRef={avatarRef}
                  menuRef={menuRef}
                  menuOpen={userMenuOpen}
                  setMenuOpen={setUserMenuOpen}
                />
              </div>
            </>
          ) : (
            <div className="hidden lg:block">
              <button type="button" onClick={() => openAuthModal()} className="h-11 rounded-xl px-4 text-sm font-bold text-[var(--primary)] transition hover:bg-[#f2edf4]">
                {t.nav.signIn}
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ddd4df] bg-white text-[var(--primary)] lg:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute inset-x-0 top-full border-b border-[#e7e0e8] bg-[#fffdf9] shadow-[0_22px_45px_-34px_rgba(44,33,50,.55)] lg:hidden">
            <div className="w-full px-4 py-5 sm:px-6">
              <div className="grid gap-1">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3.5 text-base font-bold text-[#3f3843] hover:bg-[#f2edf4]">
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e7e0e8] pt-4">
                {languageItems.map((item) => (
                  <button type="button" key={item.lang} aria-pressed={lang === item.lang} onClick={() => switchLanguage(item.lang)} className={cn("rounded-lg border px-2 py-2 text-xs font-bold", lang === item.lang ? "border-[var(--primary)] bg-[#eee7f3] text-[var(--primary)]" : "border-[#ddd4df] text-[#817a85]") }>
                    {item.label}
                  </button>
                ))}
              </div>
              {!session ? <button type="button" onClick={() => openAuthModal()} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#bfaec8] text-sm font-bold text-[var(--primary)]">{t.nav.signIn}</button> : <div className="mt-3"><LogoutButton /></div>}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
