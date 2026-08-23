import { describe, expect, it } from "vitest";

import { buildNeedDisplayTitle } from "./display-title";

describe("buildNeedDisplayTitle", () => {
  it("derives a localized title from mode and pet snapshots", () => {
    const need = {
      mode: "HOME_VISIT",
      pets: [{ name: "Mochi", petType: "CAT", customPetType: null }],
    };

    expect(buildNeedDisplayTitle({ ...need, lang: "en" })).toBe(
      "Mochi · Home visit care",
    );
    expect(buildNeedDisplayTitle({ ...need, lang: "zh" })).toBe(
      "Mochi · 上门照护",
    );
    expect(buildNeedDisplayTitle({ ...need, lang: "ja" })).toBe(
      "Mochi · 訪問ケア",
    );
  });

  it("uses canonical pet labels and preserves custom pet text", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "BOARDING",
        lang: "zh",
        pets: [
          { name: null, petType: "HAMSTER", customPetType: null },
          { name: "", petType: "OTHER", customPetType: "Sugar glider" },
        ],
      }),
    ).toBe("仓鼠, Sugar glider · 宠物寄养");
  });

  it("falls back to the mode label when a snapshot has no pets", () => {
    expect(buildNeedDisplayTitle({ mode: "CUSTOM", pets: [], lang: "ja" })).toBe(
      "カスタムケア",
    );
  });
});
