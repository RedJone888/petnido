"use client";

import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ModalShell } from "@/components/ui/modal-shell";
import { trpc } from "@/utils/trpc";
import { authCurrentPasswordSchema } from "../../schemas";

import { useAccountSecurityMessages } from "../../i18n/use-account-security-messages";
import { useAuthMessages } from "../../i18n/use-auth-messages";

type OAuthProvider = "google" | "line";

const rowClass =
  "grid gap-3 py-4 first:pt-0 md:grid-cols-[112px_minmax(0,1fr)] md:items-start md:gap-5";
const actionClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/25 bg-white px-4 py-2 text-sm font-bold text-primary transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50";
const dangerActionClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const oauthUnlinkMarkerKey = "petnido:oauth-unlink-reauth";

function providerName(provider: OAuthProvider) {
  return provider === "google" ? "Google" : "LINE";
}

function SignInMethodRow({
  icon,
  name,
  connected,
  connectedLabel,
  notConnectedLabel,
  detail,
  action,
}: {
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  connectedLabel: string;
  notConnectedLabel: string;
  detail?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800">{name}</p>
        <p
          className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold ${
            connected ? "text-green-700" : "text-slate-500"
          }`}
        >
          {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {connected ? connectedLabel : notConnectedLabel}
        </p>
        {detail ? <p className="mt-1 break-all text-xs text-slate-500">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SignInMethodsSettings() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const copy = useAccountSecurityMessages().methods;
  const authCopy = useAuthMessages();
  const unlinkCopy = authCopy.accountUnlink;
  const accountOverview = trpc.auth.getAccountOverview.useQuery();
  const resultHandled = useRef(false);
  const oauthUnlinkHandled = useRef(false);
  const [connectingProvider, setConnectingProvider] = useState<OAuthProvider | null>(null);
  const [unlinkDialogProvider, setUnlinkDialogProvider] = useState<OAuthProvider | null>(null);
  const [unlinkDialogPassword, setUnlinkDialogPassword] = useState("");
  const [unlinkDialogError, setUnlinkDialogError] = useState("");
  const [oauthReauthStarting, setOAuthReauthStarting] = useState(false);

  const linkedProviders = accountOverview.data?.providers ?? [];
  const unlinkProviderMutation = trpc.auth.unlinkProvider.useMutation({
    async onSuccess(_result, variables) {
      await utils.auth.getAccountOverview.invalidate();
      setUnlinkDialogProvider(null);
      setUnlinkDialogPassword("");
      setUnlinkDialogError("");
      toast.success(
        copy.unlinkSuccess.replace("{provider}", providerName(variables.provider)),
      );
    },
    onError(error, variables) {
      const message =
        error.message === "LAST_SIGN_IN_METHOD"
          ? copy.lastMethod
          : error.message === "REAUTH_REQUIRED"
            ? copy.reauthRequired
            : error.message === "INVALID_CREDENTIALS"
              ? unlinkCopy.passwordIncorrect
              : error.message === "PROVIDER_NOT_LINKED"
                ? copy.providerNotLinked
                : copy.unlinkError;
      setUnlinkDialogProvider(variables.provider);
      setUnlinkDialogError(message);
      setOAuthReauthStarting(false);
    },
  });
  const unlinkProvider = unlinkProviderMutation.mutate;

  const canUnlinkProvider = (provider: OAuthProvider) =>
    Boolean(accountOverview.data?.hasPassword) ||
    linkedProviders.some(
      (linkedProvider) =>
        (linkedProvider === "google" || linkedProvider === "line") &&
        linkedProvider !== provider,
    );

  async function connectProvider(provider: OAuthProvider) {
    setConnectingProvider(provider);
    try {
      const response = await fetch(`/api/auth/connect/${provider}`, { method: "POST" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        if (result?.error === "PROVIDER_ALREADY_LINKED") {
          await utils.auth.getAccountOverview.invalidate();
          toast.info(copy.alreadyConnected);
        } else {
          toast.error(copy.connectStartError);
        }
        setConnectingProvider(null);
        return;
      }
      if (provider === "google") {
        await signIn(
          "google",
          { redirectTo: "/dashboard/settings" },
          { prompt: "select_account" },
        );
      } else {
        await signIn("line", { redirectTo: "/dashboard/settings" });
      }
    } catch {
      setConnectingProvider(null);
      toast.error(copy.connectStartError);
    }
  }

  function openUnlinkDialog(provider: OAuthProvider) {
    setUnlinkDialogProvider(provider);
    setUnlinkDialogPassword("");
    setUnlinkDialogError("");
    setOAuthReauthStarting(false);
  }

  function closeUnlinkDialog() {
    if (unlinkProviderMutation.isLoading || oauthReauthStarting) return;
    setUnlinkDialogProvider(null);
    setUnlinkDialogPassword("");
    setUnlinkDialogError("");
  }

  function submitUnlinkDialog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const provider = unlinkDialogProvider;
    if (!provider) return;
    setUnlinkDialogError("");

    if (accountOverview.data?.hasPassword) {
      if (!unlinkDialogPassword) {
        setUnlinkDialogError(unlinkCopy.passwordRequired);
        return;
      }
      unlinkProvider({ provider, password: unlinkDialogPassword });
      return;
    }

    const otherProvider = linkedProviders.find(
      (linkedProvider): linkedProvider is OAuthProvider =>
        (linkedProvider === "google" || linkedProvider === "line") &&
        linkedProvider !== provider,
    );
    if (!otherProvider) {
      setUnlinkDialogError(copy.lastMethod);
      return;
    }

    setOAuthReauthStarting(true);
    window.sessionStorage.setItem(
      oauthUnlinkMarkerKey,
      JSON.stringify({ provider, expiresAt: Date.now() + 5 * 60 * 1000 }),
    );
    void signIn(otherProvider, {
      redirectTo: `/dashboard/settings?reauthUnlink=${provider}`,
    }).catch(() => {
      window.sessionStorage.removeItem(oauthUnlinkMarkerKey);
      setOAuthReauthStarting(false);
      setUnlinkDialogError(copy.oauthReauthError);
    });
  }

  useEffect(() => {
    if (oauthUnlinkHandled.current) return;
    const provider = new URLSearchParams(window.location.search).get("reauthUnlink");
    if (provider !== "google" && provider !== "line") return;

    let marker: { provider?: string; expiresAt?: number } | null = null;
    try {
      marker = JSON.parse(window.sessionStorage.getItem(oauthUnlinkMarkerKey) ?? "null");
    } catch {
      marker = null;
    }
    window.sessionStorage.removeItem(oauthUnlinkMarkerKey);
    window.history.replaceState(null, "", "/dashboard/settings");
    setUnlinkDialogProvider(provider);
    if (
      marker?.provider !== provider ||
      typeof marker.expiresAt !== "number" ||
      marker.expiresAt < Date.now()
    ) {
      setUnlinkDialogError(copy.reauthRequired);
      return;
    }
    oauthUnlinkHandled.current = true;
    unlinkProvider({ provider });
  }, [copy.reauthRequired, unlinkProvider]);

  useEffect(() => {
    if (resultHandled.current) return;
    const search = new URLSearchParams(window.location.search);
    const provider = search.get("connectProvider");
    const result = search.get("connectResult");
    if ((provider !== "google" && provider !== "line") || (result !== "success" && result !== "already")) {
      return;
    }
    resultHandled.current = true;
    window.history.replaceState(null, "", "/dashboard/settings");
    void utils.auth.getAccountOverview.invalidate();
    toast.success(
      result === "already"
        ? copy.alreadyConnected
        : provider === "google"
          ? copy.googleConnectSuccess
          : copy.lineConnectSuccess,
      { id: "oauth-connect-result" },
    );
  }, [copy.alreadyConnected, copy.googleConnectSuccess, copy.lineConnectSuccess, utils.auth.getAccountOverview]);

  const unlinkOtherProvider = linkedProviders.find(
    (provider): provider is OAuthProvider =>
      (provider === "google" || provider === "line") &&
      provider !== unlinkDialogProvider,
  );
  const unlinkBusy = unlinkProviderMutation.isLoading || oauthReauthStarting;

  return (
    <>
      <div className={rowClass} data-profile-row="sign-in-methods">
        <div>
          <p className="text-sm font-bold text-slate-700">{copy.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 md:hidden">{copy.description}</p>
        </div>
        <div className="max-w-2xl">
          <p className="mb-3 hidden text-sm leading-6 text-slate-500 md:block">{copy.description}</p>
          {accountOverview.isLoading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50">
              <SignInMethodRow
                icon={<KeyRound className="h-5 w-5 text-primary" />}
                name={copy.emailPassword}
                connected={Boolean(accountOverview.data?.hasPassword)}
                connectedLabel={copy.passwordSet}
                notConnectedLabel={copy.passwordNotSet}
                action={accountOverview.data?.email ? (
                  <Link href="/auth/set-password" className={actionClass}>
                    {accountOverview.data.hasPassword ? copy.changePassword : copy.setPassword}
                  </Link>
                ) : undefined}
              />
              {(["google", "line"] as const).map((provider) => {
                const connected = Boolean(accountOverview.data?.providers.includes(provider));
                const detail = provider === "google" && connected && accountOverview.data?.providerEmails.google
                  ? copy.googleEmail.replace("{email}", accountOverview.data.providerEmails.google)
                  : null;
                return (
                  <SignInMethodRow
                    key={provider}
                    icon={<Image src={`/icons/${provider}.svg`} alt="" width={20} height={20} />}
                    name={providerName(provider)}
                    connected={connected}
                    connectedLabel={copy.connected}
                    notConnectedLabel={copy.notConnected}
                    detail={detail}
                    action={connected && canUnlinkProvider(provider) ? (
                      <button type="button" className={dangerActionClass} onClick={() => openUnlinkDialog(provider)}>
                        {copy.disconnect}
                      </button>
                    ) : !connected ? (
                      <button
                        type="button"
                        disabled={connectingProvider !== null}
                        className={actionClass}
                        onClick={() => void connectProvider(provider)}
                      >
                        {connectingProvider === provider
                          ? provider === "google"
                            ? authCopy.accountConnect.connecting
                            : authCopy.lineConnect.connecting
                          : copy.connect}
                      </button>
                    ) : undefined}
                  />
                );
              })}
            </div>
          )}
          {!accountOverview.isLoading ? <p className="mt-2 text-xs leading-5 text-slate-500">{copy.keepOneMethod}</p> : null}
          {!accountOverview.data?.email && !accountOverview.isLoading ? <p className="mt-2 text-xs leading-5 text-slate-500">{copy.emailRequired}</p> : null}
        </div>
      </div>

      {unlinkDialogProvider ? (
        <ModalShell
          title={unlinkDialogProvider === "line" ? copy.unlinkLineTitle : copy.unlinkGoogleTitle}
          titleId="unlink-provider-title"
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={!accountOverview.data?.hasPassword && unlinkOtherProvider
            ? copy.verifyAndDisconnect.replace("{provider}", providerName(unlinkOtherProvider))
            : copy.disconnect}
          savingLabel={copy.disconnecting}
          saving={unlinkBusy}
          saveVariant="danger"
          onClose={closeUnlinkDialog}
          onSubmit={submitUnlinkDialog}
          panelClassName="max-h-[calc(100dvh-6rem)] max-w-xl"
          overlayClassName="top-16"
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              {unlinkDialogProvider === "line" ? copy.unlinkLineDescription : copy.unlinkGoogleDescription}
            </p>
            {accountOverview.data?.hasPassword ? (
              <label className="block" htmlFor="unlink-login-password">
                <span className="text-sm font-bold text-slate-800">{unlinkCopy.loginPassword}</span>
                <p className="mt-1 text-xs leading-5 text-slate-500">{unlinkCopy.loginPasswordDescription}</p>
                <input
                  id="unlink-login-password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={unlinkDialogPassword}
                  aria-invalid={Boolean(unlinkDialogError)}
                  aria-describedby={unlinkDialogError ? "unlink-provider-error" : undefined}
                  onChange={(event) => {
                    setUnlinkDialogPassword(event.target.value);
                    setUnlinkDialogError("");
                  }}
                  className={`${fieldClass} mt-2 max-w-md ${unlinkDialogError ? "border-red-400" : ""}`}
                />
              </label>
            ) : unlinkOtherProvider ? (
              <p className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-700">
                {copy.oauthReauthDescription.replace("{provider}", providerName(unlinkOtherProvider))}
              </p>
            ) : null}
            {unlinkDialogError ? (
              <p id="unlink-provider-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                {unlinkDialogError}
              </p>
            ) : null}
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

export function DeleteAccountSettings() {
  const router = useRouter();
  const copy = useAccountSecurityMessages().deletion;
  const accountOverview = trpc.auth.getAccountOverview.useQuery();
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const hasPassword = Boolean(accountOverview.data?.hasPassword);
  const passwordValid = !hasPassword || authCurrentPasswordSchema.safeParse(password).success;
  const deleteAccount = trpc.auth.deleteAccount.useMutation({
    async onSuccess() {
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
    },
    onError(value) {
      setError(
        value.message === "INVALID_CREDENTIALS"
          ? copy.passwordIncorrect
          : value.message === "ACCOUNT_HAS_ACTIVE_OBLIGATIONS"
            ? copy.activeObligations
            : value.message === "REAUTH_REQUIRED"
              ? copy.reauthRequired
              : copy.genericError,
      );
    },
  });
  const canDelete =
    confirmation === "DELETE" &&
    !accountOverview.isLoading &&
    !deleteAccount.isLoading &&
    passwordValid;

  return (
    <div className={rowClass} data-profile-row="delete-account">
      <p className="text-sm font-bold text-red-700">{copy.title}</p>
      <div className="max-w-2xl space-y-3">
        <p className="text-sm leading-6 text-slate-600">{copy.description}</p>
        <label className="block max-w-md space-y-2">
          <span className="text-sm font-semibold text-slate-700">{copy.confirmation}</span>
          <input
            value={confirmation}
            onChange={(event) => { setConfirmation(event.target.value); setError(""); }}
            placeholder="DELETE"
            className={fieldClass}
          />
        </label>
        {hasPassword ? (
          <label className="block max-w-md space-y-2">
            <span className="text-sm font-semibold text-slate-700">{copy.loginPassword}</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                maxLength={72}
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(""); }}
                className={`${fieldClass} pr-12`}
              />
              <button
                type="button"
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
            <span className="block text-xs text-slate-500">{copy.passwordRequired}</span>
          </label>
        ) : null}
        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button
          type="button"
          disabled={!canDelete}
          onClick={() => deleteAccount.mutate({ confirmation: "DELETE", password: hasPassword ? password : undefined })}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteAccount.isLoading ? copy.deleting : copy.delete}
        </button>
      </div>
    </div>
  );
}
