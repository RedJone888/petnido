import { describe, expect, it, vi } from "vitest";

import { cleanupTemporaryAttachments } from "./temporary-attachment-cleanup";

function database(
  candidateIds: string[],
  payloads: string[] = [],
) {
  return {
    attachment: {
      findMany: vi.fn().mockResolvedValue(candidateIds.map((id) => ({ id }))),
      updateMany: vi.fn().mockImplementation(async ({ where }) => ({
        count: where.id.in.length,
      })),
    },
    publishDraftV2: {
      findMany: vi.fn().mockResolvedValue(
        payloads.map((payloadJson) => ({ payloadJson })),
      ),
    },
  };
}

describe("temporary attachment cleanup", () => {
  it("marks only expired unlinked TEMP candidates and keeps active draft references", async () => {
    const prisma = database(
      ["unused-attachment", "draft-attachment"],
      [JSON.stringify({ attachmentIds: ["draft-attachment"] })],
    );
    const result = await cleanupTemporaryAttachments(prisma as never, {
      now: new Date("2026-08-09T12:00:00.000Z"),
      retentionMs: 60_000,
    });

    expect(prisma.attachment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 0,
          createdAt: { lt: new Date("2026-08-09T11:59:00.000Z") },
          needV2Links: { none: {} },
          serviceV2Links: { none: {} },
        }),
      }),
    );
    expect(prisma.attachment.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["unused-attachment"] }, status: 0 },
      data: { status: 2 },
    });
    expect(result).toMatchObject({ scanned: 2, protected: 1, markedDeleted: 1 });
  });

  it("does not update when every candidate is referenced by an active draft", async () => {
    const prisma = database(["kept"], [JSON.stringify({ nested: { id: "kept" } })]);
    const result = await cleanupTemporaryAttachments(prisma as never);

    expect(prisma.attachment.updateMany).not.toHaveBeenCalled();
    expect(result).toMatchObject({ scanned: 1, protected: 1, markedDeleted: 0 });
  });
});
