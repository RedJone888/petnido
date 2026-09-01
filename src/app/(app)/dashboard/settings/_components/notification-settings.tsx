"use client";

import { Mail, MailWarning } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";

function PreferenceSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

export function EmailNotificationControl() {
  const { t } = useLanguage();
  const copy = t.settings.preferences;
  const preference = trpc.notificationPreference.getMine.useQuery();
  const utils = trpc.useUtils();
  const [emailInstant, setEmailInstant] = useState(false);

  useEffect(() => {
    if (preference.data) setEmailInstant(preference.data.emailInstant);
  }, [preference.data]);

  const updateEmail = trpc.notificationPreference.updateMine.useMutation({
    onSuccess: async () => {
      await utils.notificationPreference.getMine.invalidate();
    },
  });

  async function toggleEmail() {
    const next = !emailInstant;
    setEmailInstant(next);
    try {
      await updateEmail.mutateAsync({ emailInstant: next });
      toast.success(next ? copy.emailEnabled : copy.emailDisabled);
    } catch {
      setEmailInstant(!next);
      toast.error(copy.emailError);
    }
  }

  if (preference.isLoading) {
    return <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />;
  }

  if (!preference.data?.canEnableEmail) {
    const action = preference.data?.hasEmail
      ? copy.verifyEmailAction
      : copy.bindEmailAction;
    return (
      <Link
        href="/dashboard/profile"
        className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
      >
        <MailWarning className="h-4 w-4 shrink-0" />
        {action}
      </Link>
    );
  }

  return (
    <div className="inline-flex min-h-11 w-full items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs sm:w-auto">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-purple-50 text-primary">
        <Mail className="h-4 w-4" />
      </span>
      <p className="whitespace-nowrap text-xs font-bold text-slate-700">{copy.emailTitle}</p>
      <PreferenceSwitch
        checked={emailInstant}
        disabled={updateEmail.isLoading}
        label={copy.emailTitle}
        onChange={() => void toggleEmail()}
      />
    </div>
  );
}
