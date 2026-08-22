import { describe, expect, it } from "vitest";

import { publicDetailMetadata } from "./public-detail-metadata";

describe("public detail metadata", () => {
  it.each([
    ["en", "Pet care request"],
    ["zh", "宠物照护需求"],
    ["ja", "ペットケア依頼"],
  ] as const)("uses the public need title in %s metadata", (lang, suffix) => {
    const metadata = publicDetailMetadata("need", lang, "/needs/v2%3Aneed-1", "  Cat   care  ");
    expect(metadata.title).toBe(`Cat care — ${suffix} | PetNido`);
    expect(metadata.description).toContain("Cat care");
    expect(metadata.alternates.canonical).toBe(`/${lang}/needs/v2%3Aneed-1`);
    expect(metadata.alternates.languages).toEqual({
      en: "/en/needs/v2%3Aneed-1",
      zh: "/zh/needs/v2%3Aneed-1",
      ja: "/ja/needs/v2%3Aneed-1",
    });
  });

  it("uses provider nickname without exposing profile free text", () => {
    const metadata = publicDetailMetadata("provider", "zh", "/providers/user-1", "Mika");
    expect(metadata.title).toContain("Mika");
    expect(metadata.description).toBe("在 PetNido 查看 Mika 当前提供的宠物照护服务。");
  });

  it("falls back to collection metadata when the record is not publicly visible", () => {
    const metadata = publicDetailMetadata("service", "ja", "/services/missing", null);
    expect(metadata.title).toBe("近くのペットケアサービス | PetNido");
    expect(metadata.alternates.canonical).toBe("/ja/services/missing");
  });
});
