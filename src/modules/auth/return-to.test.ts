import { describe, expect, it } from "vitest";

import {
  authContinuationUrl,
  authModalReturnTo,
  authSignInUrl,
  initialIntentDestination,
  sanitizeReturnTo,
} from "@/modules/auth/return-to";

describe("authentication return paths", () => {
  it("keeps local paths with query parameters", () => {
    expect(sanitizeReturnTo("/needs/abc?apply=1")).toBe(
      "/needs/abc?apply=1",
    );
  });

  it("rejects external, protocol-relative, backslash and loop targets", () => {
    expect(sanitizeReturnTo("https://evil.example/path")).toBe("/dashboard");
    expect(sanitizeReturnTo("//evil.example/path")).toBe("/dashboard");
    expect(sanitizeReturnTo("/\\evil.example/path")).toBe("/dashboard");
    expect(sanitizeReturnTo("/auth/continue")).toBe("/dashboard");
  });

  it("builds an encoded continuation URL", () => {
    expect(authContinuationUrl("/needs/abc?apply=1")).toBe(
      "/auth/continue?returnTo=%2Fneeds%2Fabc%3Fapply%3D1",
    );
  });

  it("preserves a safe dashboard subpath for sign-in", () => {
    expect(authSignInUrl("/dashboard/settings?tab=profile")).toBe(
      "/auth/sign-in?returnTo=%2Fdashboard%2Fsettings%3Ftab%3Dprofile",
    );
  });

  it("uses dashboard for home sign-in and the current path elsewhere", () => {
    expect(authModalReturnTo("/")).toBe("/dashboard");
    expect(authModalReturnTo("/home-v2?preview=1")).toBe("/dashboard");
    expect(authModalReturnTo("/needs/abc?from=list")).toBe(
      "/needs/abc?from=list",
    );
    expect(authModalReturnTo("/needs/abc", "/dashboard/settings")).toBe(
      "/dashboard/settings",
    );
  });

  it("routes first-time choices to the matching publishing flow", () => {
    expect(initialIntentDestination("POST_NEED", "/dashboard")).toBe(
      "/needs/create",
    );
    expect(initialIntentDestination("OFFER_SERVICE", "/dashboard")).toBe(
      "/dashboard/serviceprofile/services/new",
    );
    expect(initialIntentDestination("BROWSE", "/needs/abc?from=home")).toBe(
      "/needs/abc?from=home",
    );
    expect(initialIntentDestination("BROWSE", "/dashboard")).toBe("/dashboard");
  });

  it("preserves a signed pending action through first-time setup", () => {
    const pending = "/auth/pending-action?token=signed-token";
    expect(initialIntentDestination("POST_NEED", pending)).toBe(pending);
    expect(initialIntentDestination("OFFER_SERVICE", pending)).toBe(pending);
  });
});
