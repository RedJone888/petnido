import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";
import { getNeedDisplayMessages } from "@/modules/need-display/i18n/messages";
import {
  formatMoneyAmount,
} from "@/domain/money/presentation";
export { formatMoneyAmount as formatMoney, formatMoneyAmount };
export { petAvatarPosition } from "@/domain/pet/avatar";

export { modeBadgeThemes, modeColorMap, type CareMode } from "@/domain/care/care-themes";

import {
  formatDateSpan,
  formatPublishedAt,
  parseDateValue,
} from "@/domain/date/presentation";
export { formatDateSpan, formatPublishedAt, parseDateValue };

export function isCoordinateLocationLabel(value: string | null | undefined) {
  return Boolean(
    value?.trim() &&
      /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(value.trim()),
  );
}

export function formatHomeVisitFrequency(
  intervalDays: number,
  visitsPerDay: number,
  lang: Lang
): string {
  const copy = getNeedDisplayMessages(lang);
  if (intervalDays === 1) {
    return visitsPerDay === 1
      ? copy.frequencyDailySingle
      : copy.frequencyDailyMultiple(visitsPerDay);
  }
  return visitsPerDay === 1
    ? copy.frequencyIntervalSingle(intervalDays)
    : copy.frequencyIntervalMultiple(intervalDays, visitsPerDay);
}

export function customTimeLabel(
  preference: string | null | undefined,
  exactTime: string | null | undefined,
  t: (typeof messages)[Lang],
  needCopy: ReturnType<typeof getNeedPublishingMessages>,
) {
  if (!preference) {
    if (exactTime) return exactTime;
    return needCopy.needPublishing.timeOptions.flexible;
  }
  const key = preference.toLowerCase() as keyof typeof needCopy.needPublishing.timeOptions;
  const prefLabel = needCopy.needPublishing.timeOptions[key] ?? preference;
  if (preference.toUpperCase() === "EXACT") {
    return exactTime ? `${prefLabel} · ${exactTime}` : prefLabel;
  }
  if (exactTime) {
    return `${prefLabel} (${exactTime})`;
  }
  return prefLabel;
}

export {
  calculatePetAgeParts,
  formatPetAge,
  formatPetGenderAndNeuter,
  formatPetWeight,
} from "@/domain/pet/presentation";

export function taskPriorityInfo(priority: string | null | undefined, lang: Lang) {
  const copy = getNeedDisplayMessages(lang);
  if (priority === "MUST") {
    return {
      text: copy.must,
      className: "bg-amber-50 border-amber-200/90 text-amber-900 font-bold",
    };
  }
  if (priority === "NICE") {
    return {
      text: copy.nice,
      className: "bg-slate-50 border-slate-200 text-slate-600 font-medium",
    };
  }
  return null;
}

export function taskScheduleKindInfo(kind: string | null | undefined, lang: Lang, mode?: string) {
  const effectiveKind = kind || (mode === "BOARDING" ? "DAILY" : null);
  const copy = getNeedDisplayMessages(lang);
  switch (effectiveKind) {
    case "EACH_VISIT":
      return {
        text: copy.scheduleKindEachVisit,
        className: "bg-purple-50 border-purple-200/80 text-primary",
      };
    case "DAILY":
      return {
        text: copy.scheduleKindDaily,
        className: "bg-blue-50 border-blue-200/80 text-blue-700",
      };
    case "REPEATING":
      return {
        text: copy.scheduleKindRepeating,
        className: "bg-indigo-50 border-indigo-200/80 text-indigo-700",
      };
    case "ONCE":
      return {
        text: copy.scheduleKindOnce,
        className: "bg-amber-50 border-amber-200/80 text-amber-800",
      };
    case "AS_NEEDED":
      return {
        text: copy.scheduleKindAsNeeded,
        className: "bg-teal-50 border-teal-200/80 text-teal-800",
      };
    default:
      return null;
  }
}

export function formatTransportModeLabel(mode: string | null | undefined, lang: Lang) {
  const copy = getNeedDisplayMessages(lang);
  switch (mode) {
    case "OWNER":
      return copy.transportOwner;
    case "PROVIDER":
      return copy.transportProvider;
    case "TAXI":
      return copy.transportTaxi;
    case "DISCUSS":
      return copy.transportDiscuss;
    default:
      return mode || "-";
  }
}

import {
  PiBowlFood,
  PiHouseSimple,
  PiSuitcase,
  PiSparkle,
} from "react-icons/pi";

