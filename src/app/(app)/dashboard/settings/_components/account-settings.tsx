"use client";

import {
  CheckCircle2,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import UserAvatar from "@/components/shared/user-avatar";
import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { uploadSingleImage } from "@/domain/attachment/upload";
import { emailChangeRequestSchema } from "@/lib/zod/profile";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import {
  CurrencyPicker,
  type SupportedCurrency as PreferredCurrency,
} from "@/components/ui/currency-picker";
import {
  fieldClass,
  SettingsCard,
  SettingsTabSkeleton,
  softActionButtonClass,
} from "./settings-card";
import { LocationSettings } from "./location-settings";
import {
  DeleteAccountSettings,
  SignInMethodsSettings,
} from "@/modules/auth/client/components/account-security-settings";

const rowClass =
  "grid gap-3 py-4 first:pt-0 md:grid-cols-[112px_minmax(0,1fr)] md:items-center md:gap-5";

export function AccountSettings() {
  const { t, lang } = useLanguage();
  const copy = t.settings.account;
  const utils = trpc.useUtils();
  const profile = trpc.profile.getMine.useQuery();
  const currencyPreference = trpc.profile.getPreferredCurrency.useQuery();
  const fileInput = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [preferredCurrency, setPreferredCurrency] =
    useState<PreferredCurrency>("JPY");
  const currencyCopy = {
    en: {
      label: "Currency",
      save: "Save currency",
      saving: "Saving…",
      success: "Currency saved",
      error: "Currency could not be saved",
    },
    zh: {
      label: "货币",
      save: "保存货币",
      saving: "保存中……",
      success: "货币已保存",
      error: "无法保存货币",
    },
    ja: {
      label: "通貨",
      save: "通貨を保存",
      saving: "保存中…",
      success: "通貨を保存しました",
      error: "通貨を保存できませんでした",
    },
  }[lang];

  const update = trpc.profile.updateMine.useMutation({
    onSuccess: async () => {
      await utils.profile.getMine.invalidate();
      toast.success(copy.saveSuccess);
    },
    onError: () => toast.error(copy.saveError),
  });
  const setAvatar = trpc.profile.setAvatarAttachment.useMutation();
  const setCurrency = trpc.profile.setPreferredCurrency.useMutation({
    onSuccess: async () => {
      await utils.profile.getPreferredCurrency.invalidate();
      toast.success(currencyCopy.success);
    },
    onError: () => toast.error(currencyCopy.error),
  });
  const requestEmailChange = trpc.auth.requestEmailChange.useMutation({
    onSuccess: (data, variables) => {
      setPendingEmail(variables.email);
      setEmailCode("");
      setResendSeconds(data.cooldownSeconds || 60);
      toast.success(copy.emailCodeSent);
    },
    onError: (error) =>
      toast.error(
        error.message === "EMAIL_ALREADY_REGISTERED"
          ? copy.emailAlreadyUsed
          : error.message === "RATE_LIMITED"
            ? copy.emailRateLimited
            : copy.emailSendError,
      ),
  });
  const confirmEmailChange = trpc.auth.confirmEmailChange.useMutation({
    onSuccess: async (result) => {
      setEmail(result.email ?? "");
      setPendingEmail(null);
      setEmailCode("");
      setResendSeconds(0);
      await utils.profile.getMine.invalidate();
      await utils.notificationPreference.getMine.invalidate();
      toast.success(copy.emailUpdated);
    },
    onError: (error) =>
      toast.error(
        error.message === "INVALID_CODE"
          ? copy.emailCodeInvalid
          : error.message === "CODE_EXPIRED"
            ? copy.emailCodeExpired
            : error.message === "EMAIL_ALREADY_REGISTERED"
              ? copy.emailAlreadyUsed
              : copy.emailConfirmError,
      ),
  });

  useEffect(() => {
    if (!profile.data) return;
    setNickname(profile.data.name ?? "");
    setAvatarUrl(profile.data.image ?? "");
    if (!pendingEmail) setEmail(profile.data.email ?? "");
  }, [pendingEmail, profile.data]);

  useEffect(() => {
    if (!currencyPreference.data) return;
    setPreferredCurrency(currencyPreference.data as PreferredCurrency);
  }, [currencyPreference.data]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const normalizedEmail = email.trim().toLowerCase();
  const currentEmail = (profile.data?.email ?? "").toLowerCase();
  const emailChanged = normalizedEmail !== currentEmail;
  const parsedEmail = emailChangeRequestSchema.safeParse({ email });
  const emailValid = parsedEmail.success;
  const nicknameChanged =
    nickname.trim() !== (profile.data?.name ?? "").trim();
  const currencyChanged =
    preferredCurrency !==
    ((currencyPreference.data as PreferredCurrency | undefined) ?? "JPY");

  async function saveNickname(event: React.FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync({
        nickname,
        avatarUrl: avatarUrl.trim() || null,
        bio: profile.data?.profile?.bio ?? null,
        preferredLocale:
          (profile.data?.profile?.preferredLocale as "ja" | "zh" | "en") ??
          lang,
        timeZone:
          profile.data?.profile?.timeZone ??
          Intl.DateTimeFormat().resolvedOptions().timeZone ??
          "UTC",
      });
    } catch {
      // The mutation already displays the localized error message.
    }
  }

  function sendEmailCode() {
    const parsed = emailChangeRequestSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(copy.emailInvalid);
      return;
    }
    requestEmailChange.mutate(parsed.data);
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error(copy.avatarTooLarge);
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
      await utils.profile.getMine.invalidate();
      toast.success(copy.avatarUpdated);
    } catch {
      toast.error(copy.avatarUploadError);
    } finally {
      setUploadingAvatar(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <SettingsCard
      id="account"
      icon={UserRound}
      title={copy.title}
      description={copy.description}
      showHeader={false}
    >
      {profile.isLoading ? (
        <SettingsTabSkeleton variant="account" />
      ) : (
        <div>
          <div className={rowClass} data-profile-row="avatar">
            <p className="text-sm font-bold text-slate-700">{copy.avatar}</p>
            <div className="flex max-w-2xl flex-wrap items-center gap-4">
              <UserAvatar
                size={64}
                image={avatarUrl || null}
                name={nickname}
                email={profile.data?.email}
              />
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
                className={softActionButtonClass}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingAvatar
                  ? copy.uploading
                  : avatarUrl
                    ? copy.change
                    : copy.upload}
              </button>
            </div>
          </div>

          <form
            onSubmit={saveNickname}
            className={rowClass}
            data-profile-row="nickname"
          >
            <label htmlFor="profile-nickname" className="text-sm font-bold text-slate-700">
              {copy.nickname}
            </label>
            <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="profile-nickname"
                required
                maxLength={50}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                className={`${fieldClass} !mt-0 min-w-0 sm:max-w-md sm:flex-1`}
              />
              {nicknameChanged ? (
                <button
                  type="submit"
                  disabled={update.isLoading || !nickname.trim()}
                  className={softActionButtonClass}
                >
                  {update.isLoading ? copy.saving : copy.save}
                </button>
              ) : null}
            </div>
          </form>

          <div className={`${rowClass} md:items-start`} data-profile-row="email">
            <label
              htmlFor="profile-email"
              className="text-sm font-bold text-slate-700 md:flex md:h-11 md:items-center"
            >
              {copy.email}
            </label>
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-full sm:max-w-md">
                  <div className="relative">
                    <input
                      id="profile-email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={email}
                      aria-invalid={emailChanged && !emailValid}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setPendingEmail(null);
                        setEmailCode("");
                        setResendSeconds(0);
                      }}
                      className={`${fieldClass} !mt-0 min-w-0 ${
                        profile.data?.emailVerified && !emailChanged
                          ? "pr-28"
                          : ""
                      }`}
                    />
                    {profile.data?.emailVerified && !emailChanged ? (
                      <span className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {copy.emailVerified}
                      </span>
                    ) : null}
                  </div>
                  {emailChanged && !emailValid ? (
                    <p
                      className="absolute left-0 top-full mt-1 text-xs font-semibold text-danger-text"
                      role="alert"
                    >
                      {copy.emailInvalid}
                    </p>
                  ) : null}
                </div>

                {emailChanged && !pendingEmail ? (
                  <button
                    type="button"
                    disabled={requestEmailChange.isLoading || !emailValid}
                    onClick={sendEmailCode}
                    className={`${softActionButtonClass} shrink-0 sm:mt-0`}
                  >
                    {requestEmailChange.isLoading
                      ? copy.emailSending
                      : copy.emailSendCode}
                  </button>
                ) : null}
              </div>

              {pendingEmail ? (
                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <VerificationCodeInput
                    value={emailCode}
                    onChange={setEmailCode}
                    className="justify-start"
                  />
                  <div className="flex flex-col-reverse gap-3 sm:flex-row lg:items-center">
                    <button
                      type="button"
                      disabled={
                        requestEmailChange.isLoading || resendSeconds > 0
                      }
                      onClick={sendEmailCode}
                      className={softActionButtonClass}
                    >
                      {requestEmailChange.isLoading
                        ? copy.emailSending
                        : resendSeconds > 0
                          ? `${copy.emailResendCode} (${resendSeconds}s)`
                          : copy.emailResendCode}
                    </button>
                    <button
                      type="button"
                      disabled={
                        confirmEmailChange.isLoading || emailCode.length !== 6
                      }
                      onClick={() =>
                        confirmEmailChange.mutate({
                          email: pendingEmail,
                          code: emailCode,
                        })
                      }
                      className={softActionButtonClass}
                    >
                      {confirmEmailChange.isLoading
                        ? copy.emailConfirming
                        : copy.emailConfirm}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <SignInMethodsSettings />

          <LocationSettings />

          <div className={rowClass} data-profile-row="currency">
            <label
              htmlFor="profile-currency"
              className="text-sm font-bold text-slate-700"
            >
              {currencyCopy.label}
            </label>
            <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
              <CurrencyPicker
                id="profile-currency"
                value={preferredCurrency}
                onChange={setPreferredCurrency}
                ariaLabel={currencyCopy.label}
                className="sm:max-w-md sm:flex-1"
              />
              {currencyChanged ? (
                <button
                  type="button"
                  disabled={setCurrency.isLoading}
                  onClick={() =>
                    setCurrency.mutate({ preferredCurrency })
                  }
                  className={softActionButtonClass}
                >
                  {setCurrency.isLoading
                    ? currencyCopy.saving
                    : currencyCopy.save}
                </button>
              ) : null}
            </div>
          </div>

          <DeleteAccountSettings />
        </div>
      )}
    </SettingsCard>
  );
}
