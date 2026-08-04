"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { trpc } from "@/utils/trpc";

export function ProviderProfileForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [introduction, setIntroduction] = useState("");
  const [monthsExperience, setMonthsExperience] = useState(0);
  const mutation = trpc.serviceProfile.completeOnboarding.useMutation();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({ introduction, monthsExperience });
      router.replace(`/auth/continue?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo, "/dashboard/serviceprofile"))}`);
    } catch {
      toast.error("サービスプロフィールを作成できませんでした");
    }
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">経験・自己紹介</span>
        <textarea required maxLength={2000} rows={7} value={introduction} onChange={(event) => setIntroduction(event.target.value)} className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100" placeholder="これまでのお世話経験や、得意なことを記入してください。" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">経験月数</span>
        <input type="number" min={0} max={1200} value={monthsExperience} onChange={(event) => setMonthsExperience(Number(event.target.value))} className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100" />
      </label>
      <p className="text-sm leading-6 text-slate-500">サービス場所と通貨は、具体的なサービスを作成する該当ステップで設定し、公開成功後に既定値として保存されます。</p>
      <Button type="submit" disabled={mutation.isLoading || !introduction.trim()} className="w-full">{mutation.isLoading ? "作成中..." : "プロフィールを作成"}</Button>
    </form>
  );
}
