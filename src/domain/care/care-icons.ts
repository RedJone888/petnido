import type { IconType } from "react-icons";
import {
  PiBird,
  PiBowlFood,
  PiBroom,
  PiCat,
  PiCheckCircle,
  PiDog,
  PiDrop,
  PiFirstAidKit,
  PiGameController,
  PiHouseLine,
  PiPackage,
  PiPersonSimpleWalk,
  PiPill,
  PiRabbit,
  PiShieldCheck,
  PiSparkle,
  PiWarehouse,
} from "react-icons/pi";
import type { CareType } from "@/domain/publishing/legacy-need-draft-v3";

export const CARE_TYPES: readonly CareType[] = [
  "visit",
  "boarding",
  "custom",
] as const;

export const CARE_TYPE_ICONS: Record<CareType, IconType> = {
  visit: PiHouseLine,
  boarding: PiWarehouse,
  custom: PiSparkle,
};

export const PET_TYPE_KEYS = [
  "dog",
  "cat",
  "rabbit",
  "bird",
  "other",
] as const;

export type PetTypeKey = (typeof PET_TYPE_KEYS)[number];

export const PET_TYPE_ICONS: Record<PetTypeKey, IconType> = {
  dog: PiDog,
  cat: PiCat,
  rabbit: PiRabbit,
  bird: PiBird,
  other: PiSparkle,
};

export const TASK_ICONS: Record<string, IconType> = {
  feeding: PiBowlFood,
  water: PiDrop,
  cleaning: PiBroom,
  play: PiGameController,
  walk: PiPersonSimpleWalk,
  medication: PiPill,
  safety: PiShieldCheck,
  grooming: PiSparkle,
  nails: PiSparkle,
  updates: PiCheckCircle,
  transport: PiPersonSimpleWalk,
  vet: PiFirstAidKit,
  enclosure: PiHouseLine,
  pickup: PiPackage,
  supervision: PiHouseLine,
};

export const SUPPLY_CATEGORY_ICONS: Record<string, IconType> = {
  food: PiBowlFood,
  stay: PiHouseLine,
  travel: PiPackage,
};

export function getCareTypeIcon(careType?: CareType | null): IconType {
  return (careType && CARE_TYPE_ICONS[careType]) ?? PiSparkle;
}

export function getPetTypeIcon(petType?: string | null): IconType {
  const normalized = petType?.trim().toLowerCase() as PetTypeKey;
  return PET_TYPE_ICONS[normalized] ?? PiSparkle;
}

export function getTaskIcon(taskId?: string | null): IconType {
  if (!taskId) return PiSparkle;
  const baseId = taskId.replace(/^(boarding-|custom-)/, "");
  return TASK_ICONS[baseId] ?? TASK_ICONS[taskId] ?? PiSparkle;
}
