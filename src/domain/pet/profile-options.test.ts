import { describe, expect, it } from "vitest";

import {
  getOtherPetTypeSuggestions,
  getPetBreedSuggestions,
  localizeOtherPetType,
  localizePetBreed,
  resolveOtherPetTypeKey,
} from "./profile-options";

describe("localized pet profile suggestions", () => {
  it("returns suggestions in the selected interface language", () => {
    expect(getOtherPetTypeSuggestions("zh")).toEqual([
      "仓鼠",
      "荷兰猪",
      "雪貂",
      "乌龟",
      "龙猫",
    ]);
    expect(getPetBreedSuggestions("ja", "dog")).toContain("柴犬");
    expect(getPetBreedSuggestions("en", "cat")).toContain("Ragdoll");
  });

  it("recognizes an existing custom type across language changes", () => {
    expect(getPetBreedSuggestions("zh", "other", "Hamster")).toContain(
      "叙利亚仓鼠",
    );
    expect(getPetBreedSuggestions("ja", "other", "仓鼠")).toContain(
      "ゴールデンハムスター",
    );
  });

  it("localizes built-in breeds while preserving custom values", () => {
    expect(localizePetBreed("Holland Lop", "zh", "RABBIT")).toBe(
      "荷兰垂耳兔",
    );
    expect(localizePetBreed("荷兰垂耳兔", "ja", "RABBIT")).toBe(
      "ホーランドロップ",
    );
    expect(localizePetBreed("My family breed", "zh", "RABBIT")).toBe(
      "My family breed",
    );
  });

  it("keeps canonical other-pet identity across languages", () => {
    expect(resolveOtherPetTypeKey("Guinea pig")).toBe("guinea-pig");
    expect(resolveOtherPetTypeKey("荷兰猪")).toBe("guinea-pig");
    expect(localizeOtherPetType("Guinea pig", "ja")).toBe("モルモット");
    expect(
      localizePetBreed("Abyssinian", "zh", "OTHER", "Guinea pig"),
    ).toBe("阿比西尼亚豚鼠");
  });
});
