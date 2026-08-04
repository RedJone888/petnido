"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import UserAvatar from "@/components/shared/user-avatar";
import { trpc } from "@/utils/trpc";
import {
  fieldClass,
  primaryButtonClass,
  SettingsCard,
  textareaClass,
} from "./settings-card";

export function AccountSettings() {
  const utils = trpc.useUtils();
  const profile = trpc.profile.getMine.useQuery();
  const update = trpc.profile.updateMine.useMutation({
    onSuccess: async () => {
      await profile.refetch();
      await utils.profile.getMine.invalidate();
      toast.success("プロフィールを保存しました");
    },
    onError: () => toast.error("プロフィールを保存できませんでした"),
  });
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<"ja" | "zh" | "en">("ja");
  const [timeZone, setTimeZone] = useState("Asia/Tokyo");

  useEffect(() => {
    if (!profile.data) return;
    setNickname(profile.data.name ?? "");
    setAvatarUrl(profile.data.image ?? "");
    setBio(profile.data.profile?.bio ?? "");
    setPreferredLocale(
      (profile.data.profile?.preferredLocale as "ja" | "zh" | "en") ?? "ja",
    );
    setTimeZone(profile.data.profile?.timeZone ?? "Asia/Tokyo");
  }, [profile.data]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await update.mutateAsync({
      nickname,
      avatarUrl: avatarUrl.trim() || null,
      bio: bio.trim() || null,
      preferredLocale,
      timeZone: timeZone.trim(),
    });
  }

  return (
    <SettingsCard
      id="account"
      icon={UserRound}
      title="個人プロフィール"
      description="公開時に表示するニックネームとアバター、自己紹介を編集します。"
    >
      {profile.isLoading ? (
        <p className="text-sm text-slate-500">読み込み中...</p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar
              size={80}
              image={avatarUrl || null}
              name={nickname}
              email={profile.data?.email}
            />
            <label className="min-w-0 flex-1 text-sm font-semibold text-slate-700">
              アバター画像 URL
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className={fieldClass}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                画像アップロードは後続のメディア統合で追加します。現在は画像 URL を保存できます。
              </span>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              ニックネーム
              <input
                required
                maxLength={50}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              表示言語
              <select
                value={preferredLocale}
                onChange={(event) =>
                  setPreferredLocale(event.target.value as "ja" | "zh" | "en")
                }
                className={fieldClass}
              >
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            自己紹介
            <textarea
              rows={5}
              maxLength={1000}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className={textareaClass}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            タイムゾーン
            <input
              required
              maxLength={100}
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={update.isLoading || !nickname.trim() || !timeZone.trim()}
            className={primaryButtonClass}
          >
            {update.isLoading ? "保存中..." : "個人プロフィールを保存"}
          </button>
        </form>
      )}
    </SettingsCard>
  );
}
