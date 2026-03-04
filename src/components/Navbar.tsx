"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import NotificationBell from "@/components/navbar/NotificationBell";
import { Mail, Menu, X } from "lucide-react";
import UserMenu from "@/components/navbar/UserMenu";
import { useAuthModal } from "@/providers/AuthModalProvider";
import cn from "@/lib/cn";
import Image from "next/image";
const mockNotifications = [
  {
    id: "1",
    title: "新しいメッセージ",
    body: "大阪市此花区でのペットシッター募集に返信がありました。",
    createdAt: "5分前",
    read: false,
  },
  {
    id: "2",
    title: "ご予約の確認",
    body: "12月24日のうさぎのお世話予約が承認されました。",
    createdAt: "昨日",
    read: true,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  //Dropdown: 点击外部 & Esc 关闭
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        avatarRef.current &&
        !avatarRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);
  const links = [
    { href: "/", label: "ホーム" },
    { href: "/public/browse/needs", label: "お世話の依頼を見る" },
    { href: "/public/browse/sitters", label: "シッターを探す" },
  ];
  const { openAuthModal } = useAuthModal();
  return (
    <nav className="w-full bg-background border-b border-border sticky top-0 z-888">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/favicon.svg" alt="logo" width={36} height={36} />
          <span className="text-2xl font-[Open_Sans] font-semibold text-primary tracking-widest">
            PetNido
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-gray-700">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href + "/") ||
                  pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={cn(
                  "hover:text-secondary transition",
                  isActive ? "text-primary font-medium" : "",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {/* 未登录 */}
          {!session && (
            <Button
              className="ml-4 rounded-full px-6 py-2"
              variant="primary"
              onClick={() => openAuthModal()}
            >
              ログイン
            </Button>
          )}
          {/* 已登录 */}
          {session && (
            <div className="flex items-center gap-4">
              <NotificationBell notifications={mockNotifications} />
              <Link
                href="/message"
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Link>
              <UserMenu
                session={session}
                avatarRef={avatarRef}
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
              />
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-2xl text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        {mobileOpen && (
          <>
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileOpen(false)}
            />
            {/* 侧边菜单 */}
            <div className="md:hidden absolute top-full right-0 w-56 bg-white z-50 shadow-lg p-6">
              <div className="flex flex-col space-y-6">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-gray-700 hover:text-primary text-center"
                  >
                    {link.label}
                  </Link>
                ))}
                {!session && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      // handleOpenAuth();
                      openAuthModal();
                      setMobileOpen(false);
                    }}
                  >
                    ログイン
                  </Button>
                )}
                {session && (
                  <>
                    <Link
                      href="/message"
                      onClick={() => setMobileOpen(false)}
                      className="text-center"
                    >
                      メッセージ
                    </Link>
                    <button onClick={() => setMobileOpen(false)}>通知</button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}
