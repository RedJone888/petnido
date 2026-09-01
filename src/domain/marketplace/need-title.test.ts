import { describe, expect, it } from "vitest";
import { buildPublicNeedTitle } from "./need-title";

describe("buildPublicNeedTitle", () => {
  it("uses the persisted region label without parsing the full location label", () => {
    const item = {
      mode: "HOME_VISIT",
      pets: [{ petType: "DOG" }],
      location: { regionLabel: "Kita Ward, Osaka" },
    };

    expect(buildPublicNeedTitle(item, "zh")).toBe("上门照护｜Kita Ward, Osaka｜1只狗");
    expect(buildPublicNeedTitle(item, "ja")).toBe("訪問ケア｜Kita Ward, Osaka｜犬1匹");
    expect(buildPublicNeedTitle(item, "en")).toBe("Home visits｜Kita Ward, Osaka｜1 Dog");
  });

  it("handles multi-pets and custom types cleanly", () => {
    const sameSpecies = {
      mode: "BOARDING",
      pets: [{ petType: "CAT" }, { petType: "CAT" }],
      location: { regionLabel: "東京都渋谷区" },
    };
    expect(buildPublicNeedTitle(sameSpecies, "zh")).toBe("家庭寄养｜東京都渋谷区｜2只猫");
    expect(buildPublicNeedTitle(sameSpecies, "ja")).toBe("家庭預かり｜東京都渋谷区｜猫2匹");
    expect(buildPublicNeedTitle(sameSpecies, "en")).toBe("Pet boarding｜東京都渋谷区｜2 Cats");

    const mixedSpecies = {
      mode: "BOARDING",
      pets: [{ petType: "CAT" }, { petType: "DOG" }],
      location: { regionLabel: "東京都渋谷区" },
    };
    expect(buildPublicNeedTitle(mixedSpecies, "zh")).toBe("家庭寄养｜東京都渋谷区｜2只宠物");
    expect(buildPublicNeedTitle(mixedSpecies, "ja")).toBe("家庭預かり｜東京都渋谷区｜2匹のペット");
    expect(buildPublicNeedTitle(mixedSpecies, "en")).toBe("Pet boarding｜東京都渋谷区｜2 pets");
  });
});
