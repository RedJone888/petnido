"use client";

import { CalendarCheck, LocateFixed, MapPin, PawPrint, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";
import { AppImage } from "@/components/ui/app-image";
import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";

type Mode = "HOME_VISIT" | "BOARDING" | "CUSTOM";
const petTypes = ["DOG", "CAT", "RABBIT", "BIRD", "CHINCHILLA", "GUINEA_PIG", "HAMSTER", "OTHER"] as const;
const inputClass = "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

function amountMinor(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  return Math.round(amount * (currency === "JPY" || currency === "KRW" ? 1 : 100));
}

function money(amount: number, currency: string) {
  const divisor = currency === "JPY" || currency === "KRW" ? 1 : 100;
  return `${currency} ${(amount / divisor).toLocaleString(undefined, { maximumFractionDigits: divisor === 1 ? 0 : 2 })}`;
}

export function ServiceMarketplace({ initialLanguage }: { initialLanguage?: Lang } = {}) {
  const lang = usePageLanguage(initialLanguage);
  const t = messages[lang];
  const copy = t.core.marketplace;
  const prefix = initialLanguage ? `/${initialLanguage}` : "";
  const [mode, setMode] = useState<Mode | "">("");
  const [petType, setPetType] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [availableOn, setAvailableOn] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>();
  const [locationError, setLocationError] = useState<string | null>(null);
  const filter = useMemo(() => ({
    modes: mode ? [mode] : [],
    petTypes: petType ? [petType] : [],
    currency: minimum || maximum ? currency as "JPY" | "USD" | "EUR" | "CNY" | "TWD" | "KRW" | "GBP" : undefined,
    minPriceMinor: minimum ? amountMinor(minimum, currency) : undefined,
    maxPriceMinor: maximum ? amountMinor(maximum, currency) : undefined,
    availableOn: availableOn || undefined,
    origin: origin ? { ...origin, radiusMeters: radiusKm * 1000 } : undefined,
  }), [availableOn, currency, maximum, minimum, mode, origin, petType, radiusKm]);
  const services = trpc.marketplaceService.list.useQuery({ filter, limit: 20, cursor });

  function update(action: () => void) { setCursor(undefined); action(); }
  function useLocation() {
    setLocationError(null);
    if (!navigator.geolocation) return setLocationError(copy.locationUnavailable);
    navigator.geolocation.getCurrentPosition(
      (position) => update(() => setOrigin({ lat: position.coords.latitude, lon: position.coords.longitude })),
      () => setLocationError(copy.locationDenied),
      { maximumAge: 300_000 },
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f9] pb-16">
      <header className="border-b border-purple-100 bg-white px-5 py-10"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{copy.serviceEyebrow}</p><h1 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">{copy.serviceTitle}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{copy.serviceIntro}</p></div><Link href={`${prefix}/providers`} className="rounded-xl border border-primary px-5 py-3 text-sm font-black text-primary">{copy.browseProviders}</Link></div></div></header>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4" aria-label={copy.filters}>
          <label className="text-xs font-black">{copy.mode}<select value={mode} onChange={(event) => update(() => setMode(event.target.value as Mode | ""))} className={`${inputClass} mt-2 w-full`}><option value="">{copy.allModes}</option>{Object.entries(t.core.modes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-black">{copy.petType}<select value={petType} onChange={(event) => update(() => setPetType(event.target.value))} className={`${inputClass} mt-2 w-full`}><option value="">{copy.allPets}</option>{petTypes.map((value) => <option key={value} value={value}>{t.core.pets[value]}</option>)}</select></label>
          <label className="text-xs font-black">{copy.availableOn}<input type="date" value={availableOn} onChange={(event) => update(() => setAvailableOn(event.target.value))} className={`${inputClass} mt-2 w-full`} /></label>
          <label className="text-xs font-black">{copy.currency}<select value={currency} onChange={(event) => update(() => setCurrency(event.target.value))} className={`${inputClass} mt-2 w-full`}>{["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-black">{copy.minimumPrice}<input inputMode="decimal" value={minimum} onChange={(event) => update(() => setMinimum(event.target.value))} className={`${inputClass} mt-2 w-full`} /></label>
          <label className="text-xs font-black">{copy.maximumPrice}<input inputMode="decimal" value={maximum} onChange={(event) => update(() => setMaximum(event.target.value))} className={`${inputClass} mt-2 w-full`} /></label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2"><button type="button" onClick={useLocation} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-black text-primary"><LocateFixed size={17} />{origin ? t.core.common.locationEnabled : t.core.common.useLocation}</button><select aria-label={copy.searchRadius} value={radiusKm} onChange={(event) => update(() => setRadiusKm(Number(event.target.value)))} disabled={!origin} className={inputClass}><option value={3}>3 km</option><option value={5}>5 km</option><option value={10}>10 km</option><option value={25}>25 km</option><option value={50}>50 km</option></select>{origin ? <button type="button" onClick={() => update(() => setOrigin(null))} className="min-h-11 text-xs font-bold text-slate-500 underline">{t.core.common.clearLocation}</button> : null}</div>
          {locationError ? <p role="alert" className="text-xs font-bold text-danger-text sm:col-span-2 lg:col-span-4">{locationError}</p> : null}
        </section>
        {services.isLoading ? <p className="py-16 text-center text-sm text-slate-500">{copy.searchingServices}</p> : null}
        {services.error ? <p role="alert" className="my-6 rounded-xl bg-danger-bg p-4 text-sm font-bold text-danger-text">{copy.servicesError}</p> : null}
        {!services.isLoading && services.data?.items.length === 0 ? <p className="py-16 text-center text-sm text-slate-500">{copy.noServices}</p> : null}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.data?.items.map((service) => (
            <article key={service.publicId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {service.attachments[0] ? <AppImage src={service.attachments[0].url} alt={copy.serviceImage} loading="lazy" className="h-40 w-full object-cover" /> : <div className="grid h-32 place-items-center bg-purple-50 text-4xl">🏡</div>}
              <div className="p-5"><p className="text-[11px] font-black uppercase tracking-wide text-primary">{t.core.modes[service.mode as keyof typeof t.core.modes] ?? service.mode}</p><h2 className="mt-1 line-clamp-2 font-black text-slate-950">{service.title}</h2><div className="mt-3 flex items-center gap-2"><div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-slate-100">{service.provider.image ? <AppImage src={service.provider.image} alt="" width={36} height={36} className="h-full w-full object-cover" /> : "🐾"}</div><div><p className="text-sm font-black">{service.provider.nickname || t.core.common.providerFallback}</p><p className="flex items-center gap-1 text-xs text-slate-500"><Star size={12} />{service.provider.rating.toFixed(1)} · {service.provider.reviewCount} {t.core.common.reviewCount}</p></div></div>
                <dl className="mt-4 space-y-2 text-xs text-slate-600"><div className="flex gap-2"><PawPrint size={15} className="text-primary" /><dd>{[...new Set(service.petPolicies.filter((policy) => policy.accepted).map((policy) => t.core.pets[policy.petType as keyof typeof t.core.pets]))].join(", ") || copy.askProvider}</dd></div><div className="flex gap-2"><MapPin size={15} className="text-primary" /><dd>{service.location.regionLabel || t.core.common.approximateArea}{service.location.distanceMeters !== null ? ` · ${(service.location.distanceMeters / 1000).toFixed(1)} km` : ""}</dd></div><div className="flex gap-2"><CalendarCheck size={15} className="text-primary" /><dd>{service.availabilityRules.length} {copy.availabilityRules}</dd></div></dl>
                <p className="mt-4 text-sm font-black">{service.priceRules[0] ? `${copy.from} ${money(Math.min(...service.priceRules.map((rule) => rule.amountMinor)), service.currency)}` : t.core.common.discussPrice}</p>
                <Link href={`${prefix}/services/${encodeURIComponent(service.publicId)}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-white">{copy.viewService}</Link>
              </div>
            </article>
          ))}
        </section>
        {services.data?.nextCursor ? <div className="mt-8 text-center"><button type="button" onClick={() => setCursor(services.data?.nextCursor ?? undefined)} className="min-h-11 rounded-xl border border-primary bg-white px-6 text-sm font-black text-primary">{t.core.common.next}</button></div> : null}
      </div>
    </main>
  );
}
