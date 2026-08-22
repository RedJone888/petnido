import { describe, expect, it } from "vitest";

import { authMessages } from "./messages";
import { accountSecurityMessages } from "./account-security-messages";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      leafKeys(item, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [prefix];
}

describe("auth module translations", () => {
  it("keeps English, Chinese, and Japanese keys in parity", () => {
    const englishKeys = leafKeys(authMessages.en).sort();

    expect(leafKeys(authMessages.zh).sort()).toEqual(englishKeys);
    expect(leafKeys(authMessages.ja).sort()).toEqual(englishKeys);
  });

  it("keeps account-security copy in the auth module and in locale parity", () => {
    const englishKeys = leafKeys(accountSecurityMessages.en).sort();

    expect(leafKeys(accountSecurityMessages.zh).sort()).toEqual(englishKeys);
    expect(leafKeys(accountSecurityMessages.ja).sort()).toEqual(englishKeys);
  });
});
