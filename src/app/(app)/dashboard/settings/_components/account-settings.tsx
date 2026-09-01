"use client";

import {
  CheckCircle2,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { toast } from "sonner";

import UserAvatar from "@/components/shared/user-avatar";
import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { uploadSingleImage } from "@/domain/attachment/upload";
import { CURRENCY_META } from "@/domain/location/constants";
import { emailChangeRequestSchema } from "@/lib/zod/profile";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import {
  CurrencyPicker,
  type SupportedCurrency as PreferredCurrency,
} from "@/components/ui/currency-picker";
import {
  fieldClass,
  SettingsTabSkeleton,
  softActionButtonClass,
} from "./settings-card";
import { LocationSettings } from "./location-settings";

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
  const [editingNickname, setEditingNickname] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [preferredCurrency, setPreferredCurrency] =
    useState<PreferredCurrency>("JPY");
  const currencyCopy = {
    en: {
      label: "Currency",
      change: "Change currency",
      save: "Save currency",
      saving: "Saving…",
      success: "Currency saved",
      error: "Currency could not be saved",
    },
    zh: {
      label: "货币",
      change: "修改货币",
      save: "保存货币",
      saving: "保存中……",
      success: "货币已保存",
      error: "无法保存货币",
    },
    ja: {
      label: "通貨",
      change: "通貨を変更",
      save: "通貨を保存",
      saving: "保存中…",
      success: "通貨を保存しました",
      error: "通貨を保存できませんでした",
    },
  }[lang];
  const sectionCopy = {
    en: {
      identityTitle: "Profile identity",
      identityDescription: "Manage the avatar, nickname, and verified email shown across your PetNido account.",
      defaultsTitle: "Publishing defaults",
      defaultsDescription: "Choose the location and currency PetNido should preselect when you create a request or service.",
      changeAvatar: "Change avatar",
      changeNickname: "Change nickname",
      changeEmail: "Change email",
    },
    zh: {
      identityTitle: "个人身份信息",
      identityDescription: "管理在 PetNido 中展示的头像、昵称以及经过验证的邮箱。",
      defaultsTitle: "发布默认值",
      defaultsDescription: "设置发布照护需求或服务时默认带入的位置与货币。",
      changeAvatar: "更换头像",
      changeNickname: "修改昵称",
      changeEmail: "修改邮箱",
    },
    ja: {
      identityTitle: "プロフィール情報",
      identityDescription: "PetNido で表示するアバター、ニックネーム、確認済みメールを管理します。",
      defaultsTitle: "公開時の既定値",
      defaultsDescription: "依頼やサービスを作成するときにあらかじめ選択する場所と通貨を設定します。",
      changeAvatar: "アバターを変更",
      changeNickname: "ニックネームを変更",
      changeEmail: "メールを変更",
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
      setEditingCurrency(false);
      toast.success(currencyCopy.success);
    },
    onError: () => {
      setPreferredCurrency(
        (currencyPreference.data as PreferredCurrency | undefined) ?? "JPY",
      );
      toast.error(currencyCopy.error);
    },
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
      setEditingEmail(false);
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
  const currencyMeta = CURRENCY_META[preferredCurrency];

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
      setEditingNickname(false);
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

  if (profile.isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-7"><SettingsTabSkeleton variant="account" /></div>;
  }

  return (
    <div id="account" className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">{sectionCopy.identityTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{sectionCopy.identityDescription}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
          <form
            onSubmit={saveNickname}
            data-profile-row="nickname"
            className="grid grid-cols-[72px_minmax(0,19rem)] items-center gap-3 lg:grid-cols-[72px_19rem_minmax(0,1fr)]"
          >
            <label htmlFor={editingNickname ? "profile-nickname" : undefined} className="text-sm font-bold text-slate-700">
              {copy.nickname}
            </label>
            {editingNickname ? (
              <input
                id="profile-nickname"
                required
                maxLength={50}
                value={nickname}
                autoFocus
                onChange={(event) => setNickname(event.target.value)}
                className={`${fieldClass} !mt-0 min-w-0 w-full`}
              />
            ) : (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                  {profile.data?.name || "—"}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingNickname(true)}
                  className={`${softActionButtonClass} shrink-0 !min-h-9 !px-3 !py-1.5 !text-xs`}
                >
                  {sectionCopy.changeNickname}
                </button>
              </div>
            )}
            <div className="col-start-2 flex flex-wrap items-center gap-4 lg:col-start-auto">
              {editingNickname ? (
                <button
                  type="submit"
                  disabled={update.isLoading || !nickname.trim() || !nicknameChanged}
                  className={`${softActionButtonClass} !min-h-9 !px-3 !py-1.5 !text-xs`}
                >
                  {update.isLoading ? copy.saving : copy.save}
                </button>
              ) : null}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4" data-profile-row="avatar">
                <UserAvatar size={44} image={avatarUrl || null} name={nickname} email={profile.data?.email} />
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
                  className="inline-flex min-h-8 items-center justify-center rounded-lg border border-primary/20 bg-white px-3 text-xs font-bold text-primary transition hover:bg-primary/[0.06] disabled:opacity-50"
                >
                  {uploadingAvatar ? copy.uploading : sectionCopy.changeAvatar}
                </button>
              </div>
            </div>
          </form>

          <div
            className="mt-5 grid grid-cols-[72px_minmax(0,19rem)] items-center gap-3 border-t border-slate-200 pt-5 lg:grid-cols-[72px_19rem_minmax(0,1fr)]"
            data-profile-row="email"
          >
            <label htmlFor={editingEmail ? "profile-email" : undefined} className="text-sm font-bold text-slate-700">
              {copy.email}
            </label>
            {editingEmail ? (
              <div className="relative min-w-0 w-full">
                <input
                  id="profile-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  autoFocus
                  aria-invalid={emailChanged && !emailValid}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setPendingEmail(null);
                    setEmailCode("");
                    setResendSeconds(0);
                  }}
                  className={`${fieldClass} !mt-0 min-w-0 w-full`}
                />
                {emailChanged && !emailValid ? (
                  <p className="mt-1 text-xs font-semibold text-danger-text" role="alert">
                    {copy.emailInvalid}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{profile.data?.email || "—"}</p>
                  {profile.data?.emailVerified ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {copy.emailVerified}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className={`${softActionButtonClass} shrink-0 !min-h-9 !px-3 !py-1.5 !text-xs`}
                >
                  {sectionCopy.changeEmail}
                </button>
              </div>
            )}

            {editingEmail ? <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-2 lg:col-start-auto">
              {!pendingEmail ? (
                <button
                  type="button"
                  disabled={requestEmailChange.isLoading || !emailChanged || !emailValid}
                  onClick={sendEmailCode}
                  className={`${softActionButtonClass} shrink-0 !min-h-9 !px-3 !py-1.5 !text-xs`}
                >
                  {requestEmailChange.isLoading ? copy.emailSending : copy.emailSendCode}
                </button>
              ) : (
                <>
                  <VerificationCodeInput
                    value={emailCode}
                    onChange={setEmailCode}
                    className="justify-start"
                    compact
                  />
                  <button
                    type="button"
                    disabled={requestEmailChange.isLoading || resendSeconds > 0}
                    onClick={sendEmailCode}
                    className={`${softActionButtonClass} !min-h-9 !px-3 !py-1.5 !text-xs`}
                  >
                    {requestEmailChange.isLoading
                      ? copy.emailSending
                      : resendSeconds > 0
                        ? `${copy.emailResendCode} (${resendSeconds}s)`
                        : copy.emailResendCode}
                  </button>
                  <button
                    type="button"
                    disabled={confirmEmailChange.isLoading || emailCode.length !== 6}
                    onClick={() =>
                      confirmEmailChange.mutate({ email: pendingEmail, code: emailCode })
                    }
                    className={`${softActionButtonClass} !min-h-9 !px-3 !py-1.5 !text-xs`}
                  >
                    {confirmEmailChange.isLoading ? copy.emailConfirming : copy.emailConfirm}
                  </button>
                </>
              )}
            </div> : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">{sectionCopy.defaultsTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{sectionCopy.defaultsDescription}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
          <div className="pb-4">
            <LocationSettings />
          </div>

          <div className="pt-4" data-profile-row="currency">
            <div className="grid min-h-11 gap-3 md:grid-cols-[112px_minmax(0,1fr)] md:items-center md:gap-5">
              <p className="text-sm font-bold text-slate-700">{currencyCopy.label}</p>
              {currencyPreference.isLoading ? (
                <div className="h-5 max-w-xs animate-pulse rounded bg-slate-200" />
              ) : editingCurrency ? (
                <div className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <CurrencyPicker
                      id="profile-currency"
                      value={preferredCurrency}
                      onChange={setPreferredCurrency}
                      ariaLabel={currencyCopy.label}
                      triggerClassName={setCurrency.isLoading ? "opacity-60" : undefined}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={setCurrency.isLoading || preferredCurrency === currencyPreference.data}
                    onClick={() => setCurrency.mutate({ preferredCurrency })}
                    className={`${softActionButtonClass} shrink-0 !min-h-10 !px-3 !py-1.5 !text-xs`}
                  >
                    {setCurrency.isLoading ? currencyCopy.saving : currencyCopy.save}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    <ReactCountryFlag svg countryCode={currencyMeta.countryCode} style={{ width: 20, height: 20 }} />
                    <span className="font-bold text-slate-900">{preferredCurrency}</span>
                    <span>{currencyMeta.label[lang].long}</span>
                    <span className="text-slate-500">{currencyMeta.symbol}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCurrency(true)}
                    className={`${softActionButtonClass} !min-h-9 !px-3 !py-1.5 !text-xs`}
                  >
                    {currencyCopy.change}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
