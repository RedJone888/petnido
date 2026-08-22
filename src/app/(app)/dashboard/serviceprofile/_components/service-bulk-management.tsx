"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";

const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;

export function ServiceBulkManagement() {
  const { t } = useLanguage();
  const copy = t.core.serviceDashboard;
  const bulkCopy = t.core.serviceDashboardBulk;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const settings = trpc.serviceProfile.getSettings.useQuery();
  const locations = trpc.savedLocation.listMine.useQuery();
  const utils = trpc.useUtils();
  const [locationId, setLocationId] = useState("");
  const [currency, setCurrency] = useState<(typeof currencies)[number]>("JPY");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!locationId && locations.data?.length) setLocationId(locations.data.find((item) => item.isDefault)?.id ?? locations.data[0].id);
  }, [locationId, locations.data]);
  useEffect(() => {
    const value = settings.data?.serviceProfile?.baseCurrency;
    if (value) setCurrency(value);
  }, [settings.data]);
  const bulk = trpc.serviceProfile.executeBulkCommand.useMutation({
    onSuccess: async (result) => {
      setNotice(bulkCopy.success.replace("{v2}", String(result.affected.v2)).replace("{legacy}", String(result.affected.legacy)));
      await Promise.all([settings.refetch(), utils.serviceProfile.getMine.invalidate(), utils.serviceV2.listMine.invalidate(), utils.dashboardSummary.getMine.invalidate()]);
    },
    onError: () => setError(bulkCopy.error),
  });
  const run = async (command: "PAUSE_ALL" | "RESUME_ALL" | "SET_LOCATION" | "SET_CURRENCY") => {
    setNotice(null); setError(null);
    const profile = settings.data?.serviceProfile;
    if (!profile) return;
    const title =
      command === "PAUSE_ALL"
        ? copy.pauseAll
        : command === "RESUME_ALL"
          ? copy.enableAll
          : copy.applyAll;
    const accepted = await confirm({
      title,
      content: (
        <p>
          {command === "PAUSE_ALL"
            ? bulkCopy.pauseConfirm
            : command === "RESUME_ALL"
              ? bulkCopy.resumeConfirm
              : bulkCopy.overwriteConfirm}
        </p>
      ),
      confirmText: title,
      variant: command === "PAUSE_ALL" ? "danger" : "primary",
    });
    if (!accepted) return;
    closeConfirm();
    const common = { expectedProfileUpdatedAt: new Date(profile.updatedAt) };
    if (command === "SET_LOCATION") bulk.mutate({ command, ...common, locationId });
    else if (command === "SET_CURRENCY") bulk.mutate({ command, ...common, currency });
    else bulk.mutate({ command, ...common });
  };
  if (!settings.data?.serviceProfile) return null;
  return <section className="mx-6 mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-primary">{copy.bulkEyebrow}</p><h2 className="mt-1 text-xl font-black">{copy.bulkTitle}</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">{copy.bulkDescription}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${settings.data.serviceProfile.isAccepting ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{settings.data.serviceProfile.isAccepting ? copy.accepting : copy.paused}</span></div>{notice ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}{error ? <p role="alert" className="mt-4 rounded-xl bg-danger-bg p-3 text-sm text-danger-text">{error}</p> : null}<div className="mt-5 grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-slate-200 p-4"><h3 className="font-black">{copy.stateTitle}</h3><div className="mt-3 flex gap-2"><button type="button" disabled={bulk.isLoading} onClick={() => run("RESUME_ALL")} className="min-h-11 flex-1 rounded-xl bg-primary px-3 text-sm font-bold text-white">{copy.enableAll}</button><button type="button" disabled={bulk.isLoading} onClick={() => run("PAUSE_ALL")} className="min-h-11 flex-1 rounded-xl border border-amber-300 px-3 text-sm font-bold text-amber-800">{copy.pauseAll}</button></div></div><div className="rounded-2xl border border-slate-200 p-4"><label className="text-sm font-black">{copy.locationLabel}<select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">{locations.data?.map((item) => <option key={item.id} value={item.id}>{item.label || item.regionLabel || copy.mapLocation}{item.isDefault ? copy.defaultSuffix : ""}</option>)}</select></label><button type="button" disabled={!locationId || bulk.isLoading} onClick={() => run("SET_LOCATION")} className="mt-3 min-h-11 w-full rounded-xl border border-primary px-3 text-sm font-bold text-primary">{copy.applyAll}</button></div><div className="rounded-2xl border border-slate-200 p-4"><label className="text-sm font-black">{copy.currencyLabel}<select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" disabled={bulk.isLoading} onClick={() => run("SET_CURRENCY")} className="mt-3 min-h-11 w-full rounded-xl border border-primary px-3 text-sm font-bold text-primary">{copy.applyAll}</button></div></div></section>;
}
