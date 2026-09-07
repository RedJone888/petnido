"use client";

import Link from "next/link";
import { useState, use } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function ServiceCalendarPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { t } = useLanguage();
  const copy = t.core.serviceDashboard;
  const [month, setMonth] = useState(currentMonth);
  const calendar = trpc.serviceBooking.calendar.useQuery({ serviceId: params.id, month });
  return <main className="h-full overflow-y-auto p-5 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href={`/dashboard/serviceprofile/services/v2/${params.id}`} className="text-sm font-bold text-primary underline">{copy.calendarBack}</Link><h1 className="mt-4 text-3xl font-black">{copy.calendarTitle}</h1><p className="mt-2 text-sm text-slate-600">{copy.calendarIntro}</p></div><label className="text-sm font-black">{copy.month}<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="ml-3 min-h-11 rounded-xl border border-slate-300 px-3" /></label></div>{calendar.isLoading ? <p className="rounded-2xl bg-slate-50 p-6 text-sm">{copy.loadingCalendar}</p> : calendar.error ? <p role="alert" className="rounded-2xl bg-danger-bg p-6 text-sm text-danger-text">{copy.calendarError}</p> : calendar.data ? <><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">{calendar.data.service.title}</h2><p className="mt-2 text-sm text-slate-500">{t.core.modes[calendar.data.service.mode as keyof typeof t.core.modes] ?? calendar.data.service.mode}{calendar.data.service.maxPetCapacity !== null ? ` · ${copy.maxPets.replace("{n}", String(calendar.data.service.maxPetCapacity))}` : ` · ${copy.noCapacity}`}</p></section><section className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{calendar.data.days.map((day) => <article key={day.date} className={`min-h-28 rounded-xl border p-3 ${day.confirmedBookingCount ? "border-purple-200 bg-purple-50" : "border-slate-200 bg-white"}`}><p className="text-xs font-black text-slate-500">{day.date}</p><p className="mt-3 text-sm font-black">{day.confirmedBookingCount} {copy.confirmedBookings}</p>{day.remainingPetCapacity !== null ? <p className={`mt-2 text-xs font-bold ${day.remainingPetCapacity === 0 ? "text-danger-text" : "text-emerald-700"}`}>{copy.occupied.replace("{n}", String(day.confirmedPetCount))} · {copy.remaining.replace("{n}", String(day.remainingPetCapacity))}</p> : day.confirmedBookingCount ? <p className="mt-2 text-xs text-slate-500">{copy.involved.replace("{n}", String(day.confirmedPetCount))}</p> : null}</article>)}</section></> : null}</div></main>;
}
