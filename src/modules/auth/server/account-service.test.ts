import { describe, expect, it } from "vitest";

import {
  hasAlternativeSignInMethod,
  isRecentOtherOAuthAuthentication,
} from "./account-service";

describe("OAuth provider unlink policy", () => {
  it("allows unlinking when email-password login remains", () => {
    expect(
      hasAlternativeSignInMethod(
        { hasPasswordLogin: true, providers: ["google"] },
        "google",
      ),
    ).toBe(true);
  });

  it("allows unlinking when the other supported OAuth provider remains", () => {
    expect(
      hasAlternativeSignInMethod(
        { hasPasswordLogin: false, providers: ["google", "line"] },
        "line",
      ),
    ).toBe(true);
  });

  it("rejects removing the only usable sign-in method", () => {
    expect(
      hasAlternativeSignInMethod(
        { hasPasswordLogin: false, providers: ["line"] },
        "line",
      ),
    ).toBe(false);
  });

  it("does not count an unsupported stored provider as a usable method", () => {
    expect(
      hasAlternativeSignInMethod(
        { hasPasswordLogin: false, providers: ["google", "github"] },
        "google",
      ),
    ).toBe(false);
  });
});

describe("OAuth provider reauthentication policy", () => {
  const now = new Date("2026-08-21T12:00:00.000Z");

  it("accepts a recent authentication with the provider being kept", () => {
    expect(
      isRecentOtherOAuthAuthentication(
        {
          authenticatedAt: now.getTime() - 60_000,
          authenticatedProvider: "line",
        },
        "google",
        now,
      ),
    ).toBe(true);
  });

  it("rejects authentication with the provider being removed", () => {
    expect(
      isRecentOtherOAuthAuthentication(
        {
          authenticatedAt: now.getTime() - 60_000,
          authenticatedProvider: "google",
        },
        "google",
        now,
      ),
    ).toBe(false);
  });

  it("rejects an expired authentication", () => {
    expect(
      isRecentOtherOAuthAuthentication(
        {
          authenticatedAt: now.getTime() - 11 * 60_000,
          authenticatedProvider: "line",
        },
        "google",
        now,
      ),
    ).toBe(false);
  });
});
