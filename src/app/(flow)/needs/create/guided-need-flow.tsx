"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import type { IconType } from "react-icons";
import {
  PiBowlFood,
  PiBroom,
  PiCalendarBlank,
  PiCheckCircle,
  PiCurrencyCircleDollar,
  PiDrop,
  PiGameController,
  PiHouseLine,
  PiMapPin,
  PiPackage,
  PiPawPrint,
  PiPersonSimpleWalk,
  PiPill,
  PiQuestion,
  PiShieldCheck,
  PiSparkle,
} from "react-icons/pi";

import { useAuthModal } from "@/modules/auth/client/auth-modal-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { getCareTypeIcon, getTaskIcon } from "@/domain/care/care-icons";
import { messages } from "@/i18n/messages";
import type { PublishingStep } from "@/components/publishing/publishing-flow-shell";
import { GuidedNeedFlowLayout } from "./guided-need-flow-layout";
import {
  DraftRecoveryDialogs,
  PublishFeedback,
} from "./guided-need-flow-feedback";
import {
  StepCareType,
  StepPets,
  createPet,
  draftPetFromProfile,
  StepScheduleBoarding,
  StepScheduleCustom,
  StepScheduleVisitDates,
  StepScheduleVisitTiming,
  StepVisitTasks,
  StepBoardingTasks,
  StepCustomTasks,
  StepSupplies,
  StepRequirementsBoarding,
  StepRequirementsCustom,
  StepBudget,
  StepPreview,
} from "./steps";
import {
  boardingNights,
  buildTitle,
  buildVisitDates,
  isPetProfileComplete,
} from "./guided-need-flow-shared";
import { useNeedDraftV2Persistence } from "@/components/publishing/use-need-draft-v2-persistence";
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
import { trpc } from "@/utils/trpc";
import type { ImageItem } from "@/domain/attachment/type";
import {
  NEED_DRAFT_STORAGE_KEY,
  NEED_ENTRY_STORAGE_KEY,
} from "./preview/types";

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

type ScreenDefinition = {
  id: ScreenId;
  chapter: string;
  label: string;
  title: string;
  description: string;
  icon: IconType;
};

const visitTasks = [
  "feeding",
  "water",
  "cleaning",
  "play",
  "walk",
  "medication",
  "safety",
].map((id) => ({ id, label: id, icon: getTaskIcon(id) }));

const boardingTasks = [
  "boarding-feeding",
  "boarding-water",
  "boarding-cleaning",
  "boarding-walks",
  "boarding-medication",
  "boarding-play",
  "boarding-grooming",
  "boarding-nails",
  "boarding-updates",
].map((id) => ({ id, label: id, icon: getTaskIcon(id) }));

const customTasks = [
  "transport",
  "vet",
  "enclosure",
  "pickup",
  "supervision",
].map((id) => ({ id, label: id, icon: getTaskIcon(id) }));

