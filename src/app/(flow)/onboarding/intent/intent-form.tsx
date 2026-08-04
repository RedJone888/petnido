"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, HeartHandshake } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { trpc } from "@/utils/trpc";

export function IntentForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [confirmProvider, setConfirmProvider] = useState(false);
  const mutation = trpc.profile.chooseInitialIntent.useMutation();

  async function choose(intent: "POST_NEED" | "OFFER_SERVICE") {
    try {
      const result = await mutation.mutateAsync({ intent });
      const safe = encodeURIComponent(sanitizeReturnTo(returnTo));
      router.replace(
        result.nextStep === "PROVIDER_PROFILE"
          ? `/onboarding/provider-profile?returnTo=${safe}`
          : `/auth/continue?returnTo=${safe}`,
      );
    } catch {
      toast.error("選択を保存できませんでした");
    }
  }

  if (confirmProvider) {
    return (
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
        <h2 className="text-xl font-black text-slate-900">受付モードを開始しますか？</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          サービスプロフィールを作成します。あとからいつでも受付を停止できます。
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setConfirmProvider(false)}>
            戻る
          </Button>
          <Button type="button" disabled={mutation.isLoading} onClick={() => choose("OFFER_SERVICE")}>
            確認して続ける
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        disabled={mutation.isLoading}
        onClick={() => choose("POST_NEED")}
        className="rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-primary hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <HeartHandshake className="h-8 w-8 text-primary" />
        <strong className="mt-5 block text-lg text-slate-900">お世話を依頼したい</strong>
        <span className="mt-2 block text-sm leading-6 text-slate-600">ペットのお世話の依頼を作成します。</span>
      </button>
      <button
        type="button"
        disabled={mutation.isLoading}
        onClick={() => setConfirmProvider(true)}
        className="rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-primary hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <BriefcaseBusiness className="h-8 w-8 text-primary" />
        <strong className="mt-5 block text-lg text-slate-900">お世話を提供したい</strong>
        <span className="mt-2 block text-sm leading-6 text-slate-600">受付プロフィールを作成してサービスを提供します。</span>
      </button>
    </div>
  );
}
