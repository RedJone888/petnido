import type { PrismaClient } from "@prisma/client";

import type { PublicDetailKind } from "@/domain/content/public-detail-metadata";
import prisma from "@/lib/prisma";

type Lookup = { kind: PublicDetailKind; publicId: string };

function splitPublicId(publicId: string) {
  const decoded = decodeURIComponent(publicId);
  const separator = decoded.indexOf(":");
  const source = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  return id && (source === "v2" || source === "legacy") ? { source, id } : null;
}

export async function findPublicDetailSubject(database: PrismaClient, lookup: Lookup, now = new Date()) {
  if (lookup.kind === "provider") {
    const hasLegacyModels = "service" in database;
    const profile = await database.serviceProfile.findFirst({
      where: {
        userId: lookup.publicId,
        isAccepting: true,
        OR: hasLegacyModels
          ? [
              { servicesV2: { some: { state: "ACTIVE", archivedAt: null } } },
              { services: { some: { isActive: true, archivedAt: null } } },
            ]
          : [{ servicesV2: { some: { state: "ACTIVE", archivedAt: null } } }],
      },
      select: { user: { select: { name: true } } },
    });
    if (profile?.user.name) return profile.user.name;
    const user = await database.user.findUnique({
      where: { id: lookup.publicId },
      select: { name: true },
    });
    return user?.name || null;
  }

  const parsed = splitPublicId(lookup.publicId);
  if (!parsed) return null;
  if (lookup.kind === "need") {
    if (parsed.source === "v2") {
      const record = await database.needV2.findFirst({
        where: { id: parsed.id, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
        select: { title: true },
      });
      return record?.title ?? null;
    }
    if (!("need" in database)) return null;
    const record = await database.need.findFirst({
      where: { id: parsed.id, status: "OPEN", archivedAt: null, endDate: { gt: now } },
      select: { title: true },
    });
    return record?.title ?? null;
  }

  if (parsed.source === "v2") {
    const record = await database.serviceV2.findFirst({
      where: { id: parsed.id, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
      select: { title: true },
    });
    return record?.title ?? null;
  }
  if (!("service" in database)) return null;
  const record = await database.service.findFirst({
    where: { id: parsed.id, isActive: true, archivedAt: null, serviceProfile: { isAccepting: true } },
    select: { customType: true, serviceType: true },
  });
  return record?.customType || record?.serviceType || null;
}

async function publicMetadataDatabase() {
  if (process.env.NODE_ENV !== "production" && process.env.VALIDATION_DATABASE_URL) {
    const { getValidationPrisma } = await import("@/lib/validation-prisma");
    return getValidationPrisma() as unknown as PrismaClient;
  }
  return prisma;
}

export async function resolvePublicDetailSubject(lookup: Lookup) {
  try {
    return await findPublicDetailSubject(await publicMetadataDatabase(), lookup);
  } catch {
    return null;
  }
}
