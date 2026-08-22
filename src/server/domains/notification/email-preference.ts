import { Prisma, type PrismaClient } from "@prisma/client";

export async function consumePostPublishEmailPrompt(prisma: PrismaClient, userId: string, now = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  const emailEligible = Boolean(user?.email && user.emailVerified);
  const existing = await prisma.notificationPreference.findUnique({ where: { userId }, select: { id: true, emailInstant: true, emailPromptedAt: true } });
  if (existing) return { shouldPrompt: false, emailEligible };
  try {
    await prisma.notificationPreference.create({ data: { userId, emailInstant: false, emailPromptedAt: now } });
    return { shouldPrompt: false, emailEligible };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { shouldPrompt: false, emailEligible };
    }
    throw error;
  }
}
