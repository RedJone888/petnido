import { z } from "zod";

import { resolveOtherPetTypeKey } from "@/domain/pet/profile-options";
import {
  normalizePetTypeSelection,
  petTypeCodes,
  type PetTypeCode,
} from "@/modules/need-publishing/domain/pet-types";
import {
  normalizeTaskIdentity,
  taskPersistenceLabel,
} from "@/modules/need-publishing/domain/task-catalog";
import { needDraftPayloadSchema } from "./contracts";

export type CareType = "visit" | "boarding" | "custom";
export type TaskPriority = "must" | "nice";
export type CompatibilityChoice = "ok" | "not-ok";
export type SupplyProvision = "" | "owner" | "sitter" | "not-needed";
export type SupplyCostMode = "reimburse" | "fixed" | "discuss";
export type SupplyCategory = "food" | "stay" | "travel" | "other";
export type ScreenId =
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

export type PetDraft = {
  id: string;
  sourcePetId?: string;
  photoAttachmentId?: string;
  profileAction?: "create" | "update" | "none";
  type: string;
  typeCode?: PetTypeCode;
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

export type TaskPlan = {
  id: string;
  templateId: string;
  label: string;
  priority: TaskPriority;
  petIds: string[];
  visitNumbers: number[];
  custom: boolean;
  notes?: string;
  order?: number;
  /** Home-visit display order keyed by visit number; never part of identity. */
  orderByVisit?: Record<number, number>;
};

export type BoardingScheduleType = "daily" | "repeating" | "once" | "as-needed";

export type BoardingRoutine = {
  id: string;
  petIds: string[];
  priority: TaskPriority;
  scheduleType: BoardingScheduleType;
  instructions: string;
  order: number;
};

export type BoardingTaskConfig = {
  templateId: string;
  label: string;
  custom: boolean;
  routines: BoardingRoutine[];
};

export type BoardingSupplyPlan = Record<string, SupplyProvision>;

export type CustomBoardingSupply = {
  id: string;
  petId: string;
  category: SupplyCategory;
  categoryLabel?: string;
  label: string;
};

export type BoardingSupplyOption = {
  key: string;
  petId: string;
  category: SupplyCategory;
  categoryLabel?: string;
  label: string;
  custom: boolean;
};

const sharedSupplyFoodExtras = ["Treats or supplements", "Medication"];
const sharedSupplyCareBasics = ["Food bowl or dish", "Water bowl or dispenser"];
const sharedSupplyEnrichment = ["Toys or enrichment"];
const sharedSupplyTravel = ["Travel carrier or container"];
export const boardingRequirementOptions = [
  "Someone is usually at home",
  "Daily photo updates",
  "Available for daily messages",
  "Medication support",
  "Secure outdoor area",
  "Quiet environment",
  "Step-free home",
  "Only one client at a time",
];
export const boardingHomeSituationOptions = [
  "Dogs in the home",
  "Cats in the home",
  "Children in the home",
  "Other pets in the home",
  "Smoking household",
  "Shared home with housemates",
];

export function boardingSupplyKey(
  petId: string,
  category: SupplyCategory,
  label: string,
) {
  return `${petId}:${category}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function boardingSupplyOptions(
  pets: PetDraft[],
  customItems: CustomBoardingSupply[],
): BoardingSupplyOption[] {
  type SupplyProfile =
    | "cat-dog"
    | "small-herbivore"
    | "small-mammal"
    | "bird"
    | "reptile"
    | "other";
  const defaults: Record<SupplyProfile, Record<SupplyCategory, string[]>> = {
    "cat-dog": {
      food: ["Dry food", "Wet food (cans or pouches)", ...sharedSupplyFoodExtras],
      stay: [
        ...sharedSupplyCareBasics,
        "Bed or familiar blanket",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel],
      other: [],
    },
    "small-herbivore": {
      food: ["Hay", "Pellets", "Fresh vegetables", ...sharedSupplyFoodExtras],
      stay: [
        "Food bowl or dish",
        "Water bottle or bowl",
        "Litter tray",
        "Toilet litter or pads",
        "Cage or exercise pen",
        "Bedding or substrate",
        "Chew toys or enrichment",
      ],
      travel: ["Secure travel carrier", "Carrier liner or towel"],
      other: [],
    },
    "small-mammal": {
      food: ["Regular food", ...sharedSupplyFoodExtras],
      stay: [
        ...sharedSupplyCareBasics,
        "Home cage or enclosure",
        "Bedding or substrate",
        "Toilet or cleaning supplies",
        ...sharedSupplyEnrichment,
      ],
      travel: [...sharedSupplyTravel],
      other: [],
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
      other: [],
    },
    reptile: {
      food: ["Species-appropriate food", "Calcium or supplements", "Medication"],
      stay: [
        "Enclosure or habitat",
        "Heat or UV lamp",
        "Thermometer or hygrometer",
        "Water dish or bathing container",
        "Bedding or substrate",
        "Toilet or cleaning supplies",
      ],
      travel: ["Ventilated travel container", "Heat pack or insulation"],
      other: [],
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
      other: [],
    },
  };

  return pets.flatMap((pet) => {
    const otherType =
      pet.type === "other" ? resolveOtherPetTypeKey(pet.otherType) : null;
    const profile: SupplyProfile =
      pet.type === "dog" || pet.type === "cat"
        ? "cat-dog"
        : pet.type === "rabbit" ||
            otherType === "guinea-pig" ||
            otherType === "chinchilla"
          ? "small-herbivore"
          : otherType === "hamster" || otherType === "ferret"
            ? "small-mammal"
            : pet.type === "bird"
              ? "bird"
              : otherType === "turtle"
                ? "reptile"
                : "other";
    const familyGroups = defaults[profile];
    const stayExtras =
      pet.type === "dog"
        ? ["Poop bags", "Toilet pads", "Leash and harness"]
        : pet.type === "cat"
          ? ["Litter tray", "Toilet litter or pads", "Scratching post or pad"]
          : otherType === "ferret"
            ? ["Litter tray", "Bed or familiar blanket", "Leash and harness"]
            : otherType === "hamster"
              ? ["Exercise wheel", "Hideout or nesting box"]
            : [];
    const groups: Record<SupplyCategory, string[]> = {
      ...familyGroups,
      stay: [...familyGroups.stay, ...stayExtras],
    };
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
        categoryLabel: item.categoryLabel,
        label: item.label,
        custom: true,
      }));
    return [...standard, ...custom];
  });
}

export function countBoardingSupplyArrangements(
  pets: PetDraft[],
  options: BoardingSupplyOption[],
  plan: BoardingSupplyPlan,
  provision: "owner" | "sitter",
) {
  const petsById = new Map(pets.map((pet) => [pet.id, pet]));
  return new Set(
    options.flatMap((option) => {
      if (plan[option.key] !== provision) return [];
      const pet = petsById.get(option.petId);
      const normalizedPetType = pet
        ? normalizePetTypeSelection(pet.typeCode ?? pet.type, pet.otherType)
        : null;
      const groupKey = !normalizedPetType
        ? "unknown"
        : normalizedPetType.petType === "OTHER"
          ? `OTHER:${normalizedPetType.customPetType?.normalize("NFKC").trim().toLocaleLowerCase() ?? "unknown"}`
          : normalizedPetType.petType;
      return [
        [
          groupKey,
          option.category,
          option.categoryLabel?.trim().toLowerCase() ?? "",
          option.label.trim().toLowerCase(),
        ].join("::"),
      ];
    }),
  ).size;
}

export type BudgetDraft = {
  currency: string;
  mode: "exact" | "range" | "open";
  amount: string;
  maximum: string;
  exactNegotiable: boolean;
  travelMode: "none" | "fixed" | "actual" | "discuss";
  travelAmount: string;
  supplyAmount: string;
};

export type LocationDraft = {
  lat: number;
  lng: number;
  label?: string | null;
  regionLabel?: string | null;
  sourceLocationId?: string;
  displayPrecision?: "CITY" | "DISTRICT" | "NEIGHBORHOOD" | "MAP_POINT";
};

export type NeedAttachmentDraft = {
  id: string;
  url: string;
  signature: string;
};

export type NeedDraftSnapshotV3 = {
  version: 3;
  savedAt: number;
  serverDraftId?: string;
  publishIdempotencyKey?: string;
  currentId: ScreenId;
  careType: CareType | null;
  pets: PetDraft[];
  dates: {
    startDate: string;
    endDate: string;
    notes: string;
    timeOfDay?: string;
    exactTime?: string;
  };
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
  customRequirementsNotes?: string;
  transport: string;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  distance: string;
  area: string;
  location: LocationDraft;
  areaConfirmed?: boolean;
  budget: BudgetDraft;
  attachments?: NeedAttachmentDraft[];
  visitedScreenIds: ScreenId[];
  confirmedScreenIds?: ScreenId[];
  /** Full browser workspace used to keep non-active care branches intact. */
  draftByMode?: Partial<Record<CareType, Record<string, unknown>>>;
};

const careTypeSchema = z.enum(["visit", "boarding", "custom"]);
const screenIdSchema = z.enum([
  "care",
  "pets",
  "dates",
  "frequency",
  "tasks",
  "supplies",
  "requirements",
  "cautions",
  "transport",
  "area",
  "budget",
  "preview",
]);
const taskPlanSchema = z
  .object({
    id: z.string(),
    templateId: z.string(),
    label: z.string(),
    priority: z.enum(["must", "nice"]),
    petIds: z.array(z.string()),
    visitNumbers: z.array(z.number()),
    custom: z.boolean(),
    notes: z.string().optional(),
    order: z.number().optional(),
    orderByVisit: z.record(z.string(), z.number().int().nonnegative()).optional(),
  })
  .strict();
const petDraftSchema = z
  .object({
    id: z.string(),
    sourcePetId: z.string().optional(),
    photoAttachmentId: z.string().optional(),
    profileAction: z.enum(["create", "update", "none"]).optional(),
    type: z.string(),
    typeCode: z.enum(petTypeCodes).optional(),
    otherType: z.string(),
    quantity: z.number().int().positive().max(100),
    name: z.string(),
    breed: z.string(),
    weight: z.string(),
    weightUnit: z.enum(["kg", "g"]),
    birthDate: z.string(),
    sex: z.string(),
    neutered: z.string(),
    photo: z.string(),
    notes: z.string(),
  })
  .strict();
const boardingRoutineSchema = z
  .object({
    id: z.string(),
    petIds: z.array(z.string()),
    priority: z.enum(["must", "nice"]),
    scheduleType: z.enum(["daily", "repeating", "once", "as-needed"]),
    instructions: z.string(),
    order: z.number(),
    // Legacy per-frequency fields are accepted only so drafts saved before the
    // boarding task editor simplified still restore; they are never written.
    dailyTimes: z.array(z.string()).optional(),
    intervalDays: z.number().optional(),
    firstDueDate: z.string().optional(),
    preferredDate: z.string().optional(),
    trigger: z.string().optional(),
  })
  .strict();

export const legacyNeedDraftV3Schema = z
  .object({
    version: z.literal(3),
    savedAt: z.number().finite(),
    serverDraftId: z.string().min(1).optional(),
    publishIdempotencyKey: z.string().min(1).optional(),
    currentId: screenIdSchema,
    careType: careTypeSchema.nullable(),
    pets: z.array(petDraftSchema),
    dates: z
      .object({
        startDate: z.string(),
        endDate: z.string(),
        notes: z.string(),
        timeOfDay: z.string().optional(),
        exactTime: z.string().optional(),
      })
      .strict(),
    visitFrequency: z.string(),
    customInterval: z.number(),
    firstVisitDate: z.string().optional(),
    excludedVisitDates: z.array(z.string()).optional(),
    visitsPerDay: z.number(),
    visitTimes: z.array(z.string()),
    exactTimes: z.array(z.string()),
    visitPlans: z.array(taskPlanSchema),
    boardingRoutines: z.array(
      z
        .object({
          templateId: z.string(),
          label: z.string(),
          custom: z.boolean(),
          routines: z.array(boardingRoutineSchema),
        })
        .strict(),
    ),
    boardingSupplies: z.record(z.enum(["", "owner", "sitter", "not-needed"])),
    customBoardingSupplies: z.array(
      z
        .object({
          id: z.string(),
          petId: z.string(),
          category: z.enum(["food", "stay", "travel", "other"]),
          categoryLabel: z.string().optional(),
          label: z.string(),
        })
        .strict(),
      ),
    boardingSupplyNotes: z.string().default(""),
    supplyCostMode: z.enum(["reimburse", "fixed", "discuss"]),
    customPlans: z.array(taskPlanSchema),
    taskNotes: z.string(),
    boardingNeeds: z.array(z.string()),
    customBoardingRequirements: z.array(z.string()),
    boardingCompatibility: z.record(z.enum(["ok", "not-ok"])),
    customHomeSituations: z.array(z.string()),
    boardingHomeNotes: z.string(),
    customNeeds: z.array(z.string()),
    customWarnings: z.array(z.string()),
    customRequirementsNotes: z.string().optional(),
    transport: z.string(),
    splitDirection: z.enum(["owner-dropoff", "sitter-dropoff"]),
    distance: z.string(),
    area: z.string(),
    location: z
      .object({
        lat: z.number().finite().min(-90).max(90),
        lng: z.number().finite().min(-180).max(180),
        label: z.string().trim().min(1).max(240).nullable().optional(),
        regionLabel: z.string().trim().min(1).max(120).nullable().optional(),
        sourceLocationId: z.string().optional(),
        displayPrecision: z
          .enum(["CITY", "DISTRICT", "NEIGHBORHOOD", "MAP_POINT"])
          .optional(),
      })
      .strict(),
    areaConfirmed: z.boolean().optional(),
    budget: z
      .object({
        currency: z.string(),
        mode: z.enum(["exact", "range", "open"]),
        amount: z.string(),
        maximum: z.string(),
        exactNegotiable: z.boolean(),
        travelMode: z.enum(["none", "fixed", "actual", "discuss"]),
        travelAmount: z.string(),
        supplyAmount: z.string(),
      })
      .strict(),
    attachments: z
      .array(
        z
          .object({
            id: z.string(),
            url: z.string(),
            signature: z.string(),
          })
          .strict(),
      )
      .max(30)
      .optional(),
    visitedScreenIds: z.array(screenIdSchema),
    confirmedScreenIds: z.array(screenIdSchema).optional(),
    draftByMode: z.record(z.record(z.unknown())).optional(),
  })
  .strict();

export function parseLegacyNeedDraftV3(value: unknown) {
  const result = legacyNeedDraftV3Schema.safeParse(value);
  return result.success ? result.data : null;
}

export type NeedDraftPayload = z.infer<typeof needDraftPayloadSchema>;

type SupportedCurrency = "JPY" | "USD" | "EUR" | "CNY" | "TWD" | "KRW" | "GBP";

const currencyDecimals: Record<SupportedCurrency, number> = {
  JPY: 0,
  KRW: 0,
  USD: 2,
  EUR: 2,
  CNY: 2,
  TWD: 2,
  GBP: 2,
};

function fromMinor(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined) return "";
  const decimals =
    currency in currencyDecimals
      ? currencyDecimals[currency as SupportedCurrency]
      : 2;
  return String(value / 10 ** decimals);
}

function localDateAtInstant(instant: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function mapNeedDraftPayloadToLegacyNeedDraftV3({
  draftId,
  mode,
  payload: value,
  attachments = [],
}: {
  draftId: string;
  mode: "HOME_VISIT" | "BOARDING" | "CUSTOM";
  payload: unknown;
  attachments?: NeedAttachmentDraft[];
}): NeedDraftSnapshotV3 {
  const payload = needDraftPayloadSchema.parse(value);
  const timeZone = payload.timeZone ?? "UTC";
  const currency = payload.budget?.currency ?? "JPY";
  const travel = payload.additionalCosts?.find((cost) => cost.kind === "TRAVEL");
  const supply = payload.additionalCosts?.find((cost) => cost.kind === "SUPPLY");
  const pets = (payload.pets ?? []).map<PetDraft>((pet, index) => {
    const normalizedType = pet.petType?.toLowerCase() ?? "other";
    const standardType = ["dog", "cat", "rabbit", "bird"].includes(
      normalizedType,
    );
    return {
      id: pet.clientPetKey ?? `pet-${index + 1}`,
      ...(pet.sourcePetId ? { sourcePetId: pet.sourcePetId } : {}),
      ...(pet.attachmentId ? { photoAttachmentId: pet.attachmentId } : {}),
      profileAction:
        pet.profileAction === "CREATE"
          ? "create"
          : pet.sourcePetId
            ? "update"
            : "none",
      type: standardType ? normalizedType : "other",
      typeCode: pet.petType,
      otherType:
        pet.petType === "OTHER"
          ? (pet.customPetType ?? "")
          : standardType
            ? ""
            : (pet.petType?.toLowerCase().replaceAll("_", "-") ?? ""),
      quantity: pet.quantity ?? 1,
      name: pet.name ?? "",
      breed: pet.breed ?? "",
      weight: pet.weightGrams ? String(pet.weightGrams / 1000) : "",
      weightUnit: "kg",
      birthDate: pet.birthDate ?? "",
      sex: pet.sex?.toLowerCase() ?? "unknown",
      neutered: pet.neutered?.toLowerCase() ?? "unknown",
      photo: pet.attachmentUrl ?? "",
      notes: pet.careNotes ?? "",
    };
  });
  type DraftTask = NonNullable<
    NonNullable<NeedDraftPayload["custom"]>["tasks"]
  >[number];
  const taskPlan = (task: DraftTask): TaskPlan => {
    const category = task.category ?? "";
    const custom =
      category.toUpperCase() === "CUSTOM" ||
      category.toUpperCase().startsWith("CUSTOM-");
    const identity = normalizeTaskIdentity({
      category,
      label: task.label,
      custom,
    });
    return {
      id: task.clientTaskKey,
      templateId: identity.code ?? "custom",
      label: identity.label || "Custom care task",
      priority: task.priority === "NICE" ? "nice" : "must",
      petIds: task.petKeys ?? [],
      visitNumbers: task.visitNumbers ?? [],
      custom: identity.custom,
      notes: task.instructions ?? undefined,
      ...(task.order == null ? {} : { order: task.order }),
      ...(task.orderByVisit
        ? {
            orderByVisit: Object.fromEntries(
              Object.entries(task.orderByVisit).map(([visit, order]) => [
                Number(visit),
                order,
              ]),
            ),
          }
        : {}),
    };
  };
  const startDate = payload.startsAt
    ? localDateAtInstant(payload.startsAt, timeZone)
    : "";
  const endDate = payload.endsAt
    ? localDateAtInstant(
        mode === "BOARDING"
          ? payload.endsAt
          : new Date(new Date(payload.endsAt).getTime() - 1).toISOString(),
        timeZone,
      )
    : "";
  const homeTasks = payload.homeVisit?.tasks ?? [];
  const boardingTasks = payload.boarding?.tasks ?? [];
  const customTasks = payload.custom?.tasks ?? [];
  const interval = payload.homeVisit?.intervalDays ?? 1;
  const visitFrequency =
    interval === 1
      ? "every-day"
      : interval === 2
        ? "every-2-days"
        : interval === 3
          ? "every-3-days"
          : "custom";
  const visitWindows = payload.homeVisit?.visitWindows ?? [];
  const visitsPerDay = payload.homeVisit?.visitsPerServiceDay ?? 1;
  const boardingSupplies = Object.fromEntries(
    (payload.boarding?.supplies ?? []).map((item) => [
      item.clientSupplyKey,
      item.providedBy === "OWNER"
        ? "owner"
        : item.providedBy === "PROVIDER"
          ? "sitter"
          : "not-needed",
    ]),
  ) as BoardingSupplyPlan;
  const customBoardingSupplies = (payload.boarding?.supplies ?? []).flatMap(
    (item): CustomBoardingSupply[] =>
      item.clientSupplyKey.startsWith("custom:")
        ? [
            {
              id: item.clientSupplyKey.slice("custom:".length),
              petId: item.petKey ?? "",
              category:
                item.category === "FOOD"
                  ? "food"
                  : item.category === "TRAVEL"
                    ? "travel"
                    : item.category === "OTHER"
                      ? "other"
                      : "stay",
              categoryLabel: item.category === "OTHER" ? "Other" : undefined,
              label: item.label,
            },
          ]
        : [],
  );
  const persistedBoardingRequirements = payload.boarding?.requirements ?? [];
  const customRequirements = payload.custom?.requirements ?? [];
  const transport =
    payload.boarding?.handoffDirection === "SPLIT"
      ? "split"
      : payload.boarding?.transportMode === "OWNER"
        ? "owner"
        : payload.boarding?.transportMode === "PROVIDER"
          ? "sitter"
          : payload.boarding?.transportMode === "TAXI"
            ? "taxi"
            : "discuss";

  return legacyNeedDraftV3Schema.parse({
    version: 3,
    savedAt: Date.now(),
    serverDraftId: draftId,
    currentId: "preview",
    careType:
      mode === "HOME_VISIT"
        ? "visit"
        : mode === "BOARDING"
          ? "boarding"
          : "custom",
    pets,
    dates: {
      startDate,
      endDate,
      notes: payload.scheduleNotes ?? "",
      ...(payload.custom?.timePreference
        ? { timeOfDay: payload.custom.timePreference.toLowerCase() }
        : {}),
      ...(payload.custom?.exactTime
        ? { exactTime: payload.custom.exactTime }
        : {}),
    },
    visitFrequency,
    customInterval: interval,
    firstVisitDate: payload.homeVisit?.firstServiceDate ?? startDate,
    // Excluded dates were removed from the publishing product. Ignore the
    // legacy field while restoring older drafts so it cannot re-enter the new
    // editor or be recreated on the next publish.
    excludedVisitDates: [],
    visitsPerDay,
    visitTimes: Array.from({ length: visitsPerDay }, (_, index) => {
      const window = visitWindows[index];
      if (window?.kind !== "PREFERRED" || !window.preferredLocalTime) return "flexible";
      const time = window.preferredLocalTime.toLowerCase();
      if (["morning", "midday", "afternoon", "evening", "bedtime"].includes(time)) {
        return time;
      }
      return "exact";
    }),
    exactTimes: Array.from(
      { length: visitsPerDay },
      (_, index) => {
        const window = visitWindows[index];
        if (window?.kind === "PREFERRED" && window.preferredLocalTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(window.preferredLocalTime)) {
          return window.preferredLocalTime;
        }
        return "";
      },
    ),
    visitPlans: homeTasks.map(taskPlan),
    boardingRoutines: boardingTasks.map((task) => {
      const category = task.category ?? "";
      const custom =
        category.toUpperCase() === "CUSTOM" ||
        category.toUpperCase().startsWith("CUSTOM-");
      const identity = normalizeTaskIdentity({
        category,
        label: task.label,
        custom,
      });
      const resolvedPetIds =
        task.petKeys?.length
          ? task.petKeys.map((key) => {
              const matched = pets.find(
                (p) => p.id === key || p.sourcePetId === key,
              );
              return matched ? matched.id : pets.length === 1 ? pets[0].id : key;
            })
          : pets.length === 1
            ? [pets[0].id]
            : [];
      return {
        templateId: identity.code ?? "custom",
        label: identity.label || "Boarding care task",
        custom: identity.custom,
        routines: [
          {
            id: task.clientTaskKey,
            petIds:
              resolvedPetIds.length > 0
                ? resolvedPetIds
                : pets.length === 1
                  ? [pets[0].id]
                  : [],
            priority: task.priority === "NICE" ? "nice" : "must",
            scheduleType:
              task.scheduleKind === "REPEATING"
                ? "repeating"
                : task.scheduleKind === "ONCE"
                  ? "once"
                  : task.scheduleKind === "AS_NEEDED"
                    ? "as-needed"
                    : "daily",
            instructions: task.instructions ?? "",
            order: task.order ?? 0,
          },
        ],
      };
    }),
    boardingSupplies,
    customBoardingSupplies,
    boardingSupplyNotes: payload.boarding?.supplyNotes ?? "",
    supplyCostMode:
      supply?.mode === "ACTUAL"
        ? "reimburse"
        : supply?.mode === "FIXED"
          ? "fixed"
          : "discuss",
    customPlans: customTasks.map(taskPlan),
    taskNotes: payload.description ?? "",
    boardingNeeds: persistedBoardingRequirements
      .filter((item) => item.kind === "ENVIRONMENT_REQUIRED")
      .map((item) => item.label),
    customBoardingRequirements: persistedBoardingRequirements
      .filter(
        (item) =>
          item.kind === "ENVIRONMENT_REQUIRED" &&
          !boardingRequirementOptions.includes(item.label),
      )
      .map((item) => item.label),
    boardingCompatibility: Object.fromEntries(
      persistedBoardingRequirements.flatMap((item) =>
        item.kind === "UNACCEPTABLE"
          ? [[item.label, "not-ok"]]
          : [],
      ),
    ),
    customHomeSituations: persistedBoardingRequirements
      .filter(
        (item) =>
          (item.kind === "UNACCEPTABLE" ||
            (item.kind === "OTHER_NEED" &&
              item.label.startsWith("Acceptable: "))) &&
          !boardingHomeSituationOptions.includes(
            item.label.startsWith("Acceptable: ")
              ? item.label.slice("Acceptable: ".length)
              : item.label,
          ),
      )
      .map((item) =>
        item.label.startsWith("Acceptable: ")
          ? item.label.slice("Acceptable: ".length)
          : item.label,
      ),
    boardingHomeNotes: persistedBoardingRequirements
      .filter(
        (item) =>
          item.kind === "NOTE" ||
          (item.kind === "OTHER_NEED" && !item.label.startsWith("Acceptable: ")),
      )
      .map((item) => item.label)
      .join("; "),
    customNeeds: customRequirements
      .filter((item) => item.kind !== "WARNING" && item.kind !== "NOTE")
      .map((item) => item.label),
    customWarnings: customRequirements
      .filter((item) => item.kind === "WARNING")
      .map((item) => item.label),
    customRequirementsNotes: customRequirements
      .filter((item) => item.kind === "NOTE")
      .map((item) => item.label)
      .join("; "),
    transport,
    splitDirection: "owner-dropoff",
    distance: payload.boarding?.maxProviderDistanceMeters
      ? `${payload.boarding.maxProviderDistanceMeters / 1000} km`
      : "No preference",
    area:
      payload.location?.label ??
      payload.location?.regionLabel ??
      "Saved map location",
    location: {
      lat: payload.location?.lat ?? 34.6545,
      lng: payload.location?.lon ?? 135.5155,
      ...(payload.location?.label ? { label: payload.location.label } : {}),
      ...(payload.location?.regionLabel
        ? { regionLabel: payload.location.regionLabel }
        : {}),
      ...(payload.location?.sourceLocationId
        ? { sourceLocationId: payload.location.sourceLocationId }
        : {}),
      ...(payload.location?.displayPrecision
        ? { displayPrecision: payload.location.displayPrecision }
        : {}),
    },
    areaConfirmed: Boolean(payload.location),
    budget: {
      currency,
      mode: payload.budget?.kind?.toLowerCase() ?? "open",
      amount: fromMinor(payload.budget?.minAmountMinor, currency),
      maximum: fromMinor(payload.budget?.maxAmountMinor, currency),
      exactNegotiable: payload.budget?.negotiable ?? false,
      travelMode: travel?.mode?.toLowerCase() ?? "none",
      travelAmount: fromMinor(travel?.amountMinor, currency),
      supplyAmount: fromMinor(supply?.amountMinor, currency),
    },
    attachments,
    visitedScreenIds: ["preview"],
  });
}

function toMinor(value: string, currency: SupportedCurrency) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 10 ** (currencyDecimals[currency] ?? 2));
}

function toInstant(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00.000Z` : null;
}

function nextDate(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function zonedMidnight(date: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  let candidate = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(
      Number(value.year),
      Number(value.month) - 1,
      Number(value.day),
      Number(value.hour),
      Number(value.minute),
      Number(value.second),
    );
    const correction = target - represented;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate).toISOString();
}

function optionalText(value: string | null | undefined) {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function petPayload(pet: PetDraft) {
  const weight = Number(pet.weight);
  const weightGrams =
    Number.isFinite(weight) && weight > 0
      ? Math.round(pet.weightUnit === "kg" ? weight * 1000 : weight)
      : undefined;
  const sex: "FEMALE" | "MALE" | "UNKNOWN" =
    pet.sex === "female" ? "FEMALE" : pet.sex === "male" ? "MALE" : "UNKNOWN";
  const neutered: "YES" | "NO" | "UNKNOWN" =
    pet.neutered === "yes" ? "YES" : pet.neutered === "no" ? "NO" : "UNKNOWN";
  const profileAction: "CREATE" | "UPDATE" | "NONE" =
    pet.profileAction === "none"
      ? "NONE"
      : pet.profileAction === "create"
        ? "CREATE"
        : pet.sourcePetId
          ? "UPDATE"
          : "CREATE";
  const normalizedPetType = normalizePetTypeSelection(
    pet.typeCode ?? pet.type,
    pet.otherType,
  );
  return {
    clientPetKey: pet.id,
    sourcePetId: pet.sourcePetId ?? null,
    attachmentId: pet.photoAttachmentId ?? null,
    attachmentUrl: optionalText(pet.photo) ?? null,
    profileAction,
    quantity: pet.quantity,
    ...(optionalText(pet.name) ? { name: pet.name.trim() } : {}),
    petType: normalizedPetType.petType,
    customPetType: normalizedPetType.customPetType,
    breed: optionalText(pet.breed) ? pet.breed.trim() : null,
    birthDate: toInstant(pet.birthDate) ? pet.birthDate : null,
    weightGrams: weightGrams ?? null,
    sex,
    neutered,
    careNotes: optionalText(pet.notes) ? pet.notes.trim() : null,
  };
}

function sanitizeTaskKey(id: string, petIds: string[] = []): string {
  if (id && id.length <= 80 && !id.includes("::")) return id;
  if (!id) return `task-${crypto.randomUUID()}`;
  const baseId = id.split(":")[0];
  const petSuffix = petIds.length ? `:${petIds[0]}` : "";
  const candidate = `${baseId}${petSuffix}`;
  return candidate.length <= 80 ? candidate : candidate.slice(0, 80);
}

function basicTask(task: TaskPlan) {
  const standardCode = task.custom
    ? null
    : normalizeTaskIdentity({
        templateId: task.templateId,
        label: task.label,
        custom: false,
      }).code;
  const label = taskPersistenceLabel({
    code: standardCode ?? task.templateId,
    label: task.label,
    custom: task.custom,
  });
  return {
    clientTaskKey: sanitizeTaskKey(task.id, task.petIds),
    category: (standardCode ?? "CUSTOM").toUpperCase(),
    label: label || "Custom care task",
    instructions: optionalText(task.notes ?? "") ?? null,
    priority: task.priority === "must" ? ("MUST" as const) : ("NICE" as const),
    petKeys: task.petIds,
    scheduleKind: null,
    visitNumbers: task.visitNumbers,
    order: task.order ?? 0,
    ...(task.orderByVisit ? { orderByVisit: task.orderByVisit } : {}),
  };
}

function customTask(task: TaskPlan) {
  const standardCode = task.custom
    ? null
    : normalizeTaskIdentity({
        templateId: task.templateId,
        label: task.label,
        custom: false,
      }).code;
  const label = taskPersistenceLabel({
    code: standardCode ?? task.templateId,
    label: task.label,
    custom: task.custom,
  });
  return {
    clientTaskKey: sanitizeTaskKey(task.id, task.petIds),
    category: (standardCode ?? "CUSTOM").toUpperCase(),
    label: label || "Custom care task",
    instructions: optionalText(task.notes ?? "") ?? null,
    priority: null,
    petKeys: task.petIds,
    scheduleKind: null,
    visitNumbers: [],
    order: task.order ?? 0,
  };
}

function boardingTask(config: BoardingTaskConfig, routine: BoardingRoutine) {
  const scheduleKind = {
    daily: "DAILY",
    repeating: "REPEATING",
    once: "ONCE",
    "as-needed": "AS_NEEDED",
  }[routine.scheduleType] as "DAILY" | "REPEATING" | "ONCE" | "AS_NEEDED";
  const standardCode = config.custom
    ? null
    : normalizeTaskIdentity({
        templateId: config.templateId,
        label: config.label,
        custom: false,
      }).code;
  const label = taskPersistenceLabel({
    code: standardCode ?? config.templateId,
    label: config.label,
    custom: config.custom,
  });
  return {
    clientTaskKey: sanitizeTaskKey(routine.id, routine.petIds),
    category: (standardCode ?? "CUSTOM").toUpperCase(),
    label: label || "Boarding care task",
    instructions: optionalText(routine.instructions) ?? null,
    priority: null,
    petKeys: routine.petIds,
    scheduleKind,
    visitNumbers: [],
    order: routine.order,
  };
}

function modeFor(careType: CareType | null) {
  if (careType === "visit") return "HOME_VISIT" as const;
  if (careType === "boarding") return "BOARDING" as const;
  if (careType === "custom") return "CUSTOM" as const;
  return null;
}

function toTimePreference(
  value: string | undefined,
): "FLEXIBLE" | "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING" | "EXACT" | null {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "FLEXIBLE" ||
    normalized === "MORNING" ||
    normalized === "MIDDAY" ||
    normalized === "AFTERNOON" ||
    normalized === "EVENING" ||
    normalized === "EXACT"
  ) {
    return normalized;
  }
  return null;
}

function distanceMeters(value: string) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric * 1000);
}

