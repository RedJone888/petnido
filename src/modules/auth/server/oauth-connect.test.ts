import { describe, expect, it } from "vitest";

import { AuthPolicyError } from "./errors";
import {
  evaluateGoogleConnectOwnership,
  evaluateLineConnectOwnership,
} from "./oauth-connect";

function errorCode(action: () => unknown) {
  try {
    action();
  } catch (error) {
    return error instanceof AuthPolicyError ? error.code : "UNKNOWN";
  }
  return null;
}

describe("Google connection ownership policy", () => {
  it("allows a different, unregistered Google email", () => {
    expect(
      evaluateGoogleConnectOwnership({
        targetUserId: "current-user",
        emailOwnerUserId: null,
      }),
    ).toBe("available");
  });

  it("allows the current PetNido email", () => {
    expect(
      evaluateGoogleConnectOwnership({
        targetUserId: "current-user",
        emailOwnerUserId: "current-user",
      }),
    ).toBe("available");
  });

  it("rejects a Google identity already linked to another user", () => {
    expect(
      errorCode(() =>
        evaluateGoogleConnectOwnership({
          targetUserId: "current-user",
          identityOwnerUserId: "other-user",
        }),
      ),
    ).toBe("GOOGLE_ACCOUNT_IN_USE");
  });

  it("rejects an email owned by another active user", () => {
    expect(
      errorCode(() =>
        evaluateGoogleConnectOwnership({
          targetUserId: "current-user",
          emailOwnerUserId: "other-user",
        }),
      ),
    ).toBe("GOOGLE_EMAIL_IN_USE");
  });

  it("does not reserve an email from a deleted user", () => {
    expect(
      evaluateGoogleConnectOwnership({
        targetUserId: "current-user",
        emailOwnerUserId: "deleted-user",
        emailOwnerDeleted: true,
      }),
    ).toBe("available");
  });
});

describe("LINE connection ownership policy", () => {
  it("allows an unused LINE identity", () => {
    expect(
      evaluateLineConnectOwnership({ targetUserId: "current-user" }),
    ).toBe("available");
  });

  it("treats the current user's LINE identity as already connected", () => {
    expect(
      evaluateLineConnectOwnership({
        targetUserId: "current-user",
        identityOwnerUserId: "current-user",
      }),
    ).toBe("already-linked");
  });

  it("rejects a LINE identity owned by another user", () => {
    expect(
      errorCode(() =>
        evaluateLineConnectOwnership({
          targetUserId: "current-user",
          identityOwnerUserId: "other-user",
        }),
      ),
    ).toBe("LINE_ACCOUNT_IN_USE");
  });
});
