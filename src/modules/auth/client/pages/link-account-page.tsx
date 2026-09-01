"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleX } from "lucide-react";

import VerificationCodeInput from "@/components/shared/verifi-code-input";
import { LoadingButton } from "@/components/shared/loading-button";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { AuthPageCard } from "../components/auth-page-card";
import { useAuthMessages } from "../../i18n/use-auth-messages";

export default function LinkAccountPageClient({
  pendingId,
  connectError,
  connectProvider,
}: {
  pendingId: string;
  connectError: string;
  connectProvider: "google" | "line";
}) {
  const router = useRouter();
  const copy = useAuthMessages();
  const connectCopy = copy.accountConnect;
  const lineConnectCopy = copy.lineConnect;
  const existingCopy = copy.googleExisting;
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const existingErrorMessage = (code: string) => {
    switch (code) {
      case "INVALID_CODE":
        return existingCopy.invalidCode;
      case "CODE_EXPIRED":
        return existingCopy.codeExpired;
      case "TOO_MANY_CODE_ATTEMPTS":
        return existingCopy.attemptsExceeded;
      case "RATE_LIMITED":
        return existingCopy.rateLimited;
      default:
        return existingCopy.genericError;
    }
  };
  const pending = trpc.auth.getPendingGoogleLink.useQuery(
    { pendingId },
    { enabled: Boolean(pendingId), retry: false },
  );
  const request = trpc.auth.requestGoogleLink.useMutation({
    onSuccess: () => setSent(true),
    onError: (value) => setError(existingErrorMessage(value.message)),
  });
  const confirm = trpc.auth.confirmGoogleLink.useMutation({
    async onSuccess(result) {
      const signedIn = await signIn("credentials", { ticket: result.ticket, redirect: false });
      if (signedIn?.error) {
        setError(existingCopy.sessionFailed);
        return;
      }
      router.replace("/auth/continue?returnTo=%2Fdashboard");
      router.refresh();
    },
    onError: (value) => setError(existingErrorMessage(value.message)),
  });
  const confirmConnect = trpc.auth.confirmGoogleConnect.useMutation({
    async onSuccess() {
      router.replace("/dashboard/settings/security?googleConnect=success");
      router.refresh();
    },
    onError: (value) => setError(value.message),
  });

  function connectErrorMessage(code: string) {
    if (connectProvider === "line") {
      switch (code) {
        case "PROVIDER_ALREADY_LINKED":
          return lineConnectCopy.alreadyLinked;
        case "LINE_ACCOUNT_IN_USE":
          return lineConnectCopy.accountInUse;
        case "OAUTH_CONNECT_EXPIRED":
          return lineConnectCopy.expired;
        default:
          return lineConnectCopy.genericError;
      }
    }
    switch (code) {
      case "PROVIDER_ALREADY_LINKED":
        return connectCopy.alreadyLinked;
      case "GOOGLE_ACCOUNT_IN_USE":
        return connectCopy.accountInUse;
      case "GOOGLE_EMAIL_IN_USE":
        return connectCopy.emailInUse;
      case "GOOGLE_EMAIL_NOT_VERIFIED":
        return connectCopy.emailNotVerified;
      case "OAUTH_CONNECT_EXPIRED":
      case "OAUTH_LINK_EXPIRED":
        return connectCopy.expired;
      default:
        return connectCopy.genericError;
    }
  }

  if (connectError) {
    return (
      <AuthPageCard
        title={connectProvider === "line" ? lineConnectCopy.title : connectCopy.title}
        panelClassName="max-w-xl"
      >
        <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
          <CircleX className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-6">{connectErrorMessage(connectError)}</p>
        </div>
        <div className="flex justify-end">
          <Button href="/dashboard/settings/security" className="min-h-11 min-w-32">
            {connectCopy.close}
          </Button>
        </div>
      </AuthPageCard>
    );
  }

  if (!pendingId || pending.isError) {
    return <AuthPageCard title={existingCopy.unavailableTitle}><p>{existingCopy.unavailableBody}</p><BackLink label={existingCopy.cancel} /></AuthPageCard>;
  }


  if (pending.isLoading) {
    return <AuthPageCard title={connectCopy.title}><p className="text-sm text-slate-500">…</p></AuthPageCard>;
  }

  if (pending.data?.flow === "connect") {
    const displayedError = error ? connectErrorMessage(error) : "";
    return (
      <AuthPageCard title={connectCopy.title}>
        <p className="text-sm leading-6 text-slate-600">{connectCopy.description}</p>
        <dl className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <div className="space-y-1 px-4 py-3">
            <dt className="text-xs font-semibold text-slate-500">{connectCopy.currentAccount}</dt>
            <dd className="break-all text-sm font-bold text-slate-900">
              {pending.data.currentEmail ?? connectCopy.noEmail}
            </dd>
          </div>
          <div className="space-y-1 px-4 py-3">
            <dt className="text-xs font-semibold text-slate-500">{connectCopy.googleAccount}</dt>
            <dd className="break-all text-sm font-bold text-slate-900">
              {pending.data.providerEmail}
            </dd>
          </div>
        </dl>
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          {connectCopy.emailUnchanged}
        </p>
        {displayedError ? <p role="alert" className="text-sm text-red-600">{displayedError}</p> : null}
        <div className="grid grid-cols-2 gap-3">
          <Button
            href="/dashboard/settings/security"
            variant="outline"
            className="min-h-11 w-full"
          >
            {connectCopy.cancel}
          </Button>
          <LoadingButton
            loading={confirmConnect.isLoading}
            loadingText={connectCopy.confirming}
            className="min-h-11 w-full"
            onClick={() => {
              setError("");
              confirmConnect.mutate({ pendingId });
            }}
          >
            {connectCopy.confirm}
          </LoadingButton>
        </div>
      </AuthPageCard>
    );
  }

  return (
    <AuthPageCard title={existingCopy.existingTitle}>
      <p className="text-sm text-slate-600">
        {existingCopy.existingBody.replace("{email}", pending.data?.maskedEmail ?? "…")}
      </p>
      {!sent ? (
        <LoadingButton
          loading={request.isLoading}
          loadingText={existingCopy.sending}
          onClick={() => request.mutate({ pendingId })}
        >
          {existingCopy.verifyAndConnect}
        </LoadingButton>
      ) : (
        <div className="space-y-4">
          <VerificationCodeInput value={code} onChange={setCode} digitLabel={existingCopy.code} />
          <LoadingButton
            loading={confirm.isLoading}
            loadingText={existingCopy.confirming}
            disabled={code.length !== 6}
            onClick={() => confirm.mutate({ pendingId, code })}
          >
            {existingCopy.confirmConnect}
          </LoadingButton>
        </div>
      )}
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      <BackLink label={existingCopy.cancel} />
    </AuthPageCard>
  );
}

function BackLink({ href = "/auth/sign-in", label }: { href?: string; label: string }) {
  return <Link className="block text-center text-sm text-slate-500 underline" href={href}>{label}</Link>;
}
