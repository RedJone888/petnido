"use client";

import { trpc } from "@/utils/trpc";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function VerifyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token");
  const hasVerified = useRef(false);
  const verify = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: async ({ email }) => {
      toast.success("メール認証が完了しました。", {
        description: "ようこそ、PetNido へ！",
        duration: 3000,
      });
      await signIn("credentials", {
        email,
        password: "MAGIC_LINK",
        redirect: false,
      });
      const redirectUrl = localStorage.getItem("authRedirect") || "/";
      localStorage.removeItem("authRedirect");
      router.push(redirectUrl);
    },
    onError: () => {
      console.error("無効なリンクです");
      router.push("/");
    },
  });

  useEffect(() => {
    if (token && !hasVerified.current) {
      hasVerified.current = true;
      verify.mutate({ token });
    }
  }, [token]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>確認中…</p>
    </div>
  );
}
