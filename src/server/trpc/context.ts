//负责createContext(session+db)
import { auth } from "@/modules/auth";
import prisma from "@/lib/prisma";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { randomUUID } from "crypto";
import {
  hasValidProfileValidationToken,
  validationFailureCookie,
  validationProfileUserId,
} from "@/server/validation/profile-session";

function requestCookie(req: Request | undefined, name: string) {
  return req?.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getRequestIp(req?: Request): string {
  if (!req) return "unknown";
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export async function createContext(options?: FetchCreateContextFnOptions) {
  const validationSession = hasValidProfileValidationToken(options?.req);
  if (process.env.VALIDATION_DATABASE_URL) {
    const { getValidationPrisma } = await import("@/lib/validation-prisma");
    return {
      session: validationSession
        ? {
            user: {
              id: validationProfileUserId,
              email: "profile-e2e@petnido.invalid",
              name: "Profile E2E",
            },
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          }
        : null,
      prisma: getValidationPrisma() as unknown as typeof prisma,
      validationFailure: requestCookie(options?.req, validationFailureCookie) ?? null,
      requestIp: getRequestIp(options?.req),
      requestId: randomUUID(),
    };
  }
  const session = await auth();
  return {
    session,
    prisma,
    validationFailure: null,
    requestIp: getRequestIp(options?.req),
    requestId: randomUUID(),
  };
}
export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