function buildScreens(careType: CareType | null): ScreenDefinition[] {
  const branch = careType ?? "visit";
  const dateCopy: Record<
    CareType,
    Pick<ScreenDefinition, "title" | "description">
  > = {
    visit: {
      title: "When should visits happen?",
      description:
        "Choose the care dates, visit frequency, and preferred times.",
    },
    boarding: {
      title: "When will your pet stay with the sitter?",
      description:
        "Choose the expected drop-off and pickup dates for the stay.",
    },
    custom: {
      title: "When do you need help?",
      description:
        "Set the expected start and end dates. Add a note if the timing is flexible or irregular.",
    },
  };
  const commonStart: ScreenDefinition[] = [
    {
      id: "care",
      chapter: "Start",
      label: "Care type",
      title: "What kind of care do you need?",
      description:
        "Choose the option that comes closest. You can change it later without losing work in the other care plans.",
      icon: PiHouseLine,
    },
    {
      id: "pets",
      chapter: "Your pets",
      label: "Pets",
      title: "Who needs to be cared for?",
      description:
        "Add each pet once. Pets of the same type are grouped automatically so they can share one care plan.",
      icon: PiPawPrint,
    },
    {
      id: "dates",
      chapter: "Schedule",
      label: branch === "visit" ? "Dates & visits" : "Dates",
      ...dateCopy[branch],
      icon: PiCalendarBlank,
    },
  ];
  const branchScreens: Record<CareType, ScreenDefinition[]> = {
    visit: [
      {
        id: "tasks",
        chapter: "Care plan",
        label: "Tasks",
        title: "What should happen during each visit?",
        description:
          "Pick the tasks you’d like your sitter to include each time they visit.",
        icon: PiCheckCircle,
      },
    ],
    boarding: [
      {
        id: "tasks",
        chapter: "Boarding plan",
        label: "Care routines",
        title: "What care routines should the sitter follow?",
        description:
          "Add daily routines, repeating care, and one-time tasks for each pet.",
        icon: PiCheckCircle,
      },
      {
        id: "supplies",
        chapter: "Boarding plan",
        label: "Supplies",
        title: "What supplies does your pet need?",
        description:
          "List the supplies your pet needs and note whether you’ll bring each item or the sitter should provide it. If the sitter needs to provide anything, you can decide how to handle those costs later in Budget.",
        icon: PiPackage,
      },
      {
        id: "requirements",
        chapter: "Boarding plan",
        label: "Home fit",
        title: "What kind of home is a good fit for your pet?",
        description:
          "Tell sitters what your pet needs and which home situations will or won’t work.",
        icon: PiHouseLine,
      },
    ],
    custom: [
      {
        id: "tasks",
        chapter: "Custom plan",
        label: "Tasks",
        title: "What do you need help with?",
        description:
          "Pick from common tasks like pet transport or vet visits, or add your own, and choose which pets need them.",
        icon: PiCheckCircle,
      },
      {
        id: "requirements",
        chapter: "Custom plan",
        label: "Requirements & cautions",
        title: "What should the sitter know before accepting?",
        description:
          "Specify sitter requirements, pet quirks, or safety notes so sitters can confirm they’re a good fit before accepting.",
        icon: PiShieldCheck,
      },
    ],
  };
  const areaCopy: Record<
    CareType,
    Pick<ScreenDefinition, "title" | "description">
  > = {
    visit: {
      title: "Where is care needed?",
      description:
        "Set the approximate location where care is needed. We’ll use it to recommend nearby sitters.",
    },
    boarding: {
      title: "How will your pet get to the boarding home?",
      description:
        "Choose the approximate starting area, preferred travel distance, and who will handle drop-off and pickup. Any sitter travel costs can be arranged in Budget.",
    },
    custom: {
      title: "Where will this service take place?",
      description:
        "Set the approximate area where the service begins or takes place (such as your home, clinic, or meeting point) to help nearby sitters judge the distance.",
    },
  };
  return [
    ...commonStart,
    ...branchScreens[branch],
    {
      id: "area",
      chapter: "Location",
      label:
        branch === "boarding"
          ? "Location & travel"
          : branch === "visit"
            ? "Care location"
            : "Service location",
      ...areaCopy[branch],
      icon: PiMapPin,
    },
    {
      id: "budget",
      chapter: "Budget",
      label: "Budget",
      title: "What budget feels right?",
      description:
        "Choose an exact amount, a range, or invite sitters to suggest a price.",
      icon: PiCurrencyCircleDollar,
    },
    {
      id: "preview",
      chapter: "Review",
      label: "Preview",
      title: "Ready to review your request?",
      description:
        "Check the public-facing summary before sending it to the server.",
      icon: PiCheckCircle,
    },
  ];
}

type NeedPublishingCopy = typeof messages.en.core.needPublishing;

