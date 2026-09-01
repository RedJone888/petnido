import type { Lang } from "@/domain/lang/types";
import { messages } from "@/i18n/messages";
import { getNeedDisplayMessages } from "@/modules/need-display/i18n/messages";

export type PetAgeParts = {
  value: number;
  unit: "day" | "month" | "year";
};

/**
 * Calculates standardized structured age parts (value and unit) based on UTC birthdate.
 */
export function calculatePetAgeParts(
  birthDate: Date | string | null | undefined,
  now: Date = new Date(),
): PetAgeParts | null {
  if (!birthDate) return null;
  const born = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(born.getTime())) return null;

  const bornYear = born.getUTCFullYear();
  const bornMonth = born.getUTCMonth();
  const bornDay = born.getUTCDate();

  const days = Math.max(
    0,
    Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(bornYear, bornMonth, bornDay)) /
        86_400_000,
    ),
  );

  let months = (now.getFullYear() - bornYear) * 12 + now.getMonth() - bornMonth;
  if (now.getDate() < bornDay) months -= 1;

  if (months < 1) return { value: days, unit: "day" };
  if (months < 12) return { value: months, unit: "month" };

  let years = now.getFullYear() - bornYear;
  if (
    now.getMonth() < bornMonth ||
    (now.getMonth() === bornMonth && now.getDate() < bornDay)
  ) {
    years -= 1;
  }
  return { value: Math.max(1, years), unit: "year" };
}

/**
 * Formats pet age string according to i18n rules (e.g. "2岁", "2 months", "15 days").
 */
export function formatPetAge(
  birthDate: Date | string | null | undefined,
  langOrT: Lang | (typeof messages)[Lang] = "en",
  now: Date = new Date(),
): string | null {
  const parts = calculatePetAgeParts(birthDate, now);
  if (!parts) return null;

  const t = typeof langOrT === "string" ? messages[langOrT] ?? messages.en : langOrT;
  const copy = t.settings.pets;

  let template = "";
  if (parts.unit === "day") {
    template = parts.value === 1 ? copy.ageDay : copy.ageDays;
  } else if (parts.unit === "month") {
    template = parts.value === 1 ? copy.ageMonth : copy.ageMonths;
  } else {
    template = parts.value === 1 ? copy.ageYear : copy.ageSummary;
  }

  return template
    .replace("{count}", String(parts.value))
    .replace("{age}", String(parts.value));
}

export type PetGenderInfo = {
  label: string;
  genderKind: "MALE" | "FEMALE" | "OTHER";
  sexLabel: string;
  neuteredLabel: string;
};

/**
 * Formats pet sex and neutered status into unified badges with localized labels.
 */
export function formatPetGenderAndNeuter(
  sex: string | null | undefined,
  neutered: string | null | undefined,
  lang: Lang = "en",
): PetGenderInfo | null {
  const normSex = (sex || "").trim().toUpperCase();
  const normNeutered = (neutered || "").trim().toUpperCase();

  if (!normSex && !normNeutered) return null;

  const copy = getNeedDisplayMessages(lang);

  let genderKind: "MALE" | "FEMALE" | "OTHER" = "OTHER";
  if (normSex === "MALE") genderKind = "MALE";
  else if (normSex === "FEMALE") genderKind = "FEMALE";

  let sexLabel = "";
  if (genderKind === "MALE") {
    sexLabel = copy.genderMale;
  } else if (genderKind === "FEMALE") {
    sexLabel = copy.genderFemale;
  }

  let neuteredLabel = "";
  if (normNeutered === "YES") {
    if (genderKind === "FEMALE") {
      neuteredLabel = copy.neuteredFemale;
    } else if (genderKind === "MALE") {
      neuteredLabel = copy.neuteredMale;
    } else {
      neuteredLabel = copy.neuteredGeneral;
    }
  } else if (normNeutered === "NO") {
    if (genderKind === "FEMALE") {
      neuteredLabel = copy.notNeuteredFemale;
    } else if (genderKind === "MALE") {
      neuteredLabel = copy.notNeuteredMale;
    } else {
      neuteredLabel = copy.notNeuteredGeneral;
    }
  }

  const parts = [sexLabel, neuteredLabel].filter(Boolean);
  if (parts.length === 0) return null;

  return {
    label: parts.join(" · "),
    genderKind,
    sexLabel,
    neuteredLabel,
  };
}

/**
 * Formats pet weight in grams or kilograms.
 */
export function formatPetWeight(
  weightGrams: number | null | undefined,
  lang: Lang = "en",
): string | null {
  if (!weightGrams || weightGrams <= 0) return null;
  if (weightGrams < 1000) {
    return `${weightGrams} g`;
  }
  const kg = weightGrams / 1000;
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(kg);
  return `${formatted} kg`;
}
