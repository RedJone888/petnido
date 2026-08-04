"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { trpc } from "@/utils/trpc";

export function OnboardingProfileForm({
  initialNickname,
  initialAvatar,
  returnTo,
}: {
  initialNickname: string;
  initialAvatar: string | null;
  returnTo: string;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? "");
  const mutation = trpc.profile.completeOnboardingProfile.useMutation();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        nickname,
        avatarUrl: avatarUrl.trim() || null,
        preferredLocale: "ja",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      router.replace(
        `/onboarding/intent?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`,
      );
    } catch (error) {
      toast.error("プロフィールを保存できませんでした");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">ニックネーム</span>
        <input
          autoFocus
          required
          maxLength={50}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          アバター画像 URL（任意）
        </span>
        <input
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://..."
          className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100"
        />
        <span className="mt-2 block text-xs text-slate-500">
          今は省略して、あとからプロフィールで追加できます。
        </span>
      </label>
      <Button type="submit" disabled={mutation.isLoading || !nickname.trim()} className="w-full">
        {mutation.isLoading ? "保存中..." : "次へ"}
      </Button>
    </form>
  );
}