function localizedNeedScreens(
  careType: CareType | null,
  copy: NeedPublishingCopy,
  lang: "en" | "zh" | "ja",
) {
  const screens = buildScreens(careType);
  const boardingAreaCopy = {
    en: {
      title: "How will your pet get to the boarding home?",
      description:
        "Choose the approximate starting area, preferred travel distance, and who will handle drop-off and pickup. Any sitter travel costs can be arranged in Budget.",
    },
    zh: {
      title: "宠物如何前往寄养家庭？",
      description:
        "设置宠物出发的大致位置、可接受的寄养距离，以及送达和接回方式；如需寄养家庭接送，相关费用可在预算中安排。",
    },
    ja: {
      title: "ペットは預かり家庭へどう移動しますか？",
      description:
        "出発するおおよその場所、希望する移動距離、送り届けと迎えの担当を設定します。シッターの交通費は予算で調整できます。",
    },
  }[lang];
  return screens.map((screen) => {
    const branch = careType ?? "visit";
    const screenCopy =
      screen.id === "care"
        ? copy.screens.care
        : screen.id === "pets"
          ? copy.screens.pets
          : screen.id === "dates"
            ? copy.screens[
                `${branch}Dates` as
                  | "visitDates"
                  | "boardingDates"
                  | "customDates"
              ]
            : screen.id === "frequency"
              ? copy.screens.visitDates
              : screen.id === "tasks"
                ? copy.screens[
                    branch === "boarding"
                      ? "boardingTasks"
                      : branch === "custom"
                        ? "customTasks"
                        : "visitTasks"
                  ]
                : screen.id === "supplies"
                  ? copy.screens.supplies
                  : screen.id === "requirements"
                    ? copy.screens[
                        branch === "boarding"
                          ? "requirements"
                          : "customRequirements"
                      ]
                    : screen.id === "cautions"
                      ? copy.screens.cautions
                      : screen.id === "transport"
                        ? copy.screens.transport
                        : screen.id === "area"
                          ? copy.screens[
                              `${branch}Area` as
                                | "visitArea"
                                | "boardingArea"
                                | "customArea"
                            ]
                          : screen.id === "budget"
                            ? copy.screens.budget
                            : copy.screens.preview;
    const chapter =
      screen.id === "care"
        ? copy.chapters.start
        : screen.id === "pets"
          ? copy.chapters.pets
          : screen.id === "dates" || screen.id === "frequency"
            ? copy.chapters.schedule
            : screen.id === "tasks"
              ? copy.chapters[
                  branch === "visit"
                    ? "carePlan"
                    : branch === "boarding"
                      ? "boardingPlan"
                      : "customPlan"
                ]
              : screen.id === "supplies" ||
                (screen.id === "requirements" && branch === "boarding")
                ? copy.chapters.boardingPlan
                : screen.id === "requirements" && branch === "custom"
                  ? copy.chapters.customPlan
                  : screen.id === "cautions"
                    ? copy.chapters.customPlan
                    : screen.id === "area"
                      ? copy.chapters.location
                      : screen.id === "transport"
                        ? copy.chapters.transport
                        : screen.id === "budget"
                          ? copy.chapters.budget
                          : copy.chapters.review;
    const label =
      screen.id === "frequency"
        ? copy.steps.frequency
        : screen.id === "requirements" && branch === "boarding"
          ? { en: "Home fit", zh: "家庭条件", ja: "家庭条件" }[lang]
          : screen.id === "requirements" && branch === "custom"
            ? {
                en: "Requirements & cautions",
                zh: "接单要求与注意事项",
                ja: "依頼条件・安全事項",
              }[lang]
          : screen.id === "area" && branch === "boarding"
            ? {
                en: "Location & travel",
                zh: "地点与接送",
                ja: "場所・送迎",
              }[lang]
            : screen.id === "area" && branch === "visit"
              ? { en: "Care location", zh: "照护地点", ja: "お世話場所" }[
                  lang
                ]
            : screen.id === "area" && branch === "custom"
              ? {
                  en: "Service location",
                  zh: "服务地点",
                  ja: "依頼場所",
                }[lang]
        : copy.steps[screen.id as keyof typeof copy.steps];
    return {
      ...screen,
      chapter,
      label,
      title:
        screen.id === "area" && branch === "boarding"
          ? boardingAreaCopy.title
          : screenCopy.title,
      description:
        screen.id === "area" && branch === "boarding"
          ? boardingAreaCopy.description
          : screenCopy.description,
    };
  });
}

