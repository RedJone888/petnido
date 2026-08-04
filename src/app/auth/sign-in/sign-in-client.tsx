"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/providers/AuthModalProvider";
import { sanitizeReturnTo } from "@/domain/auth/return-to";

export function SignInClient({ returnTo }: { returnTo: string }) {
  const { openAuthModal } = useAuthModal();
  const safeReturnTo = sanitizeReturnTo(returnTo);
  useEffect(() => {
    openAuthModal(safeReturnTo);
  }, [openAuthModal, safeReturnTo]);

  return (
    <main className="flex min-h-[calc(100vh-81px)] items-center justify-center bg-[#f6f3fa] px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-black text-slate-900">ログインが必要です</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">ログイン後、続きのページに戻ります。</p>
        <Button className="mt-6 w-full" onClick={() => openAuthModal(safeReturnTo)}>ログインまたは新規登録</Button>
      </div>
    </main>
  );
}
