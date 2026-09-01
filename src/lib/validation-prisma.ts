import { PrismaClient as ValidationPrismaClient } from "../../.generated/validation-client";

declare global {
  var validationPrisma: ValidationPrismaClient | undefined;
}

export function getValidationPrisma() {
  const client = global.validationPrisma ?? new ValidationPrismaClient();
  if (process.env.NODE_ENV !== "production") global.validationPrisma = client;
  return client;
}
