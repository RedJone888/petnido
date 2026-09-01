import { describe, expect, it, vi } from "vitest";

import { purgeDeletedAttachmentObjects } from "./deleted-attachment-purge";

function database(candidates: Array<{ id: string; fileKey: string }>) {
  return {
    attachment: {
      findMany: vi.fn().mockResolvedValue(candidates),
      deleteMany: vi.fn().mockImplementation(async ({ where }) => ({ count: where.id.in.length })),
    },
  };
}

describe("deleted attachment object purge", () => {
  it("physically deletes unlinked objects before removing their tombstones", async () => {
    const prisma = database([
      { id: "attachment-1", fileKey: "petnido/needs/photo-1" },
      { id: "attachment-2", fileKey: "petnido/services/photo-2" },
    ]);
    const deleteObject = vi.fn().mockResolvedValue(undefined);

    const result = await purgeDeletedAttachmentObjects(prisma as never, deleteObject);

    expect(deleteObject).toHaveBeenNthCalledWith(1, "petnido/needs/photo-1");
    expect(deleteObject).toHaveBeenNthCalledWith(2, "petnido/services/photo-2");
    expect(prisma.attachment.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: 2,
        id: { in: ["attachment-1", "attachment-2"] },
        needV2Links: { none: {} },
        serviceV2Links: { none: {} },
      }),
    });
    expect(result).toEqual({ scanned: 2, purged: 2, failed: 0 });
  });

  it("keeps failed tombstones for a later retry", async () => {
    const prisma = database([
      { id: "attachment-ok", fileKey: "ok" },
      { id: "attachment-retry", fileKey: "retry" },
    ]);
    const deleteObject = vi.fn().mockImplementation(async (fileKey: string) => {
      if (fileKey === "retry") throw new Error("provider unavailable");
    });

    const result = await purgeDeletedAttachmentObjects(prisma as never, deleteObject);

    expect(prisma.attachment.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: { in: ["attachment-ok"] } }),
    });
    expect(result).toEqual({ scanned: 2, purged: 1, failed: 1 });
  });

  it("does not touch the database when every object deletion fails", async () => {
    const prisma = database([{ id: "attachment-1", fileKey: "photo" }]);
    const result = await purgeDeletedAttachmentObjects(prisma as never, async () => {
      throw new Error("provider unavailable");
    });

    expect(prisma.attachment.deleteMany).not.toHaveBeenCalled();
    expect(result).toEqual({ scanned: 1, purged: 0, failed: 1 });
  });
});
