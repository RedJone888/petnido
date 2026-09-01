import { describe, expect, it } from "vitest";

import { careKnowledgeResources, filterCareKnowledge, knowledgePetTypes } from "./care-knowledge";

describe("care knowledge catalog", () => {
  it("uses explicit HTTPS sources and complete three-language summaries", () => {
    for (const resource of careKnowledgeResources) {
      expect(resource.sourceUrl.startsWith("https://")).toBe(true);
      expect(resource.sourceName.length).toBeGreaterThan(0);
      for (const lang of ["en", "zh", "ja"] as const) {
        expect(resource.title[lang].length).toBeGreaterThan(0);
        expect(resource.summary[lang].length).toBeGreaterThan(0);
      }
    }
  });

  it("covers each supported animal category and filters by animal and topic", () => {
    for (const petType of knowledgePetTypes.filter((value) => value !== "ALL")) {
      expect(filterCareKnowledge({ petType, topic: "ALL" }).length).toBeGreaterThan(0);
    }
    const rabbitEnvironment = filterCareKnowledge({ petType: "RABBIT", topic: "ENVIRONMENT" });
    expect(rabbitEnvironment.map((item) => item.id)).toContain("rspca-rabbit-home");
    expect(rabbitEnvironment.every((item) => item.petTypes.includes("RABBIT") || item.petTypes.includes("ALL"))).toBe(true);
  });

  it("includes general emergency preparation for every animal filter", () => {
    expect(filterCareKnowledge({ petType: "BIRD", topic: "EMERGENCY" }).map((item) => item.id)).toContain("avma-pet-first-aid");
  });
});
