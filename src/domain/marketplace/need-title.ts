import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";

export type NeedTitlePetInput = {
  petType: string;
  customPetType?: string | null;
};

export type NeedTitleInput = {
  mode: string;
  pets: NeedTitlePetInput[];
  location?: {
    regionLabel?: string | null;
  } | null;
};

export function localizedModeLabel(mode: string, lang: Lang): string {
  if (mode === "HOME_VISIT") {
    return lang === "zh" ? "上门照护" : lang === "ja" ? "訪問ケア" : "Home visits";
  }
  if (mode === "BOARDING") {
    return lang === "zh" ? "家庭寄养" : lang === "ja" ? "家庭預かり" : "Pet boarding";
  }
  return lang === "zh" ? "自定义照护" : lang === "ja" ? "カスタムケア" : "Custom care";
}

export function localizedPetType(
  pet: NeedTitlePetInput,
  lang: Lang,
): string {
  if (pet.customPetType?.trim()) return pet.customPetType.trim();
  const copy = messages[lang] ?? messages.en;
  return (
    copy.core.pets[pet.petType as keyof typeof copy.core.pets] ??
    copy.core.pets[pet.petType.toLowerCase() as keyof typeof copy.core.pets] ??
    pet.petType
  );
}

export function buildPublicNeedTitle(
  item: NeedTitleInput,
  lang: Lang,
): string {
  const count = item.pets.length;
  const types = new Set(item.pets.map((pet) => pet.petType));

  const petSummary =
    types.size === 1 && item.pets[0]
      ? lang === "zh"
        ? `${count}只${localizedPetType(item.pets[0], lang)}`
        : lang === "ja"
          ? `${localizedPetType(item.pets[0], lang)}${count}匹`
          : `${count} ${localizedPetType(item.pets[0], lang)}${count === 1 ? "" : "s"}`
      : lang === "zh"
        ? `${count}只宠物`
        : lang === "ja"
          ? `${count}匹のペット`
          : `${count} pets`;

  const area =
    item.location?.regionLabel?.trim() ||
    (lang === "zh"
      ? "所选地区"
      : lang === "ja"
        ? "選択エリア"
        : "Selected area");
  return `${localizedModeLabel(item.mode, lang)}｜${area}｜${petSummary}`;
}
