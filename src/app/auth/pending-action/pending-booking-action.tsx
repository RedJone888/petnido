"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { trpc } from "@/utils/trpc";
import { useLanguage } from "@/components/providers/language-provider";

export function PendingBookingAction({ publicId, returnTo, idempotencyKey }: { publicId: string; returnTo: string; idempotencyKey: string }) {
  const { t } = useLanguage();
  const copy = t.core.pendingAction;
  const router = useRouter();
  const pets = trpc.pet.listMine.useQuery();
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const selections = useMemo(() => Object.entries(selected).filter(([, quantity]) => quantity > 0).map(([petId, quantity]) => ({ petId, quantity })), [selected]);
  const booking = trpc.serviceBooking.create.useMutation({ onSuccess: (result) => router.replace(`/dashboard/messages?conversation=${encodeURIComponent(result.conversationId)}`) });
  const valid = startsAt && endsAt && new Date(startsAt) < new Date(endsAt) && selections.length && body.trim();
  const submit = () => {
    if (!valid) return;
    booking.mutate({ target: { kind: "SERVICE", publicId }, startsAt: new Date(startsAt), endsAt: new Date(endsAt), pets: selections, body: body.trim(), idempotencyKey });
  };
  return <><p className="mt-4 text-sm leading-6 text-slate-600">{copy.bookingStatus}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">{copy.startsAt}<input aria-label={copy.startsAt} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label><label className="text-sm font-bold">{copy.endsAt}<input aria-label={copy.endsAt} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label></div><fieldset className="mt-5"><legend className="text-sm font-bold">{copy.bookingPets}</legend>{pets.isLoading ? <p className="mt-2 text-sm text-slate-500">{copy.petsLoading}</p> : pets.data?.length ? <div className="mt-2 space-y-2">{pets.data.map((pet) => { const petType = t.core.pets[pet.type as keyof typeof t.core.pets] ?? pet.type; const displayName = pet.name || pet.customType || petType; return <label key={pet.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={selected[pet.id] !== undefined} onChange={(event) => setSelected((current) => { const next = { ...current }; if (event.target.checked) next[pet.id] = 1; else delete next[pet.id]; return next; })} /><span className="min-w-0 flex-1 text-sm font-bold">{displayName} <span className="font-normal text-slate-500">· {petType}</span></span>{selected[pet.id] !== undefined ? <input aria-label={copy.quantityAria.replace("{pet}", displayName)} type="number" min={1} max={pet.quantity} value={selected[pet.id]} onChange={(event) => setSelected((current) => ({ ...current, [pet.id]: Math.max(1, Math.min(pet.quantity, Number(event.target.value) || 1)) }))} className="h-9 w-16 rounded-lg border px-2" /> : null}</label>; })}</div> : <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{copy.noPets}<Link href="/dashboard/profile/pets" className="ml-1 font-bold underline">{copy.addPet}</Link></p>}</fieldset><label className="mt-5 block text-sm font-bold">{copy.bookingMessage}<textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 4000))} rows={4} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal" placeholder={copy.bookingPlaceholder} /></label>{booking.error ? <p className="mt-4 rounded-xl bg-danger-bg p-3 text-sm text-danger-text" role="alert">{copy.bookingError}</p> : null}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={returnTo} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold">{copy.back}</Link><button type="button" disabled={!valid || booking.isLoading} onClick={submit} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50">{booking.isLoading ? copy.requestingBooking : copy.requestBooking}</button></div></>;
}
