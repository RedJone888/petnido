import { describe, expect, it } from "vitest";

import { isAreaLevelLocationLabel } from "./public-region-label";

describe("isAreaLevelLocationLabel", () => {
  it("accepts Chinese administrative subdistrict labels", () => {
    expect(isAreaLevelLocationLabel("朝阳区三里屯街道")).toBe(true);
    expect(isAreaLevelLocationLabel("三里屯街道")).toBe(true);
  });

  it("accepts Japanese and English area-level labels", () => {
    expect(isAreaLevelLocationLabel("東京都目黒区")).toBe(true);
    expect(isAreaLevelLocationLabel("Shibuya Ward, Tokyo")).toBe(true);
  });

  it("rejects road names, coordinates, and empty labels", () => {
    expect(isAreaLevelLocationLabel("Hanshin Expressway Route 2")).toBe(false);
    expect(isAreaLevelLocationLabel("阪神高速2号淀川左岸線")).toBe(false);
    expect(isAreaLevelLocationLabel("39.935201, 116.449226")).toBe(false);
    expect(isAreaLevelLocationLabel(null)).toBe(false);
  });
});