function requirementList(
  entries: Array<{
    kind: "ENVIRONMENT_REQUIRED" | "UNACCEPTABLE" | "OTHER_NEED" | "WARNING" | "NOTE";
    label: string;
    petKey?: string | null;
  }>,
) {
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    const label = entry.label.trim();
    const key = `${entry.kind}:${entry.petKey ?? ""}:${label.toLocaleLowerCase()}`;
    if (!label || seen.has(key)) return [];
    seen.add(key);
    return [{ ...entry, label, petKey: entry.petKey ?? null }];
  });
}

export function mapLegacyNeedDraftV3(
  draft: NeedDraftSnapshotV3,
  timeZone: string,
): { mode: "HOME_VISIT" | "BOARDING" | "CUSTOM" | null; payload: NeedDraftPayload } {
  const currency: SupportedCurrency =
    draft.budget.currency in currencyDecimals
      ? (draft.budget.currency as SupportedCurrency)
      : "JPY";
  const minAmount = toMinor(draft.budget.amount, currency);
  const maxAmount = toMinor(draft.budget.maximum, currency);
  const mode = modeFor(draft.careType);
  const clientPetKeyByReference = new Map<string, string>();
  draft.pets.forEach((pet) => {
    clientPetKeyByReference.set(pet.id, pet.id);
    if (pet.sourcePetId) clientPetKeyByReference.set(pet.sourcePetId, pet.id);
  });
  const canonicalPetKeys = (petIds: string[]) =>
    Array.from(
      new Set(
        petIds.flatMap((petId) => {
          const clientPetKey = clientPetKeyByReference.get(petId);
          return clientPetKey ? [clientPetKey] : [];
        }),
      ),
    );
  const boardingOptions =
    draft.careType === "boarding"
      ? boardingSupplyOptions(draft.pets, draft.customBoardingSupplies)
      : [];
  const sitterSuppliesRequired = boardingOptions.some(
    (supply) => draft.boardingSupplies[supply.key] === "sitter",
  );
  const travelCostApplies =
    draft.careType === "visit"
      ? draft.budget.travelMode !== "none"
      : draft.careType === "boarding"
        ? (draft.transport === "sitter" || draft.transport === "split") &&
          draft.budget.travelMode !== "none"
        : false;
  const supplyCostApplies =
    draft.careType === "boarding" && sitterSuppliesRequired;
  const additionalCosts = [
    ...(travelCostApplies
      ? [
          {
            kind: "TRAVEL" as const,
            mode: draft.budget.travelMode.toUpperCase() as
              | "NONE"
              | "FIXED"
              | "ACTUAL"
              | "DISCUSS",
            amountMinor:
              draft.budget.travelMode === "fixed"
                ? toMinor(draft.budget.travelAmount, currency)
                : null,
          },
        ]
      : []),
    ...(supplyCostApplies
      ? [
          {
            kind: "SUPPLY" as const,
            mode:
              draft.supplyCostMode === "reimburse"
                ? ("ACTUAL" as const)
                : draft.supplyCostMode === "fixed"
                  ? ("FIXED" as const)
                  : ("DISCUSS" as const),
            amountMinor:
              draft.supplyCostMode === "fixed"
                ? toMinor(draft.budget.supplyAmount, currency)
                : null,
          },
        ]
      : []),
  ];
  const payload: NeedDraftPayload = {
    description: optionalText(draft.taskNotes)
      ? draft.taskNotes.trim()
      : null,
    scheduleNotes: optionalText(draft.dates.notes) ?? null,
    ...(zonedMidnight(draft.dates.startDate, timeZone)
      ? { startsAt: zonedMidnight(draft.dates.startDate, timeZone) }
      : {}),
    ...(zonedMidnight(draft.dates.endDate, timeZone)
      ? {
          endsAt: zonedMidnight(
            draft.careType === "boarding"
              ? draft.dates.endDate
              : nextDate(draft.dates.endDate),
            timeZone,
          ),
        }
      : {}),
    timeZone,
    pets: draft.pets.map(petPayload),
    ...(draft.areaConfirmed
      ? {
          location: {
            ...(draft.location.sourceLocationId
              ? { sourceLocationId: draft.location.sourceLocationId }
              : {}),
            lat: draft.location.lat,
            lon: draft.location.lng,
            label: optionalText(draft.location.label) ?? null,
            regionLabel: optionalText(draft.location.regionLabel) ?? null,
            displayPrecision: draft.location.displayPrecision ?? "MAP_POINT",
          },
        }
      : {}),
    budget: {
      kind: draft.budget.mode.toUpperCase() as "EXACT" | "RANGE" | "OPEN",
      minAmountMinor: draft.budget.mode === "open" ? null : minAmount,
      maxAmountMinor: draft.budget.mode === "range" ? maxAmount : null,
      currency,
      negotiable: draft.budget.exactNegotiable,
    },
    additionalCosts,
    attachmentIds: (draft.attachments ?? []).map((attachment) => attachment.id),
  };

  if (draft.careType === "visit") {
    const intervalDays =
      draft.visitFrequency === "every-day"
        ? 1
        : draft.visitFrequency === "every-2-days"
          ? 2
          : draft.visitFrequency === "every-3-days"
            ? 3
            : Math.max(1, draft.customInterval);
    payload.homeVisit = {
      intervalDays,
      firstServiceDate: draft.firstVisitDate || draft.dates.startDate || null,
      visitsPerServiceDay: Math.max(1, draft.visitsPerDay),
      visitWindows: Array.from({ length: Math.max(1, draft.visitsPerDay) }, (_, index) => {
        const timeChoice = (draft.visitTimes[index] || "flexible").toLowerCase();
        const exactTime = draft.exactTimes[index];
        if (timeChoice === "exact" && exactTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(exactTime)) {
          return {
            visitNumber: index + 1,
            kind: "PREFERRED" as const,
            preferredLocalTime: exactTime,
          };
        }
        if (["morning", "midday", "afternoon", "evening", "bedtime"].includes(timeChoice)) {
          return {
            visitNumber: index + 1,
            kind: "PREFERRED" as const,
            preferredLocalTime: timeChoice,
          };
        }
        return {
          visitNumber: index + 1,
          kind: "FLEXIBLE" as const,
          preferredLocalTime: null,
        };
      }),
      tasks: draft.visitPlans.map((task) =>
        basicTask({ ...task, petIds: canonicalPetKeys(task.petIds) }),
      ),
    };
  } else if (draft.careType === "boarding") {
    const supplies = boardingSupplyOptions(
      draft.pets,
      draft.customBoardingSupplies,
    ).flatMap((supply) => {
      const provision = draft.boardingSupplies[supply.key];
      if (!provision) return [];
      return [
        {
          clientSupplyKey: supply.key,
          petKey: supply.petId || null,
          category:
            supply.category === "food"
              ? ("FOOD" as const)
              : supply.category === "stay"
                ? ("STAY" as const)
                : supply.category === "travel"
                  ? ("TRAVEL" as const)
                  : ("OTHER" as const),
          label: supply.label.trim(),
          providedBy:
            provision === "owner"
              ? ("OWNER" as const)
              : provision === "sitter"
                ? ("PROVIDER" as const)
                : ("NOT_NEEDED" as const),
        },
      ];
    });
    payload.boarding = {
      tasks: draft.boardingRoutines.flatMap((config) =>
        config.routines.map((routine) =>
          boardingTask(config, {
            ...routine,
            petIds: canonicalPetKeys(routine.petIds),
          }),
        ),
      ),
      supplies,
      supplyNotes: optionalText(draft.boardingSupplyNotes),
      requirements: requirementList([
        ...draft.boardingNeeds.map((label) => ({ kind: "ENVIRONMENT_REQUIRED" as const, label })),
        ...Object.entries(draft.boardingCompatibility)
          .filter(([, choice]) => choice === "not-ok")
          .map(([label]) => ({ kind: "UNACCEPTABLE" as const, label })),
        ...(optionalText(draft.boardingHomeNotes)
          ? [{ kind: "NOTE" as const, label: draft.boardingHomeNotes }]
          : []),
      ]),
      transportMode:
        draft.transport === "owner"
          ? "OWNER"
          : draft.transport === "sitter" || draft.transport === "split"
            ? "PROVIDER"
            : draft.transport === "taxi"
              ? "TAXI"
              : "DISCUSS",
      handoffDirection:
        draft.transport === "split"
          ? "SPLIT"
          : draft.transport === "sitter"
            ? "PROVIDER_PICKUP"
            : draft.transport === "owner"
              ? "OWNER_DROPOFF"
              : "DISCUSS",
      maxProviderDistanceMeters: distanceMeters(draft.distance),
    };
  } else if (draft.careType === "custom") {
    payload.custom = {
      tasks: draft.customPlans.map((task) =>
        customTask({ ...task, petIds: canonicalPetKeys(task.petIds) }),
      ),
      requirements: requirementList([
        ...draft.customNeeds.map((label) => ({ kind: "OTHER_NEED" as const, label })),
        ...draft.customWarnings.map((label) => ({ kind: "WARNING" as const, label })),
        ...(draft.customRequirementsNotes?.trim()
          ? [{ kind: "NOTE" as const, label: draft.customRequirementsNotes.trim() }]
          : []),
      ]),
      timePreference: toTimePreference(draft.dates.timeOfDay),
      exactTime: optionalText(draft.dates.exactTime),
    };
  }

  return { mode, payload: needDraftPayloadSchema.parse(payload) };
}
