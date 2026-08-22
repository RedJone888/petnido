"use client";

import { MapPin, PawPrint, Star } from "lucide-react";
import Link from "next/link";

import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { PendingActionLink } from "@/components/marketplace/pending-action-link";
import { AppImage } from "@/components/ui/app-image";
import { trpc } from "@/utils/trpc";
import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";

function formatMoney(amountMinor: number, currency: string) {
  const zeroDecimal = currency === "JPY" || currency === "KRW";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountMinor / (zeroDecimal ? 1 : 100));
  } catch {
    return `${currency} ${amountMinor.toLocaleString()}`;
  }
}

export function PublicServiceDetail({ publicId, initialLanguage }: { publicId: string; initialLanguage?: Lang }) {
  const decodedPublicId = decodeURIComponent(publicId);
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const copy = t.core.marketplace;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";
  const service = trpc.marketplaceService.get.useQuery({ publicId: decodedPublicId });
  const today = new Date().toISOString().slice(0, 10);
  const bookingCount = trpc.marketplaceService.confirmedBookingCount.useQuery({ publicId: decodedPublicId, date: today }, { enabled: Boolean(service.data) });
  if (service.isLoading) return <main className="min-h-screen p-10 text-center text-sm text-slate-500">{copy.loadingService}</main>;
  if (!service.data) return <main className="min-h-screen p-10 text-center text-sm text-danger-text">{copy.serviceUnavailable}</main>;
  const item = service.data;
  const returnTo = `${prefix}/services/${encodeURIComponent(publicId)}`;
  return (
    <main className="min-h-screen bg-[#f8f6f9] px-4 py-8"><div className="mx-auto max-w-5xl space-y-6"><Link href={`${prefix}/services`} className="text-sm font-black text-primary underline">{copy.backServices}</Link><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{item.attachments.length ? <div className="grid max-h-96 grid-cols-2 gap-1 overflow-hidden">{item.attachments.slice(0, 4).map((attachment) => <AppImage key={attachment.id} src={attachment.url} alt={copy.serviceImage} loading="lazy" className="h-full min-h-44 w-full object-cover" />)}</div> : null}<div className="p-6 md:p-8"><p className="text-xs font-black uppercase tracking-widest text-primary">{t.core.modes[item.mode as keyof typeof t.core.modes] ?? item.mode}</p><h1 className="mt-2 text-3xl font-black">{item.title}</h1>{item.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p> : null}<div className="mt-6 flex flex-wrap gap-4 rounded-2xl bg-slate-50 p-4 text-sm"><span className="flex gap-2"><MapPin size={18} className="text-primary" />{item.location.regionLabel || t.core.common.approximateArea}</span>{item.serviceRadiusMeters ? <span>{copy.serviceRadius} {item.serviceRadiusMeters / 1000} km</span> : null}{item.maxPetCapacity ? <span>{item.maxPetCapacity} {copy.upToPets}</span> : null}</div></div></section>
      <div className="grid gap-6 md:grid-cols-[1.5fr_0.8fr]"><div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">{copy.acceptedPets}</h2><ul className="mt-3 space-y-2 text-sm">{item.petPolicies.filter((policy) => policy.accepted).map((policy, index) => <li key={`${policy.petType}-${index}`} className="flex gap-2"><PawPrint size={16} className="text-primary" />{t.core.pets[policy.petType as keyof typeof t.core.pets]} · {policy.size} · {policy.ageBand}</li>)}</ul></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">{copy.servicesProvided}</h2><ul className="mt-3 space-y-3">{item.offerings.map((offering, index) => <li key={`${offering.category}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{offering.label}</strong>{offering.description ? <p className="mt-1 text-xs leading-5 text-slate-600">{offering.description}</p> : null}</li>)}</ul></section>{item.boardingEnvironment ? <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">{copy.boardingEnvironment}</h2><p className="mt-3 text-sm leading-6">{item.boardingEnvironment.environmentDescription}</p>{item.boardingEnvironment.residentPetNotes ? <p className="mt-3 text-sm"><strong>{copy.residentPets}:</strong> {item.boardingEnvironment.residentPetNotes}</p> : null}<p className="mt-3 text-sm"><strong>{copy.supplied}:</strong> {item.boardingEnvironment.suppliedItems.join(", ") || copy.noneListed}</p></section> : null}</div>
      <aside className="h-fit rounded-2xl border border-purple-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-purple-50">{item.provider.image ? <AppImage src={item.provider.image} alt="" width={48} height={48} className="h-full w-full object-cover" /> : "🐾"}</div><div><Link href={`${prefix}/providers/${encodeURIComponent(item.provider.publicId)}`} className="font-black text-primary underline">{item.provider.nickname || t.core.common.providerFallback}</Link><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Star size={12} />{item.provider.rating.toFixed(1)} · {item.provider.reviewCount} {t.core.common.reviewCount}</p></div></div><div className="mt-5 border-t pt-5"><h2 className="font-black">{copy.prices}</h2>{item.priceRules.map((rule, index) => <p key={`${rule.label}-${index}`} className="mt-2 text-sm">{rule.label}: <strong>{formatMoney(rule.amountMinor, item.currency)}</strong> / {rule.unit.toLowerCase()}</p>)}</div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-sm"><p className="font-bold">{copy.confirmedBookingsToday}</p><p className="mt-1 text-2xl font-black text-primary">{bookingCount.data?.count ?? "—"}<span className="ml-1 text-xs font-normal text-slate-500">{copy.bookingsUnit}</span></p></div><div className="mt-5 space-y-3"><FavoriteButton kind="SERVICE" publicId={publicId} returnTo={returnTo} /><PendingActionLink action="CONSULT_SERVICE" targetId={publicId} returnTo={returnTo} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">{copy.consult}</PendingActionLink><PendingActionLink action="BOOK_SERVICE" targetId={publicId} returnTo={returnTo} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90">{copy.requestBooking}</PendingActionLink></div><p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{copy.bookingHelp}</p></aside></div></div></main>
  );
}
