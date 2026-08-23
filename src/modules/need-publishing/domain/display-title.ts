import type { Lang } from "@/domain/lang/types";
import {
  petTypeLabel,
  resolvePetTypeCode,
  type PetTypeCode,
} from "./pet-types";

export type NeedDisplayPet = {
  name?: string | null;
  petType: string;
  customPetType?: string | null;
  quantity?: number | null;
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

function petLabel(pet: NeedDisplayPet, lang: Lang) {
  const name = pet.name?.trim();
  if (name) return name;
  const code = resolvePetTypeCode(pet.petType) ?? "OTHER";
  if (code === "OTHER") return pet.customPetType?.trim() || petTypeLabel(code, lang);
  return petTypeLabel(code as PetTypeCode, lang);
}

/**
 * Need titles are a view concern. They are generated from canonical mode and
 * pet snapshot data so changing the UI language never mutates a published
 * record or leaves a stale concatenated title behind.
 */
export function buildNeedDisplayTitle({
  mode,
  pets,
  lang = "en",
}: {
  mode: string;
  pets?: NeedDisplayPet[];
  lang?: Lang;
}) {
  const normalizedMode = mode === "BOARDING" || mode === "CUSTOM" ? mode : "HOME_VISIT";
  const modeLabel = modeLabels[lang][normalizedMode];
  const safePets = pets ?? [];
  const labels = safePets.slice(0, 3).map((pet) => petLabel(pet, lang));
  const extra = Math.max(0, safePets.length - labels.length);
  const petSummary = labels.length
    ? `${labels.join(", ")}${extra ? ` +${extra}` : ""}`
    : null;
  return petSummary ? `${petSummary} · ${modeLabel}` : modeLabel;
}

export function buildNeedModeLabel(mode: string, lang: Lang = "en") {
  const normalizedMode = mode === "BOARDING" || mode === "CUSTOM" ? mode : "HOME_VISIT";
  return modeLabels[lang][normalizedMode];
}
