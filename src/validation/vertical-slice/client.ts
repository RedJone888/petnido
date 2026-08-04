import { PrismaClient } from "../../../.generated/validation-client";

const globalValidation = globalThis as unknown as { validationPrisma?: PrismaClient };

export const validationPrisma = globalValidation.validationPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalValidation.validationPrisma = validationPrisma;