export function getSupplyCategoryBadgeInfo(category: string, lang: Lang) {
  const norm = (category || "").toLowerCase().trim();
  const needMessages = getNeedPublishingMessages(lang);
  const formCopy = needMessages.needPublishingSupplyForm;
  const uiCopy = needMessages.needPublishingClient.supplies.ui;

  if (
    norm === "food" ||
    norm.includes("food") ||
    norm.includes("medication") ||
    norm.includes("食物") ||
    norm.includes("フード")
  ) {
    return {
      label: formCopy.food,
      categoryKey: "food" as const,
      Icon: PiBowlFood,
      className: "bg-amber-50 text-amber-800 border-amber-200/80",
    };
  }
  if (
    norm === "stay" ||
    norm.includes("stay") ||
    norm.includes("care") ||
    norm.includes("equipment") ||
    norm.includes("照护") ||
    norm.includes("ケア")
  ) {
    return {
      label: formCopy.stay,
      categoryKey: "stay" as const,
      Icon: PiHouseSimple,
      className: "bg-blue-50 text-blue-800 border-blue-200/80",
    };
  }
  if (
    norm === "travel" ||
    norm.includes("travel") ||
    norm.includes("出行") ||
    norm.includes("移動")
  ) {
    return {
      label: formCopy.travel,
      categoryKey: "travel" as const,
      Icon: PiSuitcase,
      className: "bg-purple-50 text-purple-800 border-purple-200/80",
    };
  }
  return {
    label: category || uiCopy.other,
    categoryKey: "custom" as const,
    Icon: PiSparkle,
    className: "bg-stone-100 text-stone-700 border-stone-200/80",
  };
}

export type StructuredSupplyItem<T> = T & {
  categoryRowSpan?: number;
  providerRowSpan?: number;
};

export function buildStructuredSupplyRows<
  T extends { category: string; providedBy: string }
>(supplies: T[]): Array<StructuredSupplyItem<T>> {
  const result: Array<StructuredSupplyItem<T>> = [];
  const categorySpans: number[] = new Array(supplies.length).fill(0);
  const providerSpans: number[] = new Array(supplies.length).fill(0);

  // Calculate category spans independently
  let catIndex = 0;
  while (catIndex < supplies.length) {
    const currentCategory = supplies[catIndex].category;
    let end = catIndex + 1;
    while (end < supplies.length && supplies[end].category === currentCategory) {
      end++;
    }
    categorySpans[catIndex] = end - catIndex;
    catIndex = end;
  }

  // Calculate provider spans independently across adjacent rows with matching provider
  let provIndex = 0;
  while (provIndex < supplies.length) {
    const currentProvider = supplies[provIndex].providedBy;
    let end = provIndex + 1;
    while (end < supplies.length && supplies[end].providedBy === currentProvider) {
      end++;
    }
    providerSpans[provIndex] = end - provIndex;
    provIndex = end;
  }

  for (let idx = 0; idx < supplies.length; idx++) {
    result.push({
      ...supplies[idx],
      categoryRowSpan: categorySpans[idx],
      providerRowSpan: providerSpans[idx],
    });
  }

  return result;
}

export function deduplicateTasks<
  T extends {
    label: string;
    instructions?: string | null;
    priority?: string | null;
    scheduleKind?: string | null;
  }