export function GuidedNeedFlow({
  publishingV2Enabled = false,
  validationProfileSession = false,
  editingNeedId,
}: {
  publishingV2Enabled?: boolean;
  validationProfileSession?: boolean;
  editingNeedId?: string;
}) {
  const { lang, t } = useLanguage();
  const copy = t.core.needPublishing;
  const router = useRouter();
  const { data: session } = useSession();
  const authenticatedForDrafts = Boolean(session) || validationProfileSession;
  const { openAuthModal } = useAuthModal();
  const beginEdit = trpc.needV2.beginEdit.useMutation();
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
  const [excludedVisitDates, setExcludedVisitDates] = useState<string[]>([]);
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
  const [pendingDraft, setPendingDraft] = useState<NeedDraftSnapshot | null>(
    null,
  );
  const [damagedDraftDetected, setDamagedDraftDetected] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [serverDraftId, setServerDraftId] = useState<string | undefined>();
  const appliedDefaultLocationRef = useRef(false);
  const appliedPreferredCurrencyRef = useRef(false);
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
  }, [draftReady, pendingDraft, preferredCurrency.data]);

  useEffect(() => {
    if (
      currentId !== "area" ||
      areaConfirmed ||
      area.trim() ||
      appliedDefaultLocationRef.current
    ) {
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
    setLocation({
      sourceLocationId: savedLocation.id,
      displayPrecision,
      regionLabel: savedLocation.regionLabel,
      lat,
      lng,
    });
    const displayArea =
      savedLocation.label ||
      savedLocation.regionLabel ||
      (Number.isFinite(lat) && Number.isFinite(lng)
        ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        : "Saved map location");
    setArea(displayArea);
    setAreaConfirmed(true);
  }, [area, areaConfirmed, currentId, savedLocations.data]);

  const applyDraft = (
    draft: NeedDraftSnapshot,
    preferredScreenId = draft.currentId,
  ) => {
    appliedPreferredCurrencyRef.current = true;
    setCareType(draft.careType);
    setPets(draft.pets);
    setDates({ timeOfDay: "flexible", exactTime: "", ...draft.dates });
    setVisitFrequency(draft.visitFrequency);
    setCustomInterval(draft.customInterval);
    setFirstVisitDate(draft.dates.startDate || "");
    setExcludedVisitDates([]);
    setVisitsPerDay(draft.visitsPerDay);
    setVisitTimes(draft.visitTimes);
    setExactTimes(draft.exactTimes);
    setVisitPlans(draft.visitPlans);
    setBoardingRoutines(draft.boardingRoutines);
    setBoardingSupplies(draft.boardingSupplies);
    setCustomBoardingSupplies(draft.customBoardingSupplies);
    setBoardingSupplyNotes(draft.boardingSupplyNotes);
    setSupplyCostMode(draft.supplyCostMode);
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
    setCustomNeeds(draft.customNeeds);
    setCustomWarnings(draft.customWarnings);
    setTransport(draft.transport);
    setSplitDirection(draft.splitDirection);
    setDistance(draft.distance);
    setArea(draft.area);
    setLocation(draft.location);
    setAreaConfirmed(Boolean(draft.areaConfirmed));
    setBudget(draft.budget);
    setSupportingImages(
      (draft.attachments ?? []).map((attachment) => ({
        ...attachment,
        isUploading: false,
      })),
    );
    setServerDraftId(draft.serverDraftId);
    setPublishIdempotencyKey(draft.publishIdempotencyKey);
    setVisitedScreenIds(new Set(draft.visitedScreenIds));
    const availableScreens = buildScreens(draft.careType);
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
    if (!editingNeedId) return;
    let active = true;

    async function loadEditingNeed() {
      try {
        const draft = await beginEdit.mutateAsync({ id: editingNeedId! });
        if (!active) return;
        if (!draft.mode) throw new Error("EDIT_MODE_MISSING");
        const snapshot = mapNeedDraftPayloadToLegacyNeedDraftV3({
          draftId: draft.id,
          mode: draft.mode,
          payload: draft.payload,
          attachments: draft.attachments,
        });
        applyDraft(snapshot, "preview");
        setDraftReady(true);
        setPendingDraft(null);
      } catch (err) {
        console.error("Failed to load editing need:", err);
        if (active) {
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
    if (editingNeedId) return;
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
        applyDraft(
          draft,
          restoreMode === "preview" || restoreMode === "edit"
            ? "preview"
            : draft.currentId,
        );
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
  }, [editingNeedId]);

  const draftSnapshot = useMemo<NeedDraftSnapshot>(
    () => ({
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
      excludedVisitDates,
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
      transport,
      splitDirection,
      distance,
      area,
      location,
      areaConfirmed,
      budget,
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
      careType,
      currentId,
      customBoardingRequirements,
      customBoardingSupplies,
      customHomeSituations,
      customInterval,
      customNeeds,
      customPlans,
      customWarnings,
      dates,
      distance,
      excludedVisitDates,
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
    ],
  );

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
    // Navigation-only changes should not trigger automatic draft persistence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draftPersistenceSignature],
  );

  const writeDraftToLocalStorage = useCallback(
    (snapshot: NeedDraftSnapshot) => {
      window.localStorage.setItem(
        NEED_DRAFT_STORAGE_KEY,
        JSON.stringify({ ...snapshot, savedAt: Date.now() }),
      );
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

  const serverDraftPersistence = useNeedDraftV2Persistence({
    enabled: publishingV2Enabled,
    authenticated: authenticatedForDrafts,
    snapshot:
      draftReady && !pendingDraft && !publishOutcome && hasStartedDraft
        ? draftPersistenceSnapshot
        : null,
    onServerDraftId: setServerDraftId,
  });

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
    () => localizedNeedScreens(careType, copy, lang),
    [careType, copy, lang],
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
          excludedVisitDates,
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
  const boardingTasksHavePetMatches =
    boardingRoutineItems.length > 0 &&
    boardingRoutineItems.every((routine) =>
      routine.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
    );
  const boardingSchedulesValid = true;
  const tasksHavePetMatches =
    activeTasks.length > 0 &&
    activeTasks.every((task) =>
      task.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
    );
  const everyVisitHasTasks =
    careType !== "visit" ||
    Array.from({ length: visitsPerDay }, (_, index) => index + 1).every(
      (visit) => activeTasks.some((task) => task.visitNumbers.includes(visit)),
    );
  const everyPetHasTasks =
    pets.length > 0 &&
    pets.every((pet) =>
      (careType === "boarding" ? boardingRoutineItems : activeTasks).some(
        (task) => task.petIds.includes(pet.id),
      ),
    );
  const tasksValid =
    careType === "boarding"
      ? boardingTasksHavePetMatches &&
        boardingSchedulesValid &&
        everyPetHasTasks
      : tasksHavePetMatches && everyVisitHasTasks && everyPetHasTasks;
  const areaValid = areaConfirmed && Boolean(area.trim());
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
    Number(budget.supplyAmount) > 0;
  const budgetValid = careBudgetValid && travelBudgetValid && supplyBudgetValid;
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
        visitedScreenIds.has("preview") ||
        visitedScreenIds.has(id),
    ),
  );
  const revealAllValidation =
    currentId === "preview" || visitedScreenIds.has("preview");
  const canPublish = blockingScreenIds.size === 0;
  const publishingSteps = screens.map<PublishingStep>((screen, index) => ({
    id: screen.id,
    label: screen.label,
    state:
      index === currentIndex
        ? "current"
        : invalidScreenIds.has(screen.id)
          ? "attention"
          : !careType && index > 0
            ? "locked"
            : index < currentIndex
              ? "complete"
              : "available",
  }));
  const markScreenVisited = (id: ScreenId) =>
    setVisitedScreenIds((items) => {
      if (items.has(id)) return items;
      const next = new Set(items);
      next.add(id);
      return next;
    });

  const goNext = () => {
    if (currentId === "care" && !careType) return;
    markScreenVisited(currentId);
    setCurrentId(screens[Math.min(currentIndex + 1, screens.length - 1)].id);
  };
  const goBack = () => {
    markScreenVisited(currentId);
    if (currentIndex > 0) setCurrentId(screens[currentIndex - 1].id);
  };
  const selectScreen = (index: number) => {
    if (!careType && index > 0) return;
    if (screens[index].id !== currentId) markScreenVisited(currentId);
    setCurrentId(screens[index].id);
  };
  const handlePublish = async () => {
    setPublishError(null);
    if (!authenticatedForDrafts) {
      persistDraft();
      openAuthModal("/needs/create?restore=auth");
      return;
    }
    if (!publishingV2Enabled) {
      persistDraft();
      setShowNotice(true);
      return;
    }
    try {
      const idempotencyKey = publishIdempotencyKey ?? crypto.randomUUID();
      const publishSnapshot = {
        ...draftSnapshot,
        publishIdempotencyKey: idempotencyKey,
      };
      setPublishIdempotencyKey(idempotencyKey);
      window.localStorage.setItem(
        NEED_DRAFT_STORAGE_KEY,
        JSON.stringify({ ...publishSnapshot, savedAt: Date.now() }),
      );
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
            title: buildTitle(careType, pets, copy.careTypes[careType]?.title),
          });
          return publishNeed.mutateAsync(input);
        },
      );
      window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
      setPublishOutcome({
        needId: result.needId,
        shouldPromptForEmail: result.notificationPrompt.shouldPrompt,
        edited: result.edited,
      });
      setShowNotice(false);
    } catch (error) {
      console.error("[guided-need-flow] publish error:", error);
      const isExpired =
        error instanceof Error && error.message.includes("NEED_ALREADY_EXPIRED");
      if (isExpired) {
        setPublishError(
          "This request has already expired. Update its end time before publishing.",
        );
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
    }
  };
  const updatePet = (id: string, patch: Partial<PetDraft>) =>
    setPets((items) =>
      items.map((pet) => (pet.id === id ? { ...pet, ...patch } : pet)),
    );
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
    setExcludedVisitDates([]);
  };

  const content = (() => {
    switch (currentId) {
      case "care":
        return <StepCareType value={careType} onChange={setCareType} />;
      case "pets":
        return (
          <StepPets
            pets={pets}
            savedPets={savedPets.data ?? []}
            savedPetsLoading={authenticatedForDrafts && savedPets.isLoading}
            onUseSavedPet={(savedPet) =>
              setPets((items) => [...items, draftPetFromProfile(savedPet)])
            }
            onChange={updatePet}
            onAdd={(pet) => {
              const nextPet = pet ?? createPet();
              setPets((items) => [...items, nextPet]);
              return nextPet.id;
            }}
            onRemove={(id) =>
              setPets((items) => items.filter((pet) => pet.id !== id))
            }
            showValidation={revealAllValidation || visitedScreenIds.has("pets")}
          />
        );
      case "dates":
        return careType === "visit" ? (
          <StepScheduleVisitDates
            dates={dates}
            onDatesChange={changeVisitDates}
            showValidation={
              revealAllValidation || visitedScreenIds.has("dates")
            }
            visitFrequency={visitFrequency}
            onVisitFrequencyChange={setVisitFrequency}
            customInterval={customInterval}
            onCustomIntervalChange={setCustomInterval}
            visitsPerDay={visitsPerDay}
            onVisitCountChange={changeVisitCount}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            onVisitTimesChange={setVisitTimes}
            onExactTimesChange={setExactTimes}
          />
        ) : careType === "boarding" ? (
          <StepScheduleBoarding
            dates={dates}
            onDatesChange={(next) =>
              setDates((current) => ({ ...current, ...next }))
            }
            showValidation={
              revealAllValidation || visitedScreenIds.has("dates")
            }
          />
        ) : (
          <StepScheduleCustom
            dates={dates}
            onDatesChange={(next) =>
              setDates((current) => ({ ...current, ...next }))
            }
            showValidation={
              revealAllValidation || visitedScreenIds.has("dates")
            }
          />
        );
      case "frequency":
        return (
          <StepScheduleVisitTiming
            value={visitFrequency}
            onChange={setVisitFrequency}
            customInterval={customInterval}
            onCustomIntervalChange={setCustomInterval}
            showValidation={
              revealAllValidation || visitedScreenIds.has("frequency")
            }
            visitsPerDay={visitsPerDay}
            onVisitCountChange={changeVisitCount}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            onVisitTimesChange={setVisitTimes}
            onExactTimesChange={setExactTimes}
          />
        );
      case "tasks":
        return careType === "boarding" ? (
          <StepBoardingTasks
            options={boardingTasks}
            pets={pets}
            value={boardingRoutines}
            onChange={setBoardingRoutines}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            showValidation={
              revealAllValidation || visitedScreenIds.has("tasks")
            }
          />
        ) : careType === "custom" ? (
          <StepCustomTasks
            options={customTasks}
            pets={pets}
            value={customPlans}
            onChange={setCustomPlans}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            showValidation={
              revealAllValidation || visitedScreenIds.has("tasks")
            }
          />
        ) : (
          <StepVisitTasks
            options={activeTaskOptions}
            pets={pets}
            value={activeTasks}
            onChange={setActiveTasks}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            careType={careType ?? "visit"}
            visitsPerDay={visitsPerDay}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            showValidation={
              revealAllValidation || visitedScreenIds.has("tasks")
            }
          />
        );
      case "supplies":
        return (
          <StepSupplies
            pets={pets}
            value={boardingSupplies}
            onChange={setBoardingSupplies}
            customItems={customBoardingSupplies}
            onCustomItemsChange={setCustomBoardingSupplies}
            notes={boardingSupplyNotes}
            onNotesChange={setBoardingSupplyNotes}
          />
        );
      case "requirements":
        return careType === "boarding" ? (
          <StepRequirementsBoarding
            needs={boardingNeeds}
            onNeedsChange={setBoardingNeeds}
            customRequirements={customBoardingRequirements}
            onCustomRequirementsChange={setCustomBoardingRequirements}
            compatibility={boardingCompatibility}
            onCompatibilityChange={setBoardingCompatibility}
            customSituations={customHomeSituations}
            onCustomSituationsChange={setCustomHomeSituations}
            notes={boardingHomeNotes}
            onNotesChange={setBoardingHomeNotes}
          />
        ) : (
          <StepRequirementsCustom
            requirements={customNeeds}
            onRequirementsChange={setCustomNeeds}
            cautions={customWarnings}
            onCautionsChange={setCustomWarnings}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
          />
        );
      case "cautions":
        return null;
      case "area":
        return (
          <StepArea
            careType={careType ?? "visit"}
            area={area}
            onChange={setArea}
            areaConfirmed={areaConfirmed}
            onAreaConfirmedChange={setAreaConfirmed}
            location={location}
            onLocationChange={setLocation}
            savedLocations={savedLocations.data ?? []}
            distance={distance}
            onDistanceChange={setDistance}
            transport={transport}
            onTransportChange={setTransport}
            splitDirection={splitDirection}
            onSplitDirectionChange={setSplitDirection}
            showValidation={revealAllValidation || visitedScreenIds.has("area")}
          />
        );
      case "budget":
        return (
          <StepBudget
            careType={careType ?? "visit"}
            totalVisits={plannedVisitDates.length * visitsPerDay}
            totalNights={boardingNights(dates)}
            transport={transport}
            sitterSupplyCount={sitterSupplyCount}
            supplyCostMode={supplyCostMode}
            onSupplyCostModeChange={setSupplyCostMode}
            value={budget}
            onChange={(nextBudget) => {
              if (nextBudget.currency !== budget.currency) {
                appliedPreferredCurrencyRef.current = true;
              }
              setBudget(nextBudget);
            }}
            showValidation={
              revealAllValidation || visitedScreenIds.has("budget")
            }
          />
        );
      case "preview":
        return (
          <StepPreview
            careType={careType ?? "visit"}
            pets={pets}
            dates={dates}
            tasks={activeTasks}
            boardingRoutines={boardingRoutines}
            boardingSupplies={boardingSupplies}
            boardingSupplyItems={boardingSupplyItems}
            boardingSupplyNotes={boardingSupplyNotes}
            supplyCostMode={supplyCostMode}
            taskNotes={taskNotes}
            homeFitNotes={boardingHomeNotes}
            area={area}
            distance={distance}
            transport={transport}
            splitDirection={splitDirection}
            budget={budget}
            tags={
              careType === "boarding"
                ? [
                    ...boardingNeeds,
                    ...Object.entries(boardingCompatibility)
                      .filter(([, choice]) => choice === "not-ok")
                      .map(([label]) => `Avoid: ${label}`),
                  ]
                : careType === "custom"
                  ? [...customNeeds, ...customWarnings]
                  : []
            }
            customRequirements={customNeeds}
            customCautions={customWarnings}
            visitFrequency={visitFrequency}
            customInterval={customInterval}
            firstVisitDate={firstVisitDate || dates.startDate}
            excludedVisitDates={excludedVisitDates}
            visitsPerDay={visitsPerDay}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            validation={{
              pets: petsValid,
              dates: datesValid,
              tasks: tasksValid,
              area: areaValid,
              budget: budgetValid,
            }}
            authenticated={authenticatedForDrafts}
            supportingImages={supportingImages}
            onSupportingImagesChange={setSupportingImages}
            onBeforeOpenDetail={persistDraft}
          />
        );
    }
  })();

  return (
    <div className="min-h-dvh bg-[#fcfbf8] text-[#211d27]">
      {!editingNeedId && (
        <DraftRecoveryDialogs
          damagedDraftDetected={damagedDraftDetected}
          pendingDraft={pendingDraft}
          lang={lang}
          copy={copy}
          damagedTitle={t.errors.draftDamagedTitle}
          damagedDescription={t.errors.draftDamagedDescription}
          discardDamagedLabel={t.errors.discardDamagedDraft}
          onDiscardDamaged={() => {
            window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
            setDamagedDraftDetected(false);
            setDraftReady(true);
          }}
          onDiscardDraft={discardDraft}
          onResumeDraft={resumeDraft}
        />
      )}

      <GuidedNeedFlowLayout
        current={current}
        currentId={currentId}
        currentIndex={currentIndex}
        steps={publishingSteps}
        careTypeSelected={Boolean(careType)}
        canPublish={canPublish}
        publishing={publishNeed.isLoading}
        publishComplete={Boolean(publishOutcome)}
        saveState={
          publishingV2Enabled && authenticatedForDrafts
            ? serverDraftPersistence.saveState
            : undefined
        }
        onSaveExit={exitFlow}
        onResolveConflict={() => {
          void serverDraftPersistence.keepCurrentChanges();
        }}
        onStepSelect={(id) => {
          const index = screens.findIndex((screen) => screen.id === id);
          if (index >= 0) selectScreen(index);
        }}
        onBack={goBack}
        onNext={goNext}
        onPublish={handlePublish}
      >
        {content}
      </GuidedNeedFlowLayout>

      <PublishFeedback
        showDraftNotice={showNotice}
        publishOutcome={publishOutcome}
        publishError={publishError}
        copy={copy}
        onCloseDraftNotice={() => setShowNotice(false)}
      />
    </div>
  );
}
