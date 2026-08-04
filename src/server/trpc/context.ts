//负责createContext(session+db)
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { randomUUID } from "crypto";
import {
  hasValidProfileValidationToken,
  validationProfileUserId,
} from "@/server/validation/profile-session";

function getRequestIp(req?: Request): string {
  if (!req) return "unknown";
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export async function createContext(options?: FetchCreateContextFnOptions) {
  if (hasValidProfileValidationToken(options?.req)) {
    const { getValidationPrisma } = await import("@/lib/validation-prisma");
    return {
      session: {
        user: {
          id: validationProfileUserId,
          email: "profile-e2e@petnido.invalid",
          name: "Profile E2E",
        },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      prisma: getValidationPrisma() as unknown as typeof prisma,
      requestIp: getRequestIp(options?.req),
      requestId: randomUUID(),
    };
  }
  const session = await auth();
  return {
    session,
    prisma,
    requestIp: getRequestIp(options?.req),
    requestId: randomUUID(),
  };
}
export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
