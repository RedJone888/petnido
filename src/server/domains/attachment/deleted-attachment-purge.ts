import type { PrismaClient } from "@prisma/client";

type PurgeDatabase = Pick<PrismaClient, "attachment">;

type PurgeOptions = {
  batchSize?: number;
};

type DeleteObject = (fileKey: string) => Promise<void>;

const unlinkedDeletedWhere = {
  status: 2,
  serviceId: null,
  needId: null,
  petId: null,
  needPetId: null,
  avatarFor: { is: null },
  needV2Links: { none: {} },
  serviceV2Links: { none: {} },
} as const;

/**
 * Removes storage objects for already soft-deleted, unlinked attachments and
 * only then removes their database tombstones. A failed object deletion keeps
 * its tombstone so a later run can retry safely.
 */
export async function purgeDeletedAttachmentObjects(
  prisma: PurgeDatabase,
  deleteObject: DeleteObject,
  options: PurgeOptions = {},
) {
  const candidates = await prisma.attachment.findMany({
    where: unlinkedDeletedWhere,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: options.batchSize ?? 100,
    select: { id: true, fileKey: true },
  });

  const results = await Promise.allSettled(
    candidates.map(async (candidate) => {
      await deleteObject(candidate.fileKey);
      return candidate.id;
    }),
  );
  const deletedIds = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const failed = results.length - deletedIds.length;
  if (!deletedIds.length) return { scanned: candidates.length, purged: 0, failed };

  const deleted = await prisma.attachment.deleteMany({
    where: {
      ...unlinkedDeletedWhere,
      id: { in: deletedIds },
    },
  });
  return { scanned: candidates.length, purged: deleted.count, failed };
}
