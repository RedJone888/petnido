import type { Lang } from "@/domain/lang/types";

export const petTypeCodes = [
  "DOG",
  "CAT",
  "RABBIT",
  "BIRD",
  "HAMSTER",
  "GUINEA_PIG",
  "CHINCHILLA",
  "TURTLE",
  "FERRET",
  "OTHER",
] as const;

export type PetTypeCode = (typeof petTypeCodes)[number];

export const primaryPetTypeCodes = ["DOG", "CAT", "RABBIT", "BIRD"] as const;
export const suggestedPetTypeCodes = [
  "HAMSTER",
  "GUINEA_PIG",
  "CHINCHILLA",
  "TURTLE",
  "FERRET",
] as const;

const labels = {
  en: {
    DOG: "Dog",
    CAT: "Cat",
    RABBIT: "Rabbit",
    BIRD: "Bird",
    HAMSTER: "Hamster",
    GUINEA_PIG: "Guinea pig",
    CHINCHILLA: "Chinchilla",
    TURTLE: "Turtle",
    FERRET: "Ferret",
    OTHER: "Other",
  },
  zh: {
    DOG: "狗",
    CAT: "猫",
    RABBIT: "兔子",
    BIRD: "鸟",
    HAMSTER: "仓鼠",
    GUINEA_PIG: "荷兰猪",
    CHINCHILLA: "龙猫",
    TURTLE: "乌龟",
    FERRET: "雪貂",
    OTHER: "其他",
  },
  ja: {
    DOG: "犬",
    CAT: "猫",
    RABBIT: "うさぎ",
    BIRD: "鳥",
    HAMSTER: "ハムスター",
    GUINEA_PIG: "モルモット",
    CHINCHILLA: "チンチラ",
    TURTLE: "カメ",
    FERRET: "フェレット",
    OTHER: "その他",
  },
} satisfies Record<Lang, Record<PetTypeCode, string>>;

function normalizedAlias(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replaceAll("-", "_");
}

const aliasEntries: Array<[string, PetTypeCode]> = [
  ...petTypeCodes.map((code) => [code, code] as [string, PetTypeCode]),
  ["guinea-pig", "GUINEA_PIG"],
  ["guinea pig", "GUINEA_PIG"],
  ["豚鼠", "GUINEA_PIG"],
  ["荷兰猪", "GUINEA_PIG"],
  ["龟", "TURTLE"],
  ...Object.values(labels).flatMap((localized) =>
    petTypeCodes.map(
      (code) => [localized[code], code] as [string, PetTypeCode],
    ),
  ),
];

const aliases = new Map(
  aliasEntries.map(([alias, code]) => [normalizedAlias(alias), code]),
);

export function isPetTypeCode(value: string): value is PetTypeCode {
  return (petTypeCodes as readonly string[]).includes(value);
}

export function resolvePetTypeCode(value: string): PetTypeCode | null {
  const normalized = normalizedAlias(value);
  return normalized ? aliases.get(normalized) ?? null : null;
}

export function petTypeLabel(code: PetTypeCode, lang: Lang) {
  return labels[lang][code];
}

export function petTypeSuggestionOptions(lang: Lang) {
  return suggestedPetTypeCodes.map((code) => ({
    code,
    key: code.toLowerCase().replaceAll("_", "-"),
    label: labels[lang][code],
  }));
}

export type NormalizedPetType = {
  petType: PetTypeCode;
  customPetType: string | null;
};

export function normalizePetTypeSelection(
  value: string,
  customValue?: string | null,
): NormalizedPetType {
  const direct = resolvePetTypeCode(value);
  if (direct && direct !== "OTHER") {
    return { petType: direct, customPetType: null };
  }

  const custom = (customValue ?? (direct === "OTHER" ? "" : value)).trim();
  const recognizedCustom = resolvePetTypeCode(custom);
  if (recognizedCustom && recognizedCustom !== "OTHER") {
    return { petType: recognizedCustom, customPetType: null };
  }

  return { petType: "OTHER", customPetType: custom || null };
}
