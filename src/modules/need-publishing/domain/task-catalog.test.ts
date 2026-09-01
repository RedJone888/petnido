import { describe, expect, it } from "vitest";
import {
  localizeTaskLabel,
  normalizeTaskIdentity,
  resolveStandardTaskCode,
  taskPersistenceLabel,
} from "./task-catalog";

describe("need-publishing task catalog", () => {
  it("maps current English, Chinese and Japanese labels to one code", () => {
    expect(resolveStandardTaskCode({ category: "FEEDING", label: "Feeding" })).toBe(
      "feeding",
    );
    expect(resolveStandardTaskCode({ category: "WATER", label: "更换饮水" })).toBe(
      "water",
    );
    expect(
      resolveStandardTaskCode({
        category: "BOARDING-GROOMING",
        label: "グルーミング・入浴",
      }),
    ).toBe("boarding-grooming");
  });

  it("persists a standard code while preserving custom text", () => {
    expect(
      taskPersistenceLabel({
        code: "feeding",
        label: "喂食",
        custom: false,
      }),
    ).toBe("feeding");
    expect(
      taskPersistenceLabel({
        code: "custom-123",
        label: "  Wash  the  carrier ",
        custom: true,
      }),
    ).toBe("Wash the carrier");
  });

  it("localizes a canonical code at read time and does not rewrite custom text", () => {
    expect(localizeTaskLabel("feeding", "en")).toBe("Feeding");
    expect(localizeTaskLabel("feeding", "zh")).toBe("喂食");
    expect(localizeTaskLabel("feeding", "ja")).toBe("給餌");
    expect(
      localizeTaskLabel("Feeding", "zh", { category: "CUSTOM", custom: true }),
    ).toBe("Feeding");
  });

  it("normalizes historical standard rows without classifying custom rows", () => {
    expect(
      normalizeTaskIdentity({ category: "WATER", label: "水の交換" }),
    ).toEqual({ custom: false, code: "water", label: "water" });
    expect(
      normalizeTaskIdentity({ category: "CUSTOM", label: "喂食", custom: true }),
    ).toEqual({ custom: true, code: null, label: "喂食" });
  });
});
