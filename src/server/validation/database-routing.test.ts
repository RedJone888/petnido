import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  primary: { serviceV2: { findFirst: vi.fn() } },
  validation: { serviceV2: { findFirst: vi.fn() } },
  getValidationPrisma: vi.fn(),
}));

vi.mock("@/modules/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ default: mocks.primary }));
vi.mock("@/lib/validation-prisma", () => ({ getValidationPrisma: mocks.getValidationPrisma }));

import { resolvePublicDetailSubject } from "@/server/domains/marketplace/public-detail-metadata";
import { createContext } from "@/server/trpc/context";
import { validationProfileCookie, validationProfileUserId } from "./profile-session";

const realSession = { user: { id: "real-user" }, expires: "2027-01-01T00:00:00.000Z" };
const lookup = { kind: "service" as const, publicId: "v2:service-1" };

function options(token?: string): FetchCreateContextFnOptions {
  return {
    req: new Request("http://localhost:3000/api/trpc", {
      headers: token ? { cookie: `${validationProfileCookie}=${token}` } : {},
    }),
    resHeaders: new Headers(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("FEATURE_VERTICAL_SLICE", "false");
  vi.stubEnv("FEATURE_PROFILE_E2E", undefined);
  vi.stubEnv("VALIDATION_DATABASE_URL", "file:./validation.local.db");
  vi.stubEnv("VALIDATION_TEST_TOKEN", "test-token");
  mocks.auth.mockResolvedValue(realSession);
  mocks.primary.serviceV2.findFirst.mockResolvedValue({ title: "Primary service" });
  mocks.validation.serviceV2.findFirst.mockResolvedValue({ title: "Validation service" });
  mocks.getValidationPrisma.mockReturnValue(mocks.validation);
});

afterEach(() => vi.unstubAllEnvs());

describe("application database selection", () => {
  it.each([
    { name: "the original example environment with a validation URL", overrides: {} },
    { name: "an explicitly disabled profile fixture", overrides: { FEATURE_PROFILE_E2E: "false" } },
    { name: "the standalone vertical slice", overrides: { FEATURE_VERTICAL_SLICE: "true" } },
    { name: "a missing validation URL", overrides: { FEATURE_PROFILE_E2E: "true", VALIDATION_DATABASE_URL: "" } },
    { name: "a missing test token", overrides: { FEATURE_PROFILE_E2E: "true", VALIDATION_TEST_TOKEN: "" } },
    { name: "production even with all validation flags set", overrides: { NODE_ENV: "production", FEATURE_PROFILE_E2E: "true", FEATURE_VERTICAL_SLICE: "true" } },
  ])("preserves normal authentication and metadata for $name", async ({ overrides }) => {
    for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);

    const context = await createContext(options("test-token"));
    expect(context.prisma).toBe(mocks.primary);
    expect(context.session).toBe(realSession);
    expect(context.validationFailure).toBeNull();
    expect(mocks.auth).toHaveBeenCalledOnce();
    expect(await resolvePublicDetailSubject(lookup)).toBe("Primary service");
    expect(mocks.getValidationPrisma).not.toHaveBeenCalled();
  });

  it.each([undefined, "wrong-token", "test-token"])(
    "keeps E2E data isolated and authenticates only the valid fixture token (%s)",
    async (token) => {
      vi.stubEnv("FEATURE_PROFILE_E2E", "true");
      const context = await createContext(options(token));
      expect(context.prisma).toBe(mocks.validation);
      if (token === "test-token") {
        expect(context.session?.user.id).toBe(validationProfileUserId);
      } else {
        expect(context.session).toBeNull();
      }
      expect(mocks.auth).not.toHaveBeenCalled();
      expect(await resolvePublicDetailSubject(lookup)).toBe("Validation service");
      expect(mocks.primary.serviceV2.findFirst).not.toHaveBeenCalled();
    },
  );

  it("uses validation data for anonymous server callers during E2E", async () => {
    vi.stubEnv("FEATURE_PROFILE_E2E", "true");
    const context = await createContext();
    expect(context.prisma).toBe(mocks.validation);
    expect(context.session).toBeNull();
    expect(mocks.auth).not.toHaveBeenCalled();
  });
});
