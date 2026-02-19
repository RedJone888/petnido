"use client";
import { signOut } from "next-auth/react";
import UserAvatar from "@/components/navbar/UserAvatar";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { UserStar, MessageCircleHeart, LogOut } from "lucide-react";
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
  const menuItems = [
    {
      type: "link",
      label: "マイページ",
      href: "/dashboard",
      icon: UserStar,
    },
    {
      type: "link",
      label: "メッセージ",
      href: "/messages",
      icon: MessageCircleHeart,
    },
    { type: "logout", icon: LogOut },
  ];

  return (
    <div className="relative">
      <div ref={avatarRef} onClick={() => setMenuOpen(!menuOpen)}>
        <UserAvatar
          image={session.user?.image}
          name={session.user?.name}
          email={session.user?.email}
          size={36}
        />
      </div>
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-3 py-4 w-60 bg-white border border-gray-200 rounded-[28px] shadow-lg overflow-hidden animate-fadeIn"
        >
          <div className="px-6 py-2 flex flex-col items-center  border-b border-gray-200">
            <UserAvatar
              image={session.user?.image}
              name={session.user?.name}
              email={session.user?.email}
              size={56}
            />
            <p className="font-medium text-gray-900 mt-3 text-md">
              {session.user?.name || "ユーザー"}、こんにちは！
            </p>
          </div>
          <div className="pt-4 pb-2 flex flex-col px-6 gap-2">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              return item.type === "logout" ? (
                <Button
                  key={idx}
                  variant="ghost"
                  className="rounded-xl px-4 py-2 text-md gap-4"
                  onClick={() => signOut()}
                >
                  <Icon size={18} className="text-primary" />
                  ログアウト
                </Button>
              ) : (
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
          </div>
        </div>
      )}
    </div>
  );
}
