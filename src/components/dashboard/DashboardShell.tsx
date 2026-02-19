"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import cn from "@/lib/cn";
const navItems = [
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
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const isExpanded = !collapsed || hovering;
  return (
    <div className="bg-[#f6f7fb] h-full">
      <div className="max-w-7xl mx-auto h-full overflow-hidden py-2 flex">
        <aside
          className={cn(
            "shrink-0 transition-all duration-300 overflow-y-auto mt-4",
            isExpanded ? "w-56 mr-4" : "w-18",
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href ||
                    pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                      !isExpanded && isActive ? "bg-primary/8" : "",
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                  </div>
                  <span
                    className={cn(
                      "transition-opacity duration-200",
                      isExpanded ? "opacity-100" : "opacity-0 absolute -z-10",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-hidden bg-white rounded-xl shadow-[0px_0px_40px_rgba(15,23,42,0.08)]">
          {children}
        </main>
      </div>
    </div>
  );
}
