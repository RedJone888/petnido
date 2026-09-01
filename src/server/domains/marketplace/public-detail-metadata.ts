import type { PrismaClient } from "@prisma/client";

import type { PublicDetailKind } from "@/domain/content/public-detail-metadata";
import type { Lang } from "@/domain/lang/types";
import { buildNeedDisplayTitle } from "@/modules/need-publishing/domain/display-title";
import prisma from "@/lib/prisma";

type Lookup = { kind: PublicDetailKind; publicId: string };

function splitPublicId(publicId: string) {
  const decoded = decodeURIComponent(publicId);
  const separator = decoded.indexOf(":");
  const source = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  return id && source === "v2" ? { source, id } : null;
}

export async function findPublicDetailSubject(
  database: PrismaClient,
  lookup: Lookup,
  now = new Date(),
  lang: Lang = "en",
) {
  if (lookup.kind === "provider") {
    const profile = await database.serviceProfile.findFirst({
      where: {
        userId: lookup.publicId,
        isAccepting: true,
        servicesV2: { some: { state: "ACTIVE", archivedAt: null } },
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
    const record = await database.needV2.findFirst({
        where: { id: parsed.id, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
        select: {
          mode: true,
          pets: { select: { name: true, petType: true, customPetType: true } },
          tasks: { select: { category: true, label: true } },
        },
      });
    return record ? buildNeedDisplayTitle({ mode: record.mode, pets: record.pets, tasks: record.tasks, lang }) : null;
  }

  const record = await database.serviceV2.findFirst({
      where: { id: parsed.id, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
      select: { title: true },
    });
  return record?.title ?? null;
}

async function publicMetadataDatabase() {
  if (process.env.NODE_ENV !== "production" && process.env.VALIDATION_DATABASE_URL) {
    const { getValidationPrisma } = await import("@/lib/validation-prisma");
    return getValidationPrisma() as unknown as PrismaClient;
  }
  return prisma;
}

export async function resolvePublicDetailSubject(lookup: Lookup, lang: Lang = "en") {
  try {
    return await findPublicDetailSubject(await publicMetadataDatabase(), lookup, new Date(), lang);
  } catch {
    return null;
  }
}
