"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import UserAvatar from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { uploadSingleImage } from "@/domain/attachment/upload";
import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { trpc } from "@/utils/trpc";

import { useOnboardingMessages } from "../i18n/use-onboarding-messages";

export function OnboardingProfileForm({
  initialNickname,
  initialAvatar,
  returnTo,
  variant,
}: {
  initialNickname: string;
  initialAvatar: string | null;
  returnTo: string;
  variant?: "POST_NEED";
}) {
  const { copy, lang } = useOnboardingMessages();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const mutation = trpc.profile.completeOnboardingProfile.useMutation();
  const setAvatar = trpc.profile.setAvatarAttachment.useMutation();

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(copy.saveError);
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
    } catch {
      toast.error(copy.saveError);
    } finally {
      setUploadingAvatar(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        nickname,
        avatarUrl: avatarUrl.trim() || null,
        preferredLocale: lang,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(variant === "POST_NEED" ? { initialIntent: "POST_NEED" as const } : {}),
      });
      router.replace(
        variant === "POST_NEED"
          ? sanitizeReturnTo(returnTo, "/needs/create")
          : `/onboarding/intent?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`,
      );
    } catch {
      toast.error(copy.saveError);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">{copy.nickname}</span>
        <input
          autoFocus
          required
          maxLength={50}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-purple-100"
        />
      </label>
      <div>
        <p className="mb-3 text-sm font-bold text-slate-700">{copy.avatar}</p>
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <UserAvatar image={avatarUrl || null} name={nickname} size={80} />
          <div className="min-w-0 flex-1">
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
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInput.current?.click()}
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadingAvatar ? copy.uploadingImage : copy.uploadImage}
            </button>
            <p className="mt-2 text-xs text-slate-500">{copy.avatarHelp}</p>
          </div>
        </div>
      </div>
      <Button
        type="submit"
        disabled={mutation.isLoading || uploadingAvatar || !nickname.trim()}
        className="w-full"
      >
        {mutation.isLoading ? copy.saving : copy.next}
      </Button>
    </form>
  );
}
