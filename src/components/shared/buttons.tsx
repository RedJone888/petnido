"use client";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthMessages } from "@/modules/auth/i18n/use-auth-messages";
interface CreateButtonProps {
  initialSession: Session | null;
}

export function LoginButton() {
  const copy = useAuthMessages().modal;
  const { openAuthModal } = useAuthModal();
  return (
    <Button
      className="ml-4 rounded-full px-6 py-2"
      variant="primary"
      onClick={() => openAuthModal()}
    >
      {copy.login}
    </Button>
  );
}
export function LogoutButton() {
  const copy = useAuthMessages().modal;
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
      {copy.signOut}
    </Button>
  );
}
export function CreateNeedButton({ initialSession }: CreateButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const handleCreateNeed = () => router.push("/needs/create");
  return (
    <Button
      variant="primary"
      className="px-8 py-3 rounded-full w-[85%] md:w-auto text-lg"
      onClick={handleCreateNeed}
    >
      {t.home.postNeed}
    </Button>
  );
}
export function CreateServiceButton({ initialSession }: CreateButtonProps) {
  const { t } = useLanguage();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const handleCreateService = () => {
    if (!initialSession) {
      // 没登录，明确指定登录后去发布页
      openAuthModal("/dashboard/serviceprofile/services/new");
      return;
    }
    // 已登录，直接跳转
    router.push("/dashboard/serviceprofile/services/new");
  };
  return (
    <Button
      variant="outlineDark"
      className="px-8 py-3 rounded-full w-[85%] md:w-auto text-lg"
      onClick={handleCreateService}
    >
      {t.home.becomeSitter}
    </Button>
  );
}
