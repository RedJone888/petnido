import { describe, expect, it } from "vitest";

import { localizedPageMetadata, supportedLanguages } from "./localized-page-metadata";
import { messages } from "@/i18n/messages";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafKeys(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      leafKeys(item, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

describe("three-language content contract", () => {
  it("keeps every translation leaf in parity", () => {
    const reference = leafKeys(messages.en).sort();
    for (const language of supportedLanguages) {
      expect(leafKeys(messages[language]).sort()).toEqual(reference);
    }
  });

  it("provides localized user labels for every public taxonomy value", () => {
    const modeCodes = ["HOME_VISIT", "BOARDING", "CUSTOM"] as const;
    const petCodes = ["DOG", "CAT", "RABBIT", "BIRD", "CHINCHILLA", "GUINEA_PIG", "HAMSTER", "TURTLE", "FERRET", "OTHER"] as const;
    const taskCodes = ["FEEDING", "WATER", "WALK", "CLEANING", "MEDICATION", "TRANSPORT", "OTHER"] as const;

    for (const language of supportedLanguages) {
      for (const code of modeCodes) expect(messages[language].core.modes[code]).not.toBe(code);
      for (const code of petCodes) expect(messages[language].core.pets[code]).not.toBe(code);
      for (const code of taskCodes) expect(messages[language].core.tasks[code]).not.toBe(code);
    }
  });

  it("publishes canonical and alternate metadata for each marketplace", () => {
    for (const page of ["needs", "services", "providers"] as const) {
      for (const language of supportedLanguages) {
        const metadata = localizedPageMetadata(page, language, `/${page}`);
        expect(metadata.title).toContain("PetNido");
        expect(metadata.alternates.canonical).toBe(`/${language}/${page}`);
        expect(metadata.alternates.languages).toEqual({
          en: `/en/${page}`,
          zh: `/zh/${page}`,
          ja: `/ja/${page}`,
        });
      }
    }
  });
});
