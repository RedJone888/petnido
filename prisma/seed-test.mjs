import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1).toLowerCase() : "";
if (process.env.NODE_ENV !== "test" || process.env.ALLOW_TEST_DB_RESET !== "true" || !databaseName.includes("test")) {
  throw new Error("Refusing seed: require NODE_ENV=test, ALLOW_TEST_DB_RESET=true, and a test database.");
}
const prisma = new PrismaClient();
try {
  const owner = await prisma.user.upsert({
    where: { email: "owner@petnido.example.invalid" }, update: {},
    create: { id: "fixture-owner", email: "owner@petnido.example.invalid", name: "Demo owner", profile: { create: {} } },
  });
  await prisma.needV2.upsert({
    where: { idempotencyKey: "fixture-custom-need" }, update: {},
    create: {
      id: "fixture-custom-need", idempotencyKey: "fixture-custom-need", ownerId: owner.id,
      mode: "CUSTOM", state: "OPEN", description: "Synthetic request for local review only.",
      startsAt: new Date("2030-12-30T00:00:00Z"), endsAt: new Date("2031-01-02T00:00:00Z"),
      timeZone: "Asia/Tokyo", customTimePreference: "FLEXIBLE", budgetKind: "EXACT", minAmountMinor: 3500n, currency: "JPY",
      locationSnapshot: { create: { lat: 34.69, lon: 135.50, regionLabel: "Osaka (sample)", displayPrecision: "city" } },
      pets: { create: { clientPetKey: "fixture-pet", name: "Mugi", petType: "CAT", quantity: 1, sex: "UNKNOWN", neutered: "UNKNOWN" } },
      tasks: { create: { clientTaskKey: "fixture-task", category: "CUSTOM", label: "Transport carrier setup", semanticFingerprint: "fixture-task", visitNumbers: [], priority: "MUST", scheduleKind: "ONCE" } },
    },
  });
} finally {
  await prisma.$disconnect();
}