>(tasks: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const task of tasks) {
    const labelKey = task.label.trim().toLowerCase();
    const instKey = (task.instructions || "").trim();
    const prioKey = task.priority || "";
    const schedKey = task.scheduleKind || "";
    const key = `${labelKey}|${instKey}|${prioKey}|${schedKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(task);
    }
  }

  return unique;
}

export function formatVisitWindowTime(
  window: { kind: string; preferredLocalTime: string | null } | undefined,
  lang: Lang,
  t: (typeof messages)[Lang],
  needCopy: ReturnType<typeof getNeedPublishingMessages>,
) {
  if (!window || window.kind === "FLEXIBLE" || !window.preferredLocalTime) {
    return needCopy.needPublishing.timeOptions.flexible;
  }

  const time = window.preferredLocalTime.toLowerCase();
  const timeLabels = needCopy.needPublishing.timeOptions;

  if (time === "morning") return timeLabels.morning;
  if (time === "midday") return timeLabels.midday;
  if (time === "afternoon") return timeLabels.afternoon;
  if (time === "evening") return timeLabels.evening;
  if (time === "bedtime") return timeLabels.bedtime;
  if (time === "flexible") return timeLabels.flexible;

  return window.preferredLocalTime;
}

export function groupPetsAndTasks(
  pets: Array<{
    name: string | null;
    petType: string;
    quantity: number;
    breed?: string | null;
    birthDate?: string | null;
    weightGrams?: number | null;
    sex?: string | null;
    neutered?: string | null;
    careNotes?: string | null;
    image?: string | null;
  }>,
  tasks: Array<{
    category: string;
    label: string;
    instructions?: string | null;
    priority?: string | null;
    scheduleKind?: string | null;
    visitNumbers?: number[];
    pets?: Array<{ name: string | null; petType: string }>;
  }>,
  lang: Lang,
  t: (typeof messages)[Lang]
) {
  if (!tasks.length) {
    return [];
  }

  const copy = getNeedDisplayMessages(lang);

  if (!pets.length) {
    return [
      {
        key: "default",
        petType: "PET",
        groupTitle: copy.careTasks,
        petTypeLabel: copy.petDefaultLabel,
        pets: [],
        tasks: deduplicateTasks(tasks),
      },
    ];
  }

  // Group tasks by their exact matching set of bound pets
  const groups: Array<{
    key: string;
    petType: string;
    groupTitle: string;
    petTypeLabel: string;
    pets: typeof pets;
    tasks: typeof tasks;
  }> = [];

  for (const task of tasks) {
    let matchingPets: typeof pets;

    if (!task.pets || task.pets.length === 0) {
      matchingPets = pets;
    } else {
      matchingPets = pets.filter((pet) =>
        task.pets?.some((tp) => {
          if (tp.name && pet.name) {
            return (
              tp.name.trim().toLowerCase() === pet.name.trim().toLowerCase()
            );
          }
          if (tp.petType && pet.petType) {
            return tp.petType.toUpperCase() === pet.petType.toUpperCase();
          }
          return false;
        })
      );
      if (!matchingPets.length) {
        matchingPets = pets;
      }
    }

    const groupKey = matchingPets
      .map((p) => `${p.name?.trim().toLowerCase() || ""}::${p.petType}`)
      .sort()
      .join("|");

    const existing = groups.at(-1)?.key === groupKey ? groups.at(-1) : undefined;
    if (existing) {
      existing.tasks.push(task);
    } else {
      const firstPet = matchingPets[0];
      const petTypeLabel = firstPet
        ? t.core.pets[firstPet.petType.toLowerCase() as keyof typeof t.core.pets] ??
          t.core.pets[firstPet.petType as keyof typeof t.core.pets] ??
          firstPet.petType
        : copy.petDefaultLabel;

      const groupTitle =
        matchingPets.length === pets.length && pets.length > 1
          ? copy.commonTasks
          : matchingPets
              .map((p) => p.name || petTypeLabel)
              .filter(Boolean)
              .join(" & ");

      groups.push({
        key: groupKey,
        petType: firstPet?.petType || "PET",
        groupTitle,
        petTypeLabel,
        pets: matchingPets,
        tasks: [task],
      });
    }
  }

  return groups.map((group) => ({
    ...group,
    tasks: deduplicateTasks(group.tasks),
  }));
}

export function customScheduleSummaryBadge(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  timePreference: string | null | undefined,
  exactTime: string | null | undefined,
  lang: Lang,
  t: (typeof messages)[Lang],
  needCopy: ReturnType<typeof getNeedPublishingMessages>,
) {
  if (!startDate || !endDate) return "";
  const dateStr = formatDateSpan(startDate, endDate, lang);
  const timeStr = customTimeLabel(timePreference, exactTime, t, needCopy);
  const copy = getNeedDisplayMessages(lang);

  const isSameDay =
    new Date(startDate).toDateString() === new Date(endDate).toDateString();

  return isSameDay
    ? copy.customScheduleWindowSingleDay(dateStr, timeStr)
    : copy.customScheduleWindowRange(dateStr, timeStr);
}

export function groupAdjacentSupplies(supplies: readonly any[], pets: readonly any[]) {
  return supplies.reduce<Array<{ key: string; pets: any[]; supplies: any[] }>>((groups, supply) => {
    const targetPets = supply.pet
      ? [pets.find((pet) => pet.id === supply.pet.id) ?? { ...supply.pet, image: null }]
      : [...pets];
    const key = targetPets.map((pet) => pet.id ?? `${pet.petType}:${pet.name ?? ""}`).sort().join("|");
    const previous = groups.at(-1);
    if (previous?.key === key) previous.supplies.push(supply);
    else groups.push({ key, pets: targetPets, supplies: [supply] });
    return groups;
  }, []);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function toDateValue(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function buildVisitScheduleDates(
  startsAt: Date | string,
  endsAt: Date | string,
  frequency: string = "EVERY_DAY",
  customInterval: number = 1
) {
  const start = parseDateValue(startsAt);
  const end = parseDateValue(endsAt);
  if (!start || !end || start > end) return [];

  const interval =
    frequency === "EVERY_TWO_DAYS" || frequency === "every-2-days"
      ? 2
      : frequency === "EVERY_THREE_DAYS" || frequency === "every-3-days"
      ? 3
      : frequency === "CUSTOM_INTERVAL" || frequency === "custom"
      ? Math.max(1, customInterval || 1)
      : 1;

  const result: string[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 3660) {
    result.push(toDateValue(cursor));
    cursor.setDate(cursor.getDate() + interval);
    guard += 1;
  }
  return result;
}
