"use client";

import { ClipboardCheck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";

const stateStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800", ACCEPTED: "bg-emerald-100 text-emerald-800", DECLINED: "bg-danger-bg text-danger-text", CANCELLED: "bg-slate-100 text-slate-600", NEED_ENDED: "bg-slate-100 text-slate-600",
};

export default function ApplicationsPage() {
  const { t } = useLanguage();
  const copy = t.core.workflow;
  const [tab, setTab] = useState<"RECEIVED" | "SUBMITTED">("RECEIVED");
  const received = trpc.needApplication.listReceived.useQuery();
  const submitted = trpc.needApplication.listSubmitted.useQuery();
  const utils = trpc.useContext();
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const refresh = () => Promise.all([utils.needApplication.listReceived.invalidate(), utils.needApplication.listSubmitted.invalidate(), utils.needV2.listMine.invalidate()]);
  const accept = trpc.needApplication.accept.useMutation({ onSuccess: refresh });
  const decline = trpc.needApplication.decline.useMutation({ onSuccess: refresh });
  const cancel = trpc.needApplication.cancel.useMutation({ onSuccess: refresh });
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "ACCEPT" | "DECLINE" | "CANCEL", applicationId: string) => {
    setError(null);
    const accepted = await confirm({
      title: action === "ACCEPT" ? copy.approveQuestion : action === "DECLINE" ? copy.declineQuestion : copy.cancelApplicationQuestion,
      content: <p>{action === "ACCEPT" ? copy.approveApplicationDetail : action === "CANCEL" ? copy.reopenApplicationDetail : copy.conversationKept}</p>,
      confirmText: action === "ACCEPT" ? copy.approve : action === "DECLINE" ? copy.decline : copy.cancel,
      variant: action === "ACCEPT" ? "primary" : "danger",
    });
    if (!accepted) return;
    try {
      if (action === "ACCEPT") await accept.mutateAsync({ applicationId });
      else if (action === "DECLINE") await decline.mutateAsync({ applicationId });
      else await cancel.mutateAsync({ applicationId });
    } catch {
      setError(copy.stateChanged);
    } finally {
      closeConfirm();
    }
  };

  const loading = received.isLoading || submitted.isLoading;
  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="mx-auto max-w-5xl w-full h-full flex flex-col overflow-hidden">
        {/* Fixed Top Header */}
        <header className="shrink-0 space-y-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-100 text-primary">
              <ClipboardCheck size={21} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">{copy.applicationsTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">{copy.applicationsDescription}</p>
            </div>
          </div>
          <div className="inline-flex rounded-xl bg-slate-200 p-1">
            <button type="button" onClick={() => setTab("RECEIVED")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "RECEIVED" ? "bg-white text-primary shadow-sm" : "text-slate-600"}`}>{copy.receivedApplications}</button>
            <button type="button" onClick={() => setTab("SUBMITTED")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "SUBMITTED" ? "bg-white text-primary shadow-sm" : "text-slate-600"}`}>{copy.submittedApplications}</button>
          </div>
          {error ? <p className="rounded-xl border border-danger-border bg-danger-bg p-3 text-sm text-danger-text" role="alert">{error}</p> : null}
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 pb-8">
          {loading ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">{copy.loading}</p> : tab === "RECEIVED" ? (
            <div className="space-y-4">{received.data?.length ? received.data.map((application) => {
              const profile = application.applicant.serviceProfile;
              const activeServices = profile?.activeServiceCount ?? 0;
              return <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stateStyle[application.state]}`}>{t.core.states[application.state as keyof typeof t.core.states] ?? application.state}</span><span className="text-xs text-slate-500">{t.core.modes[application.needModeSnapshot as keyof typeof t.core.modes] ?? application.needModeSnapshot}</span></div><h2 className="mt-3 text-lg font-black text-slate-900">{application.needTitleSnapshot}</h2><div className="mt-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-purple-50">{application.applicant.image ? <AppImage src={application.applicant.image} alt="" width={40} height={40} className="h-full w-full object-cover" /> : "🐾"}</div><div><p className="font-bold text-slate-800">{application.applicant.name || copy.userFallback}</p><p className="text-xs text-slate-500">{copy.memberSince} {new Date(application.applicant.createdAt).getFullYear()}</p></div></div>{profile ? <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm leading-6 text-purple-950"><p className="font-black">{copy.profileAvailable}</p><p className="mt-1">{profile.introduction || copy.noIntroduction}</p><p className="mt-2 text-xs">{copy.experience} {profile.monthsExperience ?? 0} · {activeServices} {copy.publishedServices} · {copy.rating} {profile.rating.toFixed(1)} ({profile.reviewCount})</p>{profile.servicesV2.length ? <ul className="mt-2 list-disc pl-5 text-xs">{profile.servicesV2.map((service) => <li key={service.id}>{service.title} · {t.core.modes[service.mode as keyof typeof t.core.modes] ?? service.mode}</li>)}</ul> : null}</div> : <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p className="font-black">{copy.noProfile}</p><p>{copy.noProfileDetail}</p></div>}</div><div className="flex shrink-0 flex-wrap content-start gap-2"><Link href={`/dashboard/notifications?view=conversations&conversation=${encodeURIComponent(application.conversationId)}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700"><MessageCircle size={15} />{copy.conversation}</Link>{application.state === "PENDING" ? <><button type="button" disabled={accept.isLoading} onClick={() => void run("ACCEPT", application.id)} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{copy.approve}</button><button type="button" disabled={decline.isLoading} onClick={() => void run("DECLINE", application.id)} className="rounded-xl border border-danger-border px-4 py-2 text-sm font-bold text-danger-text">{copy.decline}</button></> : application.state === "ACCEPTED" ? <button type="button" disabled={cancel.isLoading} onClick={() => void run("CANCEL", application.id)} className="rounded-xl border border-danger-border px-4 py-2 text-sm font-bold text-danger-text">{copy.cancelSelection}</button> : null}</div></div></article>;
            }) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{copy.noReceivedApplications}</p>}</div>
          ) : (
            <div className="space-y-4">{submitted.data?.length ? submitted.data.map((application) => <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stateStyle[application.state]}`}>{t.core.states[application.state as keyof typeof t.core.states] ?? application.state}</span><span className="text-xs text-slate-500">{t.core.modes[application.needModeSnapshot as keyof typeof t.core.modes] ?? application.needModeSnapshot}</span></div><h2 className="mt-3 text-lg font-black">{application.needTitleSnapshot}</h2><p className="mt-2 text-sm text-slate-500">{copy.owner}: {application.owner.name || copy.userFallback}</p></div><div className="flex gap-2"><Link href={`/dashboard/notifications?view=conversations&conversation=${encodeURIComponent(application.conversationId)}`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">{copy.conversation}</Link>{application.state === "PENDING" || application.state === "ACCEPTED" ? <button type="button" disabled={cancel.isLoading} onClick={() => void run("CANCEL", application.id)} className="rounded-xl border border-danger-border px-4 py-2 text-sm font-bold text-danger-text">{copy.cancel}</button> : null}</div></div></article>) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{copy.noSubmittedApplications}</p>}</div>
          )}
        </div>
      </div>
    </main>
  );
}
