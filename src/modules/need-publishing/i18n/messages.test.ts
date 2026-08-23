import { describe, expect, it } from "vitest";

import { needPublishingMessages } from "./messages";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      leafKeys(item, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [prefix];
}

describe("need publishing module translations", () => {
  it("keeps English, Chinese, and Japanese keys in parity", () => {
    const englishKeys = leafKeys(needPublishingMessages.en).sort();

    expect(leafKeys(needPublishingMessages.zh).sort()).toEqual(englishKeys);
    expect(leafKeys(needPublishingMessages.ja).sort()).toEqual(englishKeys);
  });
});
