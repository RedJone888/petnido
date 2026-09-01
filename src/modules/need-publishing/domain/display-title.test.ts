import { describe, expect, it } from "vitest";

import { buildNeedDisplayTitle, buildNeedTitleParts } from "./display-title";

describe("buildNeedDisplayTitle", () => {
  it("derives localized title from pet name and first task with dot separator", () => {
    const need = {
      mode: "HOME_VISIT",
      pets: [{ name: "Mochi", petType: "CAT", customPetType: null }],
      tasks: [{ label: "feeding", category: "feeding" }],
    };

    expect(buildNeedDisplayTitle({ ...need, lang: "en" })).toBe(
      "Mochi · Feeding",
    );
    expect(buildNeedDisplayTitle({ ...need, lang: "zh" })).toBe(
      "Mochi · 喂食",
    );
    expect(buildNeedDisplayTitle({ ...need, lang: "ja" })).toBe(
      "Mochi · 給餌",
    );

    const parts = buildNeedTitleParts({ ...need, lang: "zh" });
    expect(parts.petSummary).toBe("Mochi");
    expect(parts.taskSummary).toBe("喂食");
    expect(parts.title).toBe("Mochi · 喂食");
  });

  it("strictly honors visit 1 task order for home visits", () => {
    const need = {
      mode: "HOME_VISIT",
      lang: "zh" as const,
      pets: [{ name: "豆豆", petType: "DOG" }],
      tasks: [
        { label: "walk", category: "walk", orderByVisit: { 1: 2 } },
        { label: "feeding", category: "feeding", orderByVisit: { 1: 1 } },
      ],
    };

    expect(buildNeedDisplayTitle(need)).toBe("豆豆 · 喂食");
  });

  it("strictly honors task order field for boarding or custom needs", () => {
    const need = {
      mode: "BOARDING",
      lang: "zh" as const,
      pets: [{ name: "豆豆", petType: "DOG" }],
      tasks: [
        { label: "walk", category: "walk", order: 3 },
        { label: "feeding", category: "feeding", order: 1 },
      ],
    };

    expect(buildNeedDisplayTitle(need)).toBe("豆豆 · 喂食");
  });

  it("handles 2 named pets and standard task", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "HOME_VISIT",
        lang: "zh",
        pets: [
          { name: "豆豆", petType: "DOG" },
          { name: "咪咪", petType: "CAT" },
        ],
        tasks: [{ label: "walk", category: "walk" }],
      }),
    ).toBe("豆豆、咪咪 · 外出遛弯");
  });

  it("uses breed/custom pet type when name is empty", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "BOARDING",
        lang: "zh",
        pets: [
          { name: null, petType: "HAMSTER", customPetType: null },
          { name: "", petType: "OTHER", customPetType: "蜜袋鼯" },
        ],
      }),
    ).toBe("仓鼠、蜜袋鼯 · 宠物寄养");
  });

  it("summarizes 3 or more pets of same species", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "HOME_VISIT",
        lang: "zh",
        pets: [
          { name: "咪咪", petType: "CAT" },
          { name: "团团", petType: "CAT" },
          { name: "花花", petType: "CAT" },
        ],
        tasks: [{ label: "feeding", category: "feeding" }],
      }),
    ).toBe("3只猫 · 喂食");
  });

  it("summarizes 3 or more pets of mixed species", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "HOME_VISIT",
        lang: "zh",
        pets: [
          { name: "豆豆", petType: "DOG" },
          { name: "咪咪", petType: "CAT" },
          { name: "雪球", petType: "RABBIT" },
        ],
        tasks: [{ label: "feeding", category: "feeding" }],
      }),
    ).toBe("3只宠物 · 喂食");
  });

  it("supports user custom tasks", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "CUSTOM",
        lang: "zh",
        pets: [{ name: "豆豆", petType: "DOG" }],
        tasks: [{ label: "协助带去医院就诊", category: "CUSTOM", custom: true }],
      }),
    ).toBe("豆豆 · 协助带去医院就诊");
  });

  it("falls back to mode label when no tasks provided", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "CUSTOM",
        pets: [{ name: "Mochi", petType: "CAT" }],
        lang: "ja",
      }),
    ).toBe("Mochi · カスタムケア");
  });

  it("falls back when snapshot has no pets", () => {
    expect(
      buildNeedDisplayTitle({
        mode: "HOME_VISIT",
        pets: [],
        lang: "zh",
      }),
    ).toBe("宠物 · 上门照护");
  });
});
