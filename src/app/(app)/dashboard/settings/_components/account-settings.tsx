"use client";

import { Trash2, Upload, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import UserAvatar from "@/components/shared/user-avatar";
import { uploadSingleImage } from "@/domain/attachment/upload";
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
  const fileInput = useRef<HTMLInputElement>(null);
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
  const setAvatar = trpc.profile.setAvatarAttachment.useMutation();
  const removeAvatar = trpc.profile.removeAvatar.useMutation();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("5MB以下の画像ファイルを選択してください");
      return;
    }
    setUploadingAvatar(true);
    try {
      const attachment = await uploadSingleImage({
        file,
        folder: "avatars",
        serviceKind: null,
      });
      await setAvatar.mutateAsync({ attachmentId: attachment.id });
      setAvatarUrl(attachment.url);
      await profile.refetch();
      toast.success("アバターを更新しました");
    } catch {
      toast.error("アバターをアップロードできませんでした");
    } finally {
      setUploadingAvatar(false);
      if (fileInput.current) fileInput.current.value = "";
    }
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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700">アバター画像</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAvatar(file);
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInput.current?.click()}
                  className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingAvatar ? "アップロード中..." : "画像をアップロード"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    disabled={removeAvatar.isLoading}
                    onClick={async () => {
                      try {
                        await removeAvatar.mutateAsync();
                        setAvatarUrl("");
                        await profile.refetch();
                        toast.success("アバターを削除しました");
                      } catch {
                        toast.error("アバターを削除できませんでした");
                      }
                    }}
                    className="inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </button>
                )}
              </div>
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">外部画像 URL を使用</summary>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                  className={fieldClass}
                />
              </details>
            </div>
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
