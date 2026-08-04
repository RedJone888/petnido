import { PrismaClient } from "../.generated/validation-client/index.js";

const prisma = new PrismaClient();
const userId = "validation-profile-user";

try {
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "profile-e2e@petnido.invalid",
      name: "Mika",
      profile: {
        create: {
          onboardingStep: "COMPLETE",
          preferredLocale: "en",
          timeZone: "Asia/Tokyo",
          bio: "I care for cats and rabbits.",
          isSitter: true,
        },
      },
      pets: {
        create: [
          {
            name: "Mochi",
            type: "CAT",
            breed: "Domestic shorthair",
            age: 4,
            notes: "Indoor cat",
          },
          {
            name: "Sora",
            type: "RABBIT",
            age: 2,
            notes: "Quiet and curious",
          },
        ],
      },
    },
  });

  const location = await prisma.userLocation.create({
    data: {
      userId: user.id,
      label: "Tokyo area",
      lat: 35.681236,
      lon: 139.767125,
      regionLabel: "Chiyoda, Tokyo",
      displayPrecision: "DISTRICT",
      isDefault: true,
    },
  });

  await prisma.serviceProfile.create({
    data: {
      userId: user.id,
      introduction: "Experienced with cats, rabbits, and medication routines.",
      monthsExperience: 48,
      baseCurrency: "JPY",
      defaultLocationId: location.id,
      isAccepting: true,
    },
  });
  await prisma.notificationPreference.create({
    data: { userId: user.id, emailInstant: true },
  });
} finally {
  await prisma.$disconnect();
}
