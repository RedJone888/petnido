"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import {
  fieldClass,
  primaryButtonClass,
  SettingsCard,
  textareaClass,
} from "../../settings/_components/settings-card";

const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;
type CurrencyValue = (typeof currencies)[number];

export function ServiceProfileSettings() {
  const { t } = useLanguage();
  const copy = t.settings.provider;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();
  const settings = trpc.serviceProfile.getSettings.useQuery();
  const locations = trpc.savedLocation.listMine.useQuery();
  const [introduction, setIntroduction] = useState("");
  const [monthsExperience, setMonthsExperience] = useState("");
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<CurrencyValue | "">("");

  useEffect(() => {
    const serviceProfile = settings.data?.serviceProfile;
    if (!serviceProfile) return;
    setIntroduction(serviceProfile.introduction ?? "");
    setMonthsExperience(
      serviceProfile.monthsExperience == null
        ? ""
        : String(serviceProfile.monthsExperience),
    );
    setDefaultLocationId(serviceProfile.defaultLocationId ?? "");
    setBaseCurrency((serviceProfile.baseCurrency as CurrencyValue | null) ?? "");
  }, [settings.data]);

  async function refresh() {
    await Promise.all([
      utils.serviceProfile.getSettings.invalidate(),
      utils.serviceProfile.getMine.invalidate(),
      utils.serviceProfile.getLocationAndCurrency.invalidate(),
    ]);
  }

  const enable = trpc.serviceProfile.enableOffering.useMutation({ onSuccess: refresh });
  const update = trpc.serviceProfile.updateSettings.useMutation({ onSuccess: refresh });
  const setAccepting = trpc.serviceProfile.setAccepting.useMutation({ onSuccess: refresh });
  const serviceProfile = settings.data?.serviceProfile;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync({
        introduction: introduction.trim() || null,
        monthsExperience:
          monthsExperience === "" ? null : Number(monthsExperience),
        defaultLocationId: defaultLocationId || null,
        baseCurrency: baseCurrency || null,
      });
      toast.success(copy.saveSuccess);
    } catch {
      toast.error(copy.saveError);
    }
  }

  return (
    <SettingsCard
      id="provider"
      icon={Settings2}
      title={copy.title}
      description={copy.description}
    >
      {settings.isLoading ? (
        <p className="text-sm text-slate-500">{copy.loading}</p>
      ) : !serviceProfile ? (
        <div className="rounded-2xl border border-primary/20 bg-purple-50/50 p-5">
          <h3 className="font-bold text-slate-900">{copy.startTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {copy.startDescription}
          </p>
          <button
            type="button"
            disabled={enable.isLoading}
            onClick={async () => {
              const accepted = await confirm({
                title: copy.startTitle,
                content: <p>{copy.startQuestion}</p>,
                confirmText: copy.startAction,
                variant: "primary",
              });
              if (!accepted) return;
              closeConfirm();
              try {
                await enable.mutateAsync();
                toast.success(copy.startSuccess);
              } catch {
                toast.error(copy.startError);
              }
            }}
            className={`${primaryButtonClass} mt-4`}
          >
            {enable.isLoading ? copy.loading : copy.startAction}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{copy.acceptingTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {copy.acceptingDescription}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={serviceProfile.isAccepting}
              disabled={setAccepting.isLoading}
              onClick={async () => {
                const next = !serviceProfile.isAccepting;
                if (!next) {
                  const accepted = await confirm({
                    title: copy.acceptingTitle,
                    content: <p>{copy.stopQuestion}</p>,
                    confirmText: copy.stopped,
                    variant: "danger",
                  });
                  if (!accepted) return;
                  closeConfirm();
                }
                try {
                  await setAccepting.mutateAsync({ active: next });
                  toast.success(next ? copy.resume : copy.stopped);
                } catch {
                  toast.error(copy.statusError);
                }
              }}
              className={`relative h-8 w-14 rounded-full transition ${serviceProfile.isAccepting ? "bg-primary" : "bg-slate-300"}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${serviceProfile.isAccepting ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <form onSubmit={save} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              {copy.experience}
              <textarea rows={6} maxLength={2000} value={introduction} onChange={(event) => setIntroduction(event.target.value)} className={textareaClass} />
            </label>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="text-sm font-semibold text-slate-700">
                {copy.months}
                <input type="number" min={0} max={1200} value={monthsExperience} onChange={(event) => setMonthsExperience(event.target.value)} className={fieldClass} />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                {copy.defaultLocation}
                <select value={defaultLocationId} onChange={(event) => setDefaultLocationId(event.target.value)} className={fieldClass}>
                  <option value="">{copy.notSet}</option>
                  {locations.data?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label ||
                        location.regionLabel ||
                        (Number.isFinite(Number(location.lat)) &&
                        Number.isFinite(Number(location.lon))
                          ? `${Number(location.lat).toFixed(4)}, ${Number(location.lon).toFixed(4)}`
                          : copy.defaultName)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                {copy.currency}
                <select value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value as CurrencyValue | "")} className={fieldClass}>
                  <option value="">{copy.notSet}</option>
                  {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              {copy.help}
            </p>
            <button type="submit" disabled={update.isLoading} className={primaryButtonClass}>
              {update.isLoading ? copy.saving : copy.save}
            </button>
          </form>
        </div>
      )}
    </SettingsCard>
  );
}
