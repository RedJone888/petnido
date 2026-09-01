import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { deleteFromCloudinary } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { purgeDeletedAttachmentObjects } from "@/server/domains/attachment/deleted-attachment-purge";
import { cleanupTemporaryAttachments } from "@/server/domains/attachment/temporary-attachment-cleanup";

function authorized(request: Request) {
  const configured = process.env.INTERNAL_JOB_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !supplied) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
  if (!authorized(request)) return new NextResponse(null, { status: 404 });
  const cleanup = await cleanupTemporaryAttachments(prisma);
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
  const physicalPurge = cloudinaryConfigured
    ? { enabled: true, ...await purgeDeletedAttachmentObjects(prisma, deleteFromCloudinary) }
    : { enabled: false, scanned: 0, purged: 0, failed: 0 };
  return NextResponse.json({
    ...cleanup,
    cutoff: cleanup.cutoff.toISOString(),
    physicalPurge,
  });
}
