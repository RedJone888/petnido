//负责createContext(session+db)
import { auth } from "@/server/auth/auth";
import prisma from "@/lib/prisma";

export async function createContext() {
  const session = await auth();
  return { session, prisma };
}
export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
