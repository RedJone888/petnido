import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

import {
  requireOwnedNeed,
  requireOwnedService,
  requireOwnedServiceProfile,
} from "./resource-ownership";

function ownershipDb(overrides: Record<string, unknown> = {}) {
  return {
    need: { findFirst: vi.fn() },
    service: { findFirst: vi.fn() },
    serviceProfile: { findUnique: vi.fn() },
    ...overrides,
  } as any;
}

describe("resource ownership guards", () => {
  it("scopes a need lookup to both id and owner", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "need-1",
      ownerId: "user-1",
      status: "OPEN",
      endDate: new Date("2026-08-10T00:00:00Z"),
    });
    const db = ownershipDb({ need: { findFirst } });

    await expect(requireOwnedNeed(db, "need-1", "user-1")).resolves.toMatchObject({
      id: "need-1",
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "need-1", ownerId: "user-1", archivedAt: null },
      }),
    );
  });

  it("does not reveal whether another user's need exists", async () => {
    const db = ownershipDb({ need: { findFirst: vi.fn().mockResolvedValue(null) } });

    await expect(requireOwnedNeed(db, "need-2", "user-1")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "RESOURCE_NOT_FOUND",
    } satisfies Partial<TRPCError>);
  });

  it("scopes a service lookup through its service profile owner", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "service-1",
      isActive: true,
      serviceProfileId: "profile-1",
    });
    const db = ownershipDb({ service: { findFirst } });

    await requireOwnedService(db, "service-1", "user-1");

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "service-1",
          archivedAt: null,
          serviceProfile: { userId: "user-1" },
        },
      }),
    );
  });

  it("requires the current user's service profile", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const db = ownershipDb({ serviceProfile: { findUnique } });

    await expect(requireOwnedServiceProfile(db, "user-1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });
});
