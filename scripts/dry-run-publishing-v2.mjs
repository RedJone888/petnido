import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const modeMap = {
  VISIT: "HOME_VISIT",
  FOSTER: "BOARDING",
  OTHER: "CUSTOM",
};

const zeroDecimalCurrencies = new Set(["JPY", "KRW"]);

function amountToMinor(amount, currency) {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return null;
  const factor = zeroDecimalCurrencies.has(currency) ? 1 : 100;
  return Math.round(amount * factor);
}

function inCoordinateRange(lat, lon) {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

try {
  const [needs, services, counts] = await Promise.all([
    prisma.need.findMany({
      select: {
        id: true,
        category: true,
        status: true,
        startDate: true,
        endDate: true,
        addressLat: true,
        addressLon: true,
        currency: true,
        totalPrice: true,
        needPets: { select: { id: true, petIds: true } },
      },
    }),
    prisma.service.findMany({
      select: {
        id: true,
        serviceType: true,
        areaLat: true,
        areaLon: true,
        currency: true,
        priceRules: { select: { price: true } },
      },
    }),
    Promise.all([
      prisma.attachment.count(),
      prisma.attachment.count({ where: { status: 0 } }),
      prisma.attachment.count({
        where: { serviceId: null, needId: null, petId: null, needPetId: null },
      }),
    ]),
  ]);

  const needReasons = {
    invalidDateRange: 0,
    invalidCoordinates: 0,
    missingPetSnapshot: 0,
    unlinkedPetSnapshot: 0,
    requiresStructuredTaskEnrichment: 0,
  };
  const needModeCounts = { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 };
  const needStateCounts = {};
  let needAmountConversionFailures = 0;

  for (const need of needs) {
    const mode = modeMap[need.category];
    needModeCounts[mode] += 1;
    needStateCounts[need.status] = (needStateCounts[need.status] ?? 0) + 1;
    if (need.startDate >= need.endDate) needReasons.invalidDateRange += 1;
    if (!inCoordinateRange(need.addressLat, need.addressLon)) {
      needReasons.invalidCoordinates += 1;
    }
    if (need.needPets.length === 0) needReasons.missingPetSnapshot += 1;
    needReasons.unlinkedPetSnapshot += need.needPets.filter(
      (pet) => pet.petIds.length === 0,
    ).length;
    needReasons.requiresStructuredTaskEnrichment += 1;
    if (amountToMinor(need.totalPrice, need.currency) === null) {
      needAmountConversionFailures += 1;
    }
  }

  const serviceReasons = {
    invalidCoordinates: 0,
    boardingCapacityRequiredBeforeActivation: 0,
    requiresExplicitPetPolicy: 0,
    requiresStructuredAvailability: 0,
  };
  const serviceModeCounts = { HOME_VISIT: 0, BOARDING: 0, CUSTOM: 0 };
  let serviceAmountConversionFailures = 0;

  for (const service of services) {
    const mode = modeMap[service.serviceType];
    serviceModeCounts[mode] += 1;
    if (!inCoordinateRange(service.areaLat, service.areaLon)) {
      serviceReasons.invalidCoordinates += 1;
    }
    if (mode === "BOARDING") {
      serviceReasons.boardingCapacityRequiredBeforeActivation += 1;
    }
    serviceReasons.requiresExplicitPetPolicy += 1;
    serviceReasons.requiresStructuredAvailability += 1;
    serviceAmountConversionFailures += service.priceRules.filter(
      (rule) => amountToMinor(rule.price, service.currency) === null,
    ).length;
  }

  const report = {
    mode: "DRY_RUN_READ_ONLY",
    writesAttempted: 0,
    rawLocationValuesRead: 0,
    personalTextValuesRead: 0,
    needs: {
      sourceCount: needs.length,
      modeCounts: needModeCounts,
      stateCounts: needStateCounts,
      amountConversionFailures: needAmountConversionFailures,
      reviewReasons: needReasons,
    },
    services: {
      sourceCount: services.length,
      modeCounts: serviceModeCounts,
      amountConversionFailures: serviceAmountConversionFailures,
      reviewReasons: serviceReasons,
    },
    attachments: {
      sourceCount: counts[0],
      temporaryCount: counts[1],
      withoutLegacyParentCount: counts[2],
      action: "REVIEW_ONLY_NO_DELETE",
    },
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
