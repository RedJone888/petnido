import type { Lang } from "@/domain/lang/types";
import {
  petTypeLabel,
  resolvePetTypeCode,
  type PetTypeCode,
} from "./pet-types";
import { localizeTaskLabel } from "./task-catalog";

export type NeedDisplayPet = {
  name?: string | null;
  petType: string;
  customPetType?: string | null;
  quantity?: number | null;
};

export type NeedDisplayTask = {
  category?: string | null;
  label?: string | null;
  custom?: boolean;
  order?: number | null;
  orderByVisit?: Record<string | number, number> | null;
  visitOrders?: Array<{ visitNumber: number; order: number }> | null;
  visitNumbers?: number[] | null;
};

export type NeedTitleParts = {
  petSummary: string;
  taskSummary: string;
  title: string;
};

const modeLabels: Record<Lang, Record<"HOME_VISIT" | "BOARDING" | "CUSTOM", string>> = {
  en: {
    HOME_VISIT: "Home visit care",
    BOARDING: "Pet boarding",
    CUSTOM: "Custom pet care",
  },
  zh: {
    HOME_VISIT: "上门照护",
    BOARDING: "宠物寄养",
    CUSTOM: "自定义照护",
  },
  ja: {
    HOME_VISIT: "訪問ケア",
    BOARDING: "ペット預かり",
    CUSTOM: "カスタムケア",
  },
};

function petIndividualLabel(pet: NeedDisplayPet, lang: Lang): string {
  const name = pet.name?.trim();
  if (name) return name;
  const custom = pet.customPetType?.trim();
  if (custom) return custom;
  const code = resolvePetTypeCode(pet.petType) ?? "OTHER";
  if (code === "OTHER") return pet.customPetType?.trim() || petTypeLabel("OTHER", lang);
  return petTypeLabel(code as PetTypeCode, lang);
}

function buildPetSummary(pets: NeedDisplayPet[] = [], lang: Lang): string {
  if (!pets || pets.length === 0) {
    return lang === "zh" ? "宠物" : lang === "ja" ? "ペット" : "Pet";
  }

  const totalCount = pets.reduce((sum, p) => sum + Math.max(1, p.quantity || 1), 0);

  // 1. If 3 or more pets: use summary like "3只猫" / "3只宠物"
  if (totalCount >= 3) {
    const distinctTypes = Array.from(new Set(pets.map((p) => p.petType)));
    if (distinctTypes.length === 1 && pets[0]) {
      const typeCode = resolvePetTypeCode(pets[0].petType) ?? "OTHER";
      const typeName =
        typeCode === "OTHER"
          ? pets[0].customPetType?.trim() || petTypeLabel(typeCode, lang)
          : petTypeLabel(typeCode as PetTypeCode, lang);

      if (lang === "zh") return `${totalCount}只${typeName}`;
      if (lang === "ja") return `${typeName}${totalCount}匹`;
      return `${totalCount} ${typeName}${totalCount === 1 ? "" : "s"}`;
    }

    if (lang === "zh") return `${totalCount}只宠物`;
    if (lang === "ja") return `${totalCount}匹のペット`;
    return `${totalCount} pets`;
  }

  // 2. 1 ~ 2 pets:
  // If there is 1 unnamed entry with quantity 2:
  if (pets.length === 1 && !pets[0]?.name?.trim() && totalCount === 2) {
    const typeCode = resolvePetTypeCode(pets[0].petType) ?? "OTHER";
    const typeName =
      typeCode === "OTHER"
        ? pets[0].customPetType?.trim() || petTypeLabel(typeCode, lang)
        : petTypeLabel(typeCode as PetTypeCode, lang);

    if (lang === "zh") return `2只${typeName}`;
    if (lang === "ja") return `${typeName}2匹`;
    return `2 ${typeName}s`;
  }

  // Collect individual labels (up to 2 names/labels)
  const individualLabels: string[] = [];
  for (const pet of pets) {
    const label = petIndividualLabel(pet, lang);
    if (label && individualLabels.length < 2) {
      individualLabels.push(label);
    }
  }

  if (individualLabels.length === 0) {
    return lang === "zh" ? "宠物" : lang === "ja" ? "ペット" : "Pet";
  }

  if (individualLabels.length === 1) {
    return individualLabels[0];
  }

  const separator = lang === "zh" ? "、" : lang === "ja" ? "・" : ", ";
  return individualLabels.join(separator);
}

