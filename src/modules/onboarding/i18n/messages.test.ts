import { describe, expect, it } from "vitest";

import { onboardingMessages } from "./messages";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      leafKeys(item, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

describe("onboarding module translations", () => {
  it("keeps English, Chinese, and Japanese keys in parity", () => {
    const englishKeys = leafKeys(onboardingMessages.en).sort();
    expect(leafKeys(onboardingMessages.zh).sort()).toEqual(englishKeys);
    expect(leafKeys(onboardingMessages.ja).sort()).toEqual(englishKeys);
  });
});
