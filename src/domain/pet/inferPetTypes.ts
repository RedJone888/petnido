import { PetType } from "@prisma/client";
import { PET_META } from "./constant";

export function inferPetTypesFromPriceRules(
  priceRules: { groupLabel: string }[],
): PetType[] {
  const result = new Set<PetType>();
  for (const rule of priceRules) {
    const label = rule.groupLabel;
    for (const [petType, meta] of Object.entries(PET_META)) {
      const keywords = meta.label.ja.keywords;
      if (Array.isArray(keywords)) {
        for (const keyword of keywords) {
          if (label.includes(keyword)) {
            result.add(petType as PetType);
            break;
          }
        }
      }
    }
    if (label.includes("小動物") || label.includes("小型ペット")) {
      result.add(PetType.RABBIT);
      result.add(PetType.HAMSTER);
      result.add(PetType.GUINEA_PIG);
      result.add(PetType.BIRD);
    }
  }
  if (result.size === 0) {
    result.add(PetType.OTHER);
  }
  return Array.from(result);
}

export function infer4PetTypeFromText(text: string): PetType {
  if (!text) return PetType.OTHER;
  const priorityTypes: PetType[] = ["CAT", "DOG", "RABBIT"];
  for (const type of priorityTypes) {
    if (
      PET_META[type].label.ja.keywords.some((keyword) => text.includes(keyword))
    ) {
      return type;
    }
  }
  return PetType.OTHER;
}
export function inferAllPetTypeFromText(text: string | null): PetType {
  if (!text) return PetType.OTHER;
  for (const [petType, meta] of Object.entries(PET_META)) {
    const keywords = meta.label.ja.keywords;
    if (keywords.some((keyword) => text.includes(keyword))) {
      return petType as PetType;
    }
  }
  return PetType.OTHER;
}
