"use client";
import { useState } from "react";
import {
  UserStar,
  ClipboardList,
  PawPrint,
  MessageCircleHeart,
  Bell,
  Settings,
  TextAlignJustify,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "@/lib/cn";

const navLinks = [
  { href: "/dashboard", label: "マイページ", icon: UserStar },
  { href: "/dashboard/needs", label: "依頼", icon: ClipboardList },
  {
    href: "/dashboard/serviceprofile",
    label: "サービスプロフィール",
    icon: PawPrint,
  },
  {
    href: "/dashboard/messages",
    label: "メッセージ",
    icon: MessageCircleHeart,
  },
  { href: "/dashboard/notifications", label: "通知", icon: Bell },
  { href: "/dashboard/settings", label: "設定", icon: Settings },
];
export default function NavLinks() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const isExpanded = !collapsed || hovering;
  return (
    <aside
      className={cn(
        "shrink-0 transition-all duration-300 overflow-y-auto pt-4",
        isExpanded ? "w-56" : "w-18",
      )}
    >
      <div className="pl-4 my-2.5 text-sm font-medium flex items-center">
        <div
          className="p-2 bg-neutral-200 rounded-full text-neutral-700"
          onClick={() => {
            setCollapsed(!collapsed);
            if (collapsed) setHovering(false);
          }}
        >
          <TextAlignJustify size={20} />
        </div>
      </div>
      <nav
        className="space-y-1"
        onMouseOver={() => collapsed && setHovering(true)}
        onMouseLeave={() => collapsed && setHovering(false)}
      >
        {navLinks.map((link) => {
          const LinkIcon = link.icon;
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === link.href || pathname.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={cn(
                "group flex items-center gap-3 pl-4 my-2.5 rounded-r-full rounded-l-none text-sm transition-all",
                "whitespace-nowrap select-none font-medium",
                isActive ? "text-primary" : "text-neutral-700",
                isExpanded && isActive
                  ? "bg-secondary/10"
                  : "hover:bg-neutral-200",
              )}
            >
              <div
                className={cn(
                  "rounded-full transition-all p-2",
                  !isExpanded && isActive && "bg-primary/8",
                )}
              >
                <LinkIcon size={20} className="shrink-0" />
              </div>
              <span
                className={cn(
                  "transition-opacity duration-200",
                  isExpanded ? "opacity-100" : "opacity-0 absolute -z-10",
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
