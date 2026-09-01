"use client";
import UserAvatar from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/shared/buttons";
import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
interface UserMenuProps {
  session: any;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function UserMenu({
  session,
  menuOpen,
  setMenuOpen,
}: UserMenuProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const copy = t.core;
  const profile = trpc.profile.getMine.useQuery(undefined, {
    enabled: Boolean(session.user?.id),
    staleTime: 60_000,
  });
  const currentUser = {
    ...session.user,
    name: profile.data?.name ?? session.user?.name,
    image: profile.data?.image ?? session.user?.image,
    email: profile.data?.email ?? session.user?.email,
  };
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuItems = [
    {
      label: t.nav.accountCenter,
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t.settings.nav.account,
      href: "/dashboard/profile",
      icon: UserRound,
    },
    {
      label: t.settings.title,
      href: "/dashboard/settings/security",
      icon: Settings,
    },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-controls="account-menu"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? t.nav.closeAccountMenu : t.nav.openAccountMenu}
        onClick={() => setMenuOpen((open) => !open)}
        className={`flex h-11 items-center gap-1 rounded-xl px-1.5 text-slate-600 transition hover:bg-[#f2edf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${menuOpen ? "bg-[#eee7f3] text-primary ring-1 ring-[#d7c7e0]" : ""}`}
      >
        <UserAvatar
          image={currentUser.image}
          name={currentUser.name}
          email={currentUser.email}
          size={36}
        />
        <ChevronDown size={16} aria-hidden="true" className={`hidden transition-transform md:block ${menuOpen ? "rotate-180" : ""}`} />
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label={t.nav.closeAccountMenu}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-[1000] bg-slate-950/20 backdrop-blur-[1px] md:hidden"
          />
          <div
            id="account-menu"
            ref={panelRef}
            className="fixed left-3 right-3 top-[4.5rem] z-[1001] max-h-[calc(100dvh-5.25rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_18px_48px_-20px_rgba(30,20,48,0.38)] animate-fadeIn md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-3 md:w-64 md:rounded-2xl md:border md:py-3 md:shadow-xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-4 pt-1 md:flex-col md:gap-0 md:px-6 md:pt-2">
              <UserAvatar
                image={currentUser.image}
                name={currentUser.name}
                email={currentUser.email}
                size={56}
              />
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 md:mt-3 md:max-w-full md:flex-none">
                {currentUser.name || copy.workflow.user}
              </p>
            </div>
            <nav aria-label={t.nav.accountMenu} className="flex flex-col gap-1 px-3 pb-1 pt-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isCurrentRoute = item.href === pathname;
                if (isCurrentRoute) {
                  return (
                    <Button
                      key={item.href}
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      variant="ghost"
                      className="min-h-11 justify-start rounded-xl px-4 text-sm font-semibold text-slate-600 gap-3"
                    >
                      <Icon size={18} className="text-primary" />
                      {item.label}
                    </Button>
                  );
                }
                return (
                  <Button
                    key={item.href}
                    href={item.href!}
                    onClick={() => setMenuOpen(false)}
                    variant="ghost"
                    className="min-h-11 justify-start rounded-xl px-4 text-sm font-semibold text-slate-600 gap-3"
                  >
                    <Icon size={18} className="text-primary" />
                    {item.label}
                  </Button>
                );
              })}
              <div className="my-1 border-t border-slate-100" />
              <LogoutButton />
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
