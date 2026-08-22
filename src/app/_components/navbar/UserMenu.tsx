"use client";
import UserAvatar from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Bell, UserStar } from "lucide-react";
import { LogoutButton } from "@/components/shared/buttons";
import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";
interface UserMenuProps {
  session: any;
  avatarRef: React.RefObject<HTMLDivElement>;
  menuRef: React.RefObject<HTMLDivElement>;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function UserMenu({
  session,
  avatarRef,
  menuRef,
  menuOpen,
  setMenuOpen,
}: UserMenuProps) {
  const { t } = useLanguage();
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
  const menuItems = [
    {
      label: copy.dashboard.overview,
      href: "/dashboard",
      icon: UserStar,
    },
    {
      label: copy.dashboard.notifications,
      href: "/dashboard/notifications",
      icon: Bell,
    },
  ];

  return (
    <div className="relative">
      <div
        ref={avatarRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setMenuOpen((open) => !open);
          }
        }}
      >
        <UserAvatar
          image={currentUser.image}
          name={currentUser.name}
          email={currentUser.email}
          size={36}
        />
      </div>
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-3 py-4 w-60 bg-white border border-gray-200 rounded-[28px] shadow-lg overflow-hidden animate-fadeIn"
        >
          <div className="px-6 py-2 flex flex-col items-center  border-b border-gray-200">
            <UserAvatar
              image={currentUser.image}
              name={currentUser.name}
              email={currentUser.email}
              size={56}
            />
            <p className="font-medium text-gray-900 mt-3 text-md">
              {currentUser.name || copy.common.providerFallback} · {copy.dashboard.overview}
            </p>
          </div>
          <div className="pt-4 pb-2 flex flex-col px-6 gap-2">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Button
                  key={idx}
                  href={item.href!}
                  onClick={() => setMenuOpen(false)}
                  variant="ghost"
                  className="rounded-xl px-4 py-2 text-md gap-4"
                >
                  <Icon size={18} className="text-primary" />
                  {item.label}
                </Button>
              );
            })}
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
