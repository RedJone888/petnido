"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/providers/AuthModalProvider";
import { Button } from "@/components/ui/Button";

export default function CreateNeedButton() {
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const handleCreateNeed = () => {
    if (!session) {
      // 没登录，明确指定登录后去发布页
      openAuthModal("/dashboard/needs/new");
      return;
    }
    // 已登录，直接跳转
    router.push("/dashboard/needs/new");
  };
  return (
    <Button
      variant="primary"
      className="px-8 py-3 rounded-full"
      onClick={handleCreateNeed}
    >
      お世話を依頼する
    </Button>
  );
}
