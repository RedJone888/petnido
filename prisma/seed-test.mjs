import { PrismaClient, ServiceCategory, NeedStatus, Currency, AvailabilityRangeType, AvailabilityWeekPattern, PriceUnit, PetType } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const allowReset = process.env.ALLOW_TEST_DB_RESET === "true";
const databaseName = databaseUrl ? new URL(databaseUrl).pathname.replace(/^\//, "").toLowerCase() : "";

if (process.env.NODE_ENV !== "test" || !allowReset || !databaseName.includes("test")) {
  process.stderr.write("Refusing seed: this script only runs against an explicitly allowed test database.\n");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@petnido.example.invalid" },
    update: {},
    create: { id: "fixture-owner", email: "owner@petnido.example.invalid", name: "Fixture Owner", profile: { create: {} } },
  });
  const provider = await prisma.user.upsert({
    where: { email: "provider@petnido.example.invalid" },
    update: {},
    create: { id: "fixture-provider", email: "provider@petnido.example.invalid", name: "Fixture Provider", profile: { create: { isSitter: true } } },
  });

  await prisma.pet.upsert({
    where: { id: "fixture-pet-cat" },
    update: {},
    create: { id: "fixture-pet-cat", ownerId: owner.id, name: "Mugi", type: PetType.CAT },
  });

  await prisma.serviceProfile.upsert({
    where: { userId: provider.id },
    update: {},
    create: {
      id: "fixture-provider-profile",
      userId: provider.id,
      baseAreaRaw: "Fixture West area",
      baseLat: 35.69,
      baseLon: 139.75,
      baseCurrency: Currency.JPY,
      introduction: "Synthetic test provider",
      services: {
        create: {
          id: "fixture-service-boarding",
          serviceType: ServiceCategory.FOSTER,
          description: "Synthetic boarding fixture",
          areaRaw: "Fixture West area",
          areaLat: 35.69,
          areaLon: 139.75,
          currency: Currency.JPY,
          availabilityRangeType: AvailabilityRangeType.LONG_TERM,
          availabilityWeekPattern: AvailabilityWeekPattern.EVERYDAY,
          priceUnit: PriceUnit.DAY,
          petTypes: [PetType.CAT, PetType.DOG],
          priceRules: { create: { groupLabel: "fixture", price: 3000 } },
        },
      },
    },
  });

  await prisma.need.upsert({
    where: { id: "fixture-need-open" },
    update: {},
    create: {
      id: "fixture-need-open",
      ownerId: owner.id,
      title: "Synthetic home visit",
      category: ServiceCategory.VISIT,
      requirement: "Synthetic fixture only",
      startDate: new Date("2030-01-16T00:00:00.000Z"),
      endDate: new Date("2030-01-20T00:00:00.000Z"),
      addressRaw: "Fixture Central area",
      addressLat: 35.68,
      addressLon: 139.77,
      currency: Currency.JPY,
      status: NeedStatus.OPEN,
      totalPrice: 5000,
      needPets: { create: { petCategory: PetType.CAT, count: 1, tags: [], petIds: ["fixture-pet-cat"] } },
    },
  });
}

main()
  .finally(async () => prisma.$disconnect());
