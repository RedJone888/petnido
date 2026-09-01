"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  PublishingFlowShell,
  type PublishingStep,
} from "@/components/publishing/publishing-flow-shell";
import { usePublishDraft } from "@/components/publishing/use-publish-draft";
import { RecommendationPanel } from "@/components/matching/recommendation-panel";
import ImageUploader from "@/components/ui/image-uploader";
import type { ImageItem } from "@/domain/attachment/type";
import {
  serviceDraftPayloadSchema,
  servicePublishSchema,
  type PublishDraftEnvelope,
} from "@/domain/publishing/contracts";
import { trpc } from "@/utils/trpc";
import { summarizeServicePublishingIssues } from "@/domain/publishing/validation-summary";
import { useLanguage } from "@/components/providers/language-provider";

type Mode = "HOME_VISIT" | "BOARDING" | "CUSTOM";
type StepId = "mode" | "basics" | "care" | "availability" | "pricing" | "review";
type Payload = Extract<PublishDraftEnvelope, { kind: "SERVICE" }>["payload"];
type PetPolicy = NonNullable<Payload["petPolicies"]>[number];
type Offering = NonNullable<Payload["offerings"]>[number];
type AvailabilityRule = NonNullable<Payload["availabilityRules"]>[number];
type AvailabilityException = NonNullable<Payload["availabilityExceptions"]>[number];
type Discount = NonNullable<Payload["discounts"]>[number];

const stepOrder: StepId[] = ["mode", "basics", "care", "availability", "pricing", "review"];
const inputClass =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-purple-100";
const smallButton =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary disabled:opacity-50";

function blankPayload(): Payload {
  return {
    timeZone: "UTC",
    availabilityRules: [],
    availabilityExceptions: [],
    petPolicies: [],
    offerings: [],
    priceRules: [],
    discounts: [],
    attachmentIds: [],
  };
}

function withMode(payload: Payload, mode: Mode): Payload {
  const { homeVisit: _homeVisit, boarding: _boarding, custom: _custom, ...common } = payload;
  if (mode === "HOME_VISIT") return { ...common, homeVisit: { serviceRadiusMeters: 5000 } };
  if (mode === "BOARDING") {
    return {
      ...common,
      boarding: {
        maxPetCapacity: 1,
        environmentDescription: "",
        residentPetNotes: null,
        suppliedItems: [],
      },
    };
  }
  return { ...common, custom: { serviceRadiusMeters: null } };
}

function decimals(currency: string | null | undefined) {
  return currency === "JPY" || currency === "KRW" ? 0 : 2;
}

function displayAmount(amount: number | undefined, currency: string | null | undefined) {
  if (amount === undefined) return "";
  return String(amount / 10 ** decimals(currency));
}

function asDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function ServicePublishingV2Flow() {
  const { t } = useLanguage();
  const copy = t.core.servicePublishing;
  const policyCopy = t.servicePolicy;
  const stepLabels: Record<StepId, string> = copy.steps;
  const searchParams = useSearchParams();
  const editDraftId = searchParams.get("editDraft");
  const resumeDraftId = searchParams.get("resumeDraft");
  const [currentStep, setCurrentStep] = useState<StepId>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [payload, setPayload] = useState<Payload>(blankPayload);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PublishDraftEnvelope | null>(null);
  const [checkedExistingDraft, setCheckedExistingDraft] = useState(false);
  const [priceLabel, setPriceLabel] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [policyDraft, setPolicyDraft] = useState<PetPolicy>({
    petType: "CAT",
    size: "ANY",
    ageBand: "ANY",
    accepted: true,
    notes: null,
  });
  const [offeringDraft, setOfferingDraft] = useState<Offering>({
    category: "FEEDING",
    label: "",
    description: null,
  });
  const [exceptionDraft, setExceptionDraft] = useState<AvailabilityException>({
    date: "",
    available: false,
    note: null,
  });
  const [dateRange, setDateRange] = useState({ startsOn: "", endsOn: "" });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [draftRecoveryError, setDraftRecoveryError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishOutcome, setPublishOutcome] = useState<{
    serviceId: string;
    edited: boolean;
    shouldPromptForEmail: boolean;
  } | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const persistence = usePublishDraft();
  const persistenceRef = useRef(persistence);
  const queuedPayloadRef = useRef<Payload | null>(null);
  const savingRef = useRef(false);
  const utils = trpc.useUtils();
  const drafts = trpc.publishDraft.listMine.useQuery({
    kind: "SERVICE",
    includeAbandoned: false,
  });
  const editDraft = trpc.serviceV2.getEditDraft.useQuery(
    { draftId: editDraftId ?? "00000000-0000-4000-8000-000000000000" },
    { enabled: Boolean(editDraftId) },
  );
  const profile = trpc.serviceProfile.getSettings.useQuery();
  const locations = trpc.savedLocation.listMine.useQuery();
  const abandon = trpc.publishDraft.abandon.useMutation();
  const publishService = trpc.publishDraft.publishService.useMutation();

  persistenceRef.current = persistence;

  useEffect(() => {
    setPayload((current) => ({
      ...current,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    }));
  }, []);

  useEffect(() => {
    if (editDraftId || checkedExistingDraft || drafts.isLoading) return;
    const existing = drafts.data?.find(
      (draft) =>
        draft.kind === "SERVICE" &&
        draft.status === "ACTIVE" &&
        (!resumeDraftId || draft.id === resumeDraftId),
    );
    if (existing) setPendingDraft(existing as PublishDraftEnvelope);
    setCheckedExistingDraft(true);
  }, [checkedExistingDraft, drafts.data, drafts.isLoading, editDraftId, resumeDraftId]);

  useEffect(() => {
    if (!editDraft.data || draftId) return;
    const parsed = serviceDraftPayloadSchema.safeParse(editDraft.data.payload);
    if (!parsed.success) {
      setDraftRecoveryError(copy.draftSchemaError);
      return;
    }
    setDraftId(editDraft.data.id);
    setMode(editDraft.data.mode as Mode);
    setPayload(parsed.data);
    setCurrentStep("review");
    setPriceLabel(parsed.data.priceRules?.[0]?.label ?? "");
    setPriceAmount(displayAmount(parsed.data.priceRules?.[0]?.amountMinor, parsed.data.currency));
    setDiscountLabel(parsed.data.discounts?.[0]?.label ?? "");
    setDiscountValue(parsed.data.discounts?.[0]?.value ? String(parsed.data.discounts[0].value) : "");
    setImages(editDraft.data.attachments.map((attachment) => ({
      id: attachment.id,
      url: attachment.url,
      signature: attachment.signature,
      isUploading: false,
    })));
    persistence.adoptRevision(editDraft.data.revision);
    setCheckedExistingDraft(true);
  }, [copy.draftSchemaError, draftId, editDraft.data, persistence]);

  useEffect(() => {
    if (draftId || pendingDraft || !checkedExistingDraft) return;
    const defaultLocationId = profile.data?.serviceProfile?.defaultLocationId;
    const location = locations.data?.find((item) => item.id === defaultLocationId);
    setPayload((current) => ({
      ...current,
      currency: current.currency ?? profile.data?.serviceProfile?.baseCurrency ?? "JPY",
      ...(current.location || !location
        ? {}
        : {
            location: {
              sourceLocationId: location.id,
              lat: Number(location.lat),
              lon: Number(location.lon),
              regionLabel: location.regionLabel,
              displayPrecision: "MAP_POINT",
            },
          }),
    }));
  }, [
    checkedExistingDraft,
    draftId,
    locations.data,
    pendingDraft,
    profile.data?.serviceProfile?.baseCurrency,
    profile.data?.serviceProfile?.defaultLocationId,
  ]);

  const command = useCallback(
    (nextPayload: Payload) => {
      if (!draftId) throw new Error("DRAFT_NOT_CREATED");
      return {
        id: draftId,
        kind: "SERVICE" as const,
        mode,
        currentStep,
        payload: serviceDraftPayloadSchema.parse(nextPayload),
      };
    },
    [currentStep, draftId, mode],
  );

  const drainSaveQueue = useCallback(async () => {
    if (savingRef.current || !draftId || persistenceRef.current.revision === null) return;
    savingRef.current = true;
    try {
      while (queuedPayloadRef.current) {
        const nextPayload = queuedPayloadRef.current;
        queuedPayloadRef.current = null;
        await persistenceRef.current.saveDraft(command(nextPayload));
      }
    } finally {
      savingRef.current = false;
    }
  }, [command, draftId]);

  useEffect(() => {
    if (!draftId || persistence.revision === null || pendingDraft || publishOutcome) return;
    const timer = window.setTimeout(() => {
      queuedPayloadRef.current = payload;
      void drainSaveQueue().catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [drainSaveQueue, draftId, payload, pendingDraft, persistence.revision, publishOutcome]);

  async function chooseMode(nextMode: Mode) {
    const nextPayload = withMode(payload, nextMode);
    setMode(nextMode);
    setPayload(nextPayload);
    if (draftId) return;
    const id = crypto.randomUUID();
    setDraftId(id);
    await persistence.createDraft({
      id,
      kind: "SERVICE",
      mode: nextMode,
      currentStep,
      payload: nextPayload,
    });
  }

  function resumeDraft() {
    if (!pendingDraft || pendingDraft.kind !== "SERVICE") return;
    const parsed = serviceDraftPayloadSchema.safeParse(pendingDraft.payload);
    if (!parsed.success) {
      setDraftRecoveryError(
        copy.draftRestoreError,
      );
      return;
    }
    setDraftId(pendingDraft.id);
    setMode(pendingDraft.mode as Mode | null);
    setPayload(parsed.data);
    setCurrentStep(
      stepOrder.includes(pendingDraft.currentStep as StepId)
        ? (pendingDraft.currentStep as StepId)
        : "mode",
    );
    setPriceLabel(parsed.data.priceRules?.[0]?.label ?? "");
    setPriceAmount(displayAmount(parsed.data.priceRules?.[0]?.amountMinor, parsed.data.currency));
    persistence.adoptRevision(pendingDraft.revision);
    setDraftRecoveryError(null);
    setPendingDraft(null);
  }

  async function startFresh() {
    try {
      if (pendingDraft) await abandon.mutateAsync({ id: pendingDraft.id });
    } catch {
      setDraftRecoveryError(copy.draftAbandonError);
      return;
    }
    setPendingDraft(null);
    setDraftId(null);
    setMode(null);
    setPayload(blankPayload());
    setCurrentStep("mode");
  }

  async function saveCurrentPayload() {
    if (!draftId) throw new Error("DRAFT_NOT_CREATED");
    const latest = await utils.publishDraft.getMine.fetch({ id: draftId });
    return persistence.saveDraft(command(payload), latest.revision);
  }

  function updatePrice(label: string, amount: string, currency = payload.currency) {
    setPriceLabel(label);
    setPriceAmount(amount);
    const numeric = Number(amount);
    const amountMinor = Number.isFinite(numeric) && numeric >= 0
      ? Math.round(numeric * 10 ** decimals(currency))
      : null;
    setPayload((current) => ({
      ...current,
      priceRules:
        label.trim() && amountMinor !== null
          ? [{ label: label.trim(), unit: mode === "HOME_VISIT" ? "VISIT" : mode === "BOARDING" ? "DAY" : "FIXED", amountMinor }]
          : [],
    }));
  }

  function updateDiscount(label: string, value: string) {
    setDiscountLabel(label);
    setDiscountValue(value);
    const numeric = Number(value);
    const discount: Discount[] = label.trim() && Number.isInteger(numeric) && numeric > 0 && numeric <= 100
      ? [{ label: label.trim(), kind: "PERCENT", value: numeric, condition: null }]
      : [];
    setPayload((current) => ({ ...current, discounts: discount }));
  }

  function toggleWeekday(day: number) {
    const weekly = payload.availabilityRules?.find((rule) => rule.kind === "WEEKLY");
    const days = new Set(weekly?.weekdays ?? []);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    const otherRules = payload.availabilityRules?.filter((rule) => rule.kind !== "WEEKLY") ?? [];
    setPayload({
      ...payload,
      availabilityRules: days.size
        ? [{ kind: "WEEKLY", weekdays: [...days].sort(), startsOn: null, endsOn: null, includesHolidays: weekly?.includesHolidays ?? false }, ...otherRules]
        : otherRules,
    });
  }

  function addDateRange() {
    if (!asDateOnly(dateRange.startsOn) || !asDateOnly(dateRange.endsOn)) return;
    const rule: AvailabilityRule = {
      kind: "DATE_RANGE",
      weekdays: [],
      startsOn: dateRange.startsOn,
      endsOn: dateRange.endsOn,
      includesHolidays: true,
    };
    setPayload({ ...payload, availabilityRules: [...(payload.availabilityRules ?? []), rule] });
    setDateRange({ startsOn: "", endsOn: "" });
  }

  function addException() {
    if (!asDateOnly(exceptionDraft.date)) return;
    setPayload({
      ...payload,
      availabilityExceptions: [
        ...(payload.availabilityExceptions ?? []).filter((item) => item.date !== exceptionDraft.date),
        exceptionDraft,
      ],
    });
    setExceptionDraft({ date: "", available: false, note: null });
  }

  function addPolicy() {
    const duplicate = payload.petPolicies?.some(
      (item) => item.petType === policyDraft.petType && item.size === policyDraft.size && item.ageBand === policyDraft.ageBand,
    );
    if (duplicate) return;
    setPayload({ ...payload, petPolicies: [...(payload.petPolicies ?? []), policyDraft] });
  }

  function addOffering() {
    if (!offeringDraft.label.trim()) return;
    setPayload({
      ...payload,
      offerings: [...(payload.offerings ?? []), { ...offeringDraft, label: offeringDraft.label.trim() }],
    });
    setOfferingDraft({ category: "FEEDING", label: "", description: null });
  }

  function onImagesChange(nextImages: ImageItem[]) {
    setImages(nextImages);
    setPayload({
      ...payload,
      attachmentIds: nextImages
        .filter((image) => !image.isUploading && !image.id.startsWith("temp-"))
        .map((image) => image.id),
    });
  }

  const publishPreview = useMemo(() => {
    if (!mode || !draftId || persistence.revision === null) return null;
    return servicePublishSchema.safeParse({
      ...payload,
      schemaVersion: 1,
      draftId,
      revision: persistence.revision,
      idempotencyKey,
      mode,
    });
  }, [draftId, idempotencyKey, mode, payload, persistence.revision]);

  async function handlePublish() {
    setPublishError(null);
    try {
      if (images.some((image) => image.isUploading)) throw new Error("UPLOAD_IN_PROGRESS");
      const saved = await saveCurrentPayload();
      if (!mode || !draftId) throw new Error("DRAFT_NOT_CREATED");
      const input = servicePublishSchema.parse({
        ...payload,
        schemaVersion: 1,
        draftId,
        revision: saved.revision,
        idempotencyKey,
        mode,
      });
      const result = await publishService.mutateAsync(input);
      setPublishOutcome({
        serviceId: result.serviceId,
        edited: result.edited,
        shouldPromptForEmail: result.notificationPrompt.shouldPrompt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setPublishError(
        message.includes("UPLOAD_IN_PROGRESS")
          ? copy.uploadWait
          : message.includes("SERVICE_PROFILE_REQUIRED")
            ? copy.profileRequired
            : copy.publishError,
      );
    }
  }

  const currentIndex = stepOrder.indexOf(currentStep);
  const publishIssues = useMemo(
    () =>
      publishPreview && !publishPreview.success
        ? summarizeServicePublishingIssues(publishPreview.error.issues)
        : [],
    [publishPreview],
  );
  const invalidStepIds = useMemo(
    () => new Set(publishIssues.map((issue) => issue.step)),
    [publishIssues],
  );
  const steps = useMemo<PublishingStep[]>(
    () => stepOrder.map((id, index) => ({
      id,
      label: stepLabels[id],
      state: index === currentIndex ? "current" : invalidStepIds.has(id) ? "attention" : !mode && index > 0 ? "locked" : index < currentIndex ? "complete" : "available",
    })),
    [currentIndex, invalidStepIds, mode, stepLabels],
  );

  const weekly = payload.availabilityRules?.find((rule) => rule.kind === "WEEKLY");

  return (
    <>
      <PublishingFlowShell
        eyebrow={t.core.management.offerService}
        title={stepLabels[currentStep]}
        description={t.core.management.draftDescription}
        steps={steps}
        saveState={draftId ? persistence.saveState : "idle"}
        saveStateLabels={{ idle: copy.saveIdle, saving: copy.saveSaving, saved: copy.saveSaved, conflict: copy.saveConflict, error: copy.saveError, conflictAction: copy.keepTab }}
        onResolveConflict={() => void saveCurrentPayload().catch(() => undefined)}
        onStepSelect={(id) => setCurrentStep(id as StepId)}
        onPrevious={currentIndex > 0 ? () => setCurrentStep(stepOrder[currentIndex - 1]) : undefined}
        onNext={currentIndex < stepOrder.length - 1 ? () => setCurrentStep(stepOrder[currentIndex + 1]) : undefined}
        nextDisabled={!mode}
        nextLabel={currentStep === "review" ? t.core.management.reviewComplete : t.core.management.continue}
      >
        {currentStep === "mode" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {(["HOME_VISIT", "BOARDING", "CUSTOM"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={mode === value} onClick={() => void chooseMode(value).catch(() => undefined)} className={`min-h-28 rounded-2xl border p-4 text-left font-black outline-none focus-visible:ring-2 focus-visible:ring-primary ${mode === value ? "border-primary bg-purple-50 text-primary" : "border-slate-200 bg-white text-slate-800 hover:border-purple-300"}`}>
                {copy.modes[value]}
              </button>
            ))}
          </div>
        ) : null}

        {currentStep === "basics" ? (
          <div className="space-y-5">
            <label className="block text-sm font-bold text-slate-800">{copy.serviceTitle}<input value={payload.title ?? ""} maxLength={160} onChange={(event) => setPayload({ ...payload, title: event.target.value })} className={inputClass} /></label>
            <label className="block text-sm font-bold text-slate-800">{copy.description}<textarea value={payload.description ?? ""} maxLength={4000} onChange={(event) => setPayload({ ...payload, description: event.target.value })} className={`${inputClass} min-h-32`} /></label>
            {mode === "HOME_VISIT" ? (
              <label className="block text-sm font-bold text-slate-800">{copy.radius}<input type="number" min="0.1" max="500" step="0.1" value={(payload.homeVisit?.serviceRadiusMeters ?? 5000) / 1000} onChange={(event) => setPayload({ ...payload, homeVisit: { serviceRadiusMeters: Math.round(Number(event.target.value) * 1000) } })} className={inputClass} /></label>
            ) : null}
            {mode === "CUSTOM" ? (
              <label className="block text-sm font-bold text-slate-800">{copy.optionalRadius}<input type="number" min="0.1" max="500" step="0.1" value={payload.custom?.serviceRadiusMeters ? payload.custom.serviceRadiusMeters / 1000 : ""} onChange={(event) => setPayload({ ...payload, custom: { serviceRadiusMeters: event.target.value ? Math.round(Number(event.target.value) * 1000) : null } })} className={inputClass} /></label>
            ) : null}
            {mode === "BOARDING" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-800">{copy.maxPets}<input type="number" min="1" max="100" value={payload.boarding?.maxPetCapacity ?? 1} onChange={(event) => setPayload({ ...payload, boarding: { ...payload.boarding!, maxPetCapacity: Number(event.target.value) } })} className={inputClass} /><span className="mt-2 block text-xs font-normal text-slate-500">{copy.capacityHelp}</span></label>
                <label className="block text-sm font-bold text-slate-800">{copy.residentPets}<textarea value={payload.boarding?.residentPetNotes ?? ""} onChange={(event) => setPayload({ ...payload, boarding: { ...payload.boarding!, residentPetNotes: event.target.value || null } })} className={`${inputClass} min-h-24`} /></label>
                <label className="block text-sm font-bold text-slate-800 sm:col-span-2">{copy.environment}<textarea value={payload.boarding?.environmentDescription ?? ""} onChange={(event) => setPayload({ ...payload, boarding: { ...payload.boarding!, environmentDescription: event.target.value } })} className={`${inputClass} min-h-28`} /></label>
                <label className="block text-sm font-bold text-slate-800 sm:col-span-2">{copy.suppliedItems}<textarea value={(payload.boarding?.suppliedItems ?? []).join("\n")} onChange={(event) => setPayload({ ...payload, boarding: { ...payload.boarding!, suppliedItems: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) } })} className={`${inputClass} min-h-24`} /></label>
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep === "care" ? (
          <div className="space-y-7">
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">{copy.acceptedPolicies}</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="text-xs font-bold">{copy.petType}<input value={policyDraft.petType} onChange={(event) => setPolicyDraft({ ...policyDraft, petType: event.target.value.toUpperCase() })} className={inputClass} /></label>
                <label className="text-xs font-bold">{copy.size}<select value={policyDraft.size} onChange={(event) => setPolicyDraft({ ...policyDraft, size: event.target.value as PetPolicy["size"] })} className={inputClass}>{Object.entries(policyCopy.sizes).map(([item, label]) => <option key={item} value={item}>{label}</option>)}</select></label>
                <label className="text-xs font-bold">{copy.age}<select value={policyDraft.ageBand} onChange={(event) => setPolicyDraft({ ...policyDraft, ageBand: event.target.value as PetPolicy["ageBand"] })} className={inputClass}>{Object.entries(policyCopy.ages).map(([item, label]) => <option key={item} value={item}>{label}</option>)}</select></label>
                <button type="button" onClick={addPolicy} className={`${smallButton} mt-6`}>{copy.addPolicy}</button>
              </div>
              <div className="flex flex-wrap gap-2">{payload.petPolicies?.map((item, index) => <button type="button" key={`${item.petType}-${item.size}-${item.ageBand}`} onClick={() => setPayload({ ...payload, petPolicies: payload.petPolicies?.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-full bg-purple-50 px-3 py-2 text-xs font-bold text-primary" title={copy.removePolicyTitle}>{t.core.pets[item.petType as keyof typeof t.core.pets] ?? item.petType} · {policyCopy.sizes[item.size]} · {policyCopy.ages[item.ageBand]} ×</button>)}</div>
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">{copy.whatProvide}</h3>
              <div className="grid gap-3 sm:grid-cols-[0.8fr_1.3fr_1.6fr_auto]">
                <label className="text-xs font-bold">{copy.category}<select value={offeringDraft.category} onChange={(event) => setOfferingDraft({ ...offeringDraft, category: event.target.value })} className={inputClass}>{Object.entries(policyCopy.categories).map(([item, label]) => <option key={item} value={item}>{label}</option>)}</select></label>
                <label className="text-xs font-bold">{copy.service}<input value={offeringDraft.label} onChange={(event) => setOfferingDraft({ ...offeringDraft, label: event.target.value })} className={inputClass} /></label>
                <label className="text-xs font-bold">{copy.details}<input value={offeringDraft.description ?? ""} onChange={(event) => setOfferingDraft({ ...offeringDraft, description: event.target.value || null })} className={inputClass} /></label>
                <button type="button" onClick={addOffering} className={`${smallButton} mt-6`}>{copy.add}</button>
              </div>
              <div className="space-y-2">{payload.offerings?.map((item, index) => <div key={`${item.category}-${index}`} className="flex items-start justify-between rounded-xl bg-slate-50 p-3 text-sm"><span><strong>{item.label}</strong><span className="ml-2 text-xs text-slate-500">{item.category}{item.description ? ` · ${item.description}` : ""}</span></span><button type="button" onClick={() => setPayload({ ...payload, offerings: payload.offerings?.filter((_, itemIndex) => itemIndex !== index) })} className="font-bold text-danger-text">{copy.removePolicy}</button></div>)}</div>
            </section>
          </div>
        ) : null}

        {currentStep === "availability" ? (
          <div className="space-y-7">
            <section className="space-y-3">
              <h3 className="font-black text-slate-900">{copy.mapLocation}</h3>
              <select aria-label={copy.mapLocation} value={payload.location?.sourceLocationId ?? ""} onChange={(event) => { const location = locations.data?.find((item) => item.id === event.target.value); setPayload({ ...payload, location: location ? { sourceLocationId: location.id, lat: Number(location.lat), lon: Number(location.lon), regionLabel: location.regionLabel, displayPrecision: "MAP_POINT" } : payload.location ? { ...payload.location, sourceLocationId: undefined } : null }); }} className={inputClass}>
                <option value="">{copy.newMapPoint}</option>
                {locations.data?.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label ||
                      location.regionLabel ||
                      (Number.isFinite(Number(location.lat)) &&
                      Number.isFinite(Number(location.lon))
                        ? `${Number(location.lat).toFixed(4)}, ${Number(location.lon).toFixed(4)}`
                        : copy.savedMapPoint)}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-bold">{copy.latitude}<input type="number" step="0.000001" value={payload.location?.lat ?? ""} onChange={(event) => setPayload({ ...payload, location: { sourceLocationId: undefined, lat: Number(event.target.value), lon: payload.location?.lon ?? 0, regionLabel: payload.location?.regionLabel ?? null, displayPrecision: payload.location?.displayPrecision ?? "MAP_POINT" } })} className={inputClass} /></label>
                <label className="text-xs font-bold">{copy.longitude}<input type="number" step="0.000001" value={payload.location?.lon ?? ""} onChange={(event) => setPayload({ ...payload, location: { sourceLocationId: undefined, lat: payload.location?.lat ?? 0, lon: Number(event.target.value), regionLabel: payload.location?.regionLabel ?? null, displayPrecision: payload.location?.displayPrecision ?? "MAP_POINT" } })} className={inputClass} /></label>
                <label className="text-xs font-bold">{copy.broadArea}<input value={payload.location?.regionLabel ?? ""} onChange={(event) => setPayload({ ...payload, location: { sourceLocationId: payload.location?.sourceLocationId, lat: payload.location?.lat ?? 0, lon: payload.location?.lon ?? 0, regionLabel: event.target.value || null, displayPrecision: payload.location?.displayPrecision ?? "MAP_POINT" } })} className={inputClass} /></label>
              </div>
              <p className="text-xs leading-5 text-slate-500">{copy.locationPrivacy}</p>
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">{copy.weeklyAvailability}</h3>
              <div className="flex flex-wrap gap-2">{copy.weekdays.map((label, index) => <button key={label} type="button" aria-pressed={weekly?.weekdays.includes(index + 1) ?? false} onClick={() => toggleWeekday(index + 1)} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${weekly?.weekdays.includes(index + 1) ? "border-primary bg-primary text-white" : "border-slate-300"}`}>{label}</button>)}</div>
              <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={weekly?.includesHolidays ?? false} onChange={(event) => setPayload({ ...payload, availabilityRules: payload.availabilityRules?.map((rule) => rule.kind === "WEEKLY" ? { ...rule, includesHolidays: event.target.checked } : rule) })} />{copy.publicHolidays}</label>
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">{copy.dateRanges}</h3>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-bold">{copy.from}<input type="date" value={dateRange.startsOn} onChange={(event) => setDateRange({ ...dateRange, startsOn: event.target.value })} className={inputClass} /></label><label className="text-xs font-bold">{copy.to}<input type="date" value={dateRange.endsOn} onChange={(event) => setDateRange({ ...dateRange, endsOn: event.target.value })} className={inputClass} /></label><button type="button" onClick={addDateRange} className={`${smallButton} mt-6`}>{copy.addRange}</button></div>
              {payload.availabilityRules?.map((rule, index) => rule.kind === "DATE_RANGE" ? <button type="button" key={`${rule.startsOn}-${index}`} onClick={() => setPayload({ ...payload, availabilityRules: payload.availabilityRules?.filter((_, itemIndex) => itemIndex !== index) })} className="mr-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold">{rule.startsOn} – {rule.endsOn} ×</button> : null)}
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-900">{copy.dateExceptions}</h3>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]"><label className="text-xs font-bold">{copy.date}<input type="date" value={exceptionDraft.date} onChange={(event) => setExceptionDraft({ ...exceptionDraft, date: event.target.value })} className={inputClass} /></label><label className="text-xs font-bold">{copy.status}<select value={exceptionDraft.available ? "yes" : "no"} onChange={(event) => setExceptionDraft({ ...exceptionDraft, available: event.target.value === "yes" })} className={inputClass}><option value="no">{copy.unavailable}</option><option value="yes">{copy.available}</option></select></label><label className="text-xs font-bold">{copy.note}<input value={exceptionDraft.note ?? ""} onChange={(event) => setExceptionDraft({ ...exceptionDraft, note: event.target.value || null })} className={inputClass} /></label><button type="button" onClick={addException} className={`${smallButton} mt-6`}>{copy.add}</button></div>
              {payload.availabilityExceptions?.map((item, index) => <button type="button" key={item.date} onClick={() => setPayload({ ...payload, availabilityExceptions: payload.availabilityExceptions?.filter((_, itemIndex) => itemIndex !== index) })} className="mr-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">{item.date} · {item.available ? copy.available : copy.unavailable} ×</button>)}
            </section>
          </div>
        ) : null}

        {currentStep === "pricing" ? (
          <div className="space-y-7">
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block text-sm font-bold text-slate-800">{copy.currency}<select value={payload.currency ?? "JPY"} onChange={(event) => { const currency = event.target.value as Payload["currency"]; setPayload({ ...payload, currency }); updatePrice(priceLabel, priceAmount, currency); }} className={inputClass}>{["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
              <label className="block text-sm font-bold text-slate-800">{copy.priceLabel}<input value={priceLabel} onChange={(event) => updatePrice(event.target.value, priceAmount)} placeholder={copy.serviceTitlePlaceholder} className={inputClass} /></label>
              <label className="block text-sm font-bold text-slate-800">{copy.amount}<input inputMode="decimal" value={priceAmount} onChange={(event) => updatePrice(priceLabel, event.target.value)} className={inputClass} /></label>
            </div>
            <div className="grid gap-5 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2"><label className="block text-sm font-bold text-slate-800">{copy.discountLabel}<input value={discountLabel} onChange={(event) => updateDiscount(event.target.value, discountValue)} placeholder={copy.discountLabelPlaceholder} className={inputClass} /></label><label className="block text-sm font-bold text-slate-800">{copy.percent}<input type="number" min="1" max="100" value={discountValue} onChange={(event) => updateDiscount(discountLabel, event.target.value)} className={inputClass} /></label></div>
            <p className="text-xs leading-5 text-slate-500">{copy.priceDefaultHelp}</p>
          </div>
        ) : null}

        {currentStep === "review" ? (
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2"><p><strong>{copy.mode}:</strong> {mode ? copy.modes[mode] : copy.notSelected}</p><p><strong>{copy.title}:</strong> {payload.title || copy.notSet}</p><p><strong>{copy.location}:</strong> {payload.location ? payload.location.regionLabel || copy.mapPoint : copy.notSet}</p><p><strong>{copy.currency}:</strong> {payload.currency || copy.notSet}</p><p><strong>{copy.petPolicies}:</strong> {payload.petPolicies?.length ?? 0}</p><p><strong>{copy.offerings}:</strong> {payload.offerings?.length ?? 0}</p><p><strong>{copy.availabilityRules}:</strong> {payload.availabilityRules?.length ?? 0}</p><p><strong>{copy.priceRules}:</strong> {payload.priceRules?.length ?? 0}</p></div>
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-200 p-4"><h3 className="font-black text-slate-900">{mode === "BOARDING" ? copy.environmentPhotos : copy.experiencePhotos}</h3><p className="text-xs leading-5 text-slate-500">{copy.optionalFiles}</p><ImageUploader value={images} onChange={onImagesChange} onRemove={(id) => onImagesChange(images.filter((image) => image.id !== id))} maxCount={12} folder="services" serviceKind={mode === "BOARDING" ? "HOME" : "EXPERIENCE"} size="sm" /></section>
            {!publishPreview?.success ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-black">{copy.completeSteps}</p><ul className="mt-3 space-y-2">{publishIssues.slice(0, 8).map((issue, index) => <li key={`${issue.field}-${index}`}><button type="button" onClick={() => setCurrentStep(issue.step)} className="text-left font-bold underline">{stepLabels[issue.step]} · {issue.field}: {issue.message}</button></li>)}</ul></div> : null}
            {publishError ? <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-text">{publishError}</p> : null}
            <button type="button" onClick={() => void handlePublish()} disabled={!publishPreview?.success || persistence.isPending || publishService.isLoading || Boolean(publishOutcome)} className="min-h-12 w-full rounded-xl bg-primary px-5 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">{publishService.isLoading ? copy.publishing : publishOutcome ? copy.published : copy.publish}</button>
          </div>
        ) : null}
      </PublishingFlowShell>

      {pendingDraft ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="service-draft-resume-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><h2 id="service-draft-resume-title" className="text-xl font-black text-slate-950">{copy.continueDraft}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{copy.draftAvailable}</p>{draftRecoveryError ? <p role="alert" className="mt-3 rounded-xl bg-danger-bg p-3 text-sm font-bold text-danger-text">{draftRecoveryError}</p> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => void startFresh()} className={smallButton}>{copy.startFresh}</button><button type="button" onClick={resumeDraft} className="min-h-11 rounded-xl bg-primary px-4 font-bold text-white">{copy.resumeDraft}</button></div></div></div>
      ) : null}

      {publishOutcome ? (
        <div className="fixed bottom-24 left-1/2 z-50 max-h-[75vh] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl" role="status"><p className="text-sm font-black text-emerald-900">{publishOutcome.edited ? copy.updated : copy.publishedSuccess}</p><p className="mt-1 text-xs leading-5 text-slate-600">{copy.serverConfirmed}</p><div className="mt-3"><RecommendationPanel kind="SERVICE" id={publishOutcome.serviceId} compact /></div>{publishOutcome.shouldPromptForEmail ? <Link href="/dashboard/messages" className="mt-3 inline-flex text-xs font-bold text-primary underline">{copy.emailNotifications}</Link> : null}<p className="mt-2 break-all text-[11px] text-slate-400">{copy.serviceId} {publishOutcome.serviceId}</p><Link href={`/dashboard/matches?serviceId=${encodeURIComponent(publishOutcome.serviceId)}`} className="mt-3 inline-flex text-xs font-bold text-primary underline">{copy.openMatching}</Link></div>
      ) : null}
    </>
  );
}
