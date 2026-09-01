import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { findPublicDetailSubject } from "./public-detail-metadata";

function database(overrides: Record<string, unknown>) {
  return overrides as unknown as PrismaClient;
}

describe("public detail metadata lookup", () => {
  it("only returns an open, unexpired need title", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      mode: "HOME_VISIT",
      pets: [{ name: "Mochi", petType: "CAT", customPetType: null }],
    });
    const now = new Date("2026-08-09T00:00:00.000Z");
    const result = await findPublicDetailSubject(database({ needV2: { findFirst } }), { kind: "need", publicId: "v2:need-1" }, now);
    expect(result).toBe("Mochi · Home visit care");
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "need-1", state: "OPEN", archivedAt: null, endsAt: { gt: now } },
      select: {
        mode: true,
        pets: { select: { name: true, petType: true, customPetType: true } },
        tasks: { select: { category: true, label: true } },
      },
    });
  });

  it("requires an active service and accepting provider", async () => {
    const findFirst = vi.fn().mockResolvedValue({ title: "Small dog boarding" });
    const result = await findPublicDetailSubject(database({ serviceV2: { findFirst } }), { kind: "service", publicId: "v2:service-1" });
    expect(result).toBe("Small dog boarding");
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } }),
    }));
  });

  it("looks up a provider through active services", async () => {
    const findFirst = vi.fn().mockResolvedValue({ user: { name: "Mika" } });
    const result = await findPublicDetailSubject(database({ serviceProfile: { findFirst } }), { kind: "provider", publicId: "user-1" });
    expect(result).toBe("Mika");
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ servicesV2: { some: { state: "ACTIVE", archivedAt: null } } }),
    }));
  });
});
