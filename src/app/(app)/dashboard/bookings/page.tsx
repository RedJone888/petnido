"use client";

import { CalendarCheck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

const style: Record<string, string> = { PENDING: "bg-amber-100 text-amber-800", CONFIRMED: "bg-emerald-100 text-emerald-800", DECLINED: "bg-danger-bg text-danger-text", CANCELLED: "bg-slate-100 text-slate-600" };
export default function BookingsPage() {
  const { t, lang } = useLanguage();
  const copy = t.core.workflow;
  const [tab, setTab] = useState<"RECEIVED" | "MINE">("RECEIVED");
  const received = trpc.serviceBooking.listReceived.useQuery();
  const mine = trpc.serviceBooking.listMine.useQuery();
  const utils = trpc.useContext(); const confirmDialog = useConfirm(); const closeConfirm = useConfirmStore((state) => state.close); const [error, setError] = useState<string | null>(null);
  const refresh = () => Promise.all([utils.serviceBooking.listReceived.invalidate(), utils.serviceBooking.listMine.invalidate()]);
  const confirm = trpc.serviceBooking.confirm.useMutation({ onSuccess: refresh }); const decline = trpc.serviceBooking.decline.useMutation({ onSuccess: refresh }); const cancel = trpc.serviceBooking.cancel.useMutation({ onSuccess: refresh });
  const run = async (action: "CONFIRM" | "DECLINE" | "CANCEL", bookingId: string) => { setError(null); const ok = await confirmDialog({ title: action === "CONFIRM" ? copy.confirmQuestion : action === "DECLINE" ? copy.declineBookingQuestion : copy.cancelBookingQuestion, content: <p>{action === "CONFIRM" ? copy.confirmDetail : copy.bookingConversationKept}</p>, confirmText: action === "CONFIRM" ? copy.confirm : action === "DECLINE" ? copy.decline : copy.cancel, variant: action === "CONFIRM" ? "primary" : "danger" }); if (!ok) return; try { if (action === "CONFIRM") await confirm.mutateAsync({ bookingId }); else if (action === "DECLINE") await decline.mutateAsync({ bookingId }); else await cancel.mutateAsync({ bookingId }); } catch { setError(copy.bookingStateChanged); } finally { closeConfirm(); } };
  const items = tab === "RECEIVED" ? received.data : mine.data;
  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="mx-auto max-w-5xl w-full h-full flex flex-col overflow-hidden">
        {/* Fixed Top Header */}
        <header className="shrink-0 space-y-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-primary">
              <CalendarCheck size={21} />
            </div>
            <div>
              <h1 className="text-2xl font-black">{copy.bookingsTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">{copy.bookingsDescription}</p>
            </div>
          </div>
          <div className="inline-flex rounded-xl bg-slate-200 p-1">
            <button type="button" onClick={() => setTab("RECEIVED")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "RECEIVED" ? "bg-white text-primary" : "text-slate-600"}`}>{copy.receivedBookings}</button>
            <button type="button" onClick={() => setTab("MINE")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "MINE" ? "bg-white text-primary" : "text-slate-600"}`}>{copy.myBookings}</button>
          </div>
          {error ? <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger-text" role="alert">{error}</p> : null}
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 pb-8">
          {received.isLoading || mine.isLoading ? <p className="rounded-2xl bg-white p-8 text-center text-sm">{t.core.workflow.loading}</p> : items?.length ? <div className="space-y-4">{items.map((booking) => { const person = "customer" in booking ? booking.customer : booking.provider; return <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:justify-between"><div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style[booking.state]}`}>{t.core.states[booking.state as keyof typeof t.core.states] ?? booking.state}</span><h2 className="mt-3 text-lg font-black">{booking.serviceTitleSnapshot}</h2><p className="mt-2 text-sm text-slate-600">{new Date(booking.startsAt).toLocaleString(lang)} – {new Date(booking.endsAt).toLocaleString(lang)}</p><p className="mt-2 text-sm">{booking.pets.map((pet) => `${pet.name} × ${pet.quantity}`).join("、")}</p><p className="mt-2 text-xs text-slate-500">{copy.counterpart}: {person.name || copy.userFallback}</p></div><div className="flex flex-wrap content-start gap-2"><Link href={`/dashboard/notifications?view=conversations&conversation=${encodeURIComponent(booking.conversationId)}`} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><MessageCircle size={15} />{copy.conversation}</Link>{tab === "RECEIVED" && booking.state === "PENDING" ? <><button type="button" onClick={() => void run("CONFIRM", booking.id)} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{copy.confirm}</button><button type="button" onClick={() => void run("DECLINE", booking.id)} className="rounded-xl border border-danger-border px-4 py-2 text-sm font-bold text-danger-text">{copy.decline}</button></> : (tab === "MINE" && (booking.state === "PENDING" || booking.state === "CONFIRMED")) || (tab === "RECEIVED" && booking.state === "CONFIRMED") ? <button type="button" onClick={() => void run("CANCEL", booking.id)} className="rounded-xl border border-danger-border px-4 py-2 text-sm font-bold text-danger-text">{copy.cancel}</button> : null}</div></div></article>; })}</div> : <p className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">{copy.noBookings}</p>}
        </div>
      </div>
    </main>
  );
}
