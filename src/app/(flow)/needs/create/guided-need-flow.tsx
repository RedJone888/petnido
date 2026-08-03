"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { DayPicker } from "react-day-picker";
import type { IconType } from "react-icons";
import {
  PiArrowLeft,
  PiArrowRight,
  PiBagSimple,
  PiBed,
  PiBird,
  PiBookmarkSimple,
  PiBowlFood,
  PiBroom,
  PiCalendarBlank,
  PiCaretDown,
  PiCaretUp,
  PiCat,
  PiCheck,
  PiCheckCircle,
  PiClock,
  PiCurrencyCircleDollar,
  PiDog,
  PiDotsSixVertical,
  PiDrop,
  PiEye,
  PiFeather,
  PiFirstAidKit,
  PiForkKnife,
  PiGameController,
  PiGrains,
  PiHouseLine,
  PiHouseSimple,
  PiJar,
  PiLinkSimple,
  PiMapPin,
  PiMagnifyingGlass,
  PiNavigationArrow,
  PiPackage,
  PiPawPrint,
  PiPintGlass,
  PiPersonSimpleWalk,
  PiPencilSimple,
  PiPill,
  PiPlus,
  PiPlusCircle,
  PiQuestion,
  PiRabbit,
  PiFlag,
  PiNote,
  PiShieldCheck,
  PiSparkle,
  PiSuitcase,
  PiTennisBall,
  PiToiletPaper,
  PiToolbox,
  PiTrash,
  PiTowel,
  PiWarehouse,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";

import cn from "@/lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { useAuthModal } from "@/components/providers/AuthModalProvider";
import {
  NEED_DRAFT_STORAGE_KEY,
  NEED_ENTRY_STORAGE_KEY,
  NEED_PREVIEW_STORAGE_KEY,
  type NeedPreviewSnapshot,
} from "./preview/types";

type CareType = "visit" | "boarding" | "custom";
type TaskPriority = "must" | "nice";
type CompatibilityChoice = "ok" | "not-ok";
type SupplyProvision = "" | "owner" | "sitter" | "not-needed";
type SupplyCostMode = "reimburse" | "fixed" | "discuss";
type SupplyCategory = "food" | "stay" | "travel";
type ScreenId =
  | "care"
  | "pets"
  | "dates"
  | "frequency"
  | "tasks"
  | "supplies"
  | "requirements"
  | "cautions"
  | "transport"
  | "area"
  | "budget"
  | "preview";

type PetDraft = {
  id: string;
  type: string;
  otherType: string;
  quantity: number;
  name: string;
  breed: string;
  weight: string;
  weightUnit: "kg" | "g";
  birthDate: string;
  sex: string;
  neutered: string;
  photo: string;
  notes: string;
};

type TaskPlan = {
  id: string;
  templateId: string;
  label: string;
  priority: TaskPriority;
  petIds: string[];
  visitNumbers: number[];
  custom: boolean;
  notes?: string;
  order?: number;
};

type BoardingScheduleType = "daily" | "repeating" | "once" | "as-needed";

type BoardingRoutine = {
  id: string;
  petIds: string[];
  priority: TaskPriority;
  scheduleType: BoardingScheduleType;
  dailyTimes: string[];
  intervalDays: number;
  firstDueDate: string;
  preferredDate: string;
  trigger: string;
  instructions: string;
  order: number;
};

type BoardingTaskConfig = {
  templateId: string;
  label: string;
  custom: boolean;
  routines: BoardingRoutine[];
};

type BoardingSupplyPlan = Record<string, SupplyProvision>;

type CustomBoardingSupply = {
  id: string;
  petId: string;
  category: SupplyCategory;
  label: string;
};

type BoardingSupplyOption = {
  key: string;
  petId: string;
  category: SupplyCategory;
  label: string;
  custom: boolean;
};

type BudgetDraft = {
  currency: string;
  mode: "exact" | "range" | "open";
  amount: string;
  maximum: string;
  exactNegotiable: boolean;
  travelMode: "none" | "fixed" | "actual" | "discuss";
  travelAmount: string;
  supplyAmount: string;
};

type LocationDraft = {
  lat: number;
  lng: number;
};

type NeedDraftSnapshot = {
  version: 3;
  savedAt: number;
  currentId: ScreenId;
  careType: CareType | null;
  pets: PetDraft[];
  dates: { startDate: string; endDate: string; notes: string };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate?: string;
  excludedVisitDates?: string[];
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  visitPlans: TaskPlan[];
  boardingRoutines: BoardingTaskConfig[];
  boardingSupplies: BoardingSupplyPlan;
  customBoardingSupplies: CustomBoardingSupply[];
  supplyCostMode: SupplyCostMode;
  customPlans: TaskPlan[];
  taskNotes: string;
  boardingNeeds: string[];
  customBoardingRequirements: string[];
  boardingCompatibility: Record<string, CompatibilityChoice>;
  customHomeSituations: string[];
  boardingHomeNotes: string;
  customNeeds: string[];
  customWarnings: string[];
  transport: string;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  distance: string;
  area: string;
  location: LocationDraft;
  areaConfirmed?: boolean;
  budget: BudgetDraft;
  visitedScreenIds: ScreenId[];
};

type GeocodeResult = LocationDraft & {
  label: string;
  detail: string;
};

type ScreenDefinition = {
  id: ScreenId;
  chapter: string;
  label: string;
  title: string;
  description: string;
  icon: IconType;
};

const careTypes = {
  visit: {
    title: "Home Visits",
    description:
      "A sitter comes to your home for feeding, fresh water, walks, cleaning, and everyday check-ins.",
    bestFor: "Pets who are most comfortable in familiar surroundings.",
    tags: ["Familiar environment", "Short trips"],
    icon: PiHouseLine,
    budgetUnit: "per visit",
  },
  boarding: {
    title: "Pet Boarding",
    description:
      "Your pet stays in a sitter’s home and receives care throughout the day and night.",
    bestFor: "Longer stays or pets that should not be left alone.",
    tags: ["Longer trips", "Day & night care"],
    icon: PiWarehouse,
    budgetUnit: "per night",
  },
  custom: {
    title: "Custom Care",
    description:
      "Ask for help with one-off needs such as vet transport, medication, grooming, cleaning, or equipment setup.",
    bestFor: "A specific task that does not fit standard visits or boarding.",
    tags: ["One-off needs", "Flexible plan"],
    icon: PiSparkle,
    budgetUnit: "total",
  },
} satisfies Record<
  CareType,
  {
    title: string;
    description: string;
    bestFor: string;
    tags: string[];
    icon: IconType;
    budgetUnit: string;
  }
>;

const petTypes = [
  { id: "dog", label: "Dog", detail: "", icon: PiDog },
  { id: "cat", label: "Cat", detail: "", icon: PiCat },
  { id: "rabbit", label: "Rabbit", detail: "", icon: PiRabbit },
  { id: "bird", label: "Bird", detail: "", icon: PiBird },
  {
    id: "other",
    label: "Other",
    detail: "Tell us the pet type",
    icon: PiSparkle,
  },
];

const petBreedSuggestions: Record<string, string[]> = {
  dog: ["Golden Retriever", "Labrador Retriever", "Poodle", "Shiba Inu"],
  cat: ["Domestic Shorthair", "British Shorthair", "Ragdoll", "Maine Coon"],
  rabbit: ["Holland Lop", "Netherland Dwarf", "Lionhead", "Mini Rex"],
  bird: ["Budgerigar", "Cockatiel", "African Grey", "Lovebird"],
};
const otherPetTypeSuggestions = [
  "Hamster",
  "Guinea pig",
  "Ferret",
  "Turtle",
  "Chinchilla",
];
const otherPetBreedSuggestions: Record<string, string[]> = {
  hamster: [
    "Syrian Hamster",
    "Dwarf Hamster",
    "Roborovski Hamster",
    "Chinese Hamster",
  ],
  "guinea pig": ["American", "Abyssinian", "Peruvian", "Teddy"],
  ferret: ["Standard", "Angora", "Sable", "Albino"],
  turtle: ["Red-eared Slider", "Box Turtle", "Painted Turtle", "Musk Turtle"],
  chinchilla: ["Standard Grey", "Beige", "Ebony", "Violet"],
};

const visitTasks = [
  { id: "feeding", label: "Feeding", icon: PiBowlFood },
  { id: "water", label: "Refresh water", icon: PiDrop },
  { id: "cleaning", label: "Clean litter or enclosure", icon: PiBroom },
  { id: "play", label: "Play and companionship", icon: PiGameController },
  { id: "walk", label: "Walk outside", icon: PiPersonSimpleWalk },
  { id: "medication", label: "Give medication", icon: PiPill },
  { id: "safety", label: "Safety check", icon: PiShieldCheck },
];

const boardingTasks = [
  { id: "boarding-feeding", label: "Feeding", icon: PiBowlFood },
  { id: "boarding-water", label: "Refresh water", icon: PiDrop },
  {
    id: "boarding-cleaning",
    label: "Clean litter or enclosure",
    icon: PiBroom,
  },
  { id: "boarding-walks", label: "Walk outside", icon: PiPersonSimpleWalk },
  { id: "boarding-medication", label: "Medication", icon: PiPill },
  {
    id: "boarding-play",
    label: "Play and companionship",
    icon: PiGameController,
  },
  { id: "boarding-grooming", label: "Grooming or bathing", icon: PiSparkle },
  { id: "boarding-nails", label: "Nail care", icon: PiSparkle },
  { id: "boarding-updates", label: "Photo updates", icon: PiSparkle },
];

const customTasks = [
  { id: "transport", label: "Pet transport", icon: PiPersonSimpleWalk },
  { id: "vet", label: "Vet visit support", icon: PiShieldCheck },
  { id: "enclosure", label: "Enclosure cleaning", icon: PiBroom },
  { id: "pickup", label: "Food or supply pickup", icon: PiBowlFood },
  { id: "supervision", label: "Temporary supervision", icon: PiHouseLine },
];

const boardingRequirements = [
  "Someone is usually at home",
  "Daily photo updates",
  "Available for daily messages",
  "Medication support",
  "Secure outdoor area",
  "Quiet environment",
  "Step-free home",
  "Only one client at a time",
];

const boardingHomeSituations = [
  "Dogs in the home",
  "Cats in the home",
  "Children in the home",
  "Other pets in the home",
  "Smoking household",
  "Shared home with housemates",
];
const customRequirements = [
  "Pet-friendly vehicle",
  "Medication experience",
  "Exotic pet experience",
  "Able to lift a large pet",
  "Carrier handling",
];
const customCautions = [
  "May bite or scratch",
  "Nervous around strangers",
  "Heavy lifting involved",
  "Limited building access",
  "Time-sensitive task",
];

const timeOptions = [
  { value: "flexible", label: "Any time" },
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "exact", label: "Exact time" },
];

const stepIllustrations: Record<ScreenId, { position: string; alt: string }> = {
  care: { position: "0% 0%", alt: "A pet owner choosing between care options" },
  pets: {
    position: "33.333% 0%",
    alt: "A dog, cat, rabbit, and bird ready to be introduced",
  },
  dates: { position: "66.667% 0%", alt: "A calendar beside resting pets" },
  frequency: {
    position: "100% 0%",
    alt: "A sitter arriving for a scheduled home visit",
  },
  tasks: {
    position: "0% 50%",
    alt: "Pets beside food, water, and play supplies",
  },
  supplies: {
    position: "0% 50%",
    alt: "Food, carriers, bowls, and other supplies prepared for a pet stay",
  },
  requirements: {
    position: "33.333% 50%",
    alt: "A calm pet-friendly living room",
  },
  cautions: {
    position: "66.667% 50%",
    alt: "A sitter reviewing a pet safety checklist",
  },
  transport: { position: "100% 50%", alt: "A pet carrier beside a car" },
  area: {
    position: "0% 100%",
    alt: "A neighborhood map with a pet-care location pin",
  },
  budget: {
    position: "33.333% 100%",
    alt: "A wallet and coins beside a pet bowl",
  },
  preview: {
    position: "66.667% 100%",
    alt: "A completed care request beside happy pets",
  },
};

function createPet(): PetDraft {
  return {
    id: crypto.randomUUID(),
    type: "",
    otherType: "",
    quantity: 1,
    name: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    birthDate: "",
    sex: "",
    neutered: "",
    photo: "",
    notes: "",
  };
}

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
        title: "What will your pet bring?",
        description:
          "Tell sitters what you’ll provide and what they may need to supply. Set any related costs later in Budget.",
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
          "Choose a starting point, then add your own tasks where needed.",
        icon: PiCheckCircle,
      },
      {
        id: "requirements",
        chapter: "Custom plan",
        label: "Requirements",
        title: "What should the helper be able to do?",
        description:
          "Add experience, equipment, or practical requirements for this request.",
        icon: PiShieldCheck,
      },
      {
        id: "cautions",
        chapter: "Custom plan",
        label: "Cautions",
        title: "What should they know before accepting?",
        description:
          "Share the information someone needs to judge whether the task is right for them.",
        icon: PiQuestion,
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
      title: "Where will your pet travel from?",
      description:
        "Set the area your pet will travel from. We’ll use it with your preferred distance to recommend suitable boarding homes.",
    },
    custom: {
      title: "Where is help needed?",
      description:
        "Set the approximate location where help is needed. We’ll use it for nearby matching.",
    },
  };
  return [
    ...commonStart,
    ...branchScreens[branch],
    {
      id: "area",
      chapter: "Location",
      label: "Area",
      ...areaCopy[branch],
      icon: PiMapPin,
    },
    ...(branch === "boarding"
      ? [
          {
            id: "transport" as ScreenId,
            chapter: "Transport",
            label: "Handover",
            title: "How will your pet get there?",
            description:
              "Choose who will handle drop-off and pickup. Any sitter travel costs can be set in the budget next.",
            icon: PiMapPin,
          },
        ]
      : []),
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
        "Check the public-facing summary. Nothing is submitted in this front-end prototype.",
      icon: PiCheckCircle,
    },
  ];
}

