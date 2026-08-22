import { createHash, randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";

type TicketDb = Pick<PrismaClient, "authLoginTicket">;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createLoginTicket(db: TicketDb, userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.authLoginTicket.create({
    data: {
      userId,
      tokenHash: digest(token),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
  return token;
}

export async function consumeLoginTicket(db: PrismaClient, token: string) {
  const now = new Date();
  const ticket = await db.authLoginTicket.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });
  if (!ticket || ticket.consumedAt || ticket.expiresAt <= now || ticket.user.deletedAt) return null;
  const consumed = await db.authLoginTicket.updateMany({
    where: { id: ticket.id, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });
  return consumed.count === 1 ? ticket.user : null;
}
