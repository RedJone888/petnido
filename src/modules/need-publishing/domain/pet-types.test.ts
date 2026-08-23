import { describe, expect, it } from "vitest";

import {
  normalizePetTypeSelection,
  petTypeLabel,
  resolvePetTypeCode,
} from "./pet-types";

describe("need publishing pet type catalog", () => {
  it.each([
    ["Hamster", "HAMSTER"],
    ["仓鼠", "HAMSTER"],
    ["ハムスター", "HAMSTER"],
    ["荷兰猪", "GUINEA_PIG"],
    ["モルモット", "GUINEA_PIG"],
    ["雪貂", "FERRET"],
    ["フェレット", "FERRET"],
  ])("resolves %s to %s", (input, code) => {
    expect(resolvePetTypeCode(input)).toBe(code);
  });

  it("promotes recognized Other suggestions to first-class codes", () => {
    expect(normalizePetTypeSelection("OTHER", "ハムスター")).toEqual({
      petType: "HAMSTER",
      customPetType: null,
    });
  });

  it("preserves unknown user-entered types as custom text", () => {
    expect(normalizePetTypeSelection("OTHER", "Axolotl")).toEqual({
      petType: "OTHER",
      customPetType: "Axolotl",
    });
  });

  it("localizes a stable code without changing it", () => {
    expect(petTypeLabel("FERRET", "zh")).toBe("雪貂");
    expect(petTypeLabel("FERRET", "ja")).toBe("フェレット");
  });
});
