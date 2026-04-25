"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import NotificationBell from "./navbar/NotificationBell";
import { Mail, Menu, X } from "lucide-react";
import UserMenu from "./navbar/UserMenu";
import cn from "@/lib/cn";
import Image from "next/image";
import { CreateNeedButton, LoginButton } from "@/components/shared/buttons";
import { LogoutButton } from "@/components/shared/buttons";
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
    { href: "/public/needs", label: "お世話の依頼を見る" },
    { href: "/public/sitters", label: "シッターを探す" },
  ];
  return (
    <nav className="w-full bg-background border-b border-border sticky top-0 z-999">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20 px-4 md:px-6">
        {/* 1. Logo: 移动端缩小文字 */}
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image
            src="/favicon.svg"
            alt="logo"
            width={30}
            height={30}
            className="md:w-9 md:h-9"
          />
          <span className="text-xl md:text-3xl font-bold text-primary tracking-widest">
            PetNido
          </span>
        </Link>

        {/* Desktop Links */}
        {/* 2. 右侧操作区 */}
        <div className="flex items-center gap-2 md:gap-8">
          {/* 桌面端链接 (仅 md 以上显示) */}
          <div className="hidden md:flex items-center gap-8 text-gray-700">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href + "/") ||
                    pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  // prefetch={false}
                  className={cn(
                    "hover:text-secondary transition",
                    isActive ? "text-primary font-medium" : "",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {/* 已登录状态下的：通知和消息 (移动端也显示，提高优先级) */}
          {session && (
            <div className="flex items-center gap-1 md:gap-8">
              <NotificationBell notifications={mockNotifications} />

              {/* 桌面端头像入口 */}
              <div className="hidden md:block">
                <UserMenu
                  session={session}
                  avatarRef={avatarRef}
                  menuRef={menuRef}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                />
              </div>
            </div>
          )}

          {/* 未登录显示登录按钮 */}
          {
            !session && (
              <div className="hidden md:block">
                <LoginButton />
              </div>
            )
            // (
            //   <Button
            //     className="ml-4 rounded-full px-6 py-2"
            //     variant="primary"
            //     onClick={() => openAuthModal()}
            //   >
            //     ログイン
            //   </Button>
            // )
          }
          {/* 3. 手机端汉堡按钮 */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* 4. 手机端全屏/侧边抽屉 */}
        {mobileOpen && (
          <>
            {/* 背景遮罩 */}
            {/* <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileOpen(false)}
            /> */}
            {/* 侧边菜单 */}
            <div className="md:hidden absolute top-full right-0 w-[70%] bg-white z-50 shadow-2xl animate-fadeIn">
              <div className="flex flex-col h-full">
                {/* 页面导航 */}
                <div className="p-6 flex flex-col gap-6">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block text-lg font-medium text-gray-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {/* 两个核心 CTA 按钮 */}
                <div className="flex flex-col gap-3 pb-6 border-b border-gray-100">
                  {/* <CreateNeedButton />
                  <CreateNeedButton /> */}
                  {/* <CreateService className="w-full" variant="outline" /> */}
                </div>
                {/* 底部用户信息区 */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  {session ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        {/* 这里显示头像和欢迎词 */}
                        <Image
                          src={session.user?.image || "/default-avatar.png"}
                          width={40}
                          height={40}
                          className="rounded-full"
                          alt="user"
                        />
                        <span className="font-semibold text-gray-700">
                          {session.user?.name} 様
                        </span>
                      </div>
                      <Link href="/dashboard" className="block text-primary">
                        マイページ
                      </Link>
                      <LogoutButton />
                    </div>
                  ) : (
                    <LoginButton />
                  )}
                </div>
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
