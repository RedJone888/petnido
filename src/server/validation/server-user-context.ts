import { cookies } from "next/headers";

import { auth } from "@/modules/auth";
import prisma from "@/lib/prisma";
import { getValidationPrisma } from "@/lib/validation-prisma";
import {
  validationProfileCookie,
  validationProfileEnabled,
  validationProfileUserId,
} from "@/server/validation/profile-session";

/**
 * Server-component equivalent of the tRPC validation session. The validation
 * branch is unavailable in production and keeps browser tests on the isolated
 * SQLite schema instead of the configured application database.
 */
export async function getServerUserContext() {
  const validationToken = (await cookies()).get(validationProfileCookie)?.value;
  if (
    validationProfileEnabled() &&
    validationToken === process.env.VALIDATION_TEST_TOKEN
  ) {
    return {
      userId: validationProfileUserId,
      prisma: getValidationPrisma() as unknown as typeof prisma,
      isValidationSession: true,
    };
  }

  const session = await auth();
  return { userId: session?.user?.id ?? null, prisma, isValidationSession: false };
}
