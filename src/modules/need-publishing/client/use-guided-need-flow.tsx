"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useLanguage } from "@/components/providers/language-provider";
import type { PublishingStep } from "@/components/publishing/publishing-flow-shell";
import type { ImageItem } from "@/domain/attachment/type";
import { needPublishSchema } from "@/domain/publishing/contracts";
import {
  boardingSupplyOptions,
  countBoardingSupplyArrangements,
  mapLegacyNeedDraftV3,
  mapNeedDraftPayloadToLegacyNeedDraftV3,
  parseLegacyNeedDraftV3,
  type BoardingSupplyPlan,
  type BoardingTaskConfig,
  type BudgetDraft,
  type CareType,
  type CompatibilityChoice,
  type CustomBoardingSupply,
  type LocationDraft,
  type NeedDraftSnapshotV3 as NeedDraftSnapshot,
  type PetDraft,
  type ScreenId,
  type SupplyCostMode,
  type TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import { useAuthState } from "@/modules/auth/client/use-auth-state";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import { pricingInputFromDraft } from "@/modules/need-publishing/domain/draft-pricing-input";
import { calculateNeedPricing } from "@/modules/need-publishing/domain/pricing";
import { trpc } from "@/utils/trpc";
import {
  buildVisitDates,
  isPetProfileComplete,
} from "./guided-need-flow-shared";
import { saveLocalNeedDraft } from "./local-draft-storage";
import {
  NEED_DRAFT_STORAGE_KEY,
  NEED_ENTRY_STORAGE_KEY,
} from "./preview/types";
import { useNeedDraftV2Persistence } from "./use-need-draft-v2-persistence";

const StepArea = dynamic(
  () => import("./steps/step-area").then((module) => module.StepArea),
  {
    loading: () => (
      <div
        aria-hidden="true"
        className="h-[28rem] animate-pulse rounded-[16px] bg-[#f3eff4]"
      />
    ),
  },
);

import {
  buildScreens,
  customTasks,
  emptyNeedModeDraft,
  localizedNeedScreens,
  visitTasks,
  type NeedModeDraftState,
} from "./guided-need-flow-config";

export function useGuidedNeedFlow({
  publishingV2Enabled = false,
  validationProfileSession = false,
  editingNeedId,
  needPublishingContinuationToken,
}: {
  publishingV2Enabled?: boolean;
  validationProfileSession?: boolean;
  editingNeedId?: string;
  needPublishingContinuationToken?: string;
}) {
  const { lang, t } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing;
  const flowCopy = needMessages.needPublishingClient.flow;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isLoading: authLoading } = useAuthState();
  const authenticatedForDrafts = Boolean(session) || validationProfileSession;
  const { openAuthModal } = useAuthModal();
  const beginEdit = trpc.needV2.beginEdit.useMutation();
  const resumeDraftId = searchParams.get("draftId");
  const [currentId, setCurrentId] = useState<ScreenId>("care");
  const [careType, setCareType] = useState<CareType | null>(null);
  const [pets, setPets] = useState<PetDraft[]>([]);
  const [dates, setDates] = useState({
    startDate: "",
    endDate: "",
    notes: "",
    timeOfDay: "flexible",
    exactTime: "",
  });
  const [visitFrequency, setVisitFrequency] = useState("every-day");
  const [customInterval, setCustomInterval] = useState(4);
  const [firstVisitDate, setFirstVisitDate] = useState("");
  const [visitsPerDay, setVisitsPerDay] = useState(1);
  const [visitTimes, setVisitTimes] = useState<string[]>(["flexible"]);
  const [exactTimes, setExactTimes] = useState<string[]>([""]);
  const [visitPlans, setVisitPlans] = useState<TaskPlan[]>([]);
  const [boardingRoutines, setBoardingRoutines] = useState<
    BoardingTaskConfig[]
  >([]);
  const [boardingSupplies, setBoardingSupplies] = useState<BoardingSupplyPlan>(
    {},
  );
  const [customBoardingSupplies, setCustomBoardingSupplies] = useState<
    CustomBoardingSupply[]
  >([]);
  const [boardingSupplyNotes, setBoardingSupplyNotes] = useState("");
  const [supplyCostMode, setSupplyCostMode] =
    useState<SupplyCostMode>("discuss");
  const [customPlans, setCustomPlans] = useState<TaskPlan[]>([]);
  const [taskNotes, setTaskNotes] = useState("");
  const [boardingNeeds, setBoardingNeeds] = useState<string[]>([]);
  const [customBoardingRequirements, setCustomBoardingRequirements] = useState<
    string[]
  >([]);
  const [boardingCompatibility, setBoardingCompatibility] = useState<
    Record<string, CompatibilityChoice>
  >({});
  const [customHomeSituations, setCustomHomeSituations] = useState<string[]>(
    [],
  );
  const [boardingHomeNotes, setBoardingHomeNotes] = useState("");
  const [customNeeds, setCustomNeeds] = useState<string[]>([]);
  const [customWarnings, setCustomWarnings] = useState<string[]>([]);
  const [customRequirementsNotes, setCustomRequirementsNotes] = useState("");
  const [transport, setTransport] = useState("discuss");
  const [splitDirection, setSplitDirection] = useState<
    "owner-dropoff" | "sitter-dropoff"
  >("owner-dropoff");
  const [distance, setDistance] = useState("No preference");
  const [area, setArea] = useState("");
  const [location, setLocation] = useState<LocationDraft>({
    lat: 34.6545,
    lng: 135.5155,
  });
  const [areaConfirmed, setAreaConfirmed] = useState(false);
  const [budget, setBudget] = useState<BudgetDraft>({
    currency: "JPY",
    mode: "exact",
    amount: "",
    maximum: "",
    exactNegotiable: false,
    travelMode: "none",
    travelAmount: "",
    supplyAmount: "",
  });
  const [draftByMode, setDraftByMode] = useState<
    Record<CareType, NeedModeDraftState>
  >(() => ({
    visit: emptyNeedModeDraft(),
    boarding: emptyNeedModeDraft(),
    custom: emptyNeedModeDraft(),
  }));
  const [supportingImages, setSupportingImages] = useState<ImageItem[]>([]);
  const [showNotice, setShowNotice] = useState(false);
  const [publishIdempotencyKey, setPublishIdempotencyKey] = useState<
    string | undefined
  >();
  const [publishOutcome, setPublishOutcome] = useState<{
    needId: string;
    shouldPromptForEmail: boolean;
    edited: boolean;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [visitedScreenIds, setVisitedScreenIds] = useState<Set<ScreenId>>(
    () => new Set(),
  );
  const [validationAttemptedScreenIds, setValidationAttemptedScreenIds] =
    useState<Set<ScreenId>>(() => new Set());
  // A step is not considered complete merely because it was viewed. The
  // signature records the exact values that were accepted when the user
  // clicked Continue; changing any value creates a new frontier and requires
  // Continue again before later steps unlock.
  const [confirmedScreenSignatures, setConfirmedScreenSignatures] = useState<
    Partial<Record<ScreenId, string>>
  >({});
  const [confirmedScreenIds, setConfirmedScreenIds] = useState<ScreenId[]>([]);
  const editBaselineAppliedRef = useRef(false);
  const editingDraftDirtyRef = useRef(false);
  const editingBaselineSignatureRef = useRef<string | null>(null);
  const restoreConfirmationRef = useRef(false);
  // Reading and consuming the auth continuation query must be idempotent.
  // React Strict Mode re-runs effects in development; without this guard the
  // first pass removes `restore=auth`, then the second pass mistakes the same
  // local draft for an unrelated stale draft and opens the recovery dialog.
  const localDraftRestoreAppliedRef = useRef(false);
  const resumeDraftAppliedRef = useRef(false);
  const [pendingDraft, setPendingDraft] = useState<NeedDraftSnapshot | null>(
    null,
  );
  const [damagedDraftDetected, setDamagedDraftDetected] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [serverDraftId, setServerDraftId] = useState<string | undefined>();
  const [editingLoadError, setEditingLoadError] = useState<string | null>(null);
  const editingDraftExistingRef = useRef(false);
  const appliedDefaultLocationRef = useRef(false);
  const appliedPreferredCurrencyRef = useRef(false);
  const supplyCostDefaultAppliedRef = useRef(false);
  const travelCostDefaultAppliedRef = useRef(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const publishNeed = trpc.publishDraft.publishNeed.useMutation();
  const savedPets = trpc.pet.listMine.useQuery(undefined, {
    enabled: authenticatedForDrafts,
  });
  const savedLocations = trpc.savedLocation.listMine.useQuery(undefined, {
    enabled: authenticatedForDrafts,
  });
  const preferredCurrency = trpc.profile.getPreferredCurrency.useQuery(
    undefined,
    { enabled: authenticatedForDrafts },
  );
  const serverResumeDraft = trpc.publishDraft.getMine.useQuery(
    { id: resumeDraftId ?? "00000000-0000-4000-8000-000000000000" },
    { enabled: Boolean(resumeDraftId && authenticatedForDrafts) },
  );

  useEffect(() => {
    if (!savedPets.data?.length) return;
    const petMap = new Map(savedPets.data.map((p) => [p.id, p]));
    setPets((currentPets) => {
      let changed = false;
      const nextPets = currentPets.map((pet) => {
        if (pet.sourcePetId && !pet.photo) {
          const saved = petMap.get(pet.sourcePetId);
          const photoUrl = saved?.photos?.[0]?.url;
          if (photoUrl) {
            changed = true;
            return { ...pet, photo: photoUrl };
          }
        }
        return pet;
      });
      return changed ? nextPets : currentPets;
    });
  }, [savedPets.data, draftReady]);

  const captureModeState = useCallback(
    (): NeedModeDraftState => ({
      dates: {
        startDate: dates.startDate,
        endDate: dates.endDate,
        notes: dates.notes,
        timeOfDay: dates.timeOfDay,
        exactTime: dates.exactTime,
      },
      visitFrequency,
      customInterval,
      firstVisitDate,
      visitsPerDay,
      visitTimes,
      exactTimes,
      visitPlans,
      boardingRoutines,
      boardingSupplies,
      customBoardingSupplies,
      boardingSupplyNotes,
      supplyCostMode,
      customPlans,
      taskNotes,
      boardingNeeds,
      customBoardingRequirements,
      boardingCompatibility,
      customHomeSituations,
      boardingHomeNotes,
      customNeeds,
      customWarnings,
      customRequirementsNotes,
      transport,
      splitDirection,
      distance,
      area,
      location,
      areaConfirmed,
      budget,
      confirmedScreenIds,
      confirmedScreenSignatures,
    }),
    [
      area,
      areaConfirmed,
      boardingCompatibility,
      boardingHomeNotes,
      boardingNeeds,
      boardingRoutines,
      boardingSupplies,
      boardingSupplyNotes,
      budget,
      customBoardingRequirements,
      customBoardingSupplies,
      customHomeSituations,
      customNeeds,
      customPlans,
      customWarnings,
      customRequirementsNotes,
      dates,
      distance,
      exactTimes,
      firstVisitDate,
      location,
      splitDirection,
      supplyCostMode,
      taskNotes,
      transport,
      visitFrequency,
      visitPlans,
      visitTimes,
      visitsPerDay,
      customInterval,
      confirmedScreenIds,
      confirmedScreenSignatures,
    ],
  );

  const hydrateModeState = useCallback((mode: NeedModeDraftState) => {
    setDates({ ...mode.dates });
    setVisitFrequency(mode.visitFrequency);
    setCustomInterval(mode.customInterval);
    setFirstVisitDate(mode.firstVisitDate);
    setVisitsPerDay(mode.visitsPerDay);
    setVisitTimes(mode.visitTimes);
    setExactTimes(mode.exactTimes);
    setVisitPlans(mode.visitPlans);
    setBoardingRoutines(mode.boardingRoutines);
    setBoardingSupplies(mode.boardingSupplies);
    setCustomBoardingSupplies(mode.customBoardingSupplies);
    setBoardingSupplyNotes(mode.boardingSupplyNotes);
    setSupplyCostMode(mode.supplyCostMode);
    setCustomPlans(mode.customPlans);
    setTaskNotes(mode.taskNotes);
    setBoardingNeeds(mode.boardingNeeds);
    setCustomBoardingRequirements(mode.customBoardingRequirements);
    setBoardingCompatibility(mode.boardingCompatibility);
    setCustomHomeSituations(mode.customHomeSituations);
    setBoardingHomeNotes(mode.boardingHomeNotes);
    setCustomNeeds(mode.customNeeds);
    setCustomWarnings(mode.customWarnings);
    setCustomRequirementsNotes(mode.customRequirementsNotes);
    setTransport(mode.transport);
    setSplitDirection(mode.splitDirection);
    setDistance(mode.distance);
    setArea(mode.area);
    setLocation(mode.location);
    setAreaConfirmed(mode.areaConfirmed);
    setBudget(mode.budget);
  }, []);

  const switchCareType = useCallback(
    (next: CareType | null) => {
      if (!next || next === careType) {
        setCareType(next);
        return;
      }
      if (careType) {
        setDraftByMode((items) => ({
          ...items,
          [careType]: captureModeState(),
        }));
      }
      const nextMode = draftByMode[next] ?? emptyNeedModeDraft();
      supplyCostDefaultAppliedRef.current =
        nextMode.supplyCostMode !== "discuss";
      travelCostDefaultAppliedRef.current =
        nextMode.budget.travelMode !== "none";
      hydrateModeState(nextMode);
      setCareType(next);
      // The branch has changed. Keep common confirmations, then restore only
      // the target branch's own confirmations; a completed Dates/Tasks/etc.
      // step from another mode must not unlock this mode.
      const preservedCommon: Partial<Record<ScreenId, string>> = {};
      const preservedCommonIds: ScreenId[] = [];
      for (const commonId of ["care", "pets"] as const) {
        const signature = confirmedScreenSignatures[commonId];
        if (confirmedScreenIds.includes(commonId) && signature) {
          preservedCommon[commonId] = signature;
          preservedCommonIds.push(commonId);
        }
      }
      const targetSignatures = Object.fromEntries(
        Object.entries(nextMode.confirmedScreenSignatures ?? {}).filter(
          ([id]) => id !== "care" && id !== "pets",
        ),
      ) as Partial<Record<ScreenId, string>>;
      const targetIds = (nextMode.confirmedScreenIds ?? []).filter(
        (id) => id !== "care" && id !== "pets",
      );
      setConfirmedScreenSignatures({ ...preservedCommon, ...targetSignatures });
      setConfirmedScreenIds([
        ...new Set([...preservedCommonIds, ...targetIds]),
      ]);
    },
    [
      careType,
      captureModeState,
      confirmedScreenIds,
      confirmedScreenSignatures,
      draftByMode,
      hydrateModeState,
    ],
  );

  useEffect(() => {
    if (
      !draftReady ||
      pendingDraft ||
      appliedPreferredCurrencyRef.current ||
      !preferredCurrency.data
    ) {
      return;
    }
    appliedPreferredCurrencyRef.current = true;
    setBudget((current) => ({
      ...current,
      currency: preferredCurrency.data,
    }));
    setDraftByMode((items) => ({
      visit: {
        ...items.visit,
        budget: { ...items.visit.budget, currency: preferredCurrency.data },
      },
      boarding: {
        ...items.boarding,
        budget: { ...items.boarding.budget, currency: preferredCurrency.data },
      },
      custom: {
        ...items.custom,
        budget: { ...items.custom.budget, currency: preferredCurrency.data },
      },
    }));
  }, [draftReady, pendingDraft, preferredCurrency.data]);

  useEffect(() => {
    if (!draftReady || pendingDraft || appliedDefaultLocationRef.current) {
      return;
    }
    const savedLocation =
      savedLocations.data?.find((item) => item.isDefault) ??
      savedLocations.data?.[0];
    if (!savedLocation) return;
    const lat = Number(savedLocation.lat);
    const lng = Number(savedLocation.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    appliedDefaultLocationRef.current = true;
    const displayPrecision = [
      "CITY",
      "DISTRICT",
      "NEIGHBORHOOD",
      "MAP_POINT",
    ].includes(savedLocation.displayPrecision)
      ? (savedLocation.displayPrecision as NonNullable<
          LocationDraft["displayPrecision"]
        >)
      : "MAP_POINT";
    const displayArea =
      savedLocation.label ||
      savedLocation.regionLabel ||
      needMessages.needPublishingArea.savedLocation;
    const defaultLocation: LocationDraft = {
      sourceLocationId: savedLocation.id,
      displayPrecision,
      label: displayArea,
      regionLabel: savedLocation.regionLabel,
      lat,
      lng,
    };
    setDraftByMode((items) => ({
      visit: items.visit.area.trim()
        ? items.visit
        : {
            ...items.visit,
            area: displayArea,
            location: defaultLocation,
            areaConfirmed: true,
          },
      boarding: items.boarding.area.trim()
        ? items.boarding
        : {
            ...items.boarding,
            area: displayArea,
            location: defaultLocation,
            areaConfirmed: true,
          },
      custom: items.custom.area.trim()
        ? items.custom
        : {
            ...items.custom,
            area: displayArea,
            location: defaultLocation,
            areaConfirmed: true,
          },
    }));
    if (!areaConfirmed && !area.trim()) {
      setLocation(defaultLocation);
      setArea(displayArea);
      setAreaConfirmed(true);
    }
  }, [
    area,
    areaConfirmed,
    draftReady,
    needMessages.needPublishingArea.savedLocation,
    pendingDraft,
    savedLocations.data,
  ]);

  const applyDraft = (
    draft: NeedDraftSnapshot,
    preferredScreenId = draft.currentId,
  ) => {
    const restoredModeDrafts = (draft.draftByMode ?? {}) as Partial<
      Record<CareType, NeedModeDraftState>
    >;
    const restoredActiveMode = draft.careType
      ? restoredModeDrafts[draft.careType]
      : undefined;
    const restoredCustomNeeds =
      restoredActiveMode?.customNeeds ?? draft.customNeeds;
    const restoredCustomWarnings =
      restoredActiveMode?.customWarnings ?? draft.customWarnings;
    const restoredCustomRequirementsNotes =
      restoredActiveMode?.customRequirementsNotes ??
      draft.customRequirementsNotes ??
      "";
    appliedPreferredCurrencyRef.current = true;
    appliedDefaultLocationRef.current = true;
    setCareType(draft.careType);
    const petMap = new Map((savedPets.data ?? []).map((p) => [p.id, p]));
    const hydratedPets = draft.pets.map((pet) => {
      if (pet.sourcePetId && !pet.photo) {
        const saved = petMap.get(pet.sourcePetId);
        const photoUrl = saved?.photos?.[0]?.url;
        if (photoUrl) return { ...pet, photo: photoUrl };
      }
      return pet;
    });
    setPets(hydratedPets);
    const petIdMap = new Map<string, string>();
    hydratedPets.forEach((p) => {
      petIdMap.set(p.id, p.id);
      if (p.sourcePetId) petIdMap.set(p.sourcePetId, p.id);
    });
    const normalizedBoardingRoutines = (draft.boardingRoutines ?? []).map(
      (config) => ({
        ...config,
        routines: config.routines.map((routine) => {
          let petIds = routine.petIds.flatMap((id) => {
            const mapped = petIdMap.get(id);
            return mapped ? [mapped] : [];
          });
          if (!petIds.length && hydratedPets.length === 1) {
            petIds = [hydratedPets[0].id];
          }
          return {
            ...routine,
            petIds,
          };
        }),
      }),
    );
    setDates({ timeOfDay: "flexible", exactTime: "", ...draft.dates });
    setVisitFrequency(draft.visitFrequency);
    setCustomInterval(draft.customInterval);
    setFirstVisitDate(draft.dates.startDate || "");
    setVisitsPerDay(draft.visitsPerDay);
    setVisitTimes(draft.visitTimes);
    setExactTimes(draft.exactTimes);
    setVisitPlans(draft.visitPlans);
    setBoardingRoutines(normalizedBoardingRoutines);
    setBoardingSupplies(draft.boardingSupplies);
    setCustomBoardingSupplies(draft.customBoardingSupplies);
    setBoardingSupplyNotes(draft.boardingSupplyNotes);
    setSupplyCostMode(draft.supplyCostMode);
    supplyCostDefaultAppliedRef.current = true;
    setCustomPlans(draft.customPlans);
    setTaskNotes(draft.taskNotes);
    setBoardingNeeds(draft.boardingNeeds);
    setCustomBoardingRequirements(draft.customBoardingRequirements);
    setBoardingCompatibility(
      Object.fromEntries(
        Object.entries(draft.boardingCompatibility).filter(
          ([, choice]) => choice === "not-ok",
        ),
      ),
    );
    setCustomHomeSituations(draft.customHomeSituations);
    setBoardingHomeNotes(draft.boardingHomeNotes);
    setCustomNeeds(restoredCustomNeeds);
    setCustomWarnings(restoredCustomWarnings);
    setCustomRequirementsNotes(restoredCustomRequirementsNotes);
    setTransport(draft.transport);
    setSplitDirection(draft.splitDirection);
    setDistance(draft.distance);
    setArea(draft.area);
    setLocation(draft.location);
    setAreaConfirmed(Boolean(draft.areaConfirmed));
    setBudget(draft.budget);
    travelCostDefaultAppliedRef.current = true;
    const activeModeState: NeedModeDraftState = {
      ...emptyNeedModeDraft(),
      dates: {
        ...emptyNeedModeDraft().dates,
        ...draft.dates,
        timeOfDay: draft.dates.timeOfDay ?? "flexible",
        exactTime: draft.dates.exactTime ?? "",
      },
      visitFrequency: draft.visitFrequency,
      customInterval: draft.customInterval,
      firstVisitDate: draft.firstVisitDate ?? draft.dates.startDate,
      visitsPerDay: draft.visitsPerDay,
      visitTimes: draft.visitTimes,
      exactTimes: draft.exactTimes,
      visitPlans: draft.visitPlans,
      boardingRoutines: draft.boardingRoutines,
      boardingSupplies: draft.boardingSupplies,
      customBoardingSupplies: draft.customBoardingSupplies,
      boardingSupplyNotes: draft.boardingSupplyNotes,
      supplyCostMode: draft.supplyCostMode,
      customPlans: draft.customPlans,
      taskNotes: draft.taskNotes,
      boardingNeeds: draft.boardingNeeds,
      customBoardingRequirements: draft.customBoardingRequirements,
      boardingCompatibility: draft.boardingCompatibility,
      customHomeSituations: draft.customHomeSituations,
      boardingHomeNotes: draft.boardingHomeNotes,
      customNeeds: restoredCustomNeeds,
      customWarnings: restoredCustomWarnings,
      customRequirementsNotes: restoredCustomRequirementsNotes,
      transport: draft.transport,
      splitDirection: draft.splitDirection,
      distance: draft.distance,
      area: draft.area,
      location: draft.location,
      areaConfirmed: Boolean(draft.areaConfirmed),
      budget: draft.budget,
      confirmedScreenIds: draft.confirmedScreenIds ?? [],
      confirmedScreenSignatures: {},
    };
    setDraftByMode((items) => ({
      ...items,
      ...restoredModeDrafts,
      ...(draft.careType ? { [draft.careType]: activeModeState } : {}),
    }));
    setSupportingImages(
      (draft.attachments ?? []).map((attachment) => ({
        ...attachment,
        isUploading: false,
      })),
    );
    setServerDraftId(draft.serverDraftId);
    setPublishIdempotencyKey(draft.publishIdempotencyKey);
    setVisitedScreenIds(new Set(draft.visitedScreenIds));
    restoreConfirmationRef.current = true;
    setConfirmedScreenSignatures({});
    setConfirmedScreenIds(draft.confirmedScreenIds ?? []);
    const availableScreens = buildScreens(draft.careType, copy, flowCopy);
    const normalizedPreferredScreenId =
      draft.careType === "visit" && preferredScreenId === "frequency"
        ? "dates"
        : draft.careType === "boarding" && preferredScreenId === "transport"
          ? "area"
          : draft.careType === "custom" && preferredScreenId === "cautions"
            ? "requirements"
            : preferredScreenId;
    setCurrentId(
      availableScreens.some(
        (screen) => screen.id === normalizedPreferredScreenId,
      )
        ? normalizedPreferredScreenId
        : "care",
    );
  };

  useEffect(() => {
    if (!resumeDraftId || !authenticatedForDrafts) return;
    if (serverResumeDraft.isLoading || resumeDraftAppliedRef.current) return;
    if (serverResumeDraft.error || !serverResumeDraft.data?.mode) {
      if (editingNeedId) {
        setEditingLoadError("EDIT_DRAFT_NOT_FOUND");
      }
      setDraftReady(true);
      return;
    }
    try {
      const payload = serverResumeDraft.data.payload as Record<string, unknown>;
      const snapshot = mapNeedDraftPayloadToLegacyNeedDraftV3({
        draftId: serverResumeDraft.data.id,
        mode: serverResumeDraft.data.mode,
        payload,
        attachments: [],
      });
      const workspace = payload.workspace as
        | {
            common?: {
              publishIdempotencyKey?: string | null;
              confirmedScreenIds?: ScreenId[];
            };
            draftByMode?: Partial<Record<CareType, NeedModeDraftState>>;
          }
        | undefined;
      const validIds = new Set<ScreenId>([
        "care",
        "pets",
        "dates",
        "tasks",
        "supplies",
        "requirements",
        "area",
        "budget",
        "preview",
      ]);
      const requestedStep = serverResumeDraft.data.currentStep as ScreenId;
      const preferredStep = validIds.has(requestedStep)
        ? requestedStep
        : "preview";
      const screensForMode = buildScreens(snapshot.careType, copy, flowCopy);
      const preferredIndex = Math.max(
        0,
        screensForMode.findIndex((screen) => screen.id === preferredStep),
      );
      const restored: NeedDraftSnapshot = {
        ...snapshot,
        currentId: preferredStep,
        visitedScreenIds: screensForMode
          .slice(0, preferredIndex + 1)
          .map((screen) => screen.id),
        ...(workspace?.common?.confirmedScreenIds
          ? { confirmedScreenIds: workspace.common.confirmedScreenIds }
          : {}),
        ...(workspace?.draftByMode
          ? { draftByMode: workspace.draftByMode }
          : {}),
        ...(workspace?.common?.publishIdempotencyKey
          ? { publishIdempotencyKey: workspace.common.publishIdempotencyKey }
          : {}),
      };
      if (editingNeedId) {
        if (serverResumeDraft.data.editingNeedId !== editingNeedId) {
          throw new Error("EDIT_DRAFT_TARGET_MISMATCH");
        }
        editingDraftExistingRef.current = true;
        editingDraftDirtyRef.current = Boolean(serverResumeDraft.data.isDirty);
      }
      applyDraft(restored, preferredStep);
      setPendingDraft(null);
      setDraftReady(true);
      resumeDraftAppliedRef.current = true;
      window.history.replaceState(
        window.history.state,
        "",
        editingNeedId ? `/needs/edit/${editingNeedId}` : "/needs/create",
      );
    } catch {
      if (editingNeedId) {
        setEditingLoadError("EDIT_DRAFT_LOAD_FAILED");
      }
      setDraftReady(true);
    }
    // The response is the only source for this one-time server restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticatedForDrafts,
    editingNeedId,
    resumeDraftId,
    serverResumeDraft.data,
    serverResumeDraft.error,
    serverResumeDraft.isLoading,
  ]);

  useEffect(() => {
    if (!editingNeedId || resumeDraftId) return;
    let active = true;

    async function loadEditingNeed() {
      try {
        setEditingLoadError(null);
        const input = { id: editingNeedId! };
        // beginEdit is read-only until the user changes or publishes. A
        // single retry hides transient route-compilation/connection failures
        // without creating duplicate edit drafts.
        const draft = await beginEdit
          .mutateAsync(input)
          .catch(() => beginEdit.mutateAsync(input));
        if (!active) return;
        if (!draft.mode) throw new Error("EDIT_MODE_MISSING");
        editingDraftExistingRef.current = Boolean(draft.isExisting);
        editingDraftDirtyRef.current = Boolean(draft.isDirty);
        const snapshot = mapNeedDraftPayloadToLegacyNeedDraftV3({
          // A first edit is intentionally not persisted yet. Use a temporary
          // mapper key, then remove it so the persistence hook can lazily
          // create an editing draft on the first actual save.
          draftId: draft.id ?? crypto.randomUUID(),
          mode: draft.mode,
          payload: draft.payload,
          attachments: draft.attachments,
        });
        if (!draft.id) delete snapshot.serverDraftId;
        const payload = draft.payload as Record<string, unknown>;
        const workspace = payload.workspace as
          | {
              common?: {
                confirmedScreenIds?: ScreenId[];
                publishIdempotencyKey?: string | null;
              };
              draftByMode?: Partial<Record<CareType, NeedModeDraftState>>;
            }
          | undefined;
        const validIds = new Set<ScreenId>([
          "care",
          "pets",
          "dates",
          "tasks",
          "supplies",
          "requirements",
          "area",
          "budget",
          "preview",
        ]);
        const requestedStep = draft.currentStep as ScreenId;
        const preferredStep =
          draft.isExisting && validIds.has(requestedStep)
            ? requestedStep
            : "preview";
        const restored: NeedDraftSnapshot = {
          ...snapshot,
          currentId: preferredStep,
          ...(workspace?.common?.confirmedScreenIds
            ? { confirmedScreenIds: workspace.common.confirmedScreenIds }
            : {}),
          ...(workspace?.draftByMode
            ? { draftByMode: workspace.draftByMode }
            : {}),
          ...(workspace?.common?.publishIdempotencyKey
            ? { publishIdempotencyKey: workspace.common.publishIdempotencyKey }
            : {}),
        };
        applyDraft(restored, preferredStep);
        setServerDraftId(draft.id ?? undefined);
        setDraftReady(true);
        setPendingDraft(null);
      } catch (err) {
        console.error("Failed to load editing need:", err);
        if (active) {
          setEditingLoadError(
            err instanceof Error && err.message
              ? err.message
              : "NEED_EDIT_LOAD_FAILED",
          );
          setDraftReady(true);
        }
      }
    }

    void loadEditingNeed();
    return () => {
      active = false;
    };
  }, [editingNeedId]);

  useEffect(() => {
    if (editingNeedId || resumeDraftId) return;
    if (localDraftRestoreAppliedRef.current) return;
    localDraftRestoreAppliedRef.current = true;
    const restoreMode = new URLSearchParams(window.location.search).get(
      "restore",
    );
    try {
      const stored = window.localStorage.getItem(NEED_DRAFT_STORAGE_KEY);
      if (!stored) {
        setDraftReady(true);
        return;
      }
      const draft = parseLegacyNeedDraftV3(JSON.parse(stored));
      if (!draft) throw new Error("Unsupported or damaged draft");
      if (
        restoreMode === "preview" ||
        restoreMode === "auth" ||
        restoreMode === "edit"
      ) {
        applyDraft(draft, "preview");
        setDraftReady(true);
      } else {
        setPendingDraft(draft);
      }
    } catch {
      setDamagedDraftDetected(true);
      setDraftReady(false);
    } finally {
      if (restoreMode)
        window.history.replaceState(window.history.state, "", "/needs/create");
    }
  }, [editingNeedId, resumeDraftId]);

  const draftSnapshot = useMemo<NeedDraftSnapshot>(() => {
    const persistedModeDrafts = careType
      ? { ...draftByMode, [careType]: captureModeState() }
      : draftByMode;
    return {
      version: 3,
      savedAt: Date.now(),
      ...(serverDraftId ? { serverDraftId } : {}),
      ...(publishIdempotencyKey ? { publishIdempotencyKey } : {}),
      currentId,
      careType,
      pets,
      dates,
      visitFrequency,
      customInterval,
      firstVisitDate,
      visitsPerDay,
      visitTimes,
      exactTimes,
      visitPlans,
      boardingRoutines,
      boardingSupplies,
      customBoardingSupplies,
      boardingSupplyNotes,
      supplyCostMode,
      customPlans,
      taskNotes,
      boardingNeeds,
      customBoardingRequirements,
      boardingCompatibility,
      customHomeSituations,
      boardingHomeNotes,
      customNeeds,
      customWarnings,
      customRequirementsNotes,
      transport,
      splitDirection,
      distance,
      area,
      location,
      areaConfirmed,
      budget,
      draftByMode: persistedModeDrafts,
      attachments: supportingImages
        .filter(
          (image) =>
            !image.isUploading &&
            !image.id.startsWith("temp-") &&
            Boolean(image.url),
        )
        .map((image) => ({
          id: image.id,
          url: image.url,
          signature: image.signature,
        })),
      visitedScreenIds: Array.from(visitedScreenIds),
      confirmedScreenIds,
    };
  }, [
    area,
    areaConfirmed,
    boardingCompatibility,
    boardingHomeNotes,
    boardingNeeds,
    boardingRoutines,
    boardingSupplies,
    boardingSupplyNotes,
    budget,
    careType,
    currentId,
    customBoardingRequirements,
    customBoardingSupplies,
    customHomeSituations,
    customInterval,
    customNeeds,
    customPlans,
    customWarnings,
    customRequirementsNotes,
    draftByMode,
    dates,
    distance,
    exactTimes,
    firstVisitDate,
    location,
    pets,
    publishIdempotencyKey,
    serverDraftId,
    splitDirection,
    supportingImages,
    supplyCostMode,
    taskNotes,
    transport,
    visitFrequency,
    visitPlans,
    visitTimes,
    visitedScreenIds,
    visitsPerDay,
    captureModeState,
    confirmedScreenIds,
  ]);

  const draftPersistenceSignature = useMemo(() => {
    const {
      currentId: _currentId,
      visitedScreenIds: _visitedScreenIds,
      savedAt: _savedAt,
      serverDraftId: _serverDraftId,
      publishIdempotencyKey: _publishIdempotencyKey,
      ...persistableDraft
    } = draftSnapshot;
    return JSON.stringify(persistableDraft);
  }, [draftSnapshot]);
  const draftPersistenceSnapshot = useMemo(
    () => draftSnapshot,
    // Persist a newly assigned server id locally without treating navigation as content edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftPersistenceSignature, serverDraftId],
  );
  const editingContentSignature = useMemo(() => {
    if (!editingNeedId) return draftPersistenceSignature;
    try {
      const content = JSON.parse(draftPersistenceSignature) as Record<
        string,
        unknown
      >;
      delete content.confirmedScreenIds;
      const modeDrafts = content.draftByMode;
      if (modeDrafts && typeof modeDrafts === "object") {
        for (const mode of Object.values(modeDrafts)) {
          if (mode && typeof mode === "object") {
            delete (mode as Record<string, unknown>).confirmedScreenIds;
            delete (mode as Record<string, unknown>).confirmedScreenSignatures;
          }
        }
      }
      return JSON.stringify(content);
    } catch {
      return draftPersistenceSignature;
    }
  }, [draftPersistenceSignature, editingNeedId]);

  const writeDraftToLocalStorage = useCallback(
    (snapshot: NeedDraftSnapshot) => {
      saveLocalNeedDraft(window.localStorage, NEED_DRAFT_STORAGE_KEY, snapshot);
    },
    [],
  );
  const persistDraft = useCallback(() => {
    writeDraftToLocalStorage(draftSnapshot);
  }, [draftSnapshot, writeDraftToLocalStorage]);
  const persistAutosaveDraft = useCallback(() => {
    writeDraftToLocalStorage(draftPersistenceSnapshot);
  }, [draftPersistenceSnapshot, writeDraftToLocalStorage]);

  const hasStartedDraft = Boolean(
    careType ||
      pets.length ||
      dates.startDate ||
      dates.endDate ||
      taskNotes.trim() ||
      area.trim() ||
      budget.amount ||
      budget.maximum,
  );

  const editingDirty =
    !editingNeedId ||
    editingDraftDirtyRef.current ||
    (editingBaselineSignatureRef.current !== null &&
      editingBaselineSignatureRef.current !== editingContentSignature);
  const needsServerDraftSync =
    hasStartedDraft && (!editingNeedId || editingDirty);

  const serverDraftPersistence = useNeedDraftV2Persistence({
    enabled: publishingV2Enabled,
    authenticated: authenticatedForDrafts,
    snapshot:
      draftReady && !pendingDraft && !publishOutcome && needsServerDraftSync
        ? draftPersistenceSnapshot
        : null,
    editingNeedId,
    onServerDraftId: setServerDraftId,
  });

  const serverSyncing =
    authLoading ||
    (authenticatedForDrafts &&
      needsServerDraftSync &&
      serverDraftPersistence.saveState === "saving");

  useEffect(() => {
    if (!draftReady || pendingDraft) return;
    if (!hasStartedDraft) return;
    const timer = window.setTimeout(persistAutosaveDraft, 400);
    return () => window.clearTimeout(timer);
  }, [draftReady, hasStartedDraft, pendingDraft, persistAutosaveDraft]);

  const saveBeforeExit = () => {
    if (hasStartedDraft) persistDraft();
  };

  const exitFlow = async () => {
    saveBeforeExit();
    if (editingNeedId) {
      if (!editingDirty) {
        await serverDraftPersistence.abandonDraft().catch(() => undefined);
        router.push("/dashboard/needs");
        return;
      }
      if (publishingV2Enabled && authenticatedForDrafts && hasStartedDraft) {
        try {
          await serverDraftPersistence.saveNow(draftSnapshot);
        } catch {
          return;
        }
      }
      router.push("/dashboard/needs");
      return;
    }
    if (publishingV2Enabled && authenticatedForDrafts && hasStartedDraft) {
      try {
        await serverDraftPersistence.saveNow(draftSnapshot);
      } catch {
        return;
      }
      router.push("/dashboard/needs?tab=drafts");
      return;
    }
    const entryRoute =
      window.sessionStorage.getItem(NEED_ENTRY_STORAGE_KEY) || "/";
    router.push(entryRoute.startsWith("/needs/create") ? "/" : entryRoute);
  };

  const resumeDraft = () => {
    if (!pendingDraft) return;
    applyDraft(pendingDraft);
    setPendingDraft(null);
    setDraftReady(true);
  };

  const discardDraft = () => {
    void serverDraftPersistence.abandonDraft().catch(() => undefined);
    window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
    setServerDraftId(undefined);
    setPendingDraft(null);
    setDraftReady(true);
  };

  const screens = useMemo(
    () => localizedNeedScreens(careType, copy, flowCopy),
    [careType, copy, flowCopy],
  );
  const currentIndex = Math.max(
    0,
    screens.findIndex((screen) => screen.id === currentId),
  );
  const current = screens[currentIndex];
  const activeTasks = careType === "custom" ? customPlans : visitPlans;
  const activeTaskOptions = careType === "custom" ? customTasks : visitTasks;
  const setActiveTasks = careType === "custom" ? setCustomPlans : setVisitPlans;
  const petsValid = pets.length > 0 && pets.every(isPetProfileComplete);
  const dateRangeValid = Boolean(
    dates.startDate && dates.endDate && dates.startDate <= dates.endDate,
  );
  const plannedVisitDates =
    careType === "visit"
      ? buildVisitDates({
          dates,
          visitFrequency,
          customInterval,
          firstVisitDate,
        })
      : [];
  const exactTimesValid =
    careType === "visit"
      ? !visitTimes
          .slice(0, visitsPerDay)
          .some((timeMode, index) => timeMode === "exact" && !exactTimes[index])
      : careType === "custom"
        ? dates.timeOfDay !== "exact" || Boolean(dates.exactTime?.trim())
        : true;
  const datesValid =
    dateRangeValid &&
    exactTimesValid &&
    (careType !== "visit" || plannedVisitDates.length > 0);
  const boardingRoutineItems = boardingRoutines.flatMap(
    (config) => config.routines,
  );
  const boardingSupplyItems = boardingSupplyOptions(
    pets,
    customBoardingSupplies,
  );
  const sitterSupplyCount = countBoardingSupplyArrangements(
    pets,
    boardingSupplyItems,
    boardingSupplies,
    "sitter",
  );
  const petMatches = (petId: string) =>
    pets.some(
      (pet) =>
        pet.id === petId || (pet.sourcePetId && pet.sourcePetId === petId),
    );
  const boardingTasksHavePetMatches =
    boardingRoutineItems.length > 0 &&
    boardingRoutineItems.every((routine) => routine.petIds.some(petMatches));
  const boardingSchedulesValid = true;
  const tasksHavePetMatches =
    activeTasks.length > 0 &&
    activeTasks.every((task) => task.petIds.some(petMatches));
  const everyVisitHasTasks =
    careType !== "visit" ||
    Array.from({ length: visitsPerDay }, (_, index) => index + 1).every(
      (visit) => activeTasks.some((task) => task.visitNumbers.includes(visit)),
    );
  const everyPetHasTasks =
    pets.length > 0 &&
    pets.every((pet) =>
      (careType === "boarding" ? boardingRoutineItems : activeTasks).some(
        (task) =>
          task.petIds.includes(pet.id) ||
          (pet.sourcePetId && task.petIds.includes(pet.sourcePetId)),
      ),
    );
  const tasksValid =
    careType === "boarding"
      ? boardingTasksHavePetMatches &&
        boardingSchedulesValid &&
        everyPetHasTasks
      : tasksHavePetMatches && everyVisitHasTasks && everyPetHasTasks;
  const boardingDistanceValid =
    careType !== "boarding" || distance !== "Custom distance";
  const areaValid =
    areaConfirmed && Boolean(area.trim()) && boardingDistanceValid;
  const careBudgetValid =
    budget.mode === "open" ||
    (budget.mode === "exact"
      ? Number(budget.amount) > 0
      : Number(budget.amount) > 0 &&
        Number(budget.maximum) > Number(budget.amount));
  const boardingTransportNeedsBudget =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split");
  const travelBudgetValid =
    careType === "visit"
      ? budget.travelMode !== "fixed" || Number(budget.travelAmount) > 0
      : !boardingTransportNeedsBudget ||
        (budget.travelMode !== "none" &&
          (budget.travelMode !== "fixed" || Number(budget.travelAmount) > 0));
  const supplyBudgetValid =
    careType !== "boarding" ||
    !sitterSupplyCount ||
    supplyCostMode !== "fixed" ||
    (budget.supplyAmount.trim() !== "" && Number(budget.supplyAmount) >= 0);
  const budgetValid = careBudgetValid && travelBudgetValid && supplyBudgetValid;
  useEffect(() => {
    if (currentId !== "budget") return;
    if (
      careType === "boarding" &&
      sitterSupplyCount > 0 &&
      !supplyCostDefaultAppliedRef.current
    ) {
      // The default is introduced only when sitter-provided supplies make
      // this cost applicable. It is not present in untouched mode branches.
      setSupplyCostMode("reimburse");
      supplyCostDefaultAppliedRef.current = true;
    }
    const travelApplies =
      careType === "visit" ||
      (careType === "boarding" &&
        (transport === "sitter" || transport === "split"));
    if (travelApplies && !travelCostDefaultAppliedRef.current) {
      setBudget((current) => ({ ...current, travelMode: "actual" }));
      travelCostDefaultAppliedRef.current = true;
    }
  }, [careType, currentId, sitterSupplyCount, transport]);
  const pricing = calculateNeedPricing(
    pricingInputFromDraft({
      careType: careType ?? "visit",
      dates,
      budget,
      visitFrequency,
      customInterval,
      firstVisitDate: firstVisitDate || dates.startDate,
      visitsPerDay,
      transport,
      sitterSupplyCount,
      supplyCostMode,
    }),
  );
  const isScreenValid = (id: ScreenId) => {
    switch (id) {
      case "care":
        return Boolean(careType);
      case "pets":
        return petsValid;
      case "dates":
        return datesValid;
      case "tasks":
        return tasksValid;
      case "supplies":
        return true;
      case "requirements":
        return true;
      case "area":
        return areaValid;
      case "budget":
        return budgetValid;
      case "preview":
        return blockingScreenIds.size === 0;
      default:
        return true;
    }
  };
  const screenSignature = (id: ScreenId) => {
    switch (id) {
      case "care":
        return JSON.stringify(careType);
      case "pets":
        return JSON.stringify(pets);
      case "dates":
        return JSON.stringify({
          dates,
          visitFrequency,
          customInterval,
          firstVisitDate,
          visitsPerDay,
          visitTimes,
          exactTimes,
        });
      case "tasks":
        return JSON.stringify({ activeTasks, boardingRoutines, taskNotes });
      case "supplies":
        return JSON.stringify({
          boardingSupplies,
          customBoardingSupplies,
          boardingSupplyNotes,
        });
      case "requirements":
        return JSON.stringify({
          boardingNeeds,
          customBoardingRequirements,
          boardingCompatibility,
          customHomeSituations,
          boardingHomeNotes,
          customNeeds,
          customWarnings,
          customRequirementsNotes,
        });
      case "area":
        return JSON.stringify({
          area,
          location,
          areaConfirmed,
          distance,
          transport,
          splitDirection,
        });
      case "budget":
        return JSON.stringify({ budget, supplyCostMode });
      case "preview":
        return JSON.stringify({ careType, pets, activeTasks, budget, area });
      default:
        return "";
    }
  };
  const confirmedFor = (id: ScreenId) =>
    confirmedScreenSignatures[id] === screenSignature(id);
  const unconfirmedIndex = screens.findIndex(
    (screen) => !confirmedFor(screen.id),
  );
  const frontierIndex =
    unconfirmedIndex === -1 ? screens.length - 1 : unconfirmedIndex;
  useEffect(() => {
    // A restored edit may have been saved on a later step and then become
    // invalid because an earlier value changed. Once confirmation signatures
    // have hydrated, return to the first unresolved step instead of leaving
    // the user on a locked/stale screen.
    if (
      !draftReady ||
      !careType ||
      editingLoadError ||
      restoreConfirmationRef.current
    ) {
      return;
    }
    const index = screens.findIndex((screen) => screen.id === currentId);
    if (index > frontierIndex) setCurrentId(screens[frontierIndex].id);
  }, [
    careType,
    currentId,
    draftReady,
    editingLoadError,
    frontierIndex,
    screens,
  ]);
  useEffect(() => {
    if (!draftReady || !careType) return;
    if (editingNeedId && !editingBaselineSignatureRef.current) {
      editingBaselineSignatureRef.current = editingContentSignature;
    }
    if (
      editingNeedId &&
      !editBaselineAppliedRef.current &&
      !editingDraftExistingRef.current
    ) {
      const baseline = Object.fromEntries(
        screens
          .filter((screen) => screen.id !== "preview")
          .map((screen) => [screen.id, screenSignature(screen.id)]),
      ) as Partial<Record<ScreenId, string>>;
      setConfirmedScreenSignatures(baseline);
      setConfirmedScreenIds(
        screens
          .filter((screen) => screen.id !== "preview")
          .map((screen) => screen.id),
      );
      editBaselineAppliedRef.current = true;
      restoreConfirmationRef.current = false;
      return;
    }
    if (restoreConfirmationRef.current) {
      const restored = Object.fromEntries(
        screens
          .filter((screen) => confirmedScreenIds.includes(screen.id))
          .map((screen) => [screen.id, screenSignature(screen.id)]),
      ) as Partial<Record<ScreenId, string>>;
      setConfirmedScreenSignatures(restored);
      restoreConfirmationRef.current = false;
    }
    // This effect intentionally runs once after a restored/edit baseline has
    // hydrated. Later changes are detected by signature mismatch instead of
    // being silently marked complete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    careType,
    confirmedScreenIds,
    draftReady,
    editingContentSignature,
    editingNeedId,
    screens,
  ]);
  const blockingScreenIds = new Set<ScreenId>([
    ...(!careType ? ["care" as ScreenId] : []),
    ...(!petsValid ? ["pets" as ScreenId] : []),
    ...(!datesValid ? ["dates" as ScreenId] : []),
    ...(!tasksValid ? ["tasks" as ScreenId] : []),
    ...(!areaValid ? ["area" as ScreenId] : []),
    ...(!budgetValid ? ["budget" as ScreenId] : []),
  ]);
  const invalidScreenIds = new Set<ScreenId>(
    [...blockingScreenIds].filter(
      (id) =>
        currentId === "preview" ||
        validationAttemptedScreenIds.has("preview") ||
        validationAttemptedScreenIds.has(id),
    ),
  );
  const revealAllValidation =
    currentId === "preview" || validationAttemptedScreenIds.has("preview");
  useEffect(() => {
    const scrollRegion = document.querySelector<HTMLElement>(
      "[data-need-flow-scroll-region]",
    );
    if (scrollRegion) {
      scrollRegion.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentId]);
  const canPublish =
    !authLoading &&
    blockingScreenIds.size === 0 &&
    frontierIndex >= screens.length - 1 &&
    (!editingNeedId ||
      !editingDirty ||
      (Boolean(serverDraftId) && !editingLoadError));
  const publishingSteps = screens.map<PublishingStep>((screen, index) => ({
    id: screen.id,
    label: screen.label,
    state:
      index === currentIndex
        ? "current"
        : invalidScreenIds.has(screen.id)
          ? "attention"
          : index > frontierIndex
            ? "locked"
            : confirmedFor(screen.id)
              ? "complete"
              : "attention",
  }));
  const markScreenVisited = (id: ScreenId) =>
    setVisitedScreenIds((items) => {
      if (items.has(id)) return items;
      const next = new Set(items);
      next.add(id);
      return next;
    });

  const goNext = () => {
    if (!isScreenValid(currentId)) {
      markScreenVisited(currentId);
      setValidationAttemptedScreenIds((items) => {
        const next = new Set(items);
        next.add(currentId);
        return next;
      });
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const scrollRegion = document.querySelector<HTMLElement>(
            "[data-need-flow-scroll-region]",
          );
          const firstError = scrollRegion?.querySelector<HTMLElement>(
            '[role="alert"], [aria-invalid="true"]',
          );
          firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
      return;
    }
    setConfirmedScreenSignatures((items) => ({
      ...items,
      [currentId]: screenSignature(currentId),
    }));
    setConfirmedScreenIds((items) =>
      items.includes(currentId) ? items : [...items, currentId],
    );
    markScreenVisited(currentId);
    setCurrentId(screens[Math.min(currentIndex + 1, screens.length - 1)].id);
  };
  const goBack = () => {
    markScreenVisited(currentId);
    if (currentIndex > 0) setCurrentId(screens[currentIndex - 1].id);
  };
  const selectScreen = (index: number) => {
    if (index > frontierIndex) return;
    if (screens[index].id !== currentId) markScreenVisited(currentId);
    setCurrentId(screens[index].id);
  };
  const handlePublish = async () => {
    setPublishError(null);
    if (authLoading) return;
    if (blockingScreenIds.size > 0) {
      setValidationAttemptedScreenIds((items) => {
        const next = new Set(items);
        next.add("preview");
        blockingScreenIds.forEach((id) => next.add(id));
        return next;
      });
      const firstBlockingScreen = screens.find((screen) =>
        blockingScreenIds.has(screen.id),
      );
      if (firstBlockingScreen) setCurrentId(firstBlockingScreen.id);
      setPublishError(copy.publishError);
      return;
    }
    if (!authenticatedForDrafts) {
      persistDraft();
      const context = needPublishingContinuationToken
        ? `&needPublishContext=${encodeURIComponent(needPublishingContinuationToken)}`
        : "";
      openAuthModal(`/needs/create?restore=auth${context}`);
      return;
    }
    if (authLoading) {
      return;
    }
    if (!publishingV2Enabled) {
      persistDraft();
      setShowNotice(true);
      return;
    }
    setIsPublishing(true);
    try {
      const idempotencyKey = publishIdempotencyKey ?? crypto.randomUUID();
      const publishSnapshot = {
        ...draftSnapshot,
        publishIdempotencyKey: idempotencyKey,
      };
      setPublishIdempotencyKey(idempotencyKey);
      writeDraftToLocalStorage(publishSnapshot);
      const result = await serverDraftPersistence.saveAndRun(
        publishSnapshot,
        async (draft) => {
          const mapped = mapLegacyNeedDraftV3(
            publishSnapshot,
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          );
          if (!mapped.mode || !careType)
            throw new Error("PUBLISH_MODE_MISSING");
          const input = needPublishSchema.parse({
            ...mapped.payload,
            schemaVersion: 1,
            draftId: draft.id,
            revision: draft.revision,
            idempotencyKey,
            mode: mapped.mode,
          });
          return publishNeed.mutateAsync(input);
        },
      );
      serverDraftPersistence.finalizePublished();
      setPublishOutcome({
        needId: result.needId,
        edited: result.edited,
        shouldPromptForEmail: result.notificationPrompt.shouldPrompt,
      });
      window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
      setShowNotice(false);
      toast.success(
        result.edited
          ? lang === "zh"
            ? "需求已更新"
            : copy.requestUpdated
          : lang === "zh"
            ? "需求已发布"
            : copy.requestPublished,
      );
      const returnTo = searchParams.get("returnTo");
      const entryRoute =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(NEED_ENTRY_STORAGE_KEY)
          : null;
      const destination = returnTo
        ? returnTo
        : entryRoute &&
            !entryRoute.startsWith("/needs/create") &&
            !entryRoute.startsWith("/needs/edit")
          ? entryRoute
          : "/dashboard/needs";
      router.replace(destination);
    } catch (error) {
      console.error("[guided-need-flow] publish error:", error);
      const isExpired =
        error instanceof Error &&
        error.message.includes("NEED_ALREADY_EXPIRED");
      if (isExpired) {
        setPublishError(flowCopy.expired);
      } else if (error instanceof z.ZodError) {
        const issues = error.issues
          .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
          .join("; ");
        setPublishError(`${copy.publishError} (${issues})`);
      } else if (error instanceof Error && error.message) {
        setPublishError(`${copy.publishError} (${error.message})`);
      } else {
        setPublishError(copy.publishError);
      }
    } finally {
      setIsPublishing(false);
    }
  };
  const updatePet = (id: string, patch: Partial<PetDraft>) =>
    setPets((items) =>
      items.map((pet) => (pet.id === id ? { ...pet, ...patch } : pet)),
    );
  const removePet = (id: string) => {
    const removedPet = pets.find((pet) => pet.id === id);
    const removedReferences = new Set(
      [id, removedPet?.sourcePetId].filter((value): value is string =>
        Boolean(value),
      ),
    );
    setPets((items) => items.filter((pet) => pet.id !== id));
    const keepTaskWithoutRemovedPet = <T extends { petIds: string[] }>(
      task: T,
    ) => ({
      ...task,
      petIds: task.petIds.filter((petId) => !removedReferences.has(petId)),
    });
    setVisitPlans((items) => items.map(keepTaskWithoutRemovedPet));
    setCustomPlans((items) => items.map(keepTaskWithoutRemovedPet));
    setBoardingRoutines((configs) =>
      configs.map((config) => ({
        ...config,
        routines: config.routines.map(keepTaskWithoutRemovedPet),
      })),
    );
  };
  const changeVisitCount = (count: number) => {
    const safeCount = Math.max(1, Math.min(6, count));
    setVisitsPerDay(safeCount);
    setVisitTimes(
      Array.from(
        { length: safeCount },
        (_, index) => visitTimes[index] || "flexible",
      ),
    );
    setExactTimes(
      Array.from({ length: safeCount }, (_, index) => exactTimes[index] || ""),
    );
    setVisitPlans((items) =>
      items
        .filter((task) => task.visitNumbers.some((visit) => visit <= safeCount))
        .map((task) => ({
          ...task,
          visitNumbers: task.visitNumbers.filter((visit) => visit <= safeCount),
          ...(task.orderByVisit
            ? {
                orderByVisit: Object.fromEntries(
                  Object.entries(task.orderByVisit).filter(
                    ([visit]) => Number(visit) <= safeCount,
                  ),
                ),
              }
            : {}),
        })),
    );
  };
  const changeVisitDates = (next: {
    startDate: string;
    endDate: string;
    notes: string;
  }) => {
    setDates((current) => ({ ...current, ...next }));
    setFirstVisitDate(next.startDate);
  };

  return {
    lang,
    t,
    needMessages,
    copy,
    flowCopy,
    router,
    authenticatedForDrafts,
    currentId,
    careType,
    pets,
    setPets,
    dates,
    setDates,
    visitFrequency,
    setVisitFrequency,
    customInterval,
    setCustomInterval,
    firstVisitDate,
    visitsPerDay,
    visitTimes,
    setVisitTimes,
    exactTimes,
    setExactTimes,
    boardingRoutines,
    setBoardingRoutines,
    boardingSupplies,
    setBoardingSupplies,
    customBoardingSupplies,
    setCustomBoardingSupplies,
    boardingSupplyNotes,
    setBoardingSupplyNotes,
    supplyCostMode,
    setSupplyCostMode,
    customPlans,
    setCustomPlans,
    taskNotes,
    setTaskNotes,
    boardingNeeds,
    setBoardingNeeds,
    customBoardingRequirements,
    setCustomBoardingRequirements,
    boardingCompatibility,
    setBoardingCompatibility,
    customHomeSituations,
    setCustomHomeSituations,
    boardingHomeNotes,
    setBoardingHomeNotes,
    customNeeds,
    setCustomNeeds,
    customWarnings,
    setCustomWarnings,
    customRequirementsNotes,
    setCustomRequirementsNotes,
    transport,
    setTransport,
    splitDirection,
    setSplitDirection,
    distance,
    setDistance,
    area,
    setArea,
    location,
    setLocation,
    areaConfirmed,
    setAreaConfirmed,
    budget,
    setBudget,
    supportingImages,
    showNotice,
    setShowNotice,
    publishOutcome,
    publishError,
    validationAttemptedScreenIds,
    pendingDraft,
    damagedDraftDetected,
    setDamagedDraftDetected,
    draftReady,
    setDraftReady,
    editingLoadError,
    appliedPreferredCurrencyRef,
    isPublishing,
    publishNeed,
    savedPets,
    savedLocations,
    switchCareType,
    persistDraft,
    serverDraftPersistence,
    serverSyncing,
    exitFlow,
    resumeDraft,
    discardDraft,
    screens,
    currentIndex,
    current,
    activeTasks,
    activeTaskOptions,
    setActiveTasks,
    petsValid,
    plannedVisitDates,
    datesValid,
    boardingSupplyItems,
    sitterSupplyCount,
    tasksValid,
    areaValid,
    budgetValid,
    pricing,
    revealAllValidation,
    canPublish,
    publishingSteps,
    goNext,
    goBack,
    selectScreen,
    handlePublish,
    updatePet,
    removePet,
    changeVisitCount,
    changeVisitDates,
  };
}
