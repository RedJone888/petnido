//负责createContext(session+db)
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { randomUUID } from "crypto";

function getRequestIp(req?: Request): string {
  if (!req) return "unknown";
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export async function createContext(options?: FetchCreateContextFnOptions) {
  const session = await auth();
  return {
    session,
    prisma,
    requestIp: getRequestIp(options?.req),
    requestId: randomUUID(),
  };
}
export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