export function getFirstOrderedTask(
  tasks: NeedDisplayTask[] | undefined,
  mode: string,
): NeedDisplayTask | undefined {
  if (!tasks || tasks.length === 0) return undefined;

  const getVisit1Order = (task: NeedDisplayTask): number | undefined => {
    if (task.orderByVisit) {
      if (typeof task.orderByVisit["1"] === "number") return task.orderByVisit["1"];
      if (typeof task.orderByVisit[1] === "number") return task.orderByVisit[1];
      const entries = Object.entries(task.orderByVisit);
      if (entries.length > 0) {
        entries.sort(([vA], [vB]) => Number(vA) - Number(vB));
        return entries[0][1];
      }
    }
    if (task.visitOrders && task.visitOrders.length > 0) {
      const v1 = task.visitOrders.find((vo) => vo.visitNumber === 1);
      if (v1) return v1.order;
      const sorted = [...task.visitOrders].sort((a, b) => a.visitNumber - b.visitNumber);
      return sorted[0]?.order;
    }
    return undefined;
  };

  const tasksWithIndex = tasks.map((task, originalIndex) => ({
    task,
    originalIndex,
  }));

  if (mode === "HOME_VISIT") {
    tasksWithIndex.sort((a, b) => {
      const aV1 = getVisit1Order(a.task);
      const bV1 = getVisit1Order(b.task);

      if (aV1 !== undefined && bV1 !== undefined) {
        return aV1 - bV1;
      }
      if (aV1 !== undefined) return -1;
      if (bV1 !== undefined) return 1;

      const aOrder = a.task.order ?? a.originalIndex;
      const bOrder = b.task.order ?? b.originalIndex;
      return aOrder - bOrder;
    });
  } else {
    tasksWithIndex.sort((a, b) => {
      const aOrder = a.task.order ?? a.originalIndex;
      const bOrder = b.task.order ?? b.originalIndex;
      return aOrder - bOrder;
    });
  }

  return tasksWithIndex[0]?.task;
}

function buildTaskSummary(
  tasks: NeedDisplayTask[] | undefined,
  mode: string,
  lang: Lang,
): string {
  const firstTask = getFirstOrderedTask(tasks, mode);
  if (firstTask && firstTask.label) {
    const categoryUpper = (firstTask.category || "").toUpperCase();
    const isCustom = Boolean(
      firstTask.custom ||
      categoryUpper === "CUSTOM" ||
      categoryUpper.startsWith("CUSTOM-"),
    );
    const resolved = localizeTaskLabel(firstTask.label, lang, {
      category: firstTask.category,
      custom: isCustom,
    });
    if (resolved?.trim()) {
      return resolved.trim();
    }
  }

  const normalizedMode = mode === "BOARDING" || mode === "CUSTOM" ? mode : "HOME_VISIT";
  return modeLabels[lang][normalizedMode];
}

/**
 * Need titles are generated from canonical mode, pet snapshot, and task data.
 * Returns petSummary, taskSummary, and the combined title (petSummary · taskSummary).
 */
export function buildNeedTitleParts({
  mode,
  pets,
  tasks,
  lang = "en",
}: {
  mode: string;
  pets?: NeedDisplayPet[];
  tasks?: NeedDisplayTask[];
  lang?: Lang;
}): NeedTitleParts {
  const petSummary = buildPetSummary(pets, lang);
  const taskSummary = buildTaskSummary(tasks, mode, lang);
  const title = `${petSummary} · ${taskSummary}`;
  return { petSummary, taskSummary, title };
}

/**
 * Need display title string (petSummary · taskSummary).
 * Changing the UI language never mutates a published record.
 */
export function buildNeedDisplayTitle(args: {
  mode: string;
  pets?: NeedDisplayPet[];
  tasks?: NeedDisplayTask[];
  lang?: Lang;
}): string {
  return buildNeedTitleParts(args).title;
}

export function buildNeedModeLabel(mode: string, lang: Lang = "en") {
  const normalizedMode = mode === "BOARDING" || mode === "CUSTOM" ? mode : "HOME_VISIT";
  return modeLabels[lang][normalizedMode];
}
