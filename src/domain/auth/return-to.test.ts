import { describe, expect, it } from "vitest";

import {
  authContinuationUrl,
  authSignInUrl,
  sanitizeReturnTo,
} from "./return-to";

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
});
