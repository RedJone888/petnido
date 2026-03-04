"use client";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const pathname = usePathname();

  const handleLogout = async () => {
    const isPublicPage = pathname.startsWith("/public");
    if (isPublicPage) {
      // 在公共页面，静默退出（不刷新）
      await signOut({ redirect: false });
    } else {
      // 在 Dashboard 等私有页面，退出并跳回首页
      await signOut({ redirectTo: "/" });
    }
  };
  return (
    <Button
      variant="ghost"
      className="rounded-xl px-4 py-2 text-md gap-4"
      onClick={handleLogout}
    >
      <LogOut size={18} className="text-primary" />
      ログアウト
    </Button>
  );
}
