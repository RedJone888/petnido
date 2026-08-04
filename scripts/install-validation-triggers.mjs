import { PrismaClient } from "../.generated/validation-client/index.js";

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS validation_boarding_capacity
    BEFORE INSERT ON "ValidationBooking"
    WHEN (SELECT "mode" FROM "ValidationService" WHERE "id" = NEW."serviceId") = 'BOARDING'
    BEGIN
      UPDATE "ValidationCapacityBucket"
      SET "bookedPetCount" = "bookedPetCount" + NEW."petCount"
      WHERE "serviceId" = NEW."serviceId"
        AND "dateKey" = NEW."dateKey"
        AND "bookedPetCount" + NEW."petCount" <= "maxPetCapacity";
      SELECT CASE WHEN changes() = 0 THEN RAISE(ABORT, 'BOARDING_CAPACITY_EXCEEDED') END;
    END;
  `);
} finally {
  await prisma.$disconnect();
}
