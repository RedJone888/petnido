"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";

export function ServiceV2List({ mutable }: { mutable: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const utils = trpc.useUtils();
  const services = trpc.serviceV2.listMine.useQuery();
  const beginEdit = trpc.serviceV2.beginEdit.useMutation();
  const executeCommand = trpc.serviceV2.executeCommand.useMutation({
    onSuccess: () => void utils.serviceV2.listMine.invalidate(),
  });
  const [error, setError] = useState<string | null>(null);
  const actions = t.core.management.actions;
  const confirm = useConfirm();
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);
  const closeConfirm = useConfirmStore((state) => state.close);

  async function edit(id: string) {
    setError(null);
    try {
      const draft = await beginEdit.mutateAsync({ id });
      router.push(`/dashboard/serviceprofile/services/new?editDraft=${draft.id}`);
    } catch {
      setError(actions.serviceEditUnavailable);
    }
  }

  async function command(
    service: NonNullable<typeof services.data>[number],
    next: "PAUSE" | "RESUME" | "ARCHIVE",
  ) {
    if (next === "ARCHIVE") {
      const accepted = await confirm({
        title: actions.archive,
        content: <p>{actions.archiveQuestion}</p>,
        confirmText: actions.archive,
        variant: "danger",
      });
      if (!accepted) return;
      setConfirmLoading(true);
    }
    setError(null);
    try {
      await executeCommand.mutateAsync({
        id: service.id,
        command: next,
        expectedUpdatedAt: new Date(service.updatedAt),
      });
    } catch {
      setError(actions.serviceChangedElsewhere);
    } finally {
      if (next === "ARCHIVE") {
        setConfirmLoading(false);
        closeConfirm();
      }
    }
  }

  return (
    <section className="mx-6 mt-6 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm" aria-labelledby="v2-services-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="v2-services-title" className="text-xl font-black text-slate-950">{t.core.management.myServices}</h2>
        {mutable ? <Link href="/dashboard/serviceprofile/services/new" className="rounded-xl bg-primary px-4 py-3 text-sm font-black text-white">{t.core.management.addService}</Link> : <span className="rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600">{t.core.management.readOnly}</span>}
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-text">{error}</p> : null}
      {services.isLoading ? <p className="mt-5 text-sm text-slate-500">{actions.loadingServices}</p> : null}
      {services.data?.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{t.core.management.noServices}</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.data?.map((service) => (
          <article key={service.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-primary">{t.core.modes[service.mode]}</p><h3 className="mt-1 font-black text-slate-950">{service.title}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-black ${service.state === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{t.core.states[service.state]}</span></div>
            <p className="mt-3 text-xs text-slate-500">{service.locationSnapshot.regionLabel || actions.mapLocation} · {service.currency}</p>
            {service.mode === "BOARDING" ? <p className="mt-2 text-xs font-bold text-slate-700">{actions.capacity}: {service.maxPetCapacity} {actions.pets}</p> : service.serviceRadiusMeters ? <p className="mt-2 text-xs font-bold text-slate-700">{actions.radius}: {service.serviceRadiusMeters / 1000} {actions.km}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/dashboard/serviceprofile/services/v2/${service.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">{actions.details}</Link>
              <Link href={`/dashboard/serviceprofile/services/v2/${service.id}/calendar`} className="rounded-lg border border-purple-200 px-3 py-2 text-xs font-bold text-primary">{t.core.serviceDashboard.bookingCalendar}</Link>
              {mutable ? <>
              <button type="button" onClick={() => void edit(service.id)} disabled={beginEdit.isLoading} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">{actions.edit}</button>
              {service.state === "ACTIVE" ? <button type="button" onClick={() => void command(service, "PAUSE")} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">{actions.pause}</button> : <button type="button" onClick={() => void command(service, "RESUME")} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800">{actions.resume}</button>}
              <button type="button" onClick={() => void command(service, "ARCHIVE")} className="rounded-lg border border-danger-border px-3 py-2 text-xs font-bold text-danger-text">{actions.archive}</button>
              </> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
