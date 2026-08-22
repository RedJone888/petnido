import type { PrismaClient } from "@prisma/client";

type CleanupDatabase = Pick<PrismaClient, "attachment" | "publishDraftV2">;

type CleanupOptions = {
  now?: Date;
  retentionMs?: number;
  batchSize?: number;
};

function collectStrings(value: unknown, output: Set<string>) {
  if (typeof value === "string") {
    output.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, output));
  }
}

function activeDraftReferences(drafts: Array<{ payloadJson: string }>) {
  const references = new Set<string>();
  for (const draft of drafts) {
    try {
      collectStrings(JSON.parse(draft.payloadJson) as unknown, references);
    } catch {
      // A damaged draft is handled by the draft recovery flow. Do not guess
      // attachment references from invalid JSON.
    }
  }
  return references;
}

/**
 * Marks expired, unlinked TEMP records as deleted. Storage-object deletion can
 * run later from status=2; this command deliberately avoids hard deletion.
 */
export async function cleanupTemporaryAttachments(
  prisma: CleanupDatabase,
  options: CleanupOptions = {},
) {
  const now = options.now ?? new Date();
  const retentionMs = options.retentionMs ?? 24 * 60 * 60 * 1000;
  const batchSize = options.batchSize ?? 200;
  const cutoff = new Date(now.getTime() - retentionMs);

  const [candidates, activeDrafts] = await Promise.all([
    prisma.attachment.findMany({
      where: {
        status: 0,
        createdAt: { lt: cutoff },
        serviceId: null,
        needId: null,
        petId: null,
        needPetId: null,
        avatarFor: { is: null },
        needV2Links: { none: {} },
        serviceV2Links: { none: {} },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: batchSize,
      select: { id: true },
    }),
    prisma.publishDraftV2.findMany({
      where: { status: "ACTIVE" },
      select: { payloadJson: true },
    }),
  ]);

  const protectedIds = activeDraftReferences(activeDrafts);
  const reclaimableIds = candidates
    .map((item) => item.id)
    .filter((id) => !protectedIds.has(id));
  if (!reclaimableIds.length) {
    return {
      scanned: candidates.length,
      protected: candidates.length,
      markedDeleted: 0,
      cutoff,
    };
  }

  const result = await prisma.attachment.updateMany({
    where: { id: { in: reclaimableIds }, status: 0 },
    data: { status: 2 },
  });
  return {
    scanned: candidates.length,
    protected: candidates.length - reclaimableIds.length,
    markedDeleted: result.count,
    cutoff,
  };
}
