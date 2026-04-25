//负责createContext(session+db)
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function createContext() {
  const session = await auth();
  return { session, prisma };
}
export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
