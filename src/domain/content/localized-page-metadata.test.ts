import { describe, expect, it } from "vitest";

import { isSupportedLanguage, localizedPageMetadata, supportedLanguages } from "./localized-page-metadata";

describe("localized public page metadata", () => {
  it("builds titles, descriptions, canonicals and all language alternates", () => {
    for (const lang of supportedLanguages) {
      const metadata = localizedPageMetadata("knowledge", lang, "/knowledge");
      expect(metadata.title.length).toBeGreaterThan(0);
      expect(metadata.description.length).toBeGreaterThan(0);
      expect(metadata.alternates.canonical).toBe(`/${lang}/knowledge`);
      expect(Object.keys(metadata.alternates.languages).sort()).toEqual(["en", "ja", "zh"]);
    }
  });

  it("rejects unsupported route languages", () => {
    expect(isSupportedLanguage("ja")).toBe(true);
    expect(isSupportedLanguage("fr")).toBe(false);
  });
});
