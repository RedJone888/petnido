"use client";

import { BriefcaseBusiness, Languages, Mail, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Lang } from "@/domain/lang/types";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import {
  fieldClass,
  SettingsCard,
  SettingsTabSkeleton,
} from "./settings-card";

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
      className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-7" : "left-1"}`}
      />
    </button>
  );
}

export function PreferencesSettings() {
  const { t, lang, setLang } = useLanguage();
  const copy = t.settings.preferences;
  const providerCopy = t.settings.provider;
  const availability = t.settings.availability;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();
  const preference = trpc.notificationPreference.getMine.useQuery();
  const serviceSettings = trpc.serviceProfile.getSettings.useQuery();
  const [emailInstant, setEmailInstant] = useState(false);

  useEffect(() => {
    if (preference.data) setEmailInstant(preference.data.emailInstant);
  }, [preference.data]);

  const updateEmail = trpc.notificationPreference.updateMine.useMutation({
    onSuccess: async () => {
      await utils.notificationPreference.getMine.invalidate();
    },
  });

  async function refreshServiceState() {
    await Promise.all([
      utils.serviceProfile.getSettings.invalidate(),
      utils.serviceProfile.getMine.invalidate(),
      utils.serviceProfile.getLocationAndCurrency.invalidate(),
    ]);
  }

  const enableOffering = trpc.serviceProfile.enableOffering.useMutation({
    onSuccess: refreshServiceState,
  });
  const setAccepting = trpc.serviceProfile.setAccepting.useMutation({
    onSuccess: refreshServiceState,
  });
  const serviceProfile = serviceSettings.data?.serviceProfile;

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

  async function toggleService() {
    if (!serviceProfile) {
      const accepted = await confirm({
        title: providerCopy.startTitle,
        content: <p>{providerCopy.startQuestion}</p>,
        confirmText: providerCopy.startAction,
        variant: "primary",
      });
      if (!accepted) return;
      closeConfirm();
      try {
        await enableOffering.mutateAsync();
        toast.success(providerCopy.startSuccess);
      } catch {
        toast.error(providerCopy.startError);
      }
      return;
    }

    const next = !serviceProfile.isAccepting;
    if (!next) {
      const accepted = await confirm({
        title: providerCopy.acceptingTitle,
        content: <p>{providerCopy.stopQuestion}</p>,
        confirmText: providerCopy.stopped,
        variant: "danger",
      });
      if (!accepted) return;
      closeConfirm();
    }
    try {
      await setAccepting.mutateAsync({ active: next });
      toast.success(next ? providerCopy.resume : providerCopy.stopped);
    } catch {
      toast.error(providerCopy.statusError);
    }
  }

  const canEnableEmail = Boolean(preference.data?.canEnableEmail);
  const visibleEmailState = canEnableEmail ? emailInstant : false;
  const serviceBusy =
    serviceSettings.isLoading ||
    enableOffering.isLoading ||
    setAccepting.isLoading;

  return (
    <SettingsCard
      id="preferences"
      icon={SlidersHorizontal}
      title={copy.title}
      description={copy.description}
      showHeader={false}
    >
      {preference.isLoading || serviceSettings.isLoading ? (
        <SettingsTabSkeleton variant="preferences" />
      ) : (
      <div className="divide-y divide-slate-100">
        <div className="flex items-center justify-between gap-5 py-5 first:pt-0">
          <div className="flex min-w-0 gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-bold text-slate-900">{copy.emailTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {copy.emailDescription}
              </p>
              {!preference.isLoading && !canEnableEmail ? (
                <p className="mt-1 text-xs font-bold text-amber-700">
                  {availability.emailRequired}
                </p>
              ) : null}
            </div>
          </div>
          <PreferenceSwitch
            checked={visibleEmailState}
            disabled={
              preference.isLoading ||
              !canEnableEmail ||
              updateEmail.isLoading
            }
            label={copy.emailTitle}
            onChange={() => void toggleEmail()}
          />
        </div>

        <div className="flex items-center justify-between gap-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <Languages className="h-5 w-5 shrink-0 text-primary" />
            <h3 className="font-bold text-slate-900">{copy.languageTitle}</h3>
          </div>
          <select
            aria-label={copy.languageTitle}
            value={lang}
            onChange={(event) => setLang(event.target.value as Lang)}
            className={`${fieldClass} !mt-0 !w-40 shrink-0`}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-5 py-5 last:pb-0">
          <div className="flex min-w-0 gap-3">
            <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-bold text-slate-900">{copy.serviceTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {copy.serviceDescription}
              </p>
            </div>
          </div>
          <PreferenceSwitch
            checked={serviceProfile?.isAccepting ?? false}
            disabled={serviceBusy}
            label={copy.serviceTitle}
            onChange={() => void toggleService()}
          />
        </div>
      </div>
      )}
    </SettingsCard>
  );
}
