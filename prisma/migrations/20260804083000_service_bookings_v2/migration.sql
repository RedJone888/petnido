CREATE TYPE "ServiceBookingStateV2" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED');

CREATE TABLE "ServiceBookingV2" (
  "id" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "requestKey" TEXT NOT NULL,
  "serviceSource" "ConversationContextSourceV2" NOT NULL, "serviceId" TEXT NOT NULL,
  "serviceTitleSnapshot" TEXT NOT NULL, "serviceModeSnapshot" TEXT NOT NULL,
  "providerId" TEXT NOT NULL, "customerId" TEXT NOT NULL, "conversationId" TEXT NOT NULL,
  "state" "ServiceBookingStateV2" NOT NULL DEFAULT 'PENDING',
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "timeZone" TEXT NOT NULL,
  "petCount" INTEGER NOT NULL, "decidedAt" TIMESTAMP(3), "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceBookingV2_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ServiceBookingPetV2" (
  "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "sourcePetId" TEXT,
  "name" TEXT NOT NULL, "petType" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  CONSTRAINT "ServiceBookingPetV2_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceBookingV2_idempotencyKey_key" ON "ServiceBookingV2"("idempotencyKey");
CREATE UNIQUE INDEX "ServiceBookingV2_requestKey_key" ON "ServiceBookingV2"("requestKey");
CREATE INDEX "ServiceBookingV2_providerId_state_startsAt_idx" ON "ServiceBookingV2"("providerId", "state", "startsAt");
CREATE INDEX "ServiceBookingV2_customerId_state_startsAt_idx" ON "ServiceBookingV2"("customerId", "state", "startsAt");
CREATE INDEX "ServiceBookingV2_serviceSource_serviceId_state_startsAt_endsAt_idx" ON "ServiceBookingV2"("serviceSource", "serviceId", "state", "startsAt", "endsAt");
CREATE INDEX "ServiceBookingV2_conversationId_idx" ON "ServiceBookingV2"("conversationId");
CREATE INDEX "ServiceBookingPetV2_bookingId_idx" ON "ServiceBookingPetV2"("bookingId");
CREATE INDEX "ServiceBookingPetV2_sourcePetId_idx" ON "ServiceBookingPetV2"("sourcePetId");
ALTER TABLE "ServiceBookingV2" ADD CONSTRAINT "ServiceBookingV2_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceBookingV2" ADD CONSTRAINT "ServiceBookingV2_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceBookingV2" ADD CONSTRAINT "ServiceBookingV2_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceBookingPetV2" ADD CONSTRAINT "ServiceBookingPetV2_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ServiceBookingV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceBookingPetV2" ADD CONSTRAINT "ServiceBookingPetV2_sourcePetId_fkey" FOREIGN KEY ("sourcePetId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceBookingV2" ADD CONSTRAINT "ServiceBookingV2_time_range_check" CHECK ("startsAt" < "endsAt");
ALTER TABLE "ServiceBookingV2" ADD CONSTRAINT "ServiceBookingV2_pet_count_check" CHECK ("petCount" > 0);
ALTER TABLE "ServiceBookingPetV2" ADD CONSTRAINT "ServiceBookingPetV2_quantity_check" CHECK ("quantity" > 0);
