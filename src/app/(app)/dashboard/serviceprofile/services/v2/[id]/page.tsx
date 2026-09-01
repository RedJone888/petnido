"use client";

import Link from "next/link";

import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";
import { trpc } from "@/utils/trpc";

export default function ServiceV2DetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
  const copy = t.core.serviceDashboard;
  const service = trpc.serviceV2.getMine.useQuery({ id: params.id });
  if (service.isLoading) return <main className="p-8 text-sm text-slate-500">{copy.loadingService}</main>;
  if (!service.data) return <main className="p-8 text-sm text-danger-text">{copy.serviceNotFound}</main>;
  const item = service.data;
  return (
    <main className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div><div className="flex flex-wrap gap-4"><Link href="/dashboard/serviceprofile" className="text-sm font-bold text-primary underline">{copy.detailBack}</Link><Link href={`/dashboard/serviceprofile/services/v2/${item.id}/calendar`} className="text-sm font-bold text-primary underline">{copy.bookingCalendar}</Link></div><p className="mt-5 text-xs font-black uppercase tracking-widest text-primary">{t.core.modes[item.mode as keyof typeof t.core.modes] ?? item.mode} · {t.core.states[item.state as keyof typeof t.core.states] ?? item.state}</p><h1 className="mt-1 text-3xl font-black text-slate-950">{item.title}</h1>{item.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p> : null}</div>
        <section className="grid gap-4 rounded-2xl border border-slate-200 p-5 sm:grid-cols-2"><p><strong>{copy.mapArea}:</strong> {item.locationSnapshot.regionLabel || copy.mapPoint}</p><p><strong>{copy.precision}:</strong> {item.locationSnapshot.displayPrecision}</p><p><strong>{copy.timeZone}:</strong> {item.timeZone}</p><p><strong>{copy.currency}:</strong> {item.currency}</p>{item.serviceRadiusMeters ? <p><strong>{copy.radius}:</strong> {item.serviceRadiusMeters / 1000} {t.core.management.actions.km}</p> : null}{item.maxPetCapacity ? <p><strong>{copy.boardingCapacity}:</strong> {item.maxPetCapacity} {copy.pets}</p> : null}</section>
        <section className="rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-black">{copy.availability}</h2><ul className="mt-3 space-y-2 text-sm">{item.availabilityRules.map((rule) => <li key={rule.id}>{rule.kind === "WEEKLY" ? `${copy.weekdays} ${rule.weekdays.join(", ")}` : `${rule.startsOn?.toString().slice(0, 10)} – ${rule.endsOn?.toString().slice(0, 10)}`}{rule.includesHolidays ? ` · ${copy.includesHolidays}` : ""}</li>)}</ul>{item.availabilityExceptions.length ? <p className="mt-3 text-xs text-slate-500">{copy.exceptions}: {item.availabilityExceptions.map((entry) => `${entry.date.toString().slice(0, 10)} ${entry.available ? copy.available : copy.unavailable}`).join("; ")}</p> : null}</section>
        <section className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-black">{copy.petPolicies}</h2><ul className="mt-3 space-y-2 text-sm">{item.petPolicies.map((policy) => <li key={policy.id}>{policy.petType} · {policy.size} · {policy.ageBand} · {policy.accepted ? copy.accepted : copy.notAccepted}</li>)}</ul></div><div className="rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-black">{copy.servicesProvided}</h2><ul className="mt-3 space-y-2 text-sm">{item.offerings.map((offering) => <li key={offering.id}><strong>{offering.label}</strong> · {offering.category}{offering.description ? ` · ${offering.description}` : ""}</li>)}</ul></div></section>
        <section className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-black">{copy.pricing}</h2><ul className="mt-3 space-y-2 text-sm">{item.priceRules.map((price) => <li key={price.id}>{price.label}: {price.amountMinor} {item.currency} / {price.unit.toLowerCase()}</li>)}</ul>{item.discounts.map((discount) => <p key={discount.id} className="mt-2 text-sm text-emerald-800">{discount.label}: {discount.value}{discount.kind === "PERCENT" ? "%" : ` ${item.currency}`}</p>)}</div>{item.boardingDetail ? <div className="rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-black">{copy.boardingEnvironment}</h2><p className="mt-3 whitespace-pre-wrap text-sm">{item.boardingDetail.environmentDescription}</p>{item.boardingDetail.residentPetNotes ? <p className="mt-3 text-sm"><strong>{copy.residentPets}:</strong> {item.boardingDetail.residentPetNotes}</p> : null}<p className="mt-3 text-sm"><strong>{copy.suppliedItems}:</strong> {item.boardingDetail.suppliedItems.join(", ") || copy.none}</p></div> : null}</section>
        {item.attachments.length ? <section className="rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-black">{copy.photos}</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{item.attachments.map(({ attachment }) => <AppImage key={attachment.id} src={attachment.url} alt={copy.serviceEvidence} className="aspect-square w-full rounded-xl object-cover" />)}</div></section> : null}
      </div>
    </main>
  );
}
