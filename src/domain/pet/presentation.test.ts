import { describe, expect, it } from "vitest";

import {
  calculatePetAgeParts,
  formatPetAge,
  formatPetGenderAndNeuter,
  formatPetWeight,
} from "./presentation";

describe("domain/pet/presentation formatters", () => {
  it("calculates pet age parts accurately", () => {
    const fixedNow = new Date("2026-08-27T00:00:00Z");
    const birthDate2Years = "2024-08-27T00:00:00Z";
    const parts2Years = calculatePetAgeParts(birthDate2Years, fixedNow);
    expect(parts2Years).toEqual({ value: 2, unit: "year" });

    const birthDate3Months = "2026-05-27T00:00:00Z";
    const parts3Months = calculatePetAgeParts(birthDate3Months, fixedNow);
    expect(parts3Months).toEqual({ value: 3, unit: "month" });

    const birthDate10Days = "2026-08-17T00:00:00Z";
    const parts10Days = calculatePetAgeParts(birthDate10Days, fixedNow);
    expect(parts10Days).toEqual({ value: 10, unit: "day" });
  });

  it("formats pet age in Chinese, Japanese and English", () => {
    const fixedNow = new Date("2026-08-27T00:00:00Z");
    const birthDate2Years = "2024-08-27T00:00:00Z";

    expect(formatPetAge(birthDate2Years, "zh", fixedNow)).toBe("2 岁");
    expect(formatPetAge(birthDate2Years, "ja", fixedNow)).toBe("2歳");
    expect(formatPetAge(birthDate2Years, "en", fixedNow)).toBe("2 years old");
  });

  it("formats pet gender and neuter combinations correctly across languages", () => {
    const maleNeuteredZh = formatPetGenderAndNeuter("male", "yes", "zh");
    expect(maleNeuteredZh).toEqual({
      label: "公 · 已绝育",
      genderKind: "MALE",
      sexLabel: "公",
      neuteredLabel: "已绝育",
    });

    const femaleNotNeuteredJa = formatPetGenderAndNeuter("FEMALE", "NO", "ja");
    expect(femaleNotNeuteredJa).toEqual({
      label: "メス · 未避妊",
      genderKind: "FEMALE",
      sexLabel: "メス",
      neuteredLabel: "未避妊",
    });

    const femaleNeuteredEn = formatPetGenderAndNeuter("female", "yes", "en");
    expect(femaleNeuteredEn).toEqual({
      label: "Female · Spayed",
      genderKind: "FEMALE",
      sexLabel: "Female",
      neuteredLabel: "Spayed",
    });
  });

  it("formats pet weight appropriately in grams or kilograms", () => {
    expect(formatPetWeight(500, "zh")).toBe("500 g");
    expect(formatPetWeight(4200, "zh")).toBe("4.2 kg");
    expect(formatPetWeight(12000, "en")).toBe("12 kg");
    expect(formatPetWeight(null, "zh")).toBeNull();
    expect(formatPetWeight(0, "zh")).toBeNull();
  });
});