function formatDraftAge(savedAt: number) {
  const minutes = Math.max(1, Math.round((Date.now() - savedAt) / 60_000));
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function GuidedNeedFlow() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const [currentId, setCurrentId] = useState<ScreenId>("care");
  const [careType, setCareType] = useState<CareType | null>(null);
  const [pets, setPets] = useState<PetDraft[]>([]);
  const [dates, setDates] = useState({ startDate: "", endDate: "", notes: "" });
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
  const [distance, setDistance] = useState("5 km");
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
  const [showNotice, setShowNotice] = useState(false);
  const [visitedScreenIds, setVisitedScreenIds] = useState<Set<ScreenId>>(
    () => new Set(),
  );
  const [pendingDraft, setPendingDraft] = useState<NeedDraftSnapshot | null>(
    null,
  );
  const [draftReady, setDraftReady] = useState(false);

  const applyDraft = (
    draft: NeedDraftSnapshot,
    preferredScreenId = draft.currentId,
  ) => {
    setCareType(draft.careType);
    setPets(draft.pets);
    setDates(draft.dates);
    setVisitFrequency(draft.visitFrequency);
    setCustomInterval(draft.customInterval);
    setFirstVisitDate(draft.firstVisitDate || draft.dates.startDate || "");
    setExcludedVisitDates(draft.excludedVisitDates ?? []);
    setVisitsPerDay(draft.visitsPerDay);
    setVisitTimes(draft.visitTimes);
    setExactTimes(draft.exactTimes);
    setVisitPlans(draft.visitPlans);
    setBoardingRoutines(draft.boardingRoutines);
    setBoardingSupplies(draft.boardingSupplies);
    setCustomBoardingSupplies(draft.customBoardingSupplies);
    setSupplyCostMode(draft.supplyCostMode);
    setCustomPlans(draft.customPlans);
    setTaskNotes(draft.taskNotes);
    setBoardingNeeds(draft.boardingNeeds);
    setCustomBoardingRequirements(draft.customBoardingRequirements);
    setBoardingCompatibility(draft.boardingCompatibility);
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
    setVisitedScreenIds(new Set(draft.visitedScreenIds));
    const availableScreens = buildScreens(draft.careType);
    const normalizedPreferredScreenId =
      draft.careType === "visit" && preferredScreenId === "frequency"
        ? "dates"
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
    const restoreMode = new URLSearchParams(window.location.search).get(
      "restore",
    );
    try {
      const stored = window.localStorage.getItem(NEED_DRAFT_STORAGE_KEY);
      if (!stored) {
        setDraftReady(true);
        return;
      }
      const draft = JSON.parse(stored) as NeedDraftSnapshot;
      if (draft.version !== 3) throw new Error("Unsupported draft version");
      if (restoreMode === "preview" || restoreMode === "auth") {
        applyDraft(
          draft,
          restoreMode === "preview" ? "preview" : draft.currentId,
        );
        setDraftReady(true);
      } else {
        setPendingDraft(draft);
      }
    } catch {
      window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
      setDraftReady(true);
    } finally {
      if (restoreMode)
        window.history.replaceState(window.history.state, "", "/needs/create");
    }
  }, []);

  const persistDraft = useCallback(() => {
    const draft: NeedDraftSnapshot = {
      version: 3,
      savedAt: Date.now(),
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
      visitedScreenIds: Array.from(visitedScreenIds),
    };
    window.localStorage.setItem(NEED_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    area,
    areaConfirmed,
    boardingCompatibility,
    boardingHomeNotes,
    boardingNeeds,
    boardingRoutines,
    boardingSupplies,
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
    splitDirection,
    supplyCostMode,
    taskNotes,
    transport,
    visitFrequency,
    visitPlans,
    visitTimes,
    visitedScreenIds,
    visitsPerDay,
  ]);

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

  useEffect(() => {
    if (!draftReady || pendingDraft) return;
    if (!hasStartedDraft) return;
    const timer = window.setTimeout(persistDraft, 400);
    return () => window.clearTimeout(timer);
  }, [draftReady, hasStartedDraft, pendingDraft, persistDraft]);

  const saveBeforeExit = () => {
    if (hasStartedDraft) persistDraft();
  };

  const exitFlow = () => {
    saveBeforeExit();
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
    window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
    setPendingDraft(null);
    setDraftReady(true);
  };

  const screens = useMemo(() => buildScreens(careType), [careType]);
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
  const datesValid =
    dateRangeValid && (careType !== "visit" || plannedVisitDates.length > 0);
  const boardingRoutineItems = boardingRoutines.flatMap(
    (config) => config.routines,
  );
  const boardingSupplyItems = boardingSupplyOptions(
    pets,
    customBoardingSupplies,
  );
  const sitterSupplyCount = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "sitter",
  ).length;
  const boardingTasksHavePetMatches =
    boardingRoutineItems.length > 0 &&
    boardingRoutineItems.every((routine) =>
      routine.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
    );
  const boardingSchedulesValid =
    boardingRoutineItems.every(
      (routine) =>
        routine.scheduleType !== "repeating" || routine.intervalDays > 0,
    ) &&
    boardingRoutineItems.every(
      (routine) =>
        routine.scheduleType !== "daily" || routine.dailyTimes.length > 0,
    ) &&
    boardingRoutineItems.every(
      (routine) =>
        routine.scheduleType !== "as-needed" || Boolean(routine.trigger.trim()),
    );
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
  const handlePublish = () => {
    persistDraft();
    if (!session) {
      openAuthModal("/needs/create?restore=auth");
      return;
    }
    window.localStorage.removeItem(NEED_DRAFT_STORAGE_KEY);
    setShowNotice(true);
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
    const previousStart = dates.startDate;
    setDates(next);
    if (!next.startDate) {
      setFirstVisitDate("");
      setExcludedVisitDates([]);
      return;
    }
    setFirstVisitDate((current) => {
      const candidate = current || previousStart;
      if (
        !candidate ||
        candidate < next.startDate ||
        (next.endDate && candidate > next.endDate) ||
        (candidate === previousStart && previousStart !== next.startDate)
      ) {
        return next.startDate;
      }
      return candidate;
    });
    setExcludedVisitDates((items) =>
      items.filter(
        (date) =>
          date >= next.startDate && (!next.endDate || date <= next.endDate),
      ),
    );
  };

  const content = (() => {
    switch (currentId) {
      case "care":
        return <CareTypeScreen value={careType} onChange={setCareType} />;
      case "pets":
        return (
          <PetsScreen
            pets={pets}
            onChange={updatePet}
            onAdd={() => {
              const pet = createPet();
              setPets((items) => [...items, pet]);
              return pet.id;
            }}
            onRemove={(id) =>
              setPets((items) => items.filter((pet) => pet.id !== id))
            }
            showValidation={revealAllValidation || visitedScreenIds.has("pets")}
          />
        );
      case "dates":
        return careType === "visit" ? (
          <VisitDatesScreen
            dates={dates}
            onDatesChange={changeVisitDates}
            showValidation={
              revealAllValidation || visitedScreenIds.has("dates")
            }
            visitFrequency={visitFrequency}
            onVisitFrequencyChange={setVisitFrequency}
            customInterval={customInterval}
            onCustomIntervalChange={setCustomInterval}
            firstVisitDate={firstVisitDate || dates.startDate}
            onFirstVisitDateChange={setFirstVisitDate}
            excludedVisitDates={excludedVisitDates}
            onExcludedVisitDatesChange={setExcludedVisitDates}
            visitsPerDay={visitsPerDay}
            onVisitCountChange={changeVisitCount}
            visitTimes={visitTimes}
            exactTimes={exactTimes}
            onVisitTimesChange={setVisitTimes}
            onExactTimesChange={setExactTimes}
          />
        ) : (
          <DatesScreen
            careType={careType ?? "visit"}
            value={dates}
            onChange={setDates}
            showValidation={
              revealAllValidation || visitedScreenIds.has("dates")
            }
          />
        );
      case "frequency":
        return (
          <VisitScheduleScreen
            value={visitFrequency}
            onChange={setVisitFrequency}
            customInterval={customInterval}
            onCustomIntervalChange={setCustomInterval}
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
          <BoardingTaskEditor
            options={boardingTasks}
            pets={pets}
            dates={dates}
            value={boardingRoutines}
            onChange={setBoardingRoutines}
            notes={taskNotes}
            onNotesChange={setTaskNotes}
            showValidation={
              revealAllValidation || visitedScreenIds.has("tasks")
            }
          />
        ) : (
          <TaskListEditor
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
          <BoardingSuppliesScreen
            pets={pets}
            value={boardingSupplies}
            onChange={setBoardingSupplies}
            customItems={customBoardingSupplies}
            onCustomItemsChange={setCustomBoardingSupplies}
          />
        );
      case "requirements":
        return careType === "boarding" ? (
          <BoardingEnvironmentScreen
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
          <TagPicker
            options={customRequirements}
            value={customNeeds}
            onChange={setCustomNeeds}
            placeholder="Add another requirement"
          />
        );
      case "cautions":
        return (
          <TagPicker
            options={customCautions}
            value={customWarnings}
            onChange={setCustomWarnings}
            placeholder="Add another caution"
          />
        );
      case "transport":
        return (
          <TransportScreen
            transport={transport}
            onTransportChange={setTransport}
            splitDirection={splitDirection}
            onSplitDirectionChange={setSplitDirection}
          />
        );
      case "area":
        return (
          <AreaScreen
            careType={careType ?? "visit"}
            area={area}
            onChange={setArea}
            areaConfirmed={areaConfirmed}
            onAreaConfirmedChange={setAreaConfirmed}
            location={location}
            onLocationChange={setLocation}
            distance={distance}
            onDistanceChange={setDistance}
            showValidation={revealAllValidation || visitedScreenIds.has("area")}
          />
        );
      case "budget":
        return (
          <BudgetScreen
            careType={careType ?? "visit"}
            transport={transport}
            sitterSupplyCount={sitterSupplyCount}
            supplyCostMode={supplyCostMode}
            onSupplyCostModeChange={setSupplyCostMode}
            value={budget}
            onChange={setBudget}
            showValidation={
              revealAllValidation || visitedScreenIds.has("budget")
            }
          />
        );
      case "preview":
        return (
          <PreviewScreen
            careType={careType ?? "visit"}
            pets={pets}
            dates={dates}
            tasks={activeTasks}
            boardingRoutines={boardingRoutines}
            boardingSupplies={boardingSupplies}
            boardingSupplyItems={boardingSupplyItems}
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
                    ...Object.entries(boardingCompatibility).map(
                      ([label, choice]) =>
                        `${choice === "ok" ? "OK" : "Not OK"}: ${label}`,
                    ),
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
            onBeforeOpenDetail={persistDraft}
          />
        );
    }
  })();

  const illustration = stepIllustrations[currentId];

  return (
    <div className="min-h-dvh bg-[#fcfbf8] text-[#211d27]">
      <FlowHeader onSaveExit={exitFlow} />
      {pendingDraft && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#211d27]/35 px-5 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-draft-title"
        >
          <div className="w-full max-w-[460px] rounded-[22px] border border-[#ded9e0] bg-white p-6 shadow-[0_28px_80px_-32px_rgba(33,29,39,0.6)] md:p-7">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1edf5] text-[#5d3a86]">
              <PiBookmarkSimple size={22} />
            </span>
            <h2
              id="restore-draft-title"
              className="mt-5 text-2xl font-bold tracking-[-0.025em]"
            >
              Continue your care request?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#706a78]">
              You started{" "}
              {pendingDraft.careType
                ? `a ${careTypes[pendingDraft.careType].title}`
                : "a pet care"}{" "}
              request {formatDraftAge(pendingDraft.savedAt)}. Would you like to
              continue where you left off?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={discardDraft}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#cfc7d2] px-5 text-sm font-bold text-[#5d3a86] transition hover:bg-[#faf7fb]"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={resumeDraft}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#5d3a86] px-5 text-sm font-bold text-white transition hover:bg-[#4b2e6d]"
              >
                Resume request
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="site-shell grid gap-7 pb-7 pt-4 md:pb-9 md:pt-6 lg:grid-cols-[152px_minmax(0,1fr)] lg:gap-9 xl:gap-11">
        <RequestProgress
          screens={screens}
          currentIndex={currentIndex}
          careType={careType}
          invalidScreenIds={invalidScreenIds}
          onSelect={selectScreen}
        />

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-[1120px]">
            <section className="relative overflow-hidden border-b border-[#e3dde5] pb-5 md:flex md:min-h-[168px] md:items-center md:py-4">
              <div className="relative z-20 md:max-w-[78%]">
                <h1 className="max-w-[650px] text-3xl font-bold leading-[1.12] tracking-[-0.035em] md:max-w-none md:text-[34px] lg:text-[36px] xl:text-[38px]">
                  {current.title}
                </h1>
                <p className="mt-4 max-w-[850px] text-base leading-7 text-[#706a78]">
                  {current.description}
                </p>
              </div>
              <div
                role="img"
                aria-label={illustration.alt}
                className="absolute right-0 top-1/2 hidden h-[185px] w-[185px] -translate-y-1/2 bg-[url('/images/need-flow-step-sprite-v1.png')] bg-[length:400%_300%] bg-no-repeat mix-blend-multiply md:block lg:h-[195px] lg:w-[195px]"
                style={{
                  backgroundPosition: illustration.position,
                  WebkitMaskImage:
                    "radial-gradient(ellipse 82% 82% at center, #000 58%, transparent 100%)",
                  maskImage:
                    "radial-gradient(ellipse 82% 82% at center, #000 58%, transparent 100%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 hidden bg-[linear-gradient(90deg,#fcfbf8_0%,#fcfbf8_64%,rgba(252,251,248,0.92)_72%,rgba(252,251,248,0.5)_79%,rgba(252,251,248,0)_88%)] md:block"
              />
            </section>

            <section className="w-full py-5 md:py-7">{content}</section>

            <footer className="flex w-full items-center justify-center gap-4 border-t border-[#e3dde5] py-4 md:py-6">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-[#5d3a86] px-5 text-sm font-bold text-[#5d3a86] transition hover:bg-[#faf7fb]"
                >
                  <PiArrowLeft size={18} /> Back
                </button>
              )}
              {currentId === "preview" ? (
                <button
                  type="button"
                  disabled={!canPublish}
                  onClick={handlePublish}
                  className={cn(
                    "inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#5d3a86] px-5 text-sm font-bold text-white shadow-[0_12px_28px_-18px_rgba(93,58,134,0.9)] transition hover:bg-[#4b2e6d] disabled:cursor-not-allowed disabled:bg-[#d7cfd9] disabled:text-[#857d88] disabled:shadow-none",
                  )}
                >
                  Publish request <PiCheck size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentId === "care" && !careType}
                  className={cn(
                    "inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#5d3a86] px-6 text-sm font-bold text-white shadow-[0_12px_28px_-18px_rgba(93,58,134,0.9)] transition hover:bg-[#4b2e6d] disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  Next <PiArrowRight size={18} />
                </button>
              )}
            </footer>
          </div>
        </main>
      </div>

      {showNotice && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-[#d8c9e3] bg-white p-4 shadow-2xl">
          <div className="flex gap-3">
            <PiCheckCircle
              className="mt-0.5 shrink-0 text-[#5d3a86]"
              size={21}
            />
            <div className="flex-1">
              <p className="text-sm font-bold">Publish flow complete</p>
              <p className="mt-1 text-xs leading-5 text-[#706a78]">
                Your saved draft was cleared. No request was sent from this
                front-end prototype.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close notice"
              onClick={() => setShowNotice(false)}
            >
              <PiX size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowHeader({ onSaveExit }: { onSaveExit: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e0e8] bg-[#fffdf9]/95 backdrop-blur-lg">
      <div className="site-shell flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="PetNido home"
        >
          <Image
            src="/favicon.svg"
            alt=""
            width={38}
            height={38}
            className="h-9 w-9"
          />
          <span className="text-2xl font-bold tracking-[0.015em] text-[#5d3a86] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed] md:text-[1.7rem]">
            PetNido
          </span>
        </Link>
        <button
          type="button"
          onClick={onSaveExit}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-[#625a67] transition hover:bg-[#f2edf4] hover:text-[#5d3a86] md:px-3 md:text-sm"
        >
          <PiBookmarkSimple size={18} /> Save &amp; exit
        </button>
      </div>
    </header>
  );
}

function RequestProgress({
  screens,
  currentIndex,
  careType,
  invalidScreenIds,
  onSelect,
}: {
  screens: ScreenDefinition[];
  currentIndex: number;
  careType: CareType | null;
  invalidScreenIds: Set<ScreenId>;
  onSelect: (index: number) => void;
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-[88px] lg:self-start">
      <div className="rounded-2xl border border-[#e3dde5] bg-white px-4 py-3 lg:hidden">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#5d3a86]">
          Post your need
        </p>
      </div>
      <nav aria-label="Request progress" className="hidden lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5d3a86]">
          Post your need
        </p>
        <ol className="mt-4 space-y-1">
          {screens.map((screen, index) => {
            const isCurrent = index === currentIndex;
            const isComplete = index < currentIndex;
            const needsAttention = invalidScreenIds.has(screen.id);
            return (
              <li key={`${screen.id}-${index}`}>
                <button
                  type="button"
                  disabled={!careType && index > 0}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Go to ${screen.label}${needsAttention ? ", needs attention" : ""}`}
                  onClick={() => onSelect(index)}
                  className={cn(
                    "flex min-h-9 w-full items-center rounded-r-lg border-l-[3px] px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#8c6aad] disabled:cursor-not-allowed",
                    isCurrent
                      ? "border-[#5d3a86] bg-[#f2edf6]"
                      : "border-transparent",
                    !careType && index > 0 && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 text-xs font-semibold leading-4",
                      needsAttention
                        ? "text-[#a74755]"
                        : isCurrent
                          ? "text-[#5d3a86]"
                          : isComplete
                            ? "text-[#4d4654]"
                            : "text-[#817a85]",
                    )}
                  >
                    {screen.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}

function CareTypeScreen({
  value,
  onChange,
}: {
  value: CareType | null;
  onChange: (value: CareType) => void;
}) {
  return (
    <div className="space-y-3">
      {(Object.keys(careTypes) as CareType[]).map((type) => {
        const meta = careTypes[type];
        const Icon = meta.icon;
        const selected = value === type;
        return (
          <button
            type="button"
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              "flex w-full items-center gap-4 rounded-[16px] border p-4 text-left transition md:p-5",
              selected
                ? "border-[#5d3a86] bg-[#faf7fb] ring-1 ring-[#5d3a86]"
                : "border-[#ded9e0] bg-white hover:border-[#a996b8]",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                selected
                  ? "bg-[#5d3a86] text-white"
                  : "bg-[#f4f1f6] text-[#5d3a86]",
              )}
            >
              <Icon size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">{meta.title}</span>
              <span className="mt-1 block text-sm leading-5 text-[#706a78]">
                {meta.description}
              </span>
              <span className="mt-2 block text-xs leading-5 text-[#817a85]">
                <span className="font-bold text-[#5d3a86]">Best for:</span>{" "}
                {meta.bestFor}
              </span>
            </span>
            <span className="flex flex-wrap gap-2">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-[#f2edf6] px-2.5 py-1 text-[11px] font-semibold text-[#6c547a]"
                >
                  {tag}
                </span>
              ))}
            </span>
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                  : "border-[#bcb5bf]",
              )}
            >
              {selected && <PiCheck size={14} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PetsScreen({
  pets,
  onChange,
  onAdd,
  onRemove,
  showValidation,
}: {
  pets: PetDraft[];
  onChange: (id: string, patch: Partial<PetDraft>) => void;
  onAdd: () => string;
  onRemove: (id: string) => void;
  showValidation: boolean;
}) {
  const [expanded, setExpanded] = useState("");
  const [validatedPetIds, setValidatedPetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [photoError, setPhotoError] = useState("");
  const previousExpandedRef = useRef("");
  const petSnapshotsRef = useRef(new Map<string, PetDraft>());
  const newPetIdsRef = useRef(new Set<string>());

  const cancelPetEditor = () => {
    if (!expanded) return;
    if (newPetIdsRef.current.has(expanded)) {
      newPetIdsRef.current.delete(expanded);
      onRemove(expanded);
    } else {
      const snapshot = petSnapshotsRef.current.get(expanded);
      if (snapshot) onChange(expanded, snapshot);
    }
    petSnapshotsRef.current.delete(expanded);
    setExpanded("");
  };

  const savePetEditor = () => {
    const pet = pets.find((item) => item.id === expanded);
    if (!pet) return;
    if (!isPetProfileComplete(pet)) {
      setValidatedPetIds((items) => new Set(items).add(pet.id));
      return;
    }
    newPetIdsRef.current.delete(pet.id);
    petSnapshotsRef.current.delete(pet.id);
    setExpanded("");
  };

  const openPetEditor = (pet: PetDraft) => {
    if (expanded === pet.id) {
      cancelPetEditor();
      return;
    }
    if (expanded) cancelPetEditor();
    petSnapshotsRef.current.set(pet.id, { ...pet });
    setPhotoError("");
    setExpanded(pet.id);
  };

  const addPetDraft = () => {
    if (expanded) cancelPetEditor();
    const id = onAdd();
    newPetIdsRef.current.add(id);
    setPhotoError("");
    setExpanded(id);
  };

  const choosePetPhoto = async (file: File | undefined, petId: string) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 8 MB.");
      return;
    }
    try {
      const photo = await preparePetPhoto(file);
      onChange(petId, { photo });
      setPhotoError("");
    } catch {
      setPhotoError("We couldn’t read that image. Try another one.");
    }
  };

  useEffect(() => {
    if (showValidation) setValidatedPetIds(new Set(pets.map((pet) => pet.id)));
    // Existing groups validate when the user returns to this step. Groups added
    // afterwards stay neutral until their editor is collapsed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showValidation]);

  useEffect(() => {
    const previous = previousExpandedRef.current;
    if (previous && previous !== expanded)
      setValidatedPetIds((items) => new Set(items).add(previous));
    previousExpandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const displayPets = Array.from(
    new Set(pets.map((pet) => petGroupKey(pet))),
  ).flatMap((groupKey) => pets.filter((pet) => petGroupKey(pet) === groupKey));

  return (
    <div className="flex flex-wrap items-start gap-3">
      {displayPets.map((pet, index) => {
        const open = expanded === pet.id;
        const isNewDraft = newPetIdsRef.current.has(pet.id);
        const rawPetError = petProfileMissingFields(pet)[0] ?? "";
        const petError = validatedPetIds.has(pet.id) ? rawPetError : "";
        const petLabel = pet.name || petDisplayType(pet) || `Pet ${index + 1}`;
        const suggestedBreeds =
          pet.type === "other"
            ? (otherPetBreedSuggestions[pet.otherType.trim().toLowerCase()] ??
              [])
            : (petBreedSuggestions[pet.type] ?? []);
        const groupKey = petGroupKey(pet);
        const startsGroup =
          !isNewDraft &&
          displayPets
            .slice(0, index)
            .every(
              (item) =>
                newPetIdsRef.current.has(item.id) ||
                petGroupKey(item) !== groupKey,
            );
        const groupMembers = pets.filter(
          (item) =>
            !newPetIdsRef.current.has(item.id) &&
            petGroupKey(item) === groupKey,
        );

        return (
          <div key={pet.id} className="contents">
            {startsGroup && (
              <section className="order-2 mt-2 flex w-full items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold text-[#5d3a86]">
                  {petDisplayType(pet) || "Pet"} group
                </h3>
                <p className="text-xs text-[#817a85]">
                  {groupMembers.length}{" "}
                  {groupMembers.length === 1 ? "pet" : "pets"} · Shared care
                  plan
                </p>
              </section>
            )}
            <article
              className={cn(
                "relative",
                isNewDraft
                  ? "order-4 h-0 w-full border-0 bg-transparent"
                  : "order-2 rounded-[16px] border bg-white",
                !isNewDraft && "w-full sm:w-auto sm:min-w-[300px]",
                !isNewDraft &&
                  (petError ? "border-[#d18a94]" : "border-[#ded9e0]"),
                open &&
                  !isNewDraft &&
                  "z-30 border-[#bda9cb] shadow-[0_12px_28px_-22px_rgba(65,40,84,0.65)]",
              )}
            >
              {!isNewDraft && (
                <div className="flex items-center rounded-[15px] bg-white">
                  <button
                    type="button"
                    onClick={() => openPetEditor(pet)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-[15px] p-4 pr-2 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f1edf5] text-[#5d3a86]">
                      {pet.photo ? (
                        <Image
                          src={pet.photo}
                          alt=""
                          width={36}
                          height={36}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PetAvatar pet={pet} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {petLabel}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-xs",
                          petError
                            ? "font-semibold text-[#a74755]"
                            : "text-[#817a85]",
                        )}
                      >
                        {petError
                          ? "Complete pet details"
                          : petCardDetails(pet)}
                      </span>
                    </span>
                    <PiPencilSimple
                      size={17}
                      className="shrink-0 text-[#5d3a86]"
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${petLabel}`}
                    title="Remove pet"
                    onClick={() => {
                      newPetIdsRef.current.delete(pet.id);
                      petSnapshotsRef.current.delete(pet.id);
                      onRemove(pet.id);
                      if (open) setExpanded("");
                    }}
                    className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff1f1] text-[#a54f59] transition hover:bg-[#f9dddd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b96570]"
                  >
                    <PiTrash size={17} />
                  </button>
                </div>
              )}

              {open && (
                <>
                  <div
                    aria-hidden="true"
                    className="fixed inset-0 z-40 bg-[#211d27]/35 backdrop-blur-[2px]"
                  />
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`pet-editor-title-${pet.id}`}
                    data-pet-editor
                    className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[calc(100dvh-112px)] w-auto max-w-[920px] -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[16px] border border-[#ded9e0] bg-[#fdfcfa] p-4 shadow-[0_22px_42px_-16px_rgba(65,40,84,0.42)] md:inset-x-8 md:p-6"
                  >
                    <h2
                      id={`pet-editor-title-${pet.id}`}
                      className="mb-5 text-xl font-bold tracking-[-0.02em] text-[#35243f]"
                    >
                      {isNewDraft ? "Add a pet" : "Edit pet"}
                    </h2>
                    <div className="space-y-5">
                      <div className="relative">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                          Pet type
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {petTypes
                            .filter((type) => type.id !== "other")
                            .map((type) => {
                              const Icon = type.icon;
                              const selected = pet.type === type.id;
                              return (
                                <button
                                  type="button"
                                  key={type.id}
                                  onClick={() =>
                                    onChange(pet.id, {
                                      type: type.id,
                                      otherType: "",
                                    })
                                  }
                                  className={cn(
                                    "flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold",
                                    selected
                                      ? "border-[#5d3a86] bg-[#f2edf6] text-[#5d3a86]"
                                      : petError && !pet.type
                                        ? "border-[#d18a94] bg-white text-[#706a78]"
                                        : "border-[#ded9e0] bg-white text-[#706a78]",
                                  )}
                                >
                                  <Icon size={17} className="shrink-0" />
                                  <span>{type.label}</span>
                                </button>
                              );
                            })}
                          <span className="inline-flex items-start gap-2">
                            {petTypes
                              .filter((type) => type.id === "other")
                              .map((type) => {
                                const Icon = type.icon;
                                const selected = pet.type === type.id;
                                return (
                                  <button
                                    type="button"
                                    key={type.id}
                                    onClick={() =>
                                      onChange(pet.id, { type: type.id })
                                    }
                                    className={cn(
                                      "flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold",
                                      selected
                                        ? "border-[#5d3a86] bg-[#f2edf6] text-[#5d3a86]"
                                        : petError && !pet.type
                                          ? "border-[#d18a94] bg-white text-[#706a78]"
                                          : "border-[#ded9e0] bg-white text-[#706a78]",
                                    )}
                                  >
                                    <Icon size={17} className="shrink-0" />
                                    <span>{type.label}</span>
                                  </button>
                                );
                              })}
                            {pet.type === "other" && (
                              <span className="relative block h-12">
                                <input
                                  required
                                  list={`other-pet-type-suggestions-${pet.id}`}
                                  aria-label="Other pet type"
                                  aria-invalid={Boolean(
                                    petError && !pet.otherType.trim(),
                                  )}
                                  value={pet.otherType}
                                  onChange={(event) =>
                                    onChange(pet.id, {
                                      otherType: event.target.value,
                                    })
                                  }
                                  className={cn(
                                    inputClass,
                                    "h-12 w-44 sm:w-52",
                                    petError &&
                                      !pet.otherType.trim() &&
                                      "border-[#d18a94] focus:border-[#b65361] focus:ring-[#b65361]/15",
                                  )}
                                  placeholder="Enter pet type"
                                />
                                <datalist
                                  id={`other-pet-type-suggestions-${pet.id}`}
                                >
                                  {otherPetTypeSuggestions.map((suggestion) => (
                                    <option
                                      key={suggestion}
                                      value={suggestion}
                                    />
                                  ))}
                                </datalist>
                                {petError && !pet.otherType.trim() && (
                                  <span className="absolute left-0 top-[calc(100%+2px)] whitespace-nowrap text-xs font-medium text-[#a74755]">
                                    Tell us what kind of pet this is.
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                        {petError && !pet.type && (
                          <span
                            role="alert"
                            className="pointer-events-none absolute left-0 top-[calc(100%+2px)] whitespace-nowrap text-xs font-medium text-[#a74755]"
                          >
                            Choose a pet type.
                          </span>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(190px,.8fr)_minmax(190px,.9fr)]">
                        <Field label="Pet name">
                          <span className="relative block">
                            <input
                              aria-invalid={Boolean(
                                petError && !pet.name.trim(),
                              )}
                              value={pet.name}
                              onChange={(event) =>
                                onChange(pet.id, { name: event.target.value })
                              }
                              className={cn(
                                inputClass,
                                petError &&
                                  !pet.name.trim() &&
                                  "border-[#d18a94]",
                              )}
                              placeholder="Snowball"
                            />
                            {petError && !pet.name.trim() && (
                              <span
                                role="alert"
                                className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-xs font-medium text-[#a74755]"
                              >
                                Enter your pet’s name.
                              </span>
                            )}
                          </span>
                        </Field>
                        <Field label="Breed" optional>
                          <input
                            list={`breed-suggestions-${pet.id}`}
                            value={pet.breed}
                            onChange={(event) =>
                              onChange(pet.id, { breed: event.target.value })
                            }
                            className={inputClass}
                            placeholder="Holland Lop"
                          />
                          {suggestedBreeds.length > 0 && (
                            <datalist id={`breed-suggestions-${pet.id}`}>
                              {suggestedBreeds.map((breed) => (
                                <option key={breed} value={breed} />
                              ))}
                            </datalist>
                          )}
                        </Field>
                        <Field label="Weight" optional>
                          <div className="grid grid-cols-[1fr_88px] gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={pet.weight}
                              onChange={(event) =>
                                onChange(pet.id, { weight: event.target.value })
                              }
                              className={inputClass}
                              placeholder="2.4"
                            />
                            <select
                              aria-label="Weight unit"
                              value={pet.weightUnit}
                              onChange={(event) =>
                                onChange(pet.id, {
                                  weightUnit: event.target
                                    .value as PetDraft["weightUnit"],
                                })
                              }
                              className={inputClass}
                            >
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                            </select>
                          </div>
                        </Field>
                        <Field label="Date of birth" optional>
                          <input
                            type="date"
                            max={toDateValue(new Date())}
                            value={pet.birthDate}
                            onChange={(event) =>
                              onChange(pet.id, {
                                birthDate: event.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(190px,.8fr)_minmax(190px,.9fr)]">
                        <div className="order-1">
                          <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                            Sex{" "}
                            <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                              Optional
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: "male", label: "Male" },
                              { id: "female", label: "Female" },
                              { id: "unknown", label: "Not sure" },
                            ].map((option) => (
                              <button
                                type="button"
                                key={option.id}
                                onClick={() =>
                                  onChange(pet.id, { sex: option.id })
                                }
                                className={cn(
                                  "h-10 rounded-xl border px-3 text-xs font-bold transition",
                                  pet.sex === option.id
                                    ? "border-[#5d3a86] bg-[#f2edf6] text-[#5d3a86]"
                                    : "border-[#ded9e0] bg-white text-[#706a78]",
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative order-2 lg:col-span-2">
                          <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                            Photo{" "}
                            <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                              Optional
                            </span>
                          </p>
                          <div className="flex items-center gap-4">
                            <span
                              className={cn(
                                "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-[#f4f1f6] text-[#5d3a86]",
                                photoError
                                  ? "border-[#d18a94]"
                                  : "border-[#ded9e0]",
                              )}
                            >
                              {pet.photo ? (
                                <Image
                                  src={pet.photo}
                                  alt={`${pet.name || "Pet"} preview`}
                                  width={80}
                                  height={80}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <PetAvatar pet={pet} />
                              )}
                            </span>
                            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#aa96bb] bg-white px-4 text-xs font-bold text-[#5d3a86] transition hover:bg-[#faf7fb]">
                              <PiPlus size={16} />{" "}
                              {pet.photo ? "Change photo" : "Choose photo"}
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) =>
                                  void choosePetPhoto(
                                    event.target.files?.[0],
                                    pet.id,
                                  )
                                }
                              />
                            </label>
                          </div>
                          <p className="mt-2 text-[11px] leading-4 text-[#817a85]">
                            Upload a photo or keep the default avatar.
                          </p>
                          {photoError && (
                            <p
                              role="alert"
                              className="pointer-events-none absolute left-0 top-[calc(100%+2px)] text-xs font-medium text-[#a74755]"
                            >
                              {photoError}
                            </p>
                          )}
                        </div>
                        <div className="order-1">
                          <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                            {pet.sex === "male"
                              ? "Neutered?"
                              : pet.sex === "female"
                                ? "Spayed?"
                                : "Spayed or neutered?"}{" "}
                            <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                              Optional
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: "yes", label: "Yes" },
                              { id: "no", label: "No" },
                              { id: "unknown", label: "Not sure" },
                            ].map((option) => (
                              <button
                                type="button"
                                key={option.id}
                                onClick={() =>
                                  onChange(pet.id, { neutered: option.id })
                                }
                                className={cn(
                                  "h-10 rounded-xl border px-4 text-xs font-bold transition",
                                  pet.neutered === option.id
                                    ? "border-[#5d3a86] bg-[#f2edf6] text-[#5d3a86]"
                                    : "border-[#ded9e0] bg-white text-[#706a78]",
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#e5dfe7] pt-4">
                      <button
                        type="button"
                        onClick={cancelPetEditor}
                        className="h-10 rounded-xl px-4 text-xs font-bold text-[#706a78]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={savePetEditor}
                        className="h-10 rounded-xl bg-[#5d3a86] px-5 text-xs font-bold text-white"
                      >
                        Save pet
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>
          </div>
        );
      })}

      <section className="relative order-3 w-full">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            title="No saved pet profiles yet"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d8d1da] bg-white px-4 py-2 text-sm font-bold text-[#9a939d] disabled:cursor-not-allowed"
          >
            <PiPawPrint size={18} /> Import from pet profile
          </button>
          <button
            type="button"
            onClick={addPetDraft}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-dashed border-[#aa96bb] bg-[#faf7fb] px-4 py-2 text-sm font-bold text-[#5d3a86]"
          >
            <PiPlus size={18} />
            {pets.some((pet) => !newPetIdsRef.current.has(pet.id))
              ? "Add another pet"
              : "Add a pet"}
          </button>
          {showValidation && !pets.length && (
            <span role="alert" className="text-sm font-semibold text-[#a74755]">
              Add at least one pet.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

function DatesScreen({
  careType,
  value,
  onChange,
  showValidation,
  includeNotes = true,
}: {
  careType: CareType;
  value: { startDate: string; endDate: string; notes: string };
  onChange: (value: {
    startDate: string;
    endDate: string;
    notes: string;
  }) => void;
  showValidation: boolean;
  includeNotes?: boolean;
}) {
  const startInvalid = showValidation && !value.startDate;
  const endInvalid = showValidation && !value.endDate;
  const copy = {
    visit: {
      start: "First care date",
      end: "Last care date",
      endHint: "Use the same date for one-day care.",
      notes: "Additional notes",
      placeholder:
        "e.g. Building access is available after 6 pm on the first day",
    },
    boarding: {
      start: "Drop-off date",
      end: "Pickup date",
      endHint: "Use the same date for a same-day stay.",
      notes: "Additional notes",
      placeholder: "e.g. Drop-off after 6 pm and pickup before noon",
    },
    custom: {
      start: "Starts",
      end: "Ends",
      endHint: "Use the same date for a one-day request.",
      notes: "Additional notes",
      placeholder: "e.g. The timing is flexible within the selected dates",
    },
  }[careType];
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="relative flex flex-wrap items-start gap-3">
          <div className="w-full min-w-0 sm:w-[300px]">
            <LinkedDateField
              label={copy.start}
              value={value.startDate}
              linkedDate={value.endDate}
              invalid={startInvalid}
              error={startInvalid ? "Choose a start date." : ""}
              onChange={(startDate) =>
                onChange({
                  ...value,
                  startDate,
                  endDate:
                    value.endDate && startDate && startDate > value.endDate
                      ? ""
                      : value.endDate,
                })
              }
            />
          </div>
          <div className="w-full min-w-0 sm:w-[300px]">
            <LinkedDateField
              label={copy.end}
              value={value.endDate}
              linkedDate={value.startDate}
              invalid={endInvalid}
              error={
                endInvalid
                  ? "Choose an end date on or after the start date."
                  : ""
              }
              onChange={(endDate) =>
                onChange({
                  ...value,
                  startDate:
                    value.startDate && endDate && endDate < value.startDate
                      ? ""
                      : value.startDate,
                  endDate,
                })
              }
            />
          </div>
          <p className="absolute top-0 right-0 text-right text-[11px] font-medium leading-4 text-[#9a939f]">
            {copy.endHint}
          </p>
        </div>
      </div>
      {includeNotes && (
        <Field label={copy.notes} optional>
          <textarea
            value={value.notes}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value })
            }
            className={textareaClass}
            placeholder={copy.placeholder}
          />
        </Field>
      )}
    </div>
  );
}

function VisitDatesScreen({
  dates,
  onDatesChange,
  showValidation,
  visitFrequency,
  onVisitFrequencyChange,
  customInterval,
  onCustomIntervalChange,
  firstVisitDate,
  onFirstVisitDateChange,
  excludedVisitDates,
  onExcludedVisitDatesChange,
  visitsPerDay,
  onVisitCountChange,
  visitTimes,
  exactTimes,
  onVisitTimesChange,
  onExactTimesChange,
}: {
  dates: { startDate: string; endDate: string; notes: string };
  onDatesChange: (value: {
    startDate: string;
    endDate: string;
    notes: string;
  }) => void;
  showValidation: boolean;
  visitFrequency: string;
  onVisitFrequencyChange: (value: string) => void;
  customInterval: number;
  onCustomIntervalChange: (value: number) => void;
  firstVisitDate: string;
  onFirstVisitDateChange: (value: string) => void;
  excludedVisitDates: string[];
  onExcludedVisitDatesChange: (value: string[]) => void;
  visitsPerDay: number;
  onVisitCountChange: (value: number) => void;
  visitTimes: string[];
  exactTimes: string[];
  onVisitTimesChange: (value: string[]) => void;
  onExactTimesChange: (value: string[]) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_max-content]">
        <div className="min-w-0">
          <DatesScreen
            careType="visit"
            value={dates}
            onChange={onDatesChange}
            showValidation={showValidation}
            includeNotes={false}
          />
          <div className="mt-5">
            <VisitScheduleScreen
              value={visitFrequency}
              onChange={onVisitFrequencyChange}
              customInterval={customInterval}
              onCustomIntervalChange={onCustomIntervalChange}
              visitsPerDay={visitsPerDay}
              onVisitCountChange={onVisitCountChange}
              visitTimes={visitTimes}
              exactTimes={exactTimes}
              onVisitTimesChange={onVisitTimesChange}
              onExactTimesChange={onExactTimesChange}
            />
          </div>
          <div className="mt-5">
            <Field label="Additional notes" optional>
              <textarea
                value={dates.notes}
                onChange={(event) =>
                  onDatesChange({ ...dates, notes: event.target.value })
                }
                className={textareaClass}
                placeholder="e.g. Building access is available after 6 pm on the first day"
              />
            </Field>
          </div>
        </div>
        <VisitDatePlan
          dates={dates}
          visitFrequency={visitFrequency}
          customInterval={customInterval}
          firstVisitDate={firstVisitDate}
          onFirstVisitDateChange={onFirstVisitDateChange}
          excludedVisitDates={excludedVisitDates}
          onExcludedVisitDatesChange={onExcludedVisitDatesChange}
          visitsPerDay={visitsPerDay}
          showValidation={showValidation}
        />
      </div>
    </div>
  );
}

function LinkedDateField({
  label,
  value,
  linkedDate,
  invalid,
  error,
  onChange,
}: {
  label: string;
  value: string;
  linkedDate: string;
  invalid: boolean;
  error: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(
    () => parseDateValue(value || linkedDate) ?? new Date(),
  );
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);
  const changeOpen = (next: boolean) => {
    if (next) setMonth(parseDateValue(value || linkedDate) ?? new Date());
    setOpen(next);
  };
  const chooseDate = (date: Date | undefined) => {
    if (!date || date < minDate) return;
    onChange(toDateValue(date));
    setOpen(false);
  };
  return (
    <Field label={label}>
      <span className="relative block">
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-invalid={invalid}
              className={cn(
                inputClass,
                "h-10 max-w-[300px] flex items-center justify-between text-left",
                invalid &&
                  "border-[#d18a94] focus:border-[#b65361] focus:ring-[#b65361]/15",
              )}
            >
              <span className={value ? "text-[#211d27]" : "text-[#aaa4ae]"}>
                {value ? formatDate(value) : "Select date"}
              </span>
              <PiCalendarBlank className="shrink-0 text-[#5d3a86]" size={19} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            collisionPadding={12}
            className="z-[70] max-h-[min(420px,calc(100dvh-128px))] max-w-[calc(100vw-24px)] overflow-y-auto border-[#ded9e0] p-2 [--rdp-accent-color:#5d3a86] [--rdp-accent-background-color:#f1edf5]"
          >
            <DayPicker
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={parseDateValue(value)}
              disabled={{ before: minDate }}
              onSelect={chooseDate}
              classNames={{
                root: "w-full",
                day: "p-0",
                day_button: "h-10 w-10 text-sm",
                weekday: "w-10 text-xs",
                month_caption: "h-9",
                caption_label: "text-sm",
                button_previous: "h-8 w-8",
                button_next: "h-8 w-8",
              }}
            />
            <div className="flex justify-end border-t border-[#eee9ef] pt-2">
              <button
                type="button"
                disabled={!value}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#5d3a86] disabled:opacity-35"
              >
                Clear
              </button>
            </div>
          </PopoverContent>
        </Popover>
        {error && (
          <span
            role="alert"
            className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-xs font-medium text-[#a74755]"
          >
            {error}
          </span>
        )}
      </span>
    </Field>
  );
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildVisitDates({
  dates,
  visitFrequency,
  customInterval,
  firstVisitDate,
  excludedVisitDates = [],
}: {
  dates: { startDate: string; endDate: string };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  excludedVisitDates?: string[];
}) {
  const start = parseDateValue(dates.startDate);
  const end = parseDateValue(dates.endDate);
  if (!start || !end || start > end) return [];

  const requestedFirst = parseDateValue(firstVisitDate);
  const first =
    requestedFirst && requestedFirst >= start && requestedFirst <= end
      ? requestedFirst
      : start;
  const interval =
    visitFrequency === "every-2-days"
      ? 2
      : visitFrequency === "every-3-days"
        ? 3
        : visitFrequency === "custom"
          ? Math.max(1, customInterval || 1)
          : 1;
  const excluded = new Set(excludedVisitDates);
  const result: string[] = [];
  const cursor = new Date(first);
  let guard = 0;
  while (cursor <= end && guard < 3660) {
    const value = toDateValue(cursor);
    if (!excluded.has(value)) result.push(value);
    cursor.setDate(cursor.getDate() + interval);
    guard += 1;
  }
  return result;
}

function buildVisitDateCandidates({
  dates,
  visitFrequency,
  customInterval,
  firstVisitDate,
}: {
  dates: { startDate: string; endDate: string };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
}) {
  // Rebuild without exclusions so the editor can show dates that were
  // explicitly removed from the plan.
  return buildVisitDates({
    dates,
    visitFrequency,
    customInterval,
    firstVisitDate,
    excludedVisitDates: [],
  });
}

function VisitDatePlan({
  dates,
  visitFrequency,
  customInterval,
  firstVisitDate,
  onFirstVisitDateChange,
  excludedVisitDates,
  onExcludedVisitDatesChange,
  visitsPerDay,
  showValidation,
}: {
  dates: { startDate: string; endDate: string };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  onFirstVisitDateChange: (value: string) => void;
  excludedVisitDates: string[];
  onExcludedVisitDatesChange: (value: string[]) => void;
  visitsPerDay: number;
  showValidation: boolean;
}) {
  const candidates = buildVisitDateCandidates({
    dates,
    visitFrequency,
    customInterval,
    firstVisitDate,
  });
  const includedDates = buildVisitDates({
    dates,
    visitFrequency,
    customInterval,
    firstVisitDate,
    excludedVisitDates,
  });
  const hasValidRange = Boolean(
    dates.startDate && dates.endDate && dates.startDate <= dates.endDate,
  );
  const noVisitDates = showValidation && hasValidRange && !includedDates.length;
  const startDate = parseDateValue(dates.startDate);
  const endDate = parseDateValue(dates.endDate);
  const calendarStartMonth = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    : undefined;
  const calendarEndMonth = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    : undefined;
  const isSingleCalendarMonth =
    calendarStartMonth &&
    calendarEndMonth &&
    calendarStartMonth.getTime() === calendarEndMonth.getTime();
  const candidateDateSet = new Set(candidates);
  const excludedDateSet = new Set(excludedVisitDates);
  const initialCalendarDate = parseDateValue(firstVisitDate || dates.startDate);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    startOfMonth(initialCalendarDate ?? new Date()),
  );
  useEffect(() => {
    const nextMonth = parseDateValue(firstVisitDate || dates.startDate);
    if (!nextMonth) return;
    if (startDate && nextMonth < startDate) {
      setCalendarMonth(calendarStartMonth ?? startOfMonth(startDate));
      return;
    }
    if (endDate && nextMonth > endDate) {
      setCalendarMonth(calendarEndMonth ?? startOfMonth(endDate));
      return;
    }
    setCalendarMonth(startOfMonth(nextMonth));
  }, [dates.startDate, dates.endDate, firstVisitDate]);
  const changeCalendarMonth = (offset: number) => {
    const nextMonth = startOfMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + offset,
        1,
      ),
    );
    if (calendarStartMonth && nextMonth < calendarStartMonth) {
      setCalendarMonth(calendarStartMonth);
      return;
    }
    if (calendarEndMonth && nextMonth > calendarEndMonth) {
      setCalendarMonth(calendarEndMonth);
      return;
    }
    setCalendarMonth(nextMonth);
  };
  const canGoToPreviousMonth = Boolean(
    calendarStartMonth && calendarMonth > calendarStartMonth,
  );
  const canGoToNextMonth = Boolean(
    calendarEndMonth && calendarMonth < calendarEndMonth,
  );
  const toggleDate = (date: string) => {
    const next = new Set(excludedVisitDates);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    onExcludedVisitDatesChange(Array.from(next).sort());
  };

  return (
    <section className="w-full self-start rounded-[18px] border border-[#e6e0e7] bg-[#fdfcfa] p-4 sm:p-5 lg:w-fit">
      <Field label="First visit date">
        <input
          type="date"
          value={firstVisitDate}
          min={dates.startDate || undefined}
          max={dates.endDate || undefined}
          disabled={!hasValidRange}
          onChange={(event) => onFirstVisitDateChange(event.target.value)}
          className={cn(inputClass, "block h-10 max-w-[280px] lg:w-[280px]")}
        />
      </Field>

      {candidates.length ? (
        <div className="mt-4 w-full max-w-[280px] lg:w-[280px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
              Planned visit days
            </p>
            <p className="text-xs font-semibold text-[#817a85]">
              {includedDates.length * visitsPerDay}{" "}
              {includedDates.length * visitsPerDay === 1 ? "visit" : "visits"}
            </p>
          </div>
          <div className="mb-2 flex items-center justify-between">
            {isSingleCalendarMonth ? (
              <span className="h-8 w-8" aria-hidden="true" />
            ) : (
              <button
                type="button"
                aria-label="Previous month"
                disabled={!canGoToPreviousMonth}
                onClick={() => changeCalendarMonth(-1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9cce7] bg-[#f1edf5] text-[#5d3a86] transition hover:bg-[#e9dff0] disabled:pointer-events-none disabled:border-[#ebe7ed] disabled:bg-[#fbfafc] disabled:text-[#c8c3c9]"
              >
                <PiArrowLeft size={18} />
              </button>
            )}
            <p className="text-sm font-bold text-[#514956]">
              {calendarMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            {isSingleCalendarMonth ? (
              <span className="h-8 w-8" aria-hidden="true" />
            ) : (
              <button
                type="button"
                aria-label="Next month"
                disabled={!canGoToNextMonth}
                onClick={() => changeCalendarMonth(1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9cce7] bg-[#f1edf5] text-[#5d3a86] transition hover:bg-[#e9dff0] disabled:pointer-events-none disabled:border-[#ebe7ed] disabled:bg-[#fbfafc] disabled:text-[#c8c3c9]"
              >
                <PiArrowRight size={18} />
              </button>
            )}
          </div>
          <DayPicker
            mode="single"
            month={calendarMonth}
            showOutsideDays
            fixedWeeks
            startMonth={calendarStartMonth}
            endMonth={calendarEndMonth}
            hideNavigation
            disabled={
              startDate && endDate
                ? [{ before: startDate }, { after: endDate }]
                : () => true
            }
            onDayClick={(day) => {
              const date = toDateValue(day);
              if (candidateDateSet.has(date)) toggleDate(date);
            }}
            components={{
              DayButton: ({ day, modifiers, className, ...props }) => {
                const date = toDateValue(day.date);
                const isPlanned =
                  candidateDateSet.has(date) && !excludedDateSet.has(date);
                const isExcluded =
                  candidateDateSet.has(date) && excludedDateSet.has(date);
                return (
                  <button
                    {...props}
                    className={cn(
                      className,
                      "h-7 w-7 rounded-full text-xs transition",
                      modifiers.disabled || modifiers.outside
                        ? "text-[#c8c3c9]"
                        : "text-[#514956] hover:bg-[#f1edf5]",
                      isPlanned &&
                        "h-6 w-6 border-2 border-[#5d3a86] bg-[#f1edf5] font-bold text-[#5d3a86] hover:bg-[#e9dff0]",
                      isExcluded &&
                        "h-6 w-6 border border-dashed border-[#c9c0ce] bg-[#faf8f5] text-[#aaa4ae] line-through hover:bg-[#f5f1ed]",
                    )}
                  />
                );
              },
            }}
            classNames={{
              root: "w-full max-w-[280px]",
              months: "w-full",
              month: "w-full",
              month_grid: "w-full table-fixed",
              day: "h-9 p-0 text-center",
              day_button: "mx-auto",
              weekday:
                "w-7 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
              month_caption: "hidden",
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#eee9ef] pt-3 text-[11px] text-[#817a85]">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-[#5d3a86] bg-[#f1edf5]" />
              Visit planned
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-dashed border-[#c9c0ce] bg-[#faf8f5]" />
              Excluded
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-5 w-full max-w-[280px] rounded-xl border border-dashed border-[#ded9e0] px-4 py-3 text-sm text-[#817a85]">
          Add a start and end date to see the exact visit days.
        </p>
      )}

      {noVisitDates && (
        <p role="alert" className="mt-3 text-xs font-semibold text-[#a74755]">
          Keep at least one planned visit day.
        </p>
      )}
    </section>
  );
}

function VisitScheduleScreen({
  value,
  onChange,
  customInterval,
  onCustomIntervalChange,
  visitsPerDay,
  onVisitCountChange,
  visitTimes,
  exactTimes,
  onVisitTimesChange,
  onExactTimesChange,
}: {
  value: string;
  onChange: (value: string) => void;
  customInterval: number;
  onCustomIntervalChange: (value: number) => void;
  visitsPerDay: number;
  onVisitCountChange: (value: number) => void;
  visitTimes: string[];
  exactTimes: string[];
  onVisitTimesChange: (value: string[]) => void;
  onExactTimesChange: (value: string[]) => void;
}) {
  const options = [
    { id: "every-day", label: "Every day" },
    { id: "every-2-days", label: "Every 2 days" },
    { id: "every-3-days", label: "Every 3 days" },
    { id: "custom", label: "Custom interval" },
  ];
  const [intervalDraft, setIntervalDraft] = useState(
    String(customInterval || 4),
  );
  const updateTime = (index: number, next: string) =>
    onVisitTimesChange(
      Array.from({ length: visitsPerDay }, (_, itemIndex) =>
        itemIndex === index ? next : visitTimes[itemIndex] || "flexible",
      ),
    );
  const updateExact = (index: number, next: string) =>
    onExactTimesChange(
      Array.from({ length: visitsPerDay }, (_, itemIndex) =>
        itemIndex === index ? next : exactTimes[itemIndex] || "",
      ),
    );
  const chooseFrequency = (next: string) => {
    if (next === "custom") {
      const interval = Math.max(4, customInterval || 4);
      setIntervalDraft(String(interval));
      onCustomIntervalChange(interval);
    }
    onChange(next);
  };
  const changeIntervalDraft = (next: string) => {
    const digits = next.replace(/\D/g, "");
    setIntervalDraft(digits);
    if (!digits) return;
    const interval = Number(digits);
    if (interval === 1) {
      onCustomIntervalChange(1);
      onChange("every-day");
      return;
    }
    if (interval === 2 || interval === 3) {
      onCustomIntervalChange(interval);
      onChange(`every-${interval}-days`);
      return;
    }
    if (interval > 3) onCustomIntervalChange(interval);
  };
  const normalizeInterval = () => {
    if (Number(intervalDraft) >= 1) return;
    setIntervalDraft("1");
    onCustomIntervalChange(1);
    onChange("every-day");
  };
  return (
    <div className="flex flex-col gap-5">
      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
          Visiting days
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {options.map((option) => (
            <PillChoice
              key={option.id}
              label={option.label}
              active={value === option.id}
              onClick={() => chooseFrequency(option.id)}
              className="min-h-10"
            />
          ))}
          {value === "custom" && (
            <div className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#faf7fb] px-3">
              <span className="text-sm text-[#706a78]">Every</span>
              <input
                aria-label="Custom visiting interval in days"
                inputMode="numeric"
                pattern="[0-9]*"
                value={intervalDraft}
                onChange={(event) => changeIntervalDraft(event.target.value)}
                onBlur={normalizeInterval}
                className={cn(inputClass, "h-10 w-20")}
              />
              <span className="text-sm text-[#706a78]">days</span>
            </div>
          )}
        </div>
      </section>
      <div className="flex flex-col gap-5">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Visits on each care day
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <button
                type="button"
                key={count}
                onClick={() => onVisitCountChange(count)}
                className={cn(
                  "h-10 min-w-10 rounded-full border px-3 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#8c6aad] focus-visible:ring-offset-2",
                  visitsPerDay === count
                    ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                    : "border-[#ded9e0] bg-white text-[#706a78]",
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </section>
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Preferred time
          </p>
          <div className="grid gap-3 md:grid-cols-6">
            {Array.from({ length: visitsPerDay }, (_, index) => (
              <div
                key={index}
                className={cn(
                  "min-w-0",
                  visitTimes[index] === "exact" && "md:col-span-2",
                )}
              >
                <p className="mb-2 text-xs font-semibold text-[#706a78]">
                  {visitsPerDay === 1 ? "Visit" : `Visit ${index + 1}`}
                </p>
                <div
                  className={cn(
                    visitTimes[index] === "exact"
                      ? "grid grid-cols-2 gap-2"
                      : "block",
                  )}
                >
                  <select
                    aria-label={`${visitsPerDay === 1 ? "Visit" : `Visit ${index + 1}`} preferred time`}
                    value={visitTimes[index] || "flexible"}
                    onChange={(event) => updateTime(index, event.target.value)}
                    className={cn(inputClass, "h-10 w-full min-w-0 px-3")}
                  >
                    {timeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {visitTimes[index] === "exact" ? (
                    <input
                      aria-label={`Exact time for visit ${index + 1}`}
                      type="time"
                      value={exactTimes[index] || ""}
                      onChange={(event) =>
                        updateExact(index, event.target.value)
                      }
                      className={cn(inputClass, "h-10 w-full min-w-0 px-3")}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BoardingTaskEditor({
  options,
  pets,
  dates,
  value,
  onChange,
  notes,
  onNotesChange,
  showValidation,
}: {
  options: Array<{ id: string; label: string; icon: IconType }>;
  pets: PetDraft[];
  dates: { startDate: string; endDate: string };
  value: BoardingTaskConfig[];
  onChange: (value: BoardingTaskConfig[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  showValidation: boolean;
}) {
  const petCareGroups = buildPetCareGroups(pets);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<BoardingTaskConfig | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [editorError, setEditorError] = useState("");
  const [showRoutineErrors, setShowRoutineErrors] = useState(false);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    null,
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragHandlePressedRef = useRef<string | null>(null);
  const overlayAnchorRef = useRef<HTMLDivElement | null>(null);
  const overlayPanelRef = useRef<HTMLDivElement | null>(null);
  const overlayOpen = pickerOpen || Boolean(draft);
  const configuredIds = new Set(value.map((config) => config.templateId));
  const available = options.filter((option) => !configuredIds.has(option.id));
  const nextOrder =
    Math.max(
      -1,
      ...value.flatMap((config) =>
        config.routines.map((routine) => routine.order),
      ),
    ) + 1;
  const defaultTimes = (count: number) =>
    ({
      1: ["flexible"],
      2: ["morning", "evening"],
      3: ["morning", "midday", "evening"],
      4: ["morning", "midday", "afternoon", "evening"],
      5: ["morning", "midday", "afternoon", "evening", "bedtime"],
      6: ["morning", "midday", "afternoon", "evening", "bedtime", "flexible"],
    })[count] ?? ["flexible"];
  const createRoutine = (order = nextOrder): BoardingRoutine => ({
    id: crypto.randomUUID(),
    petIds: pets.map((pet) => pet.id),
    priority: "must",
    scheduleType: "daily",
    dailyTimes: ["flexible"],
    intervalDays: 7,
    firstDueDate: "",
    preferredDate: "",
    trigger: "",
    instructions: "",
    order,
  });
  const closeOverlay = () => {
    setPickerOpen(false);
    setDraft(null);
    setCustomLabel("");
    setEditorError("");
    setShowRoutineErrors(false);
    setExpandedRoutineId(null);
  };
  const startNew = (option: { id: string; label: string }) => {
    const routine = createRoutine();
    setPickerOpen(false);
    setEditorError("");
    setDraft({
      templateId: option.id,
      label: option.label,
      custom: false,
      routines: [routine],
    });
    setExpandedRoutineId(routine.id);
  };
  const startCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    const routine = createRoutine();
    setPickerOpen(false);
    setEditorError("");
    setDraft({
      templateId: `boarding-custom-${crypto.randomUUID()}`,
      label,
      custom: true,
      routines: [routine],
    });
    setExpandedRoutineId(routine.id);
  };
  const editConfig = (config: BoardingTaskConfig) => {
    setPickerOpen(false);
    setEditorError("");
    setDraft({
      ...config,
      routines: config.routines.map((routine) => ({
        ...routine,
        petIds: [...routine.petIds],
        dailyTimes: [...routine.dailyTimes],
      })),
    });
    setExpandedRoutineId(null);
  };
  const updateRoutine = (id: string, patch: Partial<BoardingRoutine>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            routines: current.routines.map((routine) =>
              routine.id === id ? { ...routine, ...patch } : routine,
            ),
          }
        : current,
    );
  const addRoutine = () => {
    const routine = createRoutine(nextOrder + (draft?.routines.length ?? 0));
    setDraft((current) =>
      current
        ? { ...current, routines: [...current.routines, routine] }
        : current,
    );
    setExpandedRoutineId(routine.id);
  };
  const removeConfig = (templateId: string) => {
    onChange(value.filter((config) => config.templateId !== templateId));
    if (draft?.templateId === templateId) closeOverlay();
  };
  const removeRoutine = (templateId: string, routineId: string) =>
    onChange(
      value.flatMap((config) => {
        if (config.templateId !== templateId) return [config];
        const routines = config.routines.filter(
          (routine) => routine.id !== routineId,
        );
        return routines.length ? [{ ...config, routines }] : [];
      }),
    );
  const saveDraft = () => {
    if (!draft) return;
    setShowRoutineErrors(true);
    if (!draft.routines.length) {
      setEditorError("Add at least one routine.");
      return;
    }
    const invalidRoutine = draft.routines.find(
      (routine) =>
        !routine.petIds.length ||
        (routine.scheduleType === "daily" && !routine.dailyTimes.length) ||
        (routine.scheduleType === "repeating" && routine.intervalDays < 1) ||
        (routine.scheduleType === "as-needed" && !routine.trigger.trim()),
    );
    if (invalidRoutine) {
      setExpandedRoutineId(invalidRoutine.id);
      if (
        invalidRoutine.scheduleType === "daily" &&
        !invalidRoutine.dailyTimes.length
      )
        setEditorError("Choose at least one daily time.");
      else if (
        invalidRoutine.scheduleType === "repeating" &&
        invalidRoutine.intervalDays < 1
      )
        setEditorError("Enter a valid repeating interval.");
      else setEditorError("");
      return;
    }
    onChange([
      ...value.filter((config) => config.templateId !== draft.templateId),
      draft,
    ]);
    closeOverlay();
  };
  useEffect(() => {
    if (!overlayOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!overlayAnchorRef.current?.contains(event.target as Node))
        closeOverlay();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [overlayOpen]);
  useEffect(() => {
    if (!overlayOpen || !overlayPanelRef.current || !overlayAnchorRef.current)
      return;
    const panel = overlayPanelRef.current;
    const scroller = findScrollContainer(overlayAnchorRef.current);
    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      if (
        panelRect.top < scrollRect.top + 12 ||
        panelRect.bottom > scrollRect.bottom - 20
      )
        scroller.scrollTop += panelRect.top - scrollRect.top - 12;
    });
  }, [overlayOpen, draft?.templateId]);
  useEffect(() => {
    if (!expandedRoutineId || !overlayPanelRef.current) return;
    requestAnimationFrame(() =>
      overlayPanelRef.current
        ?.querySelector(`[data-routine-id="${expandedRoutineId}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  }, [expandedRoutineId]);
  const allItems = value.flatMap((config) =>
    config.routines.map((routine) => ({ config, routine })),
  );
  const groups: Array<{ type: BoardingScheduleType; title: string }> = [
    { type: "daily", title: "Daily routines" },
    { type: "repeating", title: "Repeating care" },
    { type: "once", title: "One-time care" },
    { type: "as-needed", title: "As-needed care" },
  ];
  const moveRoutine = (
    sourceId: string,
    targetId: string,
    type: BoardingScheduleType,
  ) => {
    if (sourceId === targetId) return;
    const ordered = allItems
      .filter((item) => item.routine.scheduleType === type)
      .sort((a, b) => a.routine.order - b.routine.order);
    const sourceIndex = ordered.findIndex(
      (item) => item.routine.id === sourceId,
    );
    const targetIndex = ordered.findIndex(
      (item) => item.routine.id === targetId,
    );
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    const orderById = new Map(
      ordered.map((item, index) => [item.routine.id, index]),
    );
    onChange(
      value.map((config) => ({
        ...config,
        routines: config.routines.map((routine) =>
          orderById.has(routine.id)
            ? { ...routine, order: orderById.get(routine.id)! }
            : routine,
        ),
      })),
    );
  };
  const petsWithoutTasks = pets.filter(
    (pet) => !allItems.some((item) => item.routine.petIds.includes(pet.id)),
  );
  const invalidRoutine = allItems.some(
    ({ routine }) =>
      !routine.petIds.some((petId) => pets.some((pet) => pet.id === petId)) ||
      (routine.scheduleType === "repeating" && routine.intervalDays < 1) ||
      (routine.scheduleType === "as-needed" && !routine.trigger.trim()),
  );
  const scheduleOptions: Array<{ id: BoardingScheduleType; label: string }> = [
    { id: "daily", label: "Daily routine" },
    { id: "repeating", label: "Repeating" },
    { id: "once", label: "Once during the stay" },
    { id: "as-needed", label: "As needed" },
  ];
  const routinePetLabels = (routine: BoardingRoutine) =>
    routine.petIds
      .flatMap((petId) => {
        const pet = pets.find((item) => item.id === petId);
        return pet ? [pet.name || petDisplayType(pet)] : [];
      })
      .join(", ") || "Choose pets";
  return (
    <div className="space-y-5">
      {showValidation && !allItems.length && (
        <div
          role="alert"
          className="rounded-[14px] border border-[#e1aab2] bg-[#fff5f6] px-4 py-3 text-sm font-semibold text-[#a74755]"
        >
          Add at least one care routine.
        </div>
      )}
      {showValidation && invalidRoutine && (
        <div
          role="alert"
          className="rounded-[14px] border border-[#e1aab2] bg-[#fff5f6] px-4 py-3 text-sm font-semibold text-[#a74755]"
        >
          Complete the pets and schedule for every routine.
        </div>
      )}
      {showValidation && allItems.length > 0 && petsWithoutTasks.length > 0 && (
        <div
          role="alert"
          className="rounded-[14px] border border-[#e1aab2] bg-[#fff5f6] px-4 py-3 text-sm font-semibold text-[#a74755]"
        >
          No care routines have been added for{" "}
          {petsWithoutTasks
            .map(
              (pet) =>
                pet.name ||
                petDisplayType(pet) ||
                `Pet ${pets.indexOf(pet) + 1}`,
            )
            .join(", ")}
          .
        </div>
      )}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Configured care tasks
          </h3>
          <p className="text-[10px] text-[#817a85]">Manage routines and pets</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {value.map((config) => (
            <div
              key={config.templateId}
              className="inline-flex items-center overflow-hidden rounded-full border border-[#cfc3d7] bg-white text-[#5d3a86]"
            >
              <span className="px-3 py-2 text-xs font-bold">
                {config.label}
                {config.routines.length > 1
                  ? ` · ${config.routines.length}`
                  : ""}
              </span>
              <button
                type="button"
                aria-label={`Edit ${config.label} routines`}
                onClick={() => editConfig(config)}
                className="flex h-8 w-8 items-center justify-center border-l border-[#e5dfe7]"
              >
                <PiPencilSimple size={14} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${config.label} routines`}
                onClick={() => removeConfig(config.templateId)}
                className="flex h-8 w-8 items-center justify-center border-l border-[#f0d9dc] text-[#a54f59]"
              >
                <PiTrash size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setPickerOpen(true);
              setEditorError("");
            }}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[#9d84b0] bg-[#faf7fb] px-3 text-xs font-bold text-[#5d3a86]"
          >
            <PiPlus size={15} />
            {value.length ? "Add task" : "Add a task"}
          </button>
        </div>
      </section>
      <div ref={overlayAnchorRef} className="relative h-0 w-full">
        {overlayOpen && (
          <div
            ref={overlayPanelRef}
            className="absolute inset-x-0 top-0 z-40 flex max-h-[min(590px,calc(100dvh-230px))] flex-col overflow-hidden rounded-[16px] border border-[#d8c9e3] bg-[#faf7fb] shadow-[0_20px_45px_-24px_rgba(65,40,84,0.6)]"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-7">
              {pickerOpen ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                    Choose a task
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {available.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() => startNew(option)}
                          className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ded9e0] bg-white px-3 text-left text-xs font-bold text-[#706a78]"
                        >
                          <Icon size={17} />
                          {option.label}
                        </button>
                      );
                    })}
                    <div className="flex max-w-full items-center gap-2">
                      <input
                        value={customLabel}
                        onChange={(event) => setCustomLabel(event.target.value)}
                        onKeyDown={(event) =>
                          event.key === "Enter" && startCustom()
                        }
                        className={cn(inputClass, "h-11 w-48 bg-white")}
                        placeholder="Custom task"
                      />
                      <button
                        type="button"
                        aria-label="Configure custom boarding task"
                        onClick={startCustom}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
                      >
                        <PiPlus />
                      </button>
                    </div>
                  </div>
                  {!available.length && (
                    <p className="mt-3 text-xs text-[#817a85]">
                      All standard task types are already configured.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="mt-4 text-xs font-bold text-[#706a78]"
                  >
                    Cancel
                  </button>
                </>
              ) : draft ? (
                <>
                  <div className="sticky top-[-1rem] z-20 -mx-4 -mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dfe7] bg-[#faf7fb] px-4 py-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                        Configure care task
                      </p>
                      <h3 className="mt-0.5 text-lg font-bold">
                        {draft.label} routines
                      </h3>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-[#817a85]">
                        Add separate routines when pets need different timing or
                        instructions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addRoutine}
                      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-dashed border-[#9d84b0] bg-white px-3 text-xs font-bold text-[#5d3a86]"
                    >
                      <PiPlus size={14} /> Add routine
                    </button>
                  </div>
                  <div className="space-y-3 pt-5">
                    {draft.routines.map((routine, routineIndex) => (
                      <section
                        key={routine.id}
                        data-routine-id={routine.id}
                        className={cn(
                          "scroll-mt-32 rounded-[14px] border bg-white p-4 transition-colors",
                          expandedRoutineId === routine.id
                            ? "border-[#c6acd8]"
                            : "border-[#ded9e0]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            aria-expanded={expandedRoutineId === routine.id}
                            onClick={() =>
                              setExpandedRoutineId((current) =>
                                current === routine.id ? null : routine.id,
                              )
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block text-sm font-bold">
                              {draft.routines.length > 1
                                ? `Routine ${routineIndex + 1}`
                                : "Routine"}
                            </span>
                            <span className="mt-1 block truncate text-xs text-[#817a85]">
                              {routinePetLabels(routine)} ·{" "}
                              {boardingRoutineScheduleLabel(routine)}
                            </span>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRoutineId((current) =>
                                  current === routine.id ? null : routine.id,
                                )
                              }
                              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold text-[#5d3a86]"
                            >
                              {expandedRoutineId === routine.id ? (
                                <>
                                  <PiCheck size={14} /> Done
                                </>
                              ) : (
                                <>
                                  <PiPencilSimple size={14} /> Edit
                                </>
                              )}
                            </button>
                            {draft.routines.length > 1 && (
                              <button
                                type="button"
                                aria-label={`Remove routine ${routineIndex + 1}`}
                                onClick={() => {
                                  setDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          routines: current.routines.filter(
                                            (item) => item.id !== routine.id,
                                          ),
                                        }
                                      : current,
                                  );
                                  if (expandedRoutineId === routine.id)
                                    setExpandedRoutineId(null);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1f1] text-[#a54f59]"
                              >
                                <PiTrash size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {expandedRoutineId === routine.id && (
                          <div className="mt-3 grid gap-4 border-t border-[#eee9ef] pt-4 lg:grid-cols-2 lg:items-start">
                            <div className="relative order-1 lg:col-start-1 lg:row-start-1">
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                Which pets?
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {petCareGroups.map((group) => (
                                  <PillChoice
                                    key={group.key}
                                    label={group.label}
                                    active={group.petIds.every((petId) =>
                                      routine.petIds.includes(petId),
                                    )}
                                    onClick={() =>
                                      updateRoutine(routine.id, {
                                        petIds: togglePetGroup(
                                          routine.petIds,
                                          group.petIds,
                                        ),
                                      })
                                    }
                                  />
                                ))}
                              </div>
                              {!pets.length ? (
                                <p
                                  role={showRoutineErrors ? "alert" : undefined}
                                  className={cn(
                                    "text-xs font-medium",
                                    showRoutineErrors
                                      ? "pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-[#a74755]"
                                      : "mt-2 text-[#817a85]",
                                  )}
                                >
                                  Add a pet in the Pets step before assigning
                                  this routine.
                                </p>
                              ) : showRoutineErrors &&
                                !routine.petIds.length ? (
                                <p
                                  role="alert"
                                  className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-xs font-medium text-[#a74755]"
                                >
                                  Choose at least one pet group.
                                </p>
                              ) : null}
                            </div>
                            <div className="order-3 lg:col-span-2 lg:row-start-2">
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                How often?
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {scheduleOptions.map((option) => (
                                  <PillChoice
                                    key={option.id}
                                    label={option.label}
                                    active={routine.scheduleType === option.id}
                                    onClick={() =>
                                      updateRoutine(routine.id, {
                                        scheduleType: option.id,
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            {routine.scheduleType === "as-needed" && (
                              <div className="relative order-4 lg:col-span-2 lg:row-start-3">
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                  When is this needed?
                                </p>
                                <textarea
                                  aria-label={`When routine ${routineIndex + 1} is needed`}
                                  aria-invalid={
                                    showRoutineErrors && !routine.trigger.trim()
                                  }
                                  value={routine.trigger}
                                  onChange={(event) =>
                                    updateRoutine(routine.id, {
                                      trigger: event.target.value,
                                    })
                                  }
                                  className={cn(
                                    textareaClass,
                                    "h-20 text-xs",
                                    showRoutineErrors &&
                                      !routine.trigger.trim() &&
                                      "border-[#d18a94] focus:border-[#b65361] focus:ring-[#b65361]/15",
                                  )}
                                  placeholder="Describe what should trigger this task"
                                />
                                {showRoutineErrors &&
                                  !routine.trigger.trim() && (
                                    <p
                                      role="alert"
                                      className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-xs font-medium text-[#a74755]"
                                    >
                                      Describe when this task is needed.
                                    </p>
                                  )}
                              </div>
                            )}
                            {routine.scheduleType === "daily" && (
                              <div className="order-4 flex flex-wrap items-end gap-x-5 gap-y-4 lg:col-span-2 lg:row-start-3">
                                <div className="max-w-full shrink-0">
                                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                    Times per day
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6].map((count) => (
                                      <button
                                        type="button"
                                        key={count}
                                        onClick={() =>
                                          updateRoutine(routine.id, {
                                            dailyTimes: defaultTimes(count),
                                          })
                                        }
                                        className={cn(
                                          "h-9 min-w-9 rounded-full border px-3 text-xs font-bold",
                                          routine.dailyTimes.length === count
                                            ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                                            : "border-[#ded9e0] text-[#706a78]",
                                        )}
                                      >
                                        {count}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {routine.dailyTimes.map((time, index) => (
                                  <div key={index} className="w-full sm:w-auto">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                      Time {index + 1}
                                    </p>
                                    <div className="flex w-full items-center gap-2">
                                      <select
                                        aria-label={`Routine ${routineIndex + 1} time ${index + 1}`}
                                        value={
                                          time.startsWith("exact:")
                                            ? "exact"
                                            : time
                                        }
                                        onChange={(event) => {
                                          const next = [...routine.dailyTimes];
                                          next[index] =
                                            event.target.value === "exact"
                                              ? "exact:08:00"
                                              : event.target.value;
                                          updateRoutine(routine.id, {
                                            dailyTimes: next,
                                          });
                                        }}
                                        className={cn(
                                          inputClass,
                                          "h-10 min-w-0 flex-1 px-2.5 text-xs sm:w-32 sm:flex-none",
                                        )}
                                      >
                                        <option value="flexible">
                                          Flexible
                                        </option>
                                        <option value="morning">Morning</option>
                                        <option value="midday">Midday</option>
                                        <option value="afternoon">
                                          Afternoon
                                        </option>
                                        <option value="evening">Evening</option>
                                        <option value="bedtime">Bedtime</option>
                                        <option value="exact">
                                          Exact time
                                        </option>
                                      </select>
                                      {time.startsWith("exact:") && (
                                        <input
                                          type="time"
                                          aria-label={`Exact time ${index + 1}`}
                                          value={time.slice(6)}
                                          onChange={(event) => {
                                            const next = [
                                              ...routine.dailyTimes,
                                            ];
                                            next[index] =
                                              `exact:${event.target.value}`;
                                            updateRoutine(routine.id, {
                                              dailyTimes: next,
                                            });
                                          }}
                                          className={cn(
                                            inputClass,
                                            "h-10 min-w-0 flex-1 px-2.5 text-xs sm:w-28 sm:flex-none",
                                          )}
                                        />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {routine.scheduleType === "repeating" && (
                              <div className="order-4 flex flex-wrap items-end gap-4 lg:col-span-2 lg:row-start-3">
                                <div>
                                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                    Repeat every
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <input
                                      aria-label="Repeat interval in days"
                                      inputMode="numeric"
                                      value={routine.intervalDays || ""}
                                      onChange={(event) =>
                                        updateRoutine(routine.id, {
                                          intervalDays: Math.max(
                                            0,
                                            Number(
                                              event.target.value.replace(
                                                /\D/g,
                                                "",
                                              ),
                                            ),
                                          ),
                                        })
                                      }
                                      className={cn(
                                        inputClass,
                                        "h-10 w-20 px-3 text-center text-sm font-bold",
                                      )}
                                      placeholder="7"
                                    />
                                    <span className="text-xs font-medium text-[#706a78]">
                                      days
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                    First due date{" "}
                                    <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                                      Optional
                                    </span>
                                  </p>
                                  <input
                                    type="date"
                                    aria-label="First due date"
                                    min={dates.startDate || undefined}
                                    max={dates.endDate || undefined}
                                    value={routine.firstDueDate}
                                    onChange={(event) =>
                                      updateRoutine(routine.id, {
                                        firstDueDate: event.target.value,
                                      })
                                    }
                                    className={cn(
                                      inputClass,
                                      "h-10 w-44 px-3 text-xs",
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                            {routine.scheduleType === "once" && (
                              <div className="order-4 lg:col-span-2 lg:row-start-3">
                                <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                  Preferred date{" "}
                                  <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                                    Optional
                                  </span>
                                </p>
                                <input
                                  type="date"
                                  aria-label="Preferred date"
                                  min={dates.startDate || undefined}
                                  max={dates.endDate || undefined}
                                  value={routine.preferredDate}
                                  onChange={(event) =>
                                    updateRoutine(routine.id, {
                                      preferredDate: event.target.value,
                                    })
                                  }
                                  className={cn(
                                    inputClass,
                                    "h-10 w-44 px-3 text-xs",
                                  )}
                                />
                                <p className="mt-1.5 text-[10px] leading-4 text-[#817a85]">
                                  Leave blank for any suitable day during the
                                  stay.
                                </p>
                              </div>
                            )}
                            <div className="order-2 lg:col-start-2 lg:row-start-1">
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                Importance
                              </p>
                              <div className="flex gap-2">
                                <PillChoice
                                  label="Must do"
                                  active={routine.priority === "must"}
                                  onClick={() =>
                                    updateRoutine(routine.id, {
                                      priority: "must",
                                    })
                                  }
                                />
                                <PillChoice
                                  label="If possible"
                                  active={routine.priority === "nice"}
                                  onClick={() =>
                                    updateRoutine(routine.id, {
                                      priority: "nice",
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="order-5 lg:col-span-2 lg:row-start-4">
                              <Field label="Instructions" optional>
                                <textarea
                                  value={routine.instructions}
                                  onChange={(event) =>
                                    updateRoutine(routine.id, {
                                      instructions: event.target.value,
                                    })
                                  }
                                  className={cn(textareaClass, "h-20 text-xs")}
                                  placeholder="Add any details the sitter should follow"
                                />
                              </Field>
                            </div>
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                  {editorError && (
                    <p
                      role="alert"
                      className="mt-3 text-xs font-semibold text-[#a74755]"
                    >
                      {editorError}
                    </p>
                  )}
                </>
              ) : null}
            </div>
            {draft && !pickerOpen && (
              <div className="flex shrink-0 items-center justify-between border-t border-[#e5dfe7] bg-[#faf7fb] px-4 py-3">
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-[#706a78]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="h-10 rounded-xl bg-[#5d3a86] px-5 text-xs font-bold text-white"
                >
                  Save task
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {groups.map((group) => {
        const items = allItems
          .filter((item) => item.routine.scheduleType === group.type)
          .sort((a, b) => a.routine.order - b.routine.order);
        if (!items.length) return null;
        return (
          <section key={group.type} className="space-y-3">
            <h3 className="text-sm font-bold text-[#5d3a86]">{group.title}</h3>
            <div className="flex flex-wrap gap-3">
              {items.map(({ config, routine }) => {
                const Icon =
                  options.find((option) => option.id === config.templateId)
                    ?.icon ?? PiSparkle;
                const petLabels = routine.petIds.flatMap((petId) => {
                  const pet = pets.find((item) => item.id === petId);
                  return pet ? [pet.name || petDisplayType(pet)] : [];
                });
                return (
                  <article
                    key={routine.id}
                    draggable
                    onDragStart={(event) => {
                      if (dragHandlePressedRef.current !== routine.id) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedId(routine.id);
                    }}
                    onDragEnd={() => {
                      dragHandlePressedRef.current = null;
                      setDraggedId(null);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedId)
                        moveRoutine(draggedId, routine.id, group.type);
                      setDraggedId(null);
                    }}
                    className={cn(
                      "flex w-full min-w-0 items-center rounded-[15px] border border-[#ded9e0] bg-white p-3 sm:w-auto sm:min-w-[300px]",
                      draggedId === routine.id && "opacity-50 shadow-lg",
                    )}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Reorder ${config.label}`}
                      onPointerDown={() => {
                        dragHandlePressedRef.current = routine.id;
                      }}
                      onPointerUp={() => {
                        dragHandlePressedRef.current = null;
                      }}
                      className="mr-2 flex h-9 w-6 cursor-grab items-center justify-center text-[#9b939f]"
                    >
                      <PiDotsSixVertical size={20} />
                    </span>
                    <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6f2f7] text-[#8a5d34]">
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {config.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#817a85]">
                        {routine.priority === "must"
                          ? "Must do"
                          : "If possible"}{" "}
                        · {petLabels.join(", ") || "No pets"}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${config.label} routine`}
                      onClick={() =>
                        removeRoutine(config.templateId, routine.id)
                      }
                      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff1f1] text-[#a54f59]"
                    >
                      <PiTrash size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      <Field label="Additional care notes" optional>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className={textareaClass}
          placeholder="Add anything that does not fit a specific care routine"
        />
      </Field>
    </div>
  );
}

function BoardingSuppliesScreen({
  pets,
  value,
  onChange,
  customItems,
  onCustomItemsChange,
}: {
  pets: PetDraft[];
  value: BoardingSupplyPlan;
  onChange: (value: BoardingSupplyPlan) => void;
  customItems: CustomBoardingSupply[];
  onCustomItemsChange: (value: CustomBoardingSupply[]) => void;
}) {
  const [activePetId, setActivePetId] = useState(pets[0]?.id ?? "");
  const [activeCategory, setActiveCategory] = useState<SupplyCategory>("food");
  const [customLabel, setCustomLabel] = useState("");
  useEffect(() => {
    if (!pets.some((pet) => pet.id === activePetId))
      setActivePetId(pets[0]?.id ?? "");
  }, [activePetId, pets]);
  const options = boardingSupplyOptions(pets, customItems);
  const visibleOptions = options.filter(
    (item) => item.petId === activePetId && item.category === activeCategory,
  );
  const updateChoice = (key: string, choice: SupplyProvision) =>
    onChange({ ...value, [key]: value[key] === choice ? "" : choice });
  const addCustom = () => {
    const label = customLabel.trim();
    if (
      !label ||
      !activePetId ||
      visibleOptions.some(
        (item) => item.label.toLowerCase() === label.toLowerCase(),
      )
    )
      return;
    setCustomLabel("");
    onCustomItemsChange([
      ...customItems,
      {
        id: crypto.randomUUID(),
        petId: activePetId,
        category: activeCategory,
        label,
      },
    ]);
  };
  const removeCustom = (item: BoardingSupplyOption) => {
    onCustomItemsChange(
      customItems.filter(
        (customItem) => customItem.id !== item.key.slice("custom:".length),
      ),
    );
    const next = { ...value };
    delete next[item.key];
    onChange(next);
  };
  if (!pets.length)
    return (
      <div className="rounded-[14px] border border-dashed border-[#d8c9e3] bg-[#faf7fb] px-4 py-5 text-sm text-[#706a78]">
        Add a pet or pet group in the Pets step before planning supplies.
      </div>
    );
  const categoryOptions: Array<{
    id: SupplyCategory;
    label: string;
    description: string;
  }> = [
    {
      id: "food",
      label: "Food & medication",
      description: "Meals and health essentials",
    },
    {
      id: "stay",
      label: "Care equipment",
      description: "Everyday care essentials",
    },
    {
      id: "travel",
      label: "Travel items",
      description: "Carriers and travel equipment",
    },
  ];
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Choose a pet group
          </h3>
          <p className="text-[10px] text-[#817a85]">
            Plan each group separately
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pets.map((pet, index) => (
            <PillChoice
              key={pet.id}
              label={`${pet.name || petDisplayType(pet) || `Pet ${index + 1}`} ×${pet.quantity}`}
              active={pet.id === activePetId}
              onClick={() => {
                setActivePetId(pet.id);
                setCustomLabel("");
              }}
              prominent
            />
          ))}
        </div>
      </div>
      <section className="overflow-hidden rounded-[16px] border border-[#ded9e0] bg-white">
        <div
          role="tablist"
          aria-label="Supply categories"
          className="flex flex-wrap gap-1 border-b border-[#ded9e0] bg-[#f7f3f8] p-1.5"
        >
          {categoryOptions.map((category) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === category.id}
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setCustomLabel("");
              }}
              className={cn(
                "min-w-[145px] flex-1 rounded-[10px] px-3 py-2 text-left transition",
                activeCategory === category.id
                  ? "bg-white text-[#392845] shadow-sm"
                  : "text-[#706a78] hover:bg-white/60",
              )}
            >
              <span className="block text-sm font-bold">{category.label}</span>
              <span className="mt-0.5 block text-[10px] text-[#817a85]">
                {category.description}
              </span>
            </button>
          ))}
        </div>
        <div role="tabpanel" className="grid gap-2 p-4 lg:grid-cols-2">
          {visibleOptions.map((item) => {
            const ItemIcon = supplyItemIcon(item.label);
            return (
              <div
                key={item.key}
                className="rounded-[12px] bg-[#faf9f7] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f0eaf3] text-[#6a438d]">
                    <ItemIcon size={16} />
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-bold leading-5 text-[#302a34]">
                    {item.label}
                  </p>
                  {item.custom && (
                    <button
                      type="button"
                      aria-label={`Delete ${item.label}`}
                      onClick={() => removeCustom(item)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-[#a54f59]"
                    >
                      <PiTrash size={11} />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex justify-center gap-1">
                  <SupplyChoice
                    label="I’ll bring it"
                    active={value[item.key] === "owner"}
                    onClick={() => updateChoice(item.key, "owner")}
                  />
                  <SupplyChoice
                    label="Sitter provides"
                    active={value[item.key] === "sitter"}
                    onClick={() => updateChoice(item.key, "sitter")}
                  />
                  <SupplyChoice
                    label="Not needed"
                    active={value[item.key] === "not-needed"}
                    onClick={() => updateChoice(item.key, "not-needed")}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 rounded-[12px] bg-[#faf9f7] px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f0eaf3] text-[#6a438d]">
              <PiSparkle size={16} />
            </span>
            <input
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  addCustom();
                }
              }}
              className={cn(inputClass, "h-9 min-w-0 flex-1 bg-white text-xs")}
              placeholder={`Add to ${categoryOptions.find((category) => category.id === activeCategory)?.label.toLowerCase()}`}
            />
            <button
              type="button"
              aria-label="Add supply item"
              onClick={addCustom}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
            >
              <PiPlus />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SupplyChoice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-1 text-[9px] font-semibold leading-4 transition",
        active
          ? "border-[#5d3a86] bg-[#5d3a86] text-white"
          : "border-[#d7d0da] bg-white text-[#706a78] hover:border-[#9d84b0]",
      )}
    >
      {label}
    </button>
  );
}

function TaskListEditor({
  options,
  pets,
  value,
  onChange,
  notes,
  onNotesChange,
  careType,
  visitsPerDay,
  visitTimes,
  exactTimes,
  showValidation,
}: {
  options: Array<{ id: string; label: string; icon: IconType }>;
  pets: PetDraft[];
  value: TaskPlan[];
  onChange: (value: TaskPlan[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  careType: CareType;
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  showValidation: boolean;
}) {
  const petCareGroups = buildPetCareGroups(pets);
  type VisitDraft = {
    visit: number;
    enabled: boolean;
    petIds: string[];
    priority: TaskPriority;
    notes: string;
  };
  type ConfigDraft = {
    templateId: string;
    label: string;
    custom: boolean;
    visits: VisitDraft[];
  };
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<ConfigDraft | null>(null);
  const [editorError, setEditorError] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragHandlePressedRef = useRef<string | null>(null);
  const overlayAnchorRef = useRef<HTMLDivElement | null>(null);
  const overlayPanelRef = useRef<HTMLDivElement | null>(null);
  const overlayOpen = pickerOpen || Boolean(draft);
  const visitNumbers =
    careType === "visit"
      ? Array.from(
          { length: Math.max(1, visitsPerDay) },
          (_, index) => index + 1,
        )
      : [1];
  const configuredTemplateIds = new Set(value.map((task) => task.templateId));
  const available = options.filter(
    (option) => !configuredTemplateIds.has(option.id),
  );
  const configured = Array.from(
    new Map(
      value.map((task) => [
        task.templateId,
        { templateId: task.templateId, label: task.label, custom: task.custom },
      ]),
    ).values(),
  );
  const DraftTaskIcon = draft
    ? (options.find((option) => option.id === draft.templateId)?.icon ??
      PiSparkle)
    : PiSparkle;
  const emptyVisits = () =>
    visitNumbers.map((visit) => ({
      visit,
      enabled: false,
      petIds: pets.map((pet) => pet.id),
      priority: "must" as TaskPriority,
      notes: "",
    }));
  const closeOverlay = () => {
    setPickerOpen(false);
    setDraft(null);
    setEditorError("");
    setCustomLabel("");
    setExpandedVisit(null);
  };
  const startNew = (option: { id: string; label: string }) => {
    setPickerOpen(false);
    setEditorError("");
    setExpandedVisit(null);
    setDraft({
      templateId: option.id,
      label: option.label,
      custom: false,
      visits: emptyVisits(),
    });
  };
  const startCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    setPickerOpen(false);
    setEditorError("");
    setExpandedVisit(null);
    setDraft({
      templateId: `custom-${crypto.randomUUID()}`,
      label,
      custom: true,
      visits: emptyVisits(),
    });
  };
  const editConfigured = (templateId: string) => {
    const assignments = value.filter((task) => task.templateId === templateId);
    const first = assignments[0];
    if (!first) return;
    setPickerOpen(false);
    setEditorError("");
    setExpandedVisit(null);
    setDraft({
      templateId,
      label: first.label,
      custom: first.custom,
      visits: visitNumbers.map((visit) => {
        const assignment = assignments.find((task) =>
          task.visitNumbers.includes(visit),
        );
        return {
          visit,
          enabled: Boolean(assignment),
          petIds: assignment?.petIds ?? pets.map((pet) => pet.id),
          priority: assignment?.priority ?? "must",
          notes: assignment?.notes ?? "",
        };
      }),
    });
  };
  const removeConfiguration = (templateId: string) => {
    onChange(value.filter((task) => task.templateId !== templateId));
    if (draft?.templateId === templateId) closeOverlay();
  };
  const updateVisitDraft = (visit: number, patch: Partial<VisitDraft>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            visits: current.visits.map((item) =>
              item.visit === visit ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  const saveDraft = () => {
    if (!draft) return;
    const enabled = draft.visits.filter((item) => item.enabled);
    if (!enabled.length) {
      setEditorError("Choose at least one visit for this task.");
      return;
    }
    if (enabled.some((item) => !item.petIds.length)) {
      setEditorError("Choose at least one pet group for every selected visit.");
      return;
    }
    const existing = value.filter(
      (task) => task.templateId === draft.templateId,
    );
    const remaining = value.filter(
      (task) => task.templateId !== draft.templateId,
    );
    const assignments = enabled.map((item) => {
      const previous = existing.find((task) =>
        task.visitNumbers.includes(item.visit),
      );
      const nextOrder =
        previous?.order ??
        Math.max(
          -1,
          ...remaining
            .filter((task) => task.visitNumbers.includes(item.visit))
            .map((task) => task.order ?? 0),
        ) + 1;
      return {
        id:
          previous?.visitNumbers.length === 1
            ? previous.id
            : `${draft.templateId}-visit-${item.visit}-${crypto.randomUUID()}`,
        templateId: draft.templateId,
        label: draft.label,
        priority: item.priority,
        petIds: item.petIds,
        visitNumbers: [item.visit],
        custom: draft.custom,
        notes: item.notes.trim(),
        order: nextOrder,
      } satisfies TaskPlan;
    });
    const existingIndex = value.findIndex(
      (task) => task.templateId === draft.templateId,
    );
    const insertIndex =
      existingIndex < 0
        ? remaining.length
        : value
            .slice(0, existingIndex)
            .filter((task) => task.templateId !== draft.templateId).length;
    remaining.splice(insertIndex, 0, ...assignments);
    onChange(remaining);
    closeOverlay();
  };
  useEffect(() => {
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayOpen]);
  const groups =
    careType === "visit"
      ? visitNumbers.map((visit, index) => ({
          key: `visit-${visit}`,
          visit,
          title: `Visit ${visit}`,
          subtitle: visitTimeLabel(visitTimes[index], exactTimes[index]),
          tasks: value
            .filter((task) => task.visitNumbers.includes(visit))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }))
      : [
          {
            key: "all",
            visit: 0,
            title: "Care tasks",
            subtitle: "",
            tasks: [...value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          },
        ];
  const moveTask = (sourceId: string, targetId: string, visit: number) => {
    if (sourceId === targetId) return;
    const ordered = (
      careType === "visit"
        ? value.filter((task) => task.visitNumbers.includes(visit))
        : value
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const sourceIndex = ordered.findIndex((task) => task.id === sourceId);
    const targetIndex = ordered.findIndex((task) => task.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    const orderById = new Map(ordered.map((task, index) => [task.id, index]));
    onChange(
      value.map((task) =>
        orderById.has(task.id)
          ? { ...task, order: orderById.get(task.id) }
          : task,
      ),
    );
  };
  const removeAssignment = (id: string) =>
    onChange(value.filter((task) => task.id !== id));
  const petsWithoutTasks = pets.filter(
    (pet) => !value.some((task) => task.petIds.includes(pet.id)),
  );
  const taskWithoutPetGroup = value.some(
    (task) =>
      !task.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
  );
  const missingVisits =
    careType === "visit"
      ? groups
          .filter((group) => !group.tasks.length)
          .map((group) => group.visit)
      : [];
  const missingVisitsLabel =
    missingVisits.length === 1
      ? `visit ${missingVisits[0]}`
      : missingVisits.length > 1
        ? `visits ${missingVisits.slice(0, -1).join(", ")} and ${missingVisits[missingVisits.length - 1]}`
        : "";
  const taskValidationMessage = !showValidation
    ? ""
    : !value.length
      ? "Add at least one care task."
      : missingVisits.length
        ? `Add at least one task to ${missingVisitsLabel}.`
        : taskWithoutPetGroup
          ? "Every task must be assigned to at least one pet group."
          : petsWithoutTasks.length
            ? `No tasks have been added for ${petsWithoutTasks.map((pet) => pet.name || petDisplayType(pet) || `Pet ${pets.indexOf(pet) + 1}`).join(", ")}.`
            : "";
  return (
    <div className="space-y-5">
      {!petCareGroups.length && (
        <p
          role="status"
          className="rounded-[14px] border border-dashed border-[#d8c9e3] bg-[#faf7fb] px-4 py-3 text-sm leading-6 text-[#706a78]"
        >
          No pet groups yet. Add who needs care in the Pets step first.
        </p>
      )}
      <section className="relative">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Care tasks
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {configured.map((item) => {
            const ConfiguredIcon =
              options.find((option) => option.id === item.templateId)?.icon ??
              PiSparkle;
            return (
              <div
                key={item.templateId}
                className="inline-flex items-center overflow-hidden rounded-full border border-[#cfc3d7] bg-white text-[#5d3a86]"
              >
                <span
                  title={item.label}
                  className="inline-flex min-w-0 max-w-[240px] items-center gap-1.5 px-3 py-2 text-xs font-bold"
                >
                  <ConfiguredIcon size={14} className="shrink-0" />
                  <span className="min-w-0 truncate">{item.label}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Edit ${item.label} configuration`}
                  title="Edit configuration"
                  onClick={() => editConfigured(item.templateId)}
                  className="flex h-8 w-8 items-center justify-center border-l border-[#e5dfe7] hover:bg-[#faf7fb]"
                >
                  <PiPencilSimple size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${item.label} configuration and all visit assignments`}
                  title="Delete configuration"
                  onClick={() => removeConfiguration(item.templateId)}
                  className="flex h-8 w-8 items-center justify-center border-l border-[#f0d9dc] text-[#a54f59] hover:bg-[#fff1f1]"
                >
                  <PiTrash size={14} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setPickerOpen(true);
              setEditorError("");
            }}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[#9d84b0] bg-[#faf7fb] px-3 text-xs font-bold text-[#5d3a86] hover:bg-[#f3edf7]"
          >
            <PiPlus size={15} />
            {value.length ? "Add task" : "Add a task"}
          </button>
          {taskValidationMessage && (
            <span role="alert" className="text-sm font-semibold text-[#a74755]">
              {taskValidationMessage}
            </span>
          )}
        </div>
      </section>
      <div ref={overlayAnchorRef} className="relative h-0 w-full" />
      {overlayOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#211d27]/35 px-4 py-6 backdrop-blur-[2px]">
          <div
            ref={overlayPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              draft ? "configure-task-title" : "choose-task-title"
            }
            className="relative z-10 flex max-h-[min(760px,calc(100dvh-48px))] w-full max-w-[760px] flex-col overflow-y-auto overscroll-contain rounded-[20px] border border-[#d8c9e3] bg-[#faf7fb] p-4 shadow-[0_24px_65px_-28px_rgba(65,40,84,0.7)] md:p-6"
          >
            {pickerOpen ? (
              <>
                <h2
                  id="choose-task-title"
                  className="mb-5 text-xl font-bold tracking-[-0.02em] text-[#35243f]"
                >
                  Choose a task
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {available.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => startNew(option)}
                        className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ded9e0] bg-white px-3 text-left text-xs font-bold text-[#706a78]"
                      >
                        <Icon size={17} />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                  <div className="flex max-w-full items-center gap-2">
                    <input
                      value={customLabel}
                      onChange={(event) => setCustomLabel(event.target.value)}
                      onKeyDown={(event) =>
                        event.key === "Enter" && startCustom()
                      }
                      className={cn(inputClass, "h-11 w-48 bg-white")}
                      placeholder="Custom task"
                    />
                    <button
                      type="button"
                      aria-label="Configure custom task"
                      onClick={startCustom}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
                    >
                      <PiPlus />
                    </button>
                  </div>
                </div>
                {!available.length && (
                  <p className="mt-3 text-xs text-[#817a85]">
                    All standard task types are already configured.
                  </p>
                )}
                <div className="mt-4 flex justify-start border-t border-[#e5dfe7] pt-3">
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="h-10 px-0 text-xs font-bold text-[#706a78]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : draft ? (
              <>
                <div>
                  <h2
                    id="configure-task-title"
                    className="mb-5 text-xl font-bold tracking-[-0.02em] text-[#35243f]"
                  >
                    Configure task
                  </h2>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                      Task
                    </p>
                    <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#e0d5e5] bg-white px-3 py-2 text-[#5d3a86] shadow-[0_5px_16px_-12px_rgba(65,40,84,0.55)]">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f2ebf5] text-[#7a5796]">
                        <DraftTaskIcon size={16} />
                      </span>
                      <h3 className="truncate text-base font-semibold text-[#5d3a86]">
                        {draft.label}
                      </h3>
                    </div>
                  </div>
                  <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                    When should this task happen?
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {draft.visits.map((item) => {
                    const selectedGroupLabel = petCareGroups
                      .filter((group) =>
                        group.petIds.every((petId) =>
                          item.petIds.includes(petId),
                        ),
                      )
                      .map((group) => group.label)
                      .join(", ");
                    const note = item.notes.trim();
                    const isExpanded =
                      item.enabled && expandedVisit === item.visit;
                    const toggleExpanded = () => {
                      if (!item.enabled) return;
                      setExpandedVisit((current) =>
                        current === item.visit ? null : item.visit,
                      );
                    };
                    return (
                      <section
                        key={item.visit}
                        className={cn(
                          "rounded-[14px] border p-3 transition-colors",
                          item.enabled
                            ? "border-[#ded9e0] bg-white"
                            : "border-[#e8e3e8] bg-[#faf9f7]",
                          isExpanded &&
                            "border-[#bda9cb] shadow-[0_12px_28px_-22px_rgba(65,40,84,0.65)]",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-pressed={item.enabled}
                            aria-label={
                              (item.enabled ? "Deselect " : "Select ") +
                              "visit " +
                              item.visit
                            }
                            onClick={() => {
                              const nextEnabled = !item.enabled;
                              updateVisitDraft(item.visit, {
                                enabled: nextEnabled,
                              });
                              setExpandedVisit(
                                nextEnabled
                                  ? item.visit
                                  : expandedVisit === item.visit
                                    ? null
                                    : expandedVisit,
                              );
                            }}
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                              item.enabled
                                ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                                : "border-[#bcb5bf] bg-white text-transparent",
                            )}
                          >
                            {item.enabled && <PiCheck size={14} />}
                          </button>
                          <button
                            type="button"
                            disabled={!item.enabled}
                            aria-expanded={isExpanded}
                            onClick={toggleExpanded}
                            className="min-w-0 flex-1 text-left outline-none disabled:cursor-not-allowed disabled:opacity-65"
                          >
                            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                              <span className="inline-flex max-w-[190px] min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-[#35243f]">
                                <span className="shrink-0">
                                  Visit {item.visit}
                                </span>
                                <span className="text-[#b2a8b6]">·</span>
                                <PiClock
                                  size={14}
                                  className="shrink-0 text-[#8a6c9d]"
                                />
                                <span className="truncate text-xs font-medium text-[#817a85]">
                                  {visitTimeLabel(
                                    visitTimes[item.visit - 1],
                                    exactTimes[item.visit - 1],
                                  )}
                                </span>
                              </span>
                              {item.enabled && selectedGroupLabel && (
                                <span className="inline-flex max-w-[260px] min-w-0 items-center gap-1.5 text-xs font-semibold text-[#5f5364]">
                                  <PiPawPrint
                                    size={14}
                                    className="shrink-0 text-[#8a6c9d]"
                                  />
                                  <span className="truncate">
                                    {selectedGroupLabel}
                                  </span>
                                </span>
                              )}
                              {item.enabled && (
                                <span
                                  className={cn(
                                    "inline-flex max-w-[120px] min-w-0 items-center gap-1.5 text-xs font-semibold",
                                    item.priority === "must"
                                      ? "text-[#a74755]"
                                      : "text-[#7b6a52]",
                                  )}
                                >
                                  {item.priority === "must" ? (
                                    <PiWarningCircle
                                      size={14}
                                      className="shrink-0"
                                    />
                                  ) : (
                                    <PiFlag size={14} className="shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {item.priority === "must"
                                      ? "Must do"
                                      : "If time"}
                                  </span>
                                </span>
                              )}
                              {item.enabled && note && (
                                <span className="inline-flex max-w-[300px] min-w-0 items-center gap-1.5 text-xs text-[#817a85]">
                                  <PiNote
                                    size={14}
                                    className="shrink-0 text-[#9a8a9f]"
                                  />
                                  <span className="truncate">{note}</span>
                                </span>
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            disabled={!item.enabled}
                            aria-label={
                              (isExpanded ? "Collapse " : "Expand ") +
                              "visit " +
                              item.visit
                            }
                            aria-expanded={isExpanded}
                            onClick={toggleExpanded}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f0f8] text-[#5d3a86] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {isExpanded ? (
                              <PiCaretUp size={16} />
                            ) : (
                              <PiCaretDown size={16} />
                            )}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 grid gap-4 border-t border-[#eee9ef] pt-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                Who needs care?
                              </p>
                              {petCareGroups.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {petCareGroups.map((group) => (
                                    <PillChoice
                                      key={group.key}
                                      label={group.label}
                                      active={group.petIds.every((petId) =>
                                        item.petIds.includes(petId),
                                      )}
                                      onClick={() =>
                                        updateVisitDraft(item.visit, {
                                          petIds: togglePetGroup(
                                            item.petIds,
                                            group.petIds,
                                          ),
                                        })
                                      }
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p
                                  role="status"
                                  className="rounded-xl border border-dashed border-[#d8c9e3] bg-[#faf7fb] px-3 py-2 text-xs leading-5 text-[#706a78]"
                                >
                                  No pet groups yet. Add who needs care in the
                                  Pets step first.
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                Priority
                              </p>
                              <div className="flex gap-2">
                                <PillChoice
                                  label="Must do"
                                  active={item.priority === "must"}
                                  onClick={() =>
                                    updateVisitDraft(item.visit, {
                                      priority: "must",
                                    })
                                  }
                                />
                                <PillChoice
                                  label="If time"
                                  active={item.priority === "nice"}
                                  onClick={() =>
                                    updateVisitDraft(item.visit, {
                                      priority: "nice",
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                                Visit notes{" "}
                                <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                                  Optional
                                </span>
                              </p>
                              <textarea
                                aria-label={"Notes for visit " + item.visit}
                                value={item.notes}
                                onChange={(event) =>
                                  updateVisitDraft(item.visit, {
                                    notes: event.target.value,
                                  })
                                }
                                className={cn(textareaClass, "h-20 text-xs")}
                                placeholder="e.g. Give 20 g of rabbit pellets at each visit"
                              />
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
                {editorError && (
                  <p
                    role="alert"
                    className="mt-3 text-xs font-semibold text-[#a74755]"
                  >
                    {editorError}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e5dfe7] pt-3">
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="h-10 rounded-xl px-4 text-xs font-bold text-[#706a78]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="h-10 rounded-xl bg-[#5d3a86] px-5 text-xs font-bold text-white"
                  >
                    Save task
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      {value.length > 0 &&
        groups
          .filter((group) => group.tasks.length)
          .map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#5d3a86]">
                  <span className="shrink-0">{group.title}</span>
                  {group.subtitle && (
                    <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-[#817a85]">
                      <PiClock size={14} className="shrink-0 text-[#8a6c9d]" />
                      <span className="truncate">{group.subtitle}</span>
                    </span>
                  )}
                </h3>
                {group.tasks.length > 1 && (
                  <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9a939f]">
                    <PiDotsSixVertical
                      size={14}
                      className="shrink-0 text-[#b5acb8]"
                    />
                    Drag to reorder tasks if needed.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {group.tasks.map((task) => {
                  const Icon =
                    options.find((option) => option.id === task.templateId)
                      ?.icon ?? PiSparkle;
                  const petLabels = taskPetLabelText(task, pets, petCareGroups);
                  return (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        if (dragHandlePressedRef.current !== task.id) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.effectAllowed = "move";
                        setDraggedId(task.id);
                      }}
                      onDragEnd={() => {
                        dragHandlePressedRef.current = null;
                        setDraggedId(null);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedId)
                          moveTask(draggedId, task.id, group.visit);
                        setDraggedId(null);
                      }}
                      className={cn(
                        "flex w-full min-w-0 items-center rounded-[15px] border border-[#ded9e0] bg-white p-3 transition",
                        careType === "visit"
                          ? "sm:w-fit sm:max-w-[320px] sm:flex-none"
                          : "sm:w-[300px] sm:min-w-0 sm:max-w-[300px] sm:flex-none",
                        draggedId === task.id && "opacity-50 shadow-lg",
                      )}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Reorder ${task.label}`}
                        onPointerDown={() => {
                          dragHandlePressedRef.current = task.id;
                        }}
                        onPointerUp={() => {
                          dragHandlePressedRef.current = null;
                        }}
                        className="mr-2 flex h-9 w-6 shrink-0 cursor-grab items-center justify-center text-[#9b939f]"
                      >
                        <PiDotsSixVertical size={20} />
                      </span>
                      <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6f2f7] text-[#8a5d34]">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          title={task.label}
                          className="block max-w-full truncate text-sm font-bold leading-5"
                        >
                          {task.label}
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px]">
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold",
                              task.priority === "must"
                                ? "text-[#a74755]"
                                : "text-[#7b6a52]",
                            )}
                          >
                            {task.priority === "must" ? (
                              <PiWarningCircle size={12} />
                            ) : (
                              <PiFlag size={12} />
                            )}
                            <span>
                              {task.priority === "must" ? "Must do" : "If time"}
                            </span>
                          </span>
                          {petLabels && (
                            <span
                              title={petLabels}
                              className="inline-flex min-w-0 max-w-[180px] flex-1 items-center gap-1 text-[11px] font-medium text-[#6c4f80]"
                            >
                              <PiPawPrint size={12} className="shrink-0" />
                              <span className="min-w-0 truncate">
                                {petLabels}
                              </span>
                            </span>
                          )}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${task.label} from ${group.title}`}
                        onClick={() => removeAssignment(task.id)}
                        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff1f1] text-[#a54f59]"
                      >
                        <PiTrash size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
      <div className="">
        <Field
          label="Additional care notes"
          optional
          hint="Add anything that does not belong to a specific visit"
          hintInline
          hintInlineRight
        >
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className={textareaClass}
            placeholder="e.g. Brush once a week; trim nails once a month"
          />
        </Field>
      </div>
    </div>
  );
}

function BoardingMustHavePicker({
  value,
  onChange,
  customOptions,
  onCustomOptionsChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  customOptions: string[];
  onCustomOptionsChange: (value: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const items = [...boardingRequirements, ...customOptions];
  const add = () => {
    const item = custom.trim();
    if (
      !item ||
      items.some((existing) => existing.toLowerCase() === item.toLowerCase())
    )
      return;
    setCustom("");
    onCustomOptionsChange([...customOptions, item]);
    onChange([...value, item]);
  };
  const remove = (item: string) => {
    onCustomOptionsChange(customOptions.filter((option) => option !== item));
    onChange(value.filter((option) => option !== item));
  };
  const optionButton = (item: string) => {
    const active = value.includes(item);
    return (
      <button
        type="button"
        onClick={() => onChange(toggleValue(value, item))}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 px-3 text-left text-sm font-bold transition",
          active ? "text-[#493456]" : "text-[#706a78]",
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
            active
              ? "border-[#5d3a86] bg-[#5d3a86] text-white"
              : "border-[#bcb5bf]",
          )}
        >
          {active && <PiCheck size={12} />}
        </span>
        <span>{item}</span>
      </button>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {boardingRequirements.map((item) => {
        const active = value.includes(item);
        return (
          <span
            key={item}
            className={cn(
              "inline-flex overflow-hidden rounded-xl border bg-white transition",
              active
                ? "border-[#8f73a6] bg-[#faf7fb]"
                : "border-[#ded9e0] hover:border-[#aa96bb]",
            )}
          >
            {optionButton(item)}
          </span>
        );
      })}
      {customOptions.map((item) => {
        const active = value.includes(item);
        return (
          <span
            key={item}
            className={cn(
              "inline-flex items-center overflow-hidden rounded-xl border bg-white transition",
              active
                ? "border-[#8f73a6] bg-[#faf7fb]"
                : "border-[#ded9e0] hover:border-[#aa96bb]",
            )}
          >
            {optionButton(item)}
            <button
              type="button"
              aria-label={`Delete custom requirement ${item}`}
              title="Delete custom requirement"
              onClick={() => remove(item)}
              className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff3f3] text-[#a54f59] transition hover:bg-[#f9dddd]"
            >
              <PiTrash size={13} />
            </button>
          </span>
        );
      })}
      <span className="inline-flex shrink-0 items-center gap-2">
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            add();
          }}
          className={cn(inputClass, "h-11 w-44 sm:w-52")}
          placeholder="Add another requirement"
        />
        <button
          type="button"
          aria-label="Add custom requirement"
          onClick={add}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
        >
          <PiPlus />
        </button>
      </span>
    </div>
  );
}

function BoardingEnvironmentScreen({
  needs,
  onNeedsChange,
  customRequirements,
  onCustomRequirementsChange,
  compatibility,
  onCompatibilityChange,
  customSituations,
  onCustomSituationsChange,
  notes,
  onNotesChange,
}: {
  needs: string[];
  onNeedsChange: (value: string[]) => void;
  customRequirements: string[];
  onCustomRequirementsChange: (value: string[]) => void;
  compatibility: Record<string, CompatibilityChoice>;
  onCompatibilityChange: (value: Record<string, CompatibilityChoice>) => void;
  customSituations: string[];
  onCustomSituationsChange: (value: string[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const [customSituation, setCustomSituation] = useState("");
  const situations = [...boardingHomeSituations, ...customSituations];
  const chooseCompatibility = (label: string, choice: CompatibilityChoice) => {
    const next = { ...compatibility };
    if (next[label] === choice) delete next[label];
    else next[label] = choice;
    onCompatibilityChange(next);
  };
  const addSituation = () => {
    const label = customSituation.trim();
    if (
      !label ||
      situations.some((item) => item.toLowerCase() === label.toLowerCase())
    )
      return;
    setCustomSituation("");
    onCustomSituationsChange([...customSituations, label]);
  };
  const removeSituation = (label: string) => {
    onCustomSituationsChange(customSituations.filter((item) => item !== label));
    const next = { ...compatibility };
    delete next[label];
    onCompatibilityChange(next);
  };
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Must have
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#817a85]">
            Choose the support or home features your pet genuinely needs.
          </p>
        </div>
        <BoardingMustHavePicker
          value={needs}
          onChange={onNeedsChange}
          customOptions={customRequirements}
          onCustomOptionsChange={onCustomRequirementsChange}
        />
      </section>
      <section className="border-t border-[#eee9ef] pt-5">
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Home compatibility
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#817a85]">
            Mark each situation as OK or Not OK. Leave both unselected when you
            have no preference.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {situations.map((item) => {
            const custom = customSituations.includes(item);
            return (
              <div
                key={item}
                className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-xl border border-[#ded9e0] bg-white p-1"
              >
                <span className="flex items-center px-2 text-sm font-bold text-[#493456]">
                  {item}
                </span>
                <button
                  type="button"
                  aria-pressed={compatibility[item] === "ok"}
                  onClick={() => chooseCompatibility(item, "ok")}
                  className={cn(
                    "flex h-7 items-center rounded-full border px-2.5 text-[11px] font-normal shadow-sm transition",
                    compatibility[item] === "ok"
                      ? "border-[#3f7d64] bg-[#3f7d64] text-white shadow-none"
                      : "border-[#6e9a86] bg-transparent text-[#376f59] hover:border-[#3f7d64] hover:bg-[#f3f9f6]",
                  )}
                >
                  OK
                </button>
                <button
                  type="button"
                  aria-pressed={compatibility[item] === "not-ok"}
                  onClick={() => chooseCompatibility(item, "not-ok")}
                  className={cn(
                    "flex h-7 items-center rounded-full border px-2.5 text-[11px] font-normal shadow-sm transition",
                    compatibility[item] === "not-ok"
                      ? "border-[#a54f59] bg-[#a54f59] text-white shadow-none"
                      : "border-[#c77b85] bg-transparent text-[#9c4f59] hover:border-[#a54f59] hover:bg-[#fff7f7]",
                  )}
                >
                  Not OK
                </button>
                {custom && (
                  <button
                    type="button"
                    aria-label={`Delete custom home situation ${item}`}
                    title="Delete custom home situation"
                    onClick={() => removeSituation(item)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff3f3] text-[#a54f59] transition hover:bg-[#f9dddd]"
                  >
                    <PiTrash size={13} />
                  </button>
                )}
              </div>
            );
          })}
          <span className="inline-flex shrink-0 items-center gap-2">
            <input
              value={customSituation}
              onChange={(event) => setCustomSituation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing)
                  return;
                event.preventDefault();
                addSituation();
              }}
              className={cn(inputClass, "h-11 w-44 sm:w-52")}
              placeholder="Add a home situation"
            />
            <button
              type="button"
              aria-label="Add home situation"
              onClick={addSituation}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
            >
              <PiPlus />
            </button>
          </span>
        </div>
      </section>
      <section className="border-t border-[#eee9ef] pt-5">
        <Field label="Additional home fit notes" optional>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className={textareaClass}
            placeholder="e.g. Other pets are welcome, but they should not have direct contact with mine"
          />
        </Field>
      </section>
    </div>
  );
}

function TagPicker({
  options,
  value,
  onChange,
  placeholder,
  compactInline = false,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  compactInline?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const customItems = value.filter((item) => !options.includes(item));
  const add = () => {
    const item = custom.trim();
    if (!item) return;
    onChange([...value, item]);
    setCustom("");
  };
  if (compactInline)
    return (
      <div className="flex flex-wrap items-center gap-2">
        {[...options, ...customItems].map((item) => {
          const active = value.includes(item);
          return (
            <button
              type="button"
              key={item}
              onClick={() => onChange(toggleValue(value, item))}
              className={cn(
                "inline-flex min-h-11 w-auto items-center gap-2 rounded-xl border px-3 text-left text-sm font-bold transition",
                active
                  ? "border-[#8f73a6] bg-[#faf7fb] text-[#493456]"
                  : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[#aa96bb]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  active
                    ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                    : "border-[#bcb5bf]",
                )}
              >
                {active && <PiCheck size={12} />}
              </span>
              <span>{item}</span>
            </button>
          );
        })}
        <span className="inline-flex shrink-0 items-center gap-2">
          <input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && add()}
            className={cn(inputClass, "h-11 w-44 sm:w-52")}
            placeholder={placeholder}
          />
          <button
            type="button"
            aria-label="Add item"
            onClick={add}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
          >
            <PiPlus />
          </button>
        </span>
      </div>
    );
  return (
    <div>
      <div className="space-y-2">
        {[...options, ...customItems].map((item) => (
          <ChoiceRow
            key={item}
            label={item}
            active={value.includes(item)}
            onClick={() => onChange(toggleValue(value, item))}
            checkbox
          />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && add()}
          className={inputClass}
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-label="Add item"
          onClick={add}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#5d3a86] text-white"
        >
          <PiPlus />
        </button>
      </div>
    </div>
  );
}

function BoardingDistancePicker({
  distance,
  onDistanceChange,
}: {
  distance: string;
  onDistanceChange: (value: string) => void;
}) {
  const customMatch = distance.match(
    /^Custom: ((?:\d+(?:\.\d+)?)|(?:\.\d+)) km$/,
  );
  const customActive = distance === "Custom distance" || Boolean(customMatch);
  const [customDistance, setCustomDistance] = useState(customMatch?.[1] ?? "");
  const distanceOptions = [
    { value: "3 km", label: "Within 3 km" },
    { value: "5 km", label: "Within 5 km" },
    { value: "10 km", label: "Within 10 km" },
    { value: "20 km", label: "Within 20 km" },
    { value: "No preference", label: "No preference" },
  ];
  const parsedCustomDistance = Number(customDistance);
  const customDistanceIsValid =
    /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(customDistance) &&
    Number.isFinite(parsedCustomDistance) &&
    parsedCustomDistance > 0;
  const selectCustomDistance = () =>
    onDistanceChange(
      customDistanceIsValid
        ? `Custom: ${customDistance.trim()} km`
        : "Custom distance",
    );
  const updateCustomDistance = (value: string) => {
    const numeric = value.replace(/[^\d.]/g, "");
    const [whole, ...decimalParts] = numeric.split(".");
    const next = decimalParts.length
      ? `${whole}.${decimalParts.join("")}`
      : whole;
    setCustomDistance(next);
    const parsed = Number(next);
    const valid =
      /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(next) &&
      Number.isFinite(parsed) &&
      parsed > 0;
    onDistanceChange(valid ? `Custom: ${next} km` : "Custom distance");
  };
  const customDistanceInvalid = customActive && !customDistanceIsValid;
  return (
    <section
      aria-labelledby="boarding-distance-title"
      className="border-t border-[#eee9ef] pt-5"
    >
      <h3
        id="boarding-distance-title"
        className="mb-2 text-sm font-bold text-[#211d27]"
      >
        How close should the boarding home be?
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {distanceOptions.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => onDistanceChange(item.value)}
            className={cn(
              "min-h-10 rounded-full border px-4 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#8c6aad] focus-visible:ring-offset-2",
              distance === item.value
                ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                : "border-[#ded9e0] bg-white text-[#554e59] hover:border-[#a996b8]",
            )}
          >
            {item.label}
          </button>
        ))}
        <span className="inline-flex shrink-0 items-start gap-2">
          <button
            type="button"
            onClick={selectCustomDistance}
            className={cn(
              "min-h-10 rounded-full border px-4 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#8c6aad] focus-visible:ring-offset-2",
              customActive
                ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                : "border-[#ded9e0] bg-white text-[#554e59] hover:border-[#a996b8]",
            )}
          >
            Custom distance
          </button>
          {customActive && (
            <span className="relative flex flex-col items-start">
              <label
                className={cn(
                  "flex min-h-10 items-center gap-1 rounded-xl border bg-white px-3 transition focus-within:ring-2 focus-within:ring-[#8c6aad] focus-within:ring-offset-2",
                  customDistanceInvalid
                    ? "border-[#d47a85]"
                    : "border-[#8f73a6]",
                )}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Custom maximum distance"
                  aria-invalid={customDistanceInvalid}
                  value={customDistance}
                  onChange={(event) => updateCustomDistance(event.target.value)}
                  className="w-14 bg-transparent text-xs font-bold text-[#35243f] outline-none placeholder:font-normal placeholder:text-[#aaa3ae]"
                  placeholder="e.g. 15"
                />
                <span className="text-xs font-bold text-[#554e59]">km</span>
              </label>
              {customDistanceInvalid && (
                <span
                  role="alert"
                  className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-[11px] font-medium text-[#b84f5d]"
                >
                  Enter a valid distance.
                </span>
              )}
            </span>
          )}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[#817a85]">
        Distance is measured from the selected map point above and is used to
        prioritize nearby boarding homes.
      </p>
    </section>
  );
}

function TransportScreen({
  transport,
  onTransportChange,
  splitDirection,
  onSplitDirectionChange,
}: {
  transport: string;
  onTransportChange: (value: string) => void;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  onSplitDirectionChange: (value: "owner-dropoff" | "sitter-dropoff") => void;
}) {
  const options = [
    { id: "owner", label: "I’ll handle both trips" },
    { id: "sitter", label: "The sitter will handle both trips" },
    { id: "split", label: "We’ll split drop-off and pickup" },
    { id: "taxi", label: "Pet taxi" },
    { id: "discuss", label: "Discuss later" },
  ];
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
          Pickup and drop-off arrangement
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          {options.map((item) => (
            <ChoiceRow
              key={item.id}
              label={item.label}
              active={transport === item.id}
              onClick={() => onTransportChange(item.id)}
            />
          ))}
        </div>
      </section>
      {transport === "split" && (
        <section className="rounded-[16px] border border-[#ded9e0] bg-[#faf9f7] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            Who handles each trip?
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceRow
              label="I drop off · sitter returns"
              active={splitDirection === "owner-dropoff"}
              onClick={() => onSplitDirectionChange("owner-dropoff")}
            />
            <ChoiceRow
              label="Sitter picks up · I collect"
              active={splitDirection === "sitter-dropoff"}
              onClick={() => onSplitDirectionChange("sitter-dropoff")}
            />
          </div>
        </section>
      )}
      <p className="text-xs leading-5 text-[#817a85]">
        If the sitter handles either trip, you can decide how those travel costs
        are covered in the next step.
      </p>
    </div>
  );
}

function AreaScreen({
  careType,
  area,
  onChange,
  areaConfirmed,
  onAreaConfirmedChange,
  location,
  onLocationChange,
  distance,
  onDistanceChange,
  showValidation,
}: {
  careType: CareType;
  area: string;
  onChange: (value: string) => void;
  areaConfirmed: boolean;
  onAreaConfirmedChange: (value: boolean) => void;
  location: LocationDraft;
  onLocationChange: (value: LocationDraft) => void;
  distance: string;
  onDistanceChange: (value: string) => void;
  showValidation: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [center, setCenter] = useState(location);
  const [zoom, setZoom] = useState(13);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reverseSearching, setReverseSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRequestRef = useRef<AbortController | null>(null);
  const reverseRequestRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAfterInputRef = useRef(false);
  const search = async (queryValue = area) => {
    const query = queryValue.trim();
    if (query.length < 2) return;
    searchRequestRef.current?.abort();
    const controller = new AbortController();
    searchRequestRef.current = controller;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(
        `/api/geocode?mode=search&q=${encodeURIComponent(query)}&lat=${center.lat}&lng=${center.lng}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as { results?: GeocodeResult[] };
      if (searchRequestRef.current !== controller) return;
      setResults(data.results ?? []);
      setSearchOpen(true);
      if (!data.results?.length)
        setSearchError(
          "No matching places found. Try adding a city or country.",
        );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResults([]);
      setSearchError("Location search is temporarily unavailable.");
      setSearchOpen(true);
    } finally {
      if (searchRequestRef.current === controller) {
        searchRequestRef.current = null;
        setSearching(false);
      }
    }
  };
  const runSearchNow = () => {
    searchAfterInputRef.current = false;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    void search(area);
  };
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const query = area.trim();
    if (!searchAfterInputRef.current || query.length < 2) return;
    debounceTimerRef.current = setTimeout(() => {
      searchAfterInputRef.current = false;
      void search(query);
    }, 650);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [area]);
  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      searchRequestRef.current?.abort();
      reverseRequestRef.current?.abort();
    },
    [],
  );
  const selectSuggestion = (item: GeocodeResult) => {
    reverseRequestRef.current?.abort();
    setReverseSearching(false);
    searchAfterInputRef.current = false;
    onChange(item.label);
    onAreaConfirmedChange(true);
    const next = { lat: item.lat, lng: item.lng };
    onLocationChange(next);
    setCenter(next);
    setSearchOpen(false);
  };
  const selectMapPoint = async (next: LocationDraft) => {
    onLocationChange(next);
    searchAfterInputRef.current = false;
    searchRequestRef.current?.abort();
    reverseRequestRef.current?.abort();
    setResults([]);
    onChange("");
    onAreaConfirmedChange(false);
    setSearchOpen(false);
    setReverseSearching(true);
    setSearchError("");
    const controller = new AbortController();
    reverseRequestRef.current = controller;
    try {
      const response = await fetch(
        `/api/geocode?mode=reverse&lat=${next.lat}&lng=${next.lng}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Reverse lookup failed");
      const data = (await response.json()) as { result?: GeocodeResult | null };
      if (data.result?.label) {
        searchAfterInputRef.current = false;
        onChange(data.result.label);
        onAreaConfirmedChange(true);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSearchError(
        "The pin was saved, but its area name could not be found.",
      );
    } finally {
      if (reverseRequestRef.current === controller) {
        reverseRequestRef.current = null;
        setReverseSearching(false);
      }
    }
  };
  return (
    <div className={cn("space-y-6", careType === "boarding" && "space-y-5")}>
      <Field label="Where should care take place?">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <PiMagnifyingGlass
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8a5d34]"
                size={19}
              />
              <input
                aria-invalid={showValidation && !areaConfirmed}
                value={area}
                onFocus={() => results.length && setSearchOpen(true)}
                onChange={(event) => {
                  searchAfterInputRef.current = true;
                  searchRequestRef.current?.abort();
                  onAreaConfirmedChange(false);
                  onChange(event.target.value);
                  setResults([]);
                  setSearchOpen(false);
                  setSearchError("");
                }}
                className={cn(
                  inputClass,
                  "pl-11 pr-11",
                  showValidation &&
                    !areaConfirmed &&
                    "border-[#d18a94] focus:border-[#b65361] focus:ring-[#b65361]/15",
                )}
                placeholder="e.g. Konohana, Osaka or a station name"
              />
              {area && (
                <button
                  type="button"
                  aria-label="Clear area search"
                  onClick={() => {
                    searchAfterInputRef.current = false;
                    searchRequestRef.current?.abort();
                    onAreaConfirmedChange(false);
                    if (debounceTimerRef.current)
                      clearTimeout(debounceTimerRef.current);
                    onChange("");
                    setResults([]);
                    setSearchOpen(false);
                    setSearchError("");
                  }}
                  className="absolute right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#817a85] hover:bg-[#f1edf5] hover:text-[#5d3a86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c6aad]"
                >
                  <PiX size={16} />
                </button>
              )}
              {showValidation && !areaConfirmed && (
                <span
                  role="alert"
                  className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-xs font-medium text-[#a74755]"
                >
                  Confirm a location before continuing.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={runSearchNow}
              disabled={searching || area.trim().length < 2}
              className="h-12 shrink-0 rounded-xl bg-[#5d3a86] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {searchOpen && (
            <div className="absolute inset-x-0 top-[54px] z-30 max-h-64 overflow-y-auto rounded-[14px] border border-[#ded9e0] bg-white shadow-xl">
              {results.length ? (
                results.map((item) => (
                  <button
                    type="button"
                    key={`${item.lat}-${item.lng}-${item.label}`}
                    onClick={() => selectSuggestion(item)}
                    className="flex w-full items-start gap-3 border-b border-[#eee9ef] px-4 py-3 text-left last:border-b-0 hover:bg-[#faf7fb]"
                  >
                    <PiMapPin
                      className="mt-0.5 shrink-0 text-[#5d3a86]"
                      size={18}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#817a85]">
                        {item.detail}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-[#817a85]">
                  {searchError || "No matching places found."}
                </p>
              )}
            </div>
          )}
        </div>
      </Field>
      <div className="space-y-6">
        <MapPicker
          center={center}
          marker={location}
          zoom={zoom}
          compact={careType === "boarding"}
          onCenterChange={setCenter}
          onZoomChange={setZoom}
          onSelect={(next) => void selectMapPoint(next)}
        />
        {reverseSearching && (
          <p className="text-xs text-[#817a85]">Finding this area name…</p>
        )}
        {searchError && !searchOpen && (
          <p className="text-xs text-[#9c5d5d]">{searchError}</p>
        )}
        <div
          className={cn(
            "rounded-[16px] bg-[#f6f2f7]",
            careType === "boarding" ? "p-3" : "p-4",
          )}
        >
          <div className="flex gap-3">
            <PiMapPin className="mt-0.5 shrink-0 text-[#5d3a86]" size={21} />
            <div>
              <p className="text-sm font-bold">
                This map point helps with nearby matching
              </p>
              <p className="mt-1 text-xs leading-5 text-[#706a78]">
                The selected point helps show this request in the right area and
                lets sitters judge the distance. It does not include building,
                floor, room, or entry details—share those privately after
                matching.
              </p>
            </div>
          </div>
        </div>
      </div>
      {careType === "boarding" && (
        <BoardingDistancePicker
          distance={distance}
          onDistanceChange={onDistanceChange}
        />
      )}
    </div>
  );
}

function MapPicker({
  center,
  marker,
  zoom,
  compact = false,
  onCenterChange,
  onZoomChange,
  onSelect,
}: {
  center: LocationDraft;
  marker: LocationDraft;
  zoom: number;
  compact?: boolean;
  onCenterChange: (value: LocationDraft) => void;
  onZoomChange: (value: number) => void;
  onSelect: (value: LocationDraft) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    centerPixel: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const ignoreClickRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const lastWheelZoomRef = useRef(0);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleWheel = (event: WheelEvent) => {
      if ((event.target as Element).closest("[data-map-controls]")) return;
      event.preventDefault();
      event.stopPropagation();
      wheelDeltaRef.current += event.deltaY;
      const now = Date.now();
      if (
        Math.abs(wheelDeltaRef.current) < 80 ||
        now - lastWheelZoomRef.current < 220
      )
        return;
      onZoomChange(
        Math.max(3, Math.min(18, zoom + (wheelDeltaRef.current < 0 ? 1 : -1))),
      );
      wheelDeltaRef.current = 0;
      lastWheelZoomRef.current = now;
    };
    map.addEventListener("wheel", handleWheel, { passive: false });
    return () => map.removeEventListener("wheel", handleWheel);
  }, [onZoomChange, zoom]);
  const centerPixel = lngLatToWorld(center, zoom);
  const markerPixel = lngLatToWorld(marker, zoom);
  const baseX = Math.floor(centerPixel.x / 256);
  const baseY = Math.floor(centerPixel.y / 256);
  const tileColumns = 9;
  const tileRows = 3;
  const tiles = Array.from({ length: tileColumns * tileRows }, (_, index) => ({
    x: baseX + (index % tileColumns) - Math.floor(tileColumns / 2),
    y: baseY + Math.floor(index / tileColumns) - Math.floor(tileRows / 2),
  }));
  const selectPoint = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const worldX = centerPixel.x + event.clientX - rect.left - rect.width / 2;
    const worldY = centerPixel.y + event.clientY - rect.top - rect.height / 2;
    onSelect(worldToLngLat({ x: worldX, y: worldY }, zoom));
  };
  const changeZoom = (next: number) =>
    onZoomChange(Math.max(3, Math.min(18, next)));
  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    ignoreClickRef.current = drag.moved;
    dragStateRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <div
      ref={mapRef}
      aria-label="Click the map to choose the approximate location"
      onClick={selectPoint}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStateRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          centerPixel,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const drag = dragStateRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        setDragging(true);
        onCenterChange(
          worldToLngLat(
            { x: drag.centerPixel.x - dx, y: drag.centerPixel.y - dy },
            zoom,
          ),
        );
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className={cn(
        "relative block w-full overflow-hidden rounded-[16px] border border-[#ded9e0] bg-[#e9e5df] text-left touch-none overscroll-contain",
        compact ? "h-36" : "h-56",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      {tiles.map((tile) => (
        <img
          key={`${tile.x}-${tile.y}`}
          src={`https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tile.x}/${tile.y}@2x.png`}
          alt=""
          width={512}
          height={512}
          draggable={false}
          className="pointer-events-none absolute h-64 w-64 max-w-none select-none"
          style={{
            left: `calc(50% + ${Math.round(tile.x * 256 - centerPixel.x)}px)`,
            top: `calc(50% + ${Math.round(tile.y * 256 - centerPixel.y)}px)`,
            width: 256,
            height: 256,
          }}
        />
      ))}
      <span
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full text-[#5d3a86] drop-shadow-[0_2px_2px_rgba(255,255,255,0.9)]"
        style={{
          left: `calc(50% + ${markerPixel.x - centerPixel.x}px)`,
          top: `calc(50% + ${markerPixel.y - centerPixel.y}px)`,
        }}
      >
        <PiMapPin size={34} />
      </span>
      <span
        data-map-controls
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-xl border border-[#ded9e0] bg-white shadow-lg"
      >
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={(event) => {
            event.stopPropagation();
            changeZoom(zoom + 1);
          }}
          disabled={zoom >= 18}
          className="flex h-9 w-9 items-center justify-center border-b border-[#eee9ef] text-lg font-bold text-[#5d3a86] disabled:opacity-35"
        >
          <PiPlus />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={(event) => {
            event.stopPropagation();
            changeZoom(zoom - 1);
          }}
          disabled={zoom <= 3}
          className="flex h-9 w-9 items-center justify-center border-b border-[#eee9ef] text-lg font-bold text-[#5d3a86] disabled:opacity-35"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Recenter map on selected location"
          title="Recenter map"
          onClick={(event) => {
            event.stopPropagation();
            onCenterChange(marker);
          }}
          className="flex h-9 w-9 items-center justify-center text-[#5d3a86]"
        >
          <PiNavigationArrow size={17} />
        </button>
      </span>
      <span className="pointer-events-none absolute bottom-1 right-2 z-10 rounded bg-white/90 px-1.5 py-0.5 text-[9px] text-[#5d565e]">
        © OpenStreetMap contributors · © CARTO
      </span>
    </div>
  );
}

function BudgetScreen({
  careType,
  transport,
  sitterSupplyCount,
  supplyCostMode,
  onSupplyCostModeChange,
  value,
  onChange,
  showValidation,
}: {
  careType: CareType;
  transport: string;
  sitterSupplyCount: number;
  supplyCostMode: SupplyCostMode;
  onSupplyCostModeChange: (value: SupplyCostMode) => void;
  value: BudgetDraft;
  onChange: (value: BudgetDraft) => void;
  showValidation: boolean;
}) {
  const unit = careTypes[careType].budgetUnit;
  const symbol = currencySymbol(value.currency);
  const currencyLabel = currencyUnitLabel(value.currency);
  const amountError =
    showValidation && Number(value.amount) <= 0
      ? value.mode === "range"
        ? "Enter the minimum amount."
        : "Enter a budget amount."
      : "";
  const rangeOrderError =
    value.mode === "range" &&
    value.amount !== "" &&
    value.maximum !== "" &&
    Number(value.maximum) <= Number(value.amount)
      ? "Up to must be greater than From."
      : "";
  const maximumError =
    rangeOrderError ||
    (showValidation && value.mode === "range" && Number(value.maximum) <= 0
      ? "Enter the maximum amount."
      : "");
  const travelAmountError =
    showValidation &&
    value.travelMode === "fixed" &&
    Number(value.travelAmount) <= 0
      ? careType === "boarding"
        ? "Enter the total transport allowance."
        : "Enter the travel allowance per visit."
      : "";
  const supplyAmountError =
    showValidation &&
    careType === "boarding" &&
    sitterSupplyCount > 0 &&
    supplyCostMode === "fixed" &&
    Number(value.supplyAmount) <= 0
      ? "Enter the total supply allowance."
      : "";
  const boardingTransportNeedsBudget =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split");
  const sitterHandledTripCount =
    transport === "sitter" ? 2 : transport === "split" ? 1 : 0;
  const boardingTransportModeError =
    showValidation &&
    boardingTransportNeedsBudget &&
    value.travelMode === "none";
  const sectionClass =
    "rounded-[16px] border border-[#ebe6ed] bg-white/50 px-5 py-4 shadow-[0_10px_28px_-28px_rgba(65,40,84,0.55)]";
  const spaciousSectionClass = cn(sectionClass, "pb-6");
  const sectionTitleClass =
    "text-[15px] font-bold tracking-[-0.01em] text-[#5d3a86]";
  const sectionHeaderClass =
    "-mx-5 -mt-4 mb-4 flex min-h-11 items-center justify-between gap-3 rounded-t-[15px] border-b border-[#e7ddea] bg-[#f5f0f7] px-5 py-2.5";
  const sectionStatusClass =
    "rounded-full border border-[#ead8c6] bg-[#fffaf4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a5d34]";
  const sectionContentClass = "ml-3 sm:ml-4";
  const choiceTitleClass =
    "mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]";

  return (
    <div
      className={cn(
        "gap-4",
        careType === "visit" ? "grid items-start lg:grid-cols-2" : "space-y-4",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-start gap-2",
          careType === "visit" && "lg:col-span-2",
        )}
      >
        <label
          htmlFor="budget-currency"
          className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]"
        >
          Currency
        </label>
        <select
          id="budget-currency"
          value={value.currency}
          onChange={(event) =>
            onChange({ ...value, currency: event.target.value })
          }
          className="h-10 w-[220px] max-w-full rounded-full border border-[#d8d1db] bg-white px-3 text-xs font-semibold text-[#4f4853] outline-none transition focus:border-[#5d3a86] focus:ring-4 focus:ring-[#eee8f4]"
        >
          <option value="JPY">🇯🇵 JPY · Japanese Yen</option>
          <option value="USD">🇺🇸 USD · US Dollar</option>
          <option value="EUR">🇪🇺 EUR · Euro</option>
          <option value="CNY">🇨🇳 CNY · Chinese Yuan</option>
          <option value="KRW">🇰🇷 KRW · Korean Won</option>
        </select>
      </div>

      <section className={spaciousSectionClass}>
        <div className={sectionHeaderClass}>
          <h3 className={sectionTitleClass}>Care costs</h3>
        </div>
        <div className={sectionContentClass}>
          <p className={choiceTitleClass}>How should the care budget be set?</p>
          <div className="flex flex-wrap gap-2">
            <BudgetChoice
              label="Fixed amount"
              active={value.mode === "exact"}
              onClick={() => onChange({ ...value, mode: "exact" })}
            />
            <BudgetChoice
              label="Budget range"
              active={value.mode === "range"}
              onClick={() => onChange({ ...value, mode: "range" })}
            />
            <BudgetChoice
              label="Discuss with sitter"
              active={value.mode === "open"}
              onClick={() => onChange({ ...value, mode: "open" })}
            />
          </div>
          {value.mode === "exact" && (
            <div className="mt-4 flex flex-wrap items-start gap-4">
              <div className="w-full sm:w-[220px]">
                <CompactMoneyField
                  label={`Budget · ${unit}`}
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.amount}
                  onChange={(amount) => onChange({ ...value, amount })}
                  error={amountError}
                />
              </div>
              <label className="block w-full pt-1 sm:w-[250px] sm:pt-[22px]">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      exactNegotiable: !value.exactNegotiable,
                    })
                  }
                  className={cn(
                    "flex h-10 w-auto items-center gap-2 text-left text-sm font-semibold transition",
                    value.exactNegotiable ? "text-[#493456]" : "text-[#706a78]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      value.exactNegotiable
                        ? "border-[#5d3a86] bg-[#5d3a86] text-white"
                        : "border-[#bcb5bf] bg-white",
                    )}
                  >
                    {value.exactNegotiable && <PiCheck size={10} />}
                  </span>
                  <span>Allow sitter price suggestions</span>
                </button>
              </label>
            </div>
          )}
          {value.mode === "range" && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="w-full sm:w-[220px]">
                <CompactMoneyField
                  label={`From · ${unit}`}
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.amount}
                  onChange={(amount) => onChange({ ...value, amount })}
                  error={amountError}
                />
              </div>
              <div className="w-full sm:w-[220px]">
                <CompactMoneyField
                  label={`Up to · ${unit}`}
                  symbol={symbol}
                  currencyLabel={currencyLabel}
                  value={value.maximum}
                  onChange={(maximum) => onChange({ ...value, maximum })}
                  error={maximumError}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {careType === "boarding" && (
        <section className={sectionClass}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Supply costs</h3>
            <span className={sectionStatusClass}>
              {sitterSupplyCount > 0
                ? `${sitterSupplyCount} sitter-provided ${sitterSupplyCount === 1 ? "item" : "items"}`
                : "No sitter-provided items"}
            </span>
          </div>
          <div className={sectionContentClass}>
            {sitterSupplyCount > 0 ? (
              <>
                <p className={choiceTitleClass}>Supply cost arrangement</p>
                <div className="flex flex-wrap gap-2">
                  <BudgetChoice
                    label="Reimburse actual cost"
                    active={supplyCostMode === "reimburse"}
                    onClick={() => onSupplyCostModeChange("reimburse")}
                  />
                  <BudgetChoice
                    label="Set a fixed allowance"
                    active={supplyCostMode === "fixed"}
                    onClick={() => onSupplyCostModeChange("fixed")}
                  />
                  <BudgetChoice
                    label="Discuss after matching"
                    active={supplyCostMode === "discuss"}
                    onClick={() => onSupplyCostModeChange("discuss")}
                  />
                </div>
                {supplyCostMode === "fixed" && (
                  <div className="mt-4 w-full sm:w-[360px]">
                    <CompactMoneyField
                      label="Supply allowance · total"
                      symbol={symbol}
                      currencyLabel={currencyLabel}
                      value={value.supplyAmount}
                      onChange={(supplyAmount) =>
                        onChange({ ...value, supplyAmount })
                      }
                      error={supplyAmountError}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm leading-6 text-[#817a85]">
                No sitter-provided items were selected, so there are no supply
                costs to arrange.
              </p>
            )}
          </div>
        </section>
      )}

      {careType === "visit" && (
        <section className={spaciousSectionClass}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Transport costs</h3>
          </div>
          <div className={cn(sectionContentClass, "space-y-5")}>
            <div>
              <p className={choiceTitleClass}>
                Would you like to provide a travel allowance?
              </p>
              <div className="flex flex-wrap gap-2">
                <BudgetChoice
                  label="Yes"
                  active={value.travelMode !== "none"}
                  onClick={() =>
                    onChange({
                      ...value,
                      travelMode:
                        value.travelMode === "none"
                          ? "fixed"
                          : value.travelMode,
                    })
                  }
                />
                <BudgetChoice
                  label="No"
                  active={value.travelMode === "none"}
                  onClick={() => onChange({ ...value, travelMode: "none" })}
                />
              </div>
            </div>
            {value.travelMode !== "none" && (
              <div className="flex flex-wrap items-start gap-x-4 gap-y-4">
                <div className="max-w-full">
                  <p className={choiceTitleClass}>
                    How should travel costs be covered?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <BudgetChoice
                      label="Fixed amount per visit"
                      active={value.travelMode === "fixed"}
                      onClick={() =>
                        onChange({ ...value, travelMode: "fixed" })
                      }
                    />
                    <BudgetChoice
                      label="Reimburse actual cost"
                      active={value.travelMode === "actual"}
                      onClick={() =>
                        onChange({ ...value, travelMode: "actual" })
                      }
                    />
                  </div>
                </div>
                {value.travelMode === "fixed" && (
                  <div className="w-[280px] max-w-full">
                    <MoneyField
                      label="Travel allowance · per visit"
                      symbol={symbol}
                      currencyLabel={currencyLabel}
                      value={value.travelAmount}
                      onChange={(travelAmount) =>
                        onChange({ ...value, travelAmount })
                      }
                      error={travelAmountError}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {careType === "boarding" && (
        <section
          className={cn(
            spaciousSectionClass,
            boardingTransportModeError && "border-[#d18a94]",
          )}
        >
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Transport costs</h3>
            <span className={sectionStatusClass}>
              {sitterHandledTripCount > 0
                ? `${sitterHandledTripCount} sitter-handled ${sitterHandledTripCount === 1 ? "trip" : "trips"}`
                : transport === "taxi"
                  ? "Third-party pet taxi"
                  : transport === "owner"
                    ? "No sitter-handled trips"
                    : "Handover not confirmed"}
            </span>
          </div>
          <div className={sectionContentClass}>
            {boardingTransportNeedsBudget ? (
              <div className="relative">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-4">
                  <div className="max-w-full">
                    <p className={choiceTitleClass}>
                      How should travel costs be covered?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <BudgetChoice
                        label="Reimburse actual cost"
                        active={value.travelMode === "actual"}
                        onClick={() =>
                          onChange({ ...value, travelMode: "actual" })
                        }
                      />
                      <BudgetChoice
                        label="Set a fixed allowance"
                        active={value.travelMode === "fixed"}
                        onClick={() =>
                          onChange({ ...value, travelMode: "fixed" })
                        }
                      />
                      <BudgetChoice
                        label="Discuss after matching"
                        active={value.travelMode === "discuss"}
                        onClick={() =>
                          onChange({ ...value, travelMode: "discuss" })
                        }
                      />
                    </div>
                  </div>
                  {value.travelMode === "fixed" && (
                    <div className="w-[400px] max-w-full">
                      <CompactMoneyField
                        label={
                          transport === "split"
                            ? "Transport allowance · sitter-handled trip"
                            : "Transport allowance · both trips"
                        }
                        symbol={symbol}
                        currencyLabel={currencyLabel}
                        value={value.travelAmount}
                        onChange={(travelAmount) =>
                          onChange({ ...value, travelAmount })
                        }
                        error={travelAmountError}
                      />
                    </div>
                  )}
                </div>
                {boardingTransportModeError && (
                  <p
                    role="alert"
                    className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-[11px] font-medium text-[#a74755]"
                  >
                    Choose how transport costs will be covered.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[#817a85]">
                {transport === "taxi"
                  ? "You chose a pet taxi, so there are no transport costs to arrange with the sitter."
                  : transport === "owner"
                    ? "You’ll handle drop-off and pickup, so there are no transport costs to arrange with the sitter."
                    : "You chose to discuss the transport arrangement after matching, so no transport costs are set yet."}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function PreviewScreen({
  careType,
  pets,
  dates,
  tasks,
  boardingRoutines,
  boardingSupplies,
  boardingSupplyItems,
  supplyCostMode,
  taskNotes,
  homeFitNotes,
  area,
  distance,
  transport,
  splitDirection,
  budget,
  tags,
  customRequirements,
  customCautions,
  visitFrequency,
  customInterval,
  firstVisitDate,
  excludedVisitDates,
  visitsPerDay,
  visitTimes,
  exactTimes,
  validation,
  onBeforeOpenDetail,
}: {
  careType: CareType;
  pets: PetDraft[];
  dates: { startDate: string; endDate: string; notes: string };
  tasks: TaskPlan[];
  boardingRoutines: BoardingTaskConfig[];
  boardingSupplies: BoardingSupplyPlan;
  boardingSupplyItems: BoardingSupplyOption[];
  supplyCostMode: SupplyCostMode;
  taskNotes: string;
  homeFitNotes: string;
  area: string;
  distance: string;
  transport: string;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  budget: BudgetDraft;
  tags: string[];
  customRequirements: string[];
  customCautions: string[];
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  excludedVisitDates: string[];
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  validation: {
    pets: boolean;
    dates: boolean;
    tasks: boolean;
    area: boolean;
    budget: boolean;
  };
  onBeforeOpenDetail: () => void;
}) {
  const router = useRouter();
  const title = buildTitle(careType, pets);
  const boardingTransportNeedsBudget =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split");
  const travelAllowanceInvalid =
    (careType === "visit" || boardingTransportNeedsBudget) &&
    budget.travelMode === "fixed" &&
    Number(budget.travelAmount) <= 0;
  const transportBudgetMissing =
    boardingTransportNeedsBudget && budget.travelMode === "none";
  const ownerSupplyCount = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "owner",
  ).length;
  const sitterSupplyCount = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "sitter",
  ).length;
  const ownerSupplyItems = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "owner",
  );
  const sitterSupplyItems = boardingSupplyItems.filter(
    (item) => boardingSupplies[item.key] === "sitter",
  );
  const supplyAllowanceInvalid =
    careType === "boarding" &&
    sitterSupplyCount > 0 &&
    supplyCostMode === "fixed" &&
    Number(budget.supplyAmount) <= 0;
  const estimatedTotal = !validation.dates
    ? "Add dates"
    : !validation.budget
      ? travelAllowanceInvalid
        ? "Add travel allowance"
        : transportBudgetMissing
          ? "Choose transport costs"
          : supplyAllowanceInvalid
            ? "Add supply allowance"
            : budget.mode === "range" &&
                Number(budget.amount) > 0 &&
                Number(budget.maximum) > 0
              ? "Fix budget range"
              : "Add budget"
      : estimateTotalLabel({
          careType,
          dates,
          budget,
          transport,
          supplyCostMode: sitterSupplyCount > 0 ? supplyCostMode : undefined,
          visitFrequency,
          customInterval,
          firstVisitDate,
          excludedVisitDates,
          visitsPerDay,
        });
  const totalDays = dateSpanDays(dates);
  const totalNights = boardingNights(dates);
  const totalVisits =
    buildVisitDates({
      dates,
      visitFrequency,
      customInterval,
      firstVisitDate,
      excludedVisitDates,
    }).length * visitsPerDay;
  const priceLabel = budgetLabel(
    budget,
    careType === "visit"
      ? "per visit"
      : careType === "boarding"
        ? "per night"
        : "total",
  );
  const estimateInvalid = !validation.dates || !validation.budget;
  const formula = estimateFormulaText(
    careType,
    budget.travelMode,
    transport,
    sitterSupplyCount > 0 ? supplyCostMode : undefined,
  );
  const transportLabel = boardingTransportLabel(transport, splitDirection);
  const transportCostLabel = boardingTransportCostLabel(transport, budget);
  const supplyCostLabel = !sitterSupplyCount
    ? "No sitter-provided items"
    : supplyCostMode === "reimburse"
      ? "Reimburse actual cost separately"
      : supplyCostMode === "fixed"
        ? budget.supplyAmount
          ? `${currencySymbol(budget.currency)}${Number(budget.supplyAmount).toLocaleString()} total`
          : "Amount not set"
        : "Discuss after matching";
  const incompletePetLabels = pets.flatMap((pet, index) =>
    !isPetProfileComplete(pet)
      ? [pet.name || petDisplayType(pet) || `Pet ${index + 1}`]
      : [],
  );
  const hasTaskWithoutPetMatch = tasks.some(
    (task) =>
      !task.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
  );
  const hasVisitWithoutTasks =
    careType === "visit" &&
    Array.from({ length: visitsPerDay }, (_, index) => index + 1).some(
      (visit) =>
        !tasks.some((task) => (task.visitNumbers ?? [1]).includes(visit)),
    );
  const petsWithoutTasks = pets.filter(
    (pet) => !tasks.some((task) => task.petIds.includes(pet.id)),
  );
  const petsWithoutTaskLabels = petsWithoutTasks.map(
    (pet) => pet.name || petDisplayType(pet) || `Pet ${pets.indexOf(pet) + 1}`,
  );
  const boardingRoutineItems = boardingRoutines.flatMap((config) =>
    config.routines.map((routine) => ({ config, routine })),
  );
  const boardingRoutineGroups = (
    [
      { type: "daily", label: "daily" },
      { type: "repeating", label: "repeating" },
      { type: "once", label: "one-time" },
      { type: "as-needed", label: "as needed" },
    ] satisfies Array<{ type: BoardingScheduleType; label: string }>
  )
    .map((group) => ({
      ...group,
      count: boardingRoutineItems.filter(
        (item) => item.routine.scheduleType === group.type,
      ).length,
    }))
    .filter((group) => group.count > 0);
  const boardingRoutineNames = Array.from(
    new Set(boardingRoutineItems.map(({ config }) => config.label)),
  );
  const homeMustHaveTags =
    careType === "boarding"
      ? tags.filter(
          (tag) => !tag.startsWith("OK: ") && !tag.startsWith("Not OK: "),
        )
      : [];
  const homeOkTags =
    careType === "boarding"
      ? tags.filter((tag) => tag.startsWith("OK: ")).map((tag) => tag.slice(4))
      : [];
  const homeNotOkTags =
    careType === "boarding"
      ? tags
          .filter((tag) => tag.startsWith("Not OK: "))
          .map((tag) => tag.slice(8))
      : [];
  const boardingPetsWithoutTasks = pets.filter(
    (pet) =>
      !boardingRoutineItems.some((item) =>
        item.routine.petIds.includes(pet.id),
      ),
  );
  const boardingInvalidRoutine = boardingRoutineItems.some(
    (item) =>
      !item.routine.petIds.some((petId) =>
        pets.some((pet) => pet.id === petId),
      ) ||
      (item.routine.scheduleType === "repeating" &&
        item.routine.intervalDays < 1) ||
      (item.routine.scheduleType === "as-needed" &&
        !item.routine.trigger.trim()),
  );
  const taskValidationMessages =
    careType === "boarding"
      ? !boardingRoutineItems.length
        ? ["Add at least one care routine."]
        : [
            ...(boardingInvalidRoutine
              ? ["Complete the pets and schedule for every routine."]
              : []),
            ...(boardingPetsWithoutTasks.length
              ? [
                  `No care routines have been added for ${boardingPetsWithoutTasks.map((pet) => pet.name || petDisplayType(pet)).join(", ")}.`,
                ]
              : []),
          ]
      : !tasks.length
        ? ["Add at least one care task."]
        : [
            ...(hasTaskWithoutPetMatch
              ? ["Assign every task to at least one pet group."]
              : []),
            ...(hasVisitWithoutTasks
              ? ["Add at least one task to every visit."]
              : []),
            ...(petsWithoutTasks.length
              ? [
                  `No tasks have been added for ${petsWithoutTaskLabels.join(", ")}.`,
                ]
              : []),
          ];
  const previewPets = pets.map((pet, index) => ({
    id: pet.id,
    label: pet.name || petDisplayType(pet) || `Pet ${index + 1}`,
    type: petDisplayType(pet) || "Pet",
    quantity: pet.quantity,
    photo: pet.photo || undefined,
    details: previewPetDetails(pet),
    notes: pet.notes.trim() || undefined,
  }));
  const previewTask = (task: TaskPlan) => ({
    id: task.id,
    label: task.label,
    priority: task.priority,
    petLabels: task.petIds.flatMap(
      (petId) => previewPets.find((pet) => pet.id === petId)?.label ?? [],
    ),
    notes: task.notes?.trim() || undefined,
  });
  const openDetailPreview = () => {
    const snapshot: NeedPreviewSnapshot = {
      version: 1,
      careType,
      serviceTitle: careTypes[careType].title,
      title,
      area: area || "Area not added",
      areaDetail:
        careType === "boarding"
          ? distanceLabel(distance)
          : "Approximate location",
      dates: {
        label: dateLabel(dates),
        startDate: dates.startDate,
        endDate: dates.endDate,
        notes: dates.notes.trim(),
        totalDays,
        totalNights,
      },
      pets: previewPets,
      pricing: {
        priceLabel,
        supplyCostLabel,
        transportCostLabel:
          careType === "visit"
            ? budget.travelMode === "none"
              ? "Not provided"
              : budget.travelMode === "actual"
                ? "Reimburse actual cost separately"
                : budget.travelAmount
                  ? `${currencySymbol(budget.currency)}${Number(budget.travelAmount).toLocaleString()} per visit`
                  : "Amount not set"
            : careType === "boarding"
              ? transportCostLabel
              : "Not applicable",
        estimatedTotal,
        formula,
      },
      additionalCareNotes: taskNotes.trim(),
      visit:
        careType === "visit"
          ? {
              scheduleLabel: `${visitsPerDay} ${visitsPerDay === 1 ? "visit" : "visits"} / ${frequencyLabel(visitFrequency, customInterval)}`,
              totalVisits,
              visitDates: buildVisitDates({
                dates,
                visitFrequency,
                customInterval,
                firstVisitDate,
                excludedVisitDates,
              }),
              visitDateCandidates: buildVisitDateCandidates({
                dates,
                visitFrequency,
                customInterval,
                firstVisitDate,
              }),
              excludedVisitDates,
              visits: Array.from({ length: visitsPerDay }, (_, index) => ({
                number: index + 1,
                time: visitTimeLabel(visitTimes[index], exactTimes[index]),
                tasks: tasks
                  .filter((task) =>
                    (task.visitNumbers ?? [1]).includes(index + 1),
                  )
                  .map(previewTask),
              })),
            }
          : undefined,
      boarding:
        careType === "boarding"
          ? {
              routines: boardingRoutineItems.map(({ config, routine }) => ({
                id: routine.id,
                label: config.label,
                priority: routine.priority,
                petLabels: routine.petIds.flatMap(
                  (petId) =>
                    previewPets.find((pet) => pet.id === petId)?.label ?? [],
                ),
                scheduleType: routine.scheduleType,
                schedule: boardingRoutineScheduleLabel(routine),
                instructions: routine.instructions.trim(),
              })),
              homeFit: {
                needs: homeMustHaveTags,
                ok: homeOkTags,
                avoid: homeNotOkTags,
                notes: homeFitNotes.trim(),
              },
              supplies: {
                owner: ownerSupplyItems.map((item) => ({
                  id: item.key,
                  label: item.label,
                  petLabel:
                    previewPets.find((pet) => pet.id === item.petId)?.label ??
                    "Pet",
                })),
                sitter: sitterSupplyItems.map((item) => ({
                  id: item.key,
                  label: item.label,
                  petLabel:
                    previewPets.find((pet) => pet.id === item.petId)?.label ??
                    "Pet",
                })),
              },
              transportLabel,
            }
          : undefined,
      custom:
        careType === "custom"
          ? {
              tasks: tasks.map(previewTask),
              requirements: customRequirements,
              cautions: customCautions,
            }
          : undefined,
    };
    onBeforeOpenDetail();
    window.sessionStorage.setItem(
      NEED_PREVIEW_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
    router.push(`/needs/create/preview?careType=${careType}`);
  };
  return (
    <>
      <article className="overflow-hidden rounded-[18px] border border-[#ded9e0] bg-white">
        <div className="bg-[#5d3a86] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">
            Service type · {careTypes[careType].title}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-8">{title}</h2>
          <p
            className={cn(
              "mt-2 text-sm",
              validation.area
                ? "text-white/75"
                : "font-semibold text-[#ffd8dd]",
            )}
          >
            {area
              ? careType === "boarding"
                ? `${area} · ${distanceLabel(distance)}`
                : area
              : "Area not added"}
          </p>
        </div>
        <div className="space-y-4 p-5">
          {!validation.pets && (
            <div
              role="alert"
              className="rounded-xl border border-[#e1aab2] bg-[#fff5f6] px-4 py-3 text-sm font-semibold text-[#a74755]"
            >
              {pets.length
                ? `Complete the required details for ${incompletePetLabels.join(", ")}.`
                : "Add at least one pet and complete its required details."}
            </div>
          )}
          {careType === "custom" && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                validation.dates
                  ? "border-transparent bg-[#f7f4f7]"
                  : "border-[#e1aab2] bg-[#fff5f6]",
              )}
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                Care dates
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p
                  className={cn(
                    "text-sm font-bold",
                    !validation.dates && "text-[#a74755]",
                  )}
                >
                  {dateLabel(dates)}
                </p>
                <p
                  className={cn(
                    "text-xs font-semibold",
                    validation.dates ? "text-[#817a85]" : "text-[#a74755]",
                  )}
                >
                  {totalDays
                    ? `${totalDays} ${totalDays === 1 ? "day" : "days"} total`
                    : "Total days not available"}
                </p>
              </div>
            </div>
          )}
          {careType === "visit" && (
            <section>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-[minmax(230px,1.8fr)_minmax(180px,1.35fr)_minmax(90px,0.65fr)]">
                <ReviewMetric
                  label="Care dates"
                  value={dateLabel(dates)}
                  detail={
                    totalDays
                      ? `${totalDays} ${totalDays === 1 ? "day" : "days"} total`
                      : "Total days not available"
                  }
                  invalid={!validation.dates}
                />
                <ReviewMetric
                  label="Visit schedule"
                  value={`${visitsPerDay} ${visitsPerDay === 1 ? "visit" : "visits"} / ${frequencyLabel(visitFrequency, customInterval)}`}
                />
                <ReviewMetric
                  label="Total visits"
                  value={String(totalVisits || "—")}
                  invalid={!validation.dates}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-[#eee9ef] pt-3 sm:grid-cols-[minmax(160px,0.9fr)_minmax(230px,1.35fr)]">
                <ReviewMetric
                  label="Price per visit"
                  value={priceLabel}
                  invalid={
                    budget.mode !== "open" &&
                    (budget.mode === "exact"
                      ? Number(budget.amount) <= 0
                      : Number(budget.amount) <= 0 ||
                        Number(budget.maximum) <= Number(budget.amount))
                  }
                />
                <ReviewMetric
                  label="Travel costs"
                  value={
                    budget.travelMode === "none"
                      ? "Not provided"
                      : budget.travelMode === "actual"
                        ? "Reimburse actual cost separately"
                        : budget.travelAmount
                          ? `${currencySymbol(budget.currency)}${Number(budget.travelAmount).toLocaleString()} per visit`
                          : "Amount not set"
                  }
                  invalid={travelAllowanceInvalid}
                />
              </div>
            </section>
          )}
          {careType === "boarding" && (
            <section className="space-y-3">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(260px,1.8fr)_minmax(110px,0.55fr)]">
                <ReviewMetric
                  label="Stay dates"
                  value={dateLabel(dates)}
                  invalid={!validation.dates}
                />
                <ReviewMetric
                  label="Total nights"
                  value={totalNights ? String(totalNights) : "—"}
                  detail={
                    validation.dates && dates.startDate === dates.endDate
                      ? "Same-day minimum"
                      : undefined
                  }
                  invalid={!validation.dates}
                />
              </div>
              <div className="grid gap-x-6 gap-y-4 border-t border-[#eee9ef] pt-3 sm:grid-cols-3">
                <ReviewMetric
                  label="Price per night"
                  value={priceLabel}
                  invalid={!validation.budget}
                />
                <ReviewMetric
                  label="Supply costs"
                  value={supplyCostLabel}
                  invalid={supplyAllowanceInvalid}
                />
                <ReviewMetric
                  label="Transport costs"
                  value={transportCostLabel}
                  invalid={travelAllowanceInvalid || transportBudgetMissing}
                />
              </div>
            </section>
          )}
          {careType === "custom" && (
            <ReviewStat
              label="Agreed total price"
              value={priceLabel}
              invalid={!validation.budget}
            />
          )}
          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              estimateInvalid
                ? "border-[#e1aab2] bg-[#fff5f6]"
                : "border-[#dfd4e5] bg-[#fcfafc]",
            )}
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
              Estimated total
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex-nowrap">
              <p
                className={cn(
                  "shrink-0 text-lg font-bold",
                  estimateInvalid ? "text-[#a74755]" : "text-[#5d3a86]",
                )}
              >
                {estimatedTotal}
              </p>
              <p className="w-full text-[11px] font-semibold leading-5 text-[#817a85] sm:w-auto sm:whitespace-nowrap">
                {formula}
              </p>
            </div>
          </div>
          {careType === "visit" && (
            <ReviewSection title="Visit plan">
              <p className="mb-3 text-sm font-semibold">
                {visitsPerDay} {visitsPerDay === 1 ? "visit" : "visits"} on each
                care day
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Array.from({ length: visitsPerDay }, (_, index) => {
                  const visit = index + 1;
                  const visitHasMissingTasks = !tasks.some((task) =>
                    (task.visitNumbers ?? [1]).includes(visit),
                  );
                  return (
                    <div
                      key={visit}
                      className={cn(
                        "rounded-xl border p-3",
                        visitHasMissingTasks
                          ? "border-[#e1aab2] bg-[#fffafa]"
                          : "border-[#eee9ef] bg-[#fdfcfa]",
                      )}
                    >
                      <p className="text-xs font-bold text-[#5d3a86]">
                        Visit {visit}
                      </p>
                      <p className="mt-1 text-xs text-[#706a78]">
                        {visitTimeLabel(visitTimes[index], exactTimes[index])}
                      </p>
                      {visitHasMissingTasks && (
                        <p className="mt-2 text-[11px] font-semibold text-[#a74755]">
                          No tasks assigned to this visit.
                        </p>
                      )}
                      <div className="mt-2 space-y-1.5 border-t border-[#eee9ef] pt-2">
                        {pets.map((pet, petIndex) => {
                          const taskCount = tasks.filter(
                            (task) =>
                              (task.visitNumbers ?? [1]).includes(visit) &&
                              task.petIds.includes(pet.id),
                          ).length;
                          if (!taskCount) return null;
                          const PetIcon =
                            petTypes.find((type) => type.id === pet.type)
                              ?.icon ?? PiPawPrint;
                          return (
                            <div
                              key={pet.id}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#625a67]">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1edf5] text-[#5d3a86]">
                                  <PetIcon size={13} />
                                </span>
                                <span className="truncate">
                                  {pet.name ||
                                    petDisplayType(pet) ||
                                    `Pet ${petIndex + 1}`}
                                </span>
                                <span className="shrink-0 rounded-full bg-[#f1edf5] px-1.5 py-0.5 text-[10px] font-bold text-[#5d3a86]">
                                  ×{pet.quantity}
                                </span>
                              </span>
                              <span className="shrink-0 text-[#817a85]">
                                {taskCount} {taskCount === 1 ? "task" : "tasks"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ReviewSection>
          )}
          {!validation.tasks && (
            <div
              role="alert"
              className="space-y-1 rounded-xl border border-[#e1aab2] bg-[#fff5f6] px-4 py-3 text-sm font-semibold text-[#a74755]"
            >
              {taskValidationMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}
          {careType !== "boarding" && taskNotes.trim() && (
            <ReviewSection title="Additional care notes">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#625a67]">
                {taskNotes.trim()}
              </p>
            </ReviewSection>
          )}
          {careType === "boarding" && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#8a5d34]">
                Boarding details
              </h3>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <CompactReviewCard
                  title="Care routines"
                  value={
                    boardingRoutineItems.length
                      ? `${boardingRoutineItems.length} ${boardingRoutineItems.length === 1 ? "routine" : "routines"}`
                      : "None added"
                  }
                  detail={boardingRoutineGroups
                    .map((group) => `${group.count} ${group.label}`)
                    .join(" · ")}
                  invalid={!validation.tasks}
                >
                  {boardingRoutineNames.length > 0 && (
                    <p className="mt-2 truncate text-[11px] font-medium text-[#817a85]">
                      {boardingRoutineNames.slice(0, 3).join(" · ")}
                      {boardingRoutineNames.length > 3
                        ? ` · +${boardingRoutineNames.length - 3} more`
                        : ""}
                    </p>
                  )}
                  {taskNotes.trim() && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#8a6c9d]">
                      <PiPencilSimple size={12} />
                      Care notes added
                    </p>
                  )}
                </CompactReviewCard>
                <CompactReviewCard
                  title="Home fit"
                  value={
                    tags.length
                      ? `${tags.length} preferences`
                      : "No preferences"
                  }
                  detail={[
                    homeMustHaveTags.length
                      ? `${homeMustHaveTags.length} needs`
                      : "",
                    homeOkTags.length ? `${homeOkTags.length} OK` : "",
                    homeNotOkTags.length ? `${homeNotOkTags.length} avoid` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {homeFitNotes.trim() && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#8a6c9d]">
                      <PiPencilSimple size={12} />
                      Additional notes added
                    </p>
                  )}
                </CompactReviewCard>
                <CompactReviewCard
                  title="Supplies"
                  value={
                    ownerSupplyCount || sitterSupplyCount
                      ? `${ownerSupplyCount + sitterSupplyCount} ${ownerSupplyCount + sitterSupplyCount === 1 ? "item" : "items"} arranged`
                      : "No arrangements"
                  }
                  detail={
                    ownerSupplyCount || sitterSupplyCount
                      ? `Owner ${ownerSupplyCount} · Sitter ${sitterSupplyCount}`
                      : ""
                  }
                />
                <CompactReviewCard title="Transport" value={transportLabel} />
              </div>
            </section>
          )}
          {careType === "custom" && (
            <ReviewSection title="Care plan">
              <p
                className={cn(
                  "text-sm font-semibold",
                  !validation.tasks && "text-[#a74755]",
                )}
              >
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"} added
                {tags.length ? ` · ${tags.length} requirements` : ""}
              </p>
            </ReviewSection>
          )}
        </div>
      </article>
      <button
        type="button"
        onClick={openDetailPreview}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[#5d3a86] bg-white text-sm font-bold text-[#5d3a86] outline-none transition hover:bg-[#faf7fb] focus-visible:ring-2 focus-visible:ring-[#8c6aad] focus-visible:ring-offset-2"
      >
        <PiEye size={17} />
        Preview details as sitter <PiArrowRight size={15} />
      </button>
    </>
  );
}

function ChoiceRow({
  label,
  active,
  onClick,
  checkbox = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  checkbox?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[58px] w-full items-center gap-3 rounded-[14px] border px-4 text-left text-sm font-bold transition",
        active
          ? "border-[#5d3a86] bg-[#faf7fb] text-[#35243f] ring-1 ring-[#5d3a86]"
          : "border-[#ded9e0] bg-white text-[#554e59] hover:border-[#a996b8]",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center border",
          checkbox ? "rounded-md" : "rounded-full",
          active
            ? "border-[#5d3a86] bg-[#5d3a86] text-white"
            : "border-[#bcb5bf]",
        )}
      >
        {active && <PiCheck size={14} />}
      </span>
      {label}
    </button>
  );
}
function PillChoice({
  label,
  active,
  onClick,
  prominent = false,
  className = "",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  prominent?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#8c6aad] focus-visible:ring-offset-2",
        prominent ? "text-sm" : "text-xs",
        active
          ? "border-[#5d3a86] bg-[#5d3a86] text-white"
          : "border-[#ded9e0] bg-white text-[#706a78]",
        className,
      )}
    >
      {label}
    </button>
  );
}
function BudgetChoice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-full border px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#8c6aad] focus-visible:ring-offset-2",
        active
          ? "border-[#5d3a86] bg-[#5d3a86] text-white"
          : "border-[#d8d1db] bg-white text-[#706a78] hover:border-[#a996b8]",
      )}
    >
      {label}
    </button>
  );
}
function Field({
  label,
  optional,
  hint,
  hintInline = false,
  hintInlineRight = false,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  hintInline?: boolean;
  hintInlineRight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
        {optional && (
          <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
            Optional
          </span>
        )}
        {hint && hintInline && (
          <span
            className={cn(
              "whitespace-nowrap text-[10px] font-semibold normal-case tracking-normal text-[#817a85]",
              hintInlineRight &&
                "ml-auto inline-flex items-center text-[11px] font-medium text-[#9a939f]",
            )}
          >
            {hint}
          </span>
        )}
      </span>
      {children}
      {hint && !hintInline && (
        <span className="mt-1.5 block text-xs leading-5 text-[#817a85]">
          {hint}
        </span>
      )}
    </label>
  );
}
function BudgetFieldLabel({ label }: { label: string }) {
  const [title, detail] = label.split(" · ");
  return (
    <span className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
      <span className="whitespace-nowrap">{title}</span>
      {detail && (
        <span className="whitespace-nowrap text-[9px] font-semibold normal-case tracking-normal text-[#9b939e]">
          {detail}
        </span>
      )}
    </span>
  );
}
function MoneyField({
  label,
  symbol,
  currencyLabel,
  value,
  onChange,
  error = "",
}: {
  label: string;
  symbol: string;
  currencyLabel: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <BudgetFieldLabel label={label} />
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#5d3a86]">
          {symbol}
        </span>
        <input
          inputMode="numeric"
          aria-invalid={Boolean(error)}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          className={cn(
            inputClass,
            "h-10 pl-11 pr-20 text-sm font-bold",
            error &&
              "border-[#d18a94] focus:border-[#b65361] focus:ring-[#b65361]/15",
          )}
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9b939e]">
          {currencyLabel}
        </span>
        {error && (
          <span
            role="alert"
            className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-xs font-medium text-[#a74755]"
          >
            {error}
          </span>
        )}
      </div>
    </label>
  );
}
function CompactMoneyField({
  label,
  symbol,
  currencyLabel,
  value,
  onChange,
  error = "",
}: {
  label: string;
  symbol: string;
  currencyLabel: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <BudgetFieldLabel label={label} />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5d3a86]">
          {symbol}
        </span>
        <input
          inputMode="numeric"
          aria-invalid={Boolean(error)}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          className={cn(
            "h-10 w-full rounded-[10px] border border-[#ded9e0] bg-white pl-8 pr-16 text-sm font-semibold outline-none transition placeholder:text-[#aaa4ae] focus:border-[#5d3a86] focus:ring-4 focus:ring-[#eee8f4]",
            error &&
              "border-[#d18a94] focus:border-[#b65361] focus:ring-[#b65361]/15",
          )}
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#9b939e]">
          {currencyLabel}
        </span>
        {error && (
          <span
            role="alert"
            className="pointer-events-none absolute left-0 top-[calc(100%+2px)] z-10 whitespace-nowrap text-[10px] font-medium text-[#a74755]"
          >
            {error}
          </span>
        )}
      </div>
    </label>
  );
}
function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#8a5d34]">
        {title}
      </h3>
      {children}
    </section>
  );
}
function CompactReviewCard({
  title,
  value,
  detail = "",
  invalid = false,
  children,
}: {
  title: string;
  value: string;
  detail?: string;
  invalid?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-invalid={invalid}
      className={cn(
        "min-w-0 rounded-xl border px-3.5 py-3",
        invalid
          ? "border-[#e1aab2] bg-[#fffafa]"
          : "border-[#eee9ef] bg-[#fdfcfa]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34]">
        {title}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-bold leading-5",
          invalid ? "text-[#a74755]" : "text-[#302a34]",
        )}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#706a78]">
          {detail}
        </p>
      )}
      {children}
    </section>
  );
}
function ReviewMetric({
  label,
  value,
  detail,
  invalid = false,
}: {
  label: string;
  value: string;
  detail?: string;
  invalid?: boolean;
}) {
  return (
    <div className="min-w-0" aria-invalid={invalid}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-bold leading-5",
          invalid ? "text-[#a74755]" : "text-[#302a34]",
        )}
      >
        {value}
      </p>
      {detail && (
        <p
          className={cn(
            "mt-0.5 text-[10px] font-semibold",
            invalid ? "text-[#a74755]" : "text-[#817a85]",
          )}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
function ReviewStat({
  label,
  value,
  accent = false,
  invalid = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        invalid
          ? "border-[#e1aab2] bg-[#fff5f6]"
          : "border-transparent bg-[#f7f4f7]",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-bold",
          accent && "text-[#5d3a86]",
          invalid && "text-[#a74755]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-[12px] border border-[#ded9e0] bg-white px-4 text-sm outline-none transition placeholder:text-[#aaa4ae] focus:border-[#5d3a86] focus:ring-4 focus:ring-[#eee8f4]";
const textareaClass = cn(inputClass, "h-24 resize-none py-3");
function findScrollContainer(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return document.scrollingElement as HTMLElement;
}
function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
function toggleNumber(values: number[], value: number) {
  return values.includes(value)
    ? values.length > 1
      ? values.filter((item) => item !== value)
      : values
    : [...values, value].sort((a, b) => a - b);
}
function petDisplayType(pet: PetDraft) {
  return pet.type === "other"
    ? pet.otherType.trim() || "Other pet"
    : petTypes.find((type) => type.id === pet.type)?.label || "";
}

function petGroupKey(pet: PetDraft) {
  return pet.type === "other"
    ? `other:${pet.otherType.trim().toLowerCase()}`
    : pet.type || "unassigned";
}

function petAvatarPosition(pet: PetDraft) {
  if (pet.type === "dog") return "0% 5.556%";
  if (pet.type === "cat") return "33.333% 5.556%";
  if (pet.type === "rabbit") return "66.667% 5.556%";
  if (pet.type === "bird") return "100% 5.556%";
  const otherType = pet.otherType.trim().toLowerCase();
  if (otherType === "hamster") return "0% 50%";
  if (otherType === "guinea pig") return "33.333% 50%";
  if (otherType === "ferret") return "66.667% 50%";
  if (otherType === "turtle") return "100% 50%";
  if (otherType === "chinchilla") return "0% 94.444%";
  return "33.333% 94.444%";
}

function PetAvatar({ pet }: { pet: PetDraft }) {
  return (
    <span
      aria-hidden="true"
      className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
      style={{
        backgroundImage: "url('/images/pet-default-avatars-v2.png')",
        backgroundPosition: petAvatarPosition(pet),
        backgroundSize: "400% auto",
      }}
    />
  );
}

function isValidPetBirthDate(value: string) {
  const birthDate = parseDateValue(value);
  if (!birthDate) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return birthDate <= today;
}

function formatPetAge(value: string) {
  const birthDate = parseDateValue(value);
  if (!birthDate) return "";
  const today = new Date();
  let months =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    today.getMonth() -
    birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) months -= 1;
  months = Math.max(0, months);
  if (months < 1) return "Under 1 month";
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"}`;
}

function petCardDetails(pet: PetDraft) {
  return [
    pet.breed.trim(),
    formatPetAge(pet.birthDate),
    pet.weight.trim() ? `${pet.weight.trim()} ${pet.weightUnit}` : "",
    formatPetSex(pet.sex),
    formatNeuteredStatus(pet),
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
}

function formatPetSex(value: string) {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  if (value === "unknown") return "Sex unknown";
  return "";
}

function formatNeuteredStatus(pet: PetDraft) {
  if (pet.neutered === "unknown") return "Not sure";
  if (!pet.neutered) return "";
  if (pet.sex === "female")
    return pet.neutered === "yes" ? "Spayed" : "Not spayed";
  if (pet.sex === "male")
    return pet.neutered === "yes" ? "Neutered" : "Not neutered";
  return pet.neutered === "yes"
    ? "Spayed or neutered"
    : "Not spayed or neutered";
}

function previewPetDetails(pet: PetDraft) {
  const neuteredLabel =
    pet.sex === "female"
      ? "Spayed"
      : pet.sex === "male"
        ? "Neutered"
        : "Spayed/neutered";

  return [
    { label: "Breed", value: pet.breed.trim() },
    { label: "Age", value: formatPetAge(pet.birthDate) },
    {
      label: "Weight",
      value: pet.weight.trim() ? `${pet.weight.trim()} ${pet.weightUnit}` : "",
    },
    { label: "Sex", value: formatPetSex(pet.sex) },
    { label: neuteredLabel, value: previewNeuteredStatus(pet) },
  ].filter((detail) => detail.value);
}

function previewNeuteredStatus(pet: PetDraft) {
  if (pet.neutered === "unknown") {
    if (pet.sex === "female") return "Spay status unknown";
    if (pet.sex === "male") return "Neuter status unknown";
    return "Neuter / Spay unknown";
  }
  if (pet.neutered === "yes") {
    if (pet.sex === "female") return "Spayed";
    if (pet.sex === "male") return "Neutered";
    return "Spayed / Neutered";
  }
  if (pet.neutered === "no") {
    if (pet.sex === "female") return "Not Spayed";
    if (pet.sex === "male") return "Not Neutered";
    return "Not Spayed / Neutered";
  }
  return "";
}

function buildPetCareGroups(pets: PetDraft[]) {
  const groups = new Map<string, PetDraft[]>();
  pets.forEach((pet) => {
    const key = petGroupKey(pet);
    groups.set(key, [...(groups.get(key) ?? []), pet]);
  });
  return Array.from(groups.entries()).map(([key, members]) => ({
    key,
    petIds: members.map((pet) => pet.id),
    label: `${petDisplayType(members[0]) || "Pet"}: ${members.map((pet) => pet.name || "Unnamed").join(" & ")}`,
  }));
}

function taskPetLabelText(
  task: Pick<TaskPlan, "petIds">,
  pets: PetDraft[],
  petCareGroups: Array<{ petIds: string[] }>,
) {
  const selectedIds = new Set(task.petIds);
  if (pets.length && pets.every((pet) => selectedIds.has(pet.id))) {
    return "All pets";
  }

  const petsById = new Map(pets.map((pet) => [pet.id, pet]));
  return petCareGroups
    .flatMap((group) => group.petIds)
    .filter((petId) => selectedIds.has(petId))
    .map((petId) => {
      const pet = petsById.get(petId);
      if (!pet) return "";
      return pet.name || petDisplayType(pet) || `Pet ${pets.indexOf(pet) + 1}`;
    })
    .filter(Boolean)
    .join(", ");
}

function togglePetGroup(selectedPetIds: string[], groupPetIds: string[]) {
  const allSelected = groupPetIds.every((petId) =>
    selectedPetIds.includes(petId),
  );
  return allSelected
    ? selectedPetIds.filter((petId) => !groupPetIds.includes(petId))
    : Array.from(new Set([...selectedPetIds, ...groupPetIds]));
}

function petProfileMissingFields(pet: PetDraft) {
  return [
    ...(!pet.type ? ["Choose a pet type."] : []),
    ...(pet.type === "other" && !pet.otherType.trim()
      ? ["Tell us what kind of pet this is."]
      : []),
    ...(!pet.name.trim() ? ["Enter your pet’s name."] : []),
  ];
}

function isPetProfileComplete(pet: PetDraft) {
  return petProfileMissingFields(pet).length === 0;
}

function preparePetPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("Unable to decode image"));
      image.onload = () => {
        const maxSide = 640;
        const scale = Math.min(
          1,
          maxSide / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Unable to prepare image"));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const sharedSupplyFoodExtras = ["Treats or supplements", "Medication"];
const sharedSupplyCareBasics = ["Food bowl or dish", "Water bowl or dispenser"];
const sharedSupplyEnrichment = ["Toys or enrichment"];
const sharedSupplyTravel = ["Travel carrier or container"];

function boardingSupplyOptions(
  pets: PetDraft[],
  customItems: CustomBoardingSupply[],
): BoardingSupplyOption[] {
  const defaults: Record<string, Record<SupplyCategory, string[]>> = {
    dog: {
      food: [
        "Dry food",
        "Wet food (cans or pouches)",
        ...sharedSupplyFoodExtras,
      ],
      stay: [
        ...sharedSupplyCareBasics,
        "Poop bags",
        "Toilet pads",
        "Bed or familiar blanket",
        "Leash and harness",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel],
    },
    cat: {
      food: [
        "Dry food",
        "Wet food (cans or pouches)",
        ...sharedSupplyFoodExtras,
      ],
      stay: [
        ...sharedSupplyCareBasics,
        "Litter tray",
        "Toilet litter or pads",
        "Bed or familiar blanket",
        "Scratching post or pad",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel],
    },
    rabbit: {
      food: ["Hay", "Pellets", ...sharedSupplyFoodExtras],
      stay: [
        ...sharedSupplyCareBasics,
        "Litter tray",
        "Toilet litter or pads",
        "Cage or exercise pen",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel],
    },
    bird: {
      food: ["Regular food", ...sharedSupplyFoodExtras],
      stay: [
        ...sharedSupplyCareBasics,
        "Home cage or enclosure",
        "Cage liner or paper",
        "Perches",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel, "Carrier cover"],
    },
    other: {
      food: ["Regular food", ...sharedSupplyFoodExtras],
      stay: [
        ...sharedSupplyCareBasics,
        "Enclosure or habitat",
        "Bedding or substrate",
        "Toilet or cleaning supplies",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel],
    },
  };
  return pets.flatMap((pet) => {
    const groups = defaults[pet.type] ?? defaults.other;
    const standard = (Object.keys(groups) as SupplyCategory[]).flatMap(
      (category) =>
        groups[category].map((label) => ({
          key: boardingSupplyKey(pet.id, category, label),
          petId: pet.id,
          category,
          label,
          custom: false,
        })),
    );
    const custom = customItems
      .filter((item) => item.petId === pet.id)
      .map((item) => ({
        key: `custom:${item.id}`,
        petId: item.petId,
        category: item.category,
        label: item.label,
        custom: true,
      }));
    return [...standard, ...custom];
  });
}
function boardingSupplyKey(
  petId: string,
  category: SupplyCategory,
  label: string,
) {
  return `${petId}:${category}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
function supplyItemIcon(label: string): IconType {
  const value = label.toLowerCase();
  if (value.includes("medication")) return PiFirstAidKit;
  if (value.includes("food bowl") || value.includes("food dish"))
    return PiForkKnife;
  if (value.includes("water")) return PiPintGlass;
  if (value.includes("hay")) return PiGrains;
  if (["wet food", "can", "pouch"].some((word) => value.includes(word)))
    return PiJar;
  if (["dry food", "pellet"].some((word) => value.includes(word)))
    return PiBagSimple;
  if (["treat", "supplement"].some((word) => value.includes(word)))
    return PiPlusCircle;
  if (["bed", "blanket", "bedding"].some((word) => value.includes(word)))
    return PiBed;
  if (["liner", "cover"].some((word) => value.includes(word))) return PiTowel;
  if (["litter", "toilet", "poop"].some((word) => value.includes(word)))
    return PiToiletPaper;
  if (["leash", "harness", "collar"].some((word) => value.includes(word)))
    return PiLinkSimple;
  if (
    ["cage", "enclosure", "habitat", "pen"].some((word) => value.includes(word))
  )
    return PiHouseSimple;
  if (value.includes("perch")) return PiFeather;
  if (value.includes("scratch")) return PiPawPrint;
  if (["toy", "enrichment"].some((word) => value.includes(word)))
    return PiTennisBall;
  if (["carrier", "crate", "container"].some((word) => value.includes(word)))
    return PiSuitcase;
  if (["food", "feed"].some((word) => value.includes(word))) return PiPackage;
  return PiToolbox;
}
function buildTitle(careType: CareType, pets: PetDraft[]) {
  const total = pets.reduce((sum, pet) => sum + pet.quantity, 0);
  const types = Array.from(new Set(pets.map(petDisplayType).filter(Boolean)));
  const petText =
    types.length === 1
      ? `${total > 1 ? `${total} ` : ""}${types[0]}${total > 1 ? "s" : ""}`
      : types.length > 1
        ? `${total} pets`
        : total > 1
          ? `${total} pets`
          : "a pet";
  return `${careTypes[careType].title} for ${petText}`;
}
function dateLabel(dates: { startDate: string; endDate: string }) {
  if (dates.startDate && dates.endDate)
    return dates.startDate === dates.endDate
      ? formatDate(dates.startDate)
      : `${formatDate(dates.startDate)} – ${formatDate(dates.endDate)}`;
  if (dates.startDate) return `From ${formatDate(dates.startDate)}`;
  if (dates.endDate) return `Until ${formatDate(dates.endDate)}`;
  return "Dates not added";
}
function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    : value;
}
function currencySymbol(currency: string) {
  return (
    { JPY: "¥", USD: "$", EUR: "€", CNY: "¥", KRW: "₩" }[currency] || currency
  );
}
function currencyUnitLabel(currency: string) {
  return (
    { JPY: "yen", USD: "dollars", EUR: "euros", CNY: "yuan", KRW: "won" }[
      currency
    ] || currency
  );
}
function budgetLabel(budget: BudgetDraft, unit: string) {
  if (budget.mode === "open") return "Open to suggestions";
  const symbol = currencySymbol(budget.currency);
  if (budget.mode === "range")
    return budget.amount || budget.maximum
      ? `${symbol}${budget.amount || "0"}–${symbol}${budget.maximum || "?"} ${unit}`
      : "Range not set";
  return budget.amount ? `${symbol}${budget.amount} ${unit}` : "Not set";
}
function visitTimeLabel(value = "flexible", exact = "") {
  const option =
    timeOptions.find((item) => item.value === value)?.label || "Any time";
  return value === "exact" && exact ? exact : option;
}
function boardingRoutineScheduleLabel(routine: BoardingRoutine) {
  if (routine.scheduleType === "daily") {
    const labels = routine.dailyTimes.map((time) =>
      time.startsWith("exact:")
        ? time.slice(6)
        : {
            flexible: "Flexible",
            morning: "Morning",
            midday: "Midday",
            afternoon: "Afternoon",
            evening: "Evening",
            bedtime: "Bedtime",
          }[time] || time,
    );
    return `${routine.dailyTimes.length}× daily${labels.length ? ` · ${labels.join(", ")}` : ""}`;
  }
  if (routine.scheduleType === "repeating")
    return `Every ${routine.intervalDays} ${routine.intervalDays === 1 ? "day" : "days"}${routine.firstDueDate ? ` · First due ${formatDate(routine.firstDueDate)}` : ""}`;
  if (routine.scheduleType === "once")
    return routine.preferredDate
      ? `Once · ${formatDate(routine.preferredDate)}`
      : "Once during the stay";
  return "As needed";
}
function frequencyLabel(value: string, customInterval: number) {
  if (value === "every-day") return "Every day";
  if (value === "every-2-days") return "Every 2 days";
  if (value === "every-3-days") return "Every 3 days";
  if (value === "custom") return `Every ${customInterval} days`;
  return "Schedule not added";
}
function dateSpanDays(dates: { startDate: string; endDate: string }) {
  if (!dates.startDate) return 0;
  const start = new Date(`${dates.startDate}T00:00:00`);
  const end = new Date(`${dates.endDate || dates.startDate}T00:00:00`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  return Number.isFinite(diff) ? Math.max(1, diff) : 0;
}
function boardingNights(dates: { startDate: string; endDate: string }) {
  if (!dates.startDate || !dates.endDate) return 0;
  const start = new Date(`${dates.startDate}T00:00:00`);
  const end = new Date(`${dates.endDate}T00:00:00`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return Number.isFinite(diff) ? Math.max(1, diff) : 0;
}
function estimateTotalLabel({
  careType,
  dates,
  budget,
  transport,
  supplyCostMode,
  visitFrequency,
  customInterval,
  firstVisitDate,
  excludedVisitDates,
  visitsPerDay,
}: {
  careType: CareType;
  dates: { startDate: string; endDate: string };
  budget: BudgetDraft;
  transport: string;
  supplyCostMode?: SupplyCostMode;
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  excludedVisitDates: string[];
  visitsPerDay: number;
}) {
  if (budget.mode === "open") return "To be discussed";
  const span = dateSpanDays(dates);
  if (!span) return "Add dates";
  const units =
    careType === "visit"
      ? buildVisitDates({
          dates,
          visitFrequency,
          customInterval,
          firstVisitDate,
          excludedVisitDates,
        }).length * visitsPerDay
      : careType === "boarding"
        ? boardingNights(dates)
        : 1;
  if (!units) return "Complete schedule";
  const symbol = currencySymbol(budget.currency);
  const travelPerUnit =
    careType === "visit" && budget.travelMode === "fixed"
      ? Number(budget.travelAmount || 0)
      : 0;
  const boardingTransportTotal =
    careType === "boarding" &&
    (transport === "sitter" || transport === "split") &&
    budget.travelMode === "fixed"
      ? Number(budget.travelAmount || 0)
      : 0;
  const supplyTotal =
    careType === "boarding" && supplyCostMode === "fixed"
      ? Number(budget.supplyAmount || 0)
      : 0;
  const minimum =
    (Number(budget.amount || 0) + travelPerUnit) * units +
    boardingTransportTotal +
    supplyTotal;
  const maximum =
    (Number(budget.maximum || 0) + travelPerUnit) * units +
    boardingTransportTotal +
    supplyTotal;
  if (budget.mode === "range")
    return minimum || maximum
      ? `${symbol}${minimum.toLocaleString()}–${symbol}${(maximum || minimum).toLocaleString()}`
      : "Add budget";
  return minimum ? `${symbol}${minimum.toLocaleString()}` : "Add budget";
}
function estimateFormulaText(
  careType: CareType,
  travelMode: BudgetDraft["travelMode"],
  transport: string,
  supplyCostMode?: SupplyCostMode,
) {
  if (careType === "visit" && travelMode === "fixed")
    return "Estimated total = total visits × (price per visit + travel allowance per visit)";
  if (careType === "visit" && travelMode === "actual")
    return "Estimated total = total visits × price per visit (travel costs not included)";
  if (careType === "visit")
    return "Estimated total = total visits × price per visit";
  if (careType === "boarding") {
    const sitterHandlesTransport =
      transport === "sitter" || transport === "split";
    const additions = [
      travelMode === "fixed" && sitterHandlesTransport
        ? "fixed transport allowance"
        : "",
      supplyCostMode === "fixed" ? "fixed supply allowance" : "",
    ].filter(Boolean);
    const excludesTransport =
      transport === "taxi" ||
      transport === "discuss" ||
      (sitterHandlesTransport &&
        (travelMode === "actual" || travelMode === "discuss"));
    const excludesSupplies =
      supplyCostMode === "reimburse" || supplyCostMode === "discuss";
    const exclusions =
      excludesTransport && excludesSupplies
        ? ["transport and supply costs not included"]
        : [
            excludesTransport ? "transport costs not included" : "",
            excludesSupplies ? "supply costs not included" : "",
          ].filter(Boolean);
    return `Estimated total = total nights × price per night${additions.map((item) => ` + ${item}`).join("")}${exclusions.length ? ` (${exclusions.join("; ")})` : ""}`;
  }
  return "Estimated total = agreed total price";
}
function distanceLabel(distance: string) {
  if (distance === "No preference") return "No fixed limit";
  if (distance.startsWith("Custom:"))
    return `Within ${distance.slice(7).trim()}`;
  return `Within ${distance}`;
}
function boardingTransportLabel(
  transport: string,
  splitDirection: "owner-dropoff" | "sitter-dropoff",
) {
  if (transport === "owner") return "Owner handles drop-off and pickup";
  if (transport === "sitter") return "Sitter handles pickup and return";
  if (transport === "split")
    return splitDirection === "owner-dropoff"
      ? "Owner drops off · sitter returns"
      : "Sitter picks up · owner collects";
  if (transport === "taxi") return "Pet taxi";
  return "Discuss later";
}
function boardingTransportCostLabel(transport: string, budget: BudgetDraft) {
  if (transport === "owner") return "No sitter transport cost";
  if (transport === "taxi") return "Paid to pet taxi";
  if (transport === "discuss") return "To be discussed";
  if (budget.travelMode === "actual") return "Reimburse actual cost";
  if (budget.travelMode === "discuss") return "To be discussed";
  if (budget.travelMode === "fixed" && budget.travelAmount)
    return `${currencySymbol(budget.currency)}${Number(budget.travelAmount).toLocaleString()} total`;
  return "Not selected";
}
function lngLatToWorld(point: LocationDraft, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin((point.lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}
function worldToLngLat(
  point: { x: number; y: number },
  zoom: number,
): LocationDraft {
  const scale = 256 * 2 ** zoom;
  const lng = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat: Math.max(-85, Math.min(85, lat)), lng };
}
