import { PrismaClient } from "@prisma/client";

declare global {
  // allow global var across module reloads in dev
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"], // optional: shows SQL in terminal
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
