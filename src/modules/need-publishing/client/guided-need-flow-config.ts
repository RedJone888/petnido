"use client";

import type { IconType } from "react-icons";
import {
  PiCalendarBlank,
  PiCheckCircle,
  PiCurrencyCircleDollar,
  PiHouseLine,
  PiMapPin,
  PiPackage,
  PiPawPrint,
  PiShieldCheck,
} from "react-icons/pi";

import { getTaskIcon } from "@/domain/care/care-icons";
import {
  type BoardingSupplyPlan,
  type BoardingTaskConfig,
  type BudgetDraft,
  type CareType,
  type CompatibilityChoice,
  type CustomBoardingSupply,
  type LocationDraft,
  type ScreenId,
  type SupplyCostMode,
  type TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";

export type ScreenDefinition = {
  id: ScreenId;
  chapter: string;
  label: string;
  title: string;
  description: string;
  icon: IconType;
};

export const visitTasks = [
  "feeding",
  "water",
  "cleaning",
  "play",
  "walk",
  "medication",
  "safety",
].map((id) => ({ id, label: id, icon: getTaskIcon(id) }));

export const boardingTasks = [
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

export const customTasks = [
  "transport",
  "vet",
  "enclosure",
  "pickup",
  "supervision",
].map((id) => ({ id, label: id, icon: getTaskIcon(id) }));

export type NeedPublishingCopy = ReturnType<
  typeof getNeedPublishingMessages
>["needPublishing"];

export function buildScreens(
  careType: CareType | null,
  copy: NeedPublishingCopy,
  flowCopy: ReturnType<
    typeof getNeedPublishingMessages
  >["needPublishingClient"]["flow"],
): ScreenDefinition[] {
  const branch = careType ?? "visit";
  const dateCopy = {
    visit: copy.screens.visitDates,
    boarding: copy.screens.boardingDates,
    custom: copy.screens.customDates,
  };
  const commonStart: ScreenDefinition[] = [
    {
      id: "care",
      chapter: copy.chapters.start,
      label: copy.steps.care,
      ...copy.screens.care,
      icon: PiHouseLine,
    },
    {
      id: "pets",
      chapter: copy.chapters.pets,
      label: copy.steps.pets,
      ...copy.screens.pets,
      icon: PiPawPrint,
    },
    {
      id: "dates",
      chapter: copy.chapters.schedule,
      label: branch === "visit" ? copy.steps.frequency : copy.steps.dates,
      ...dateCopy[branch],
      icon: PiCalendarBlank,
    },
  ];
  const branchScreens: Record<CareType, ScreenDefinition[]> = {
    visit: [
      {
        id: "tasks",
        chapter: copy.chapters.carePlan,
        label: copy.steps.tasks,
        ...copy.screens.visitTasks,
        icon: PiCheckCircle,
      },
    ],
    boarding: [
      {
        id: "tasks",
        chapter: copy.chapters.boardingPlan,
        label: copy.steps.tasks,
        ...copy.screens.boardingTasks,
        icon: PiCheckCircle,
      },
      {
        id: "supplies",
        chapter: copy.chapters.boardingPlan,
        label: copy.steps.supplies,
        ...copy.screens.supplies,
        icon: PiPackage,
      },
      {
        id: "requirements",
        chapter: copy.chapters.boardingPlan,
        label: flowCopy.labels.boardingRequirements,
        ...copy.screens.requirements,
        icon: PiHouseLine,
      },
    ],
    custom: [
      {
        id: "tasks",
        chapter: copy.chapters.customPlan,
        label: copy.steps.tasks,
        ...copy.screens.customTasks,
        icon: PiCheckCircle,
      },
      {
        id: "requirements",
        chapter: copy.chapters.customPlan,
        label: flowCopy.labels.customRequirements,
        ...copy.screens.customRequirements,
        icon: PiShieldCheck,
      },
    ],
  };
  const areaCopy = {
    visit: copy.screens.visitArea,
    boarding: {
      title: flowCopy.boardingAreaTitle,
      description: flowCopy.boardingAreaDescription,
    },
    custom: copy.screens.customArea,
  };
  const areaLabel = {
    visit: flowCopy.labels.visitArea,
    boarding: flowCopy.labels.boardingArea,
    custom: flowCopy.labels.customArea,
  };
  return [
    ...commonStart,
    ...branchScreens[branch],
    {
      id: "area",
      chapter: copy.chapters.location,
      label: areaLabel[branch],
      ...areaCopy[branch],
      icon: PiMapPin,
    },
    {
      id: "budget",
      chapter: copy.chapters.budget,
      label: copy.steps.budget,
      ...copy.screens.budget,
      icon: PiCurrencyCircleDollar,
    },
    {
      id: "preview",
      chapter: copy.chapters.review,
      label: copy.steps.preview,
      ...copy.screens.preview,
      icon: PiCheckCircle,
    },
  ];
}

export type NeedModeDraftState = {
  dates: {
    startDate: string;
    endDate: string;
    notes: string;
    timeOfDay: string;
    exactTime: string;
  };
  visitFrequency: string;
  customInterval: number;
  firstVisitDate: string;
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  visitPlans: TaskPlan[];
  boardingRoutines: BoardingTaskConfig[];
  boardingSupplies: BoardingSupplyPlan;
  customBoardingSupplies: CustomBoardingSupply[];
  boardingSupplyNotes: string;
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
  customRequirementsNotes: string;
  transport: string;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  distance: string;
  area: string;
  location: LocationDraft;
  areaConfirmed: boolean;
  budget: BudgetDraft;
  /** Mode-specific navigation state; care and pets remain common. */
  confirmedScreenIds: ScreenId[];
  confirmedScreenSignatures: Partial<Record<ScreenId, string>>;
};

export function emptyNeedModeDraft(): NeedModeDraftState {
  return {
    dates: {
      startDate: "",
      endDate: "",
      notes: "",
      timeOfDay: "flexible",
      exactTime: "",
    },
    visitFrequency: "every-day",
    customInterval: 4,
    firstVisitDate: "",
    visitsPerDay: 1,
    visitTimes: ["flexible"],
    exactTimes: [""],
    visitPlans: [],
    boardingRoutines: [],
    boardingSupplies: {},
    customBoardingSupplies: [],
    boardingSupplyNotes: "",
    supplyCostMode: "discuss",
    customPlans: [],
    taskNotes: "",
    boardingNeeds: [],
    customBoardingRequirements: [],
    boardingCompatibility: {},
    customHomeSituations: [],
    boardingHomeNotes: "",
    customNeeds: [],
    customWarnings: [],
    customRequirementsNotes: "",
    transport: "discuss",
    splitDirection: "owner-dropoff",
    distance: "No preference",
    area: "",
    location: { lat: 34.6545, lng: 135.5155 },
    areaConfirmed: false,
    budget: {
      currency: "JPY",
      mode: "exact",
      amount: "",
      maximum: "",
      exactNegotiable: false,
      travelMode: "none",
      travelAmount: "",
      supplyAmount: "",
    },
    confirmedScreenIds: [],
    confirmedScreenSignatures: {},
  };
}

export function localizedNeedScreens(
  careType: CareType | null,
  copy: NeedPublishingCopy,
  flowCopy: ReturnType<
    typeof getNeedPublishingMessages
  >["needPublishingClient"]["flow"],
) {
  const screens = buildScreens(careType, copy, flowCopy);
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
    return {
      ...screen,
      title:
        screen.id === "area" && branch === "boarding"
          ? flowCopy.boardingAreaTitle
          : screenCopy.title,
      description:
        screen.id === "area" && branch === "boarding"
          ? flowCopy.boardingAreaDescription
          : screenCopy.description,
    };
  });
}
