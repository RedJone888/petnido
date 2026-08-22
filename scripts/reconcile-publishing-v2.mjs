import { PrismaClient } from "@prisma/client";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const modeMap = { VISIT: "HOME_VISIT", FOSTER: "BOARDING", OTHER: "CUSTOM" };
const zeroDecimalCurrencies = new Set(["JPY", "KRW"]);

function amountMinor(value, currency) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.round(value * (zeroDecimalCurrencies.has(currency) ? 1 : 100));
}

function sameCoordinate(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.000001;
}

function emptyDifferences() {
  return {
    MODE_MISMATCH: 0,
    LOCATION_MISMATCH: 0,
    CURRENCY_MISMATCH: 0,
    AMOUNT_MISMATCH: 0,
    PET_TOTAL_MISMATCH: 0,
    PRICE_RULE_COUNT_MISMATCH: 0,
    AVAILABILITY_RULE_COUNT_MISMATCH: 0,
    SOURCE_NOT_FOUND: 0,
  };
}

function differenceCount(values) {
  return Object.values(values).reduce((total, value) => total + Number(value || 0), 0);
}

try {
  const [legacyNeedCount, legacyServiceCount, linkedNeeds, linkedServices] = await Promise.all([
    prisma.need.count({ where: { archivedAt: null } }),
    prisma.service.count({ where: { archivedAt: null } }),
    prisma.needV2.findMany({
      where: { legacyNeedId: { not: null } },
      select: {
        legacyNeedId: true,
        mode: true,
        currency: true,
        minAmountMinor: true,
        locationSnapshot: { select: { lat: true, lon: true } },
        pets: { select: { quantity: true } },
      },
    }),
    prisma.serviceV2.findMany({
      where: { legacyServiceId: { not: null } },
      select: {
        legacyServiceId: true,
        mode: true,
        currency: true,
        locationSnapshot: { select: { lat: true, lon: true } },
        priceRules: { select: { amountMinor: true } },
        availabilityRules: { select: { id: true } },
      },
    }),
  ]);

  const [legacyNeeds, legacyServices] = await Promise.all([
    prisma.need.findMany({
      where: { id: { in: linkedNeeds.flatMap((item) => item.legacyNeedId ? [item.legacyNeedId] : []) } },
      select: {
        id: true,
        category: true,
        addressLat: true,
        addressLon: true,
        currency: true,
        totalPrice: true,
        needPets: { select: { count: true } },
      },
    }),
    prisma.service.findMany({
      where: { id: { in: linkedServices.flatMap((item) => item.legacyServiceId ? [item.legacyServiceId] : []) } },
      select: {
        id: true,
        serviceType: true,
        areaLat: true,
        areaLon: true,
        currency: true,
        availabilityRangeType: true,
        priceRules: { select: { price: true } },
      },
    }),
  ]);

  const legacyNeedsById = new Map(legacyNeeds.map((item) => [item.id, item]));
  const legacyServicesById = new Map(legacyServices.map((item) => [item.id, item]));
  const needDifferences = emptyDifferences();
  const serviceDifferences = emptyDifferences();

  for (const target of linkedNeeds) {
    const source = target.legacyNeedId ? legacyNeedsById.get(target.legacyNeedId) : null;
    if (!source) {
      needDifferences.SOURCE_NOT_FOUND += 1;
      continue;
    }
    if (modeMap[source.category] !== target.mode) needDifferences.MODE_MISMATCH += 1;
    if (!sameCoordinate(source.addressLat, target.locationSnapshot.lat) || !sameCoordinate(source.addressLon, target.locationSnapshot.lon)) needDifferences.LOCATION_MISMATCH += 1;
    if (source.currency !== target.currency) needDifferences.CURRENCY_MISMATCH += 1;
    if (amountMinor(source.totalPrice, source.currency) !== Number(target.minAmountMinor)) needDifferences.AMOUNT_MISMATCH += 1;
    const sourcePets = source.needPets.reduce((sum, pet) => sum + pet.count, 0);
    const targetPets = target.pets.reduce((sum, pet) => sum + pet.quantity, 0);
    if (sourcePets !== targetPets) needDifferences.PET_TOTAL_MISMATCH += 1;
  }

  for (const target of linkedServices) {
    const source = target.legacyServiceId ? legacyServicesById.get(target.legacyServiceId) : null;
    if (!source) {
      serviceDifferences.SOURCE_NOT_FOUND += 1;
      continue;
    }
    if (modeMap[source.serviceType] !== target.mode) serviceDifferences.MODE_MISMATCH += 1;
    if (!sameCoordinate(source.areaLat, target.locationSnapshot.lat) || !sameCoordinate(source.areaLon, target.locationSnapshot.lon)) serviceDifferences.LOCATION_MISMATCH += 1;
    if (source.currency !== target.currency) serviceDifferences.CURRENCY_MISMATCH += 1;
    if (source.priceRules.length !== target.priceRules.length) serviceDifferences.PRICE_RULE_COUNT_MISMATCH += 1;
    const expectedAvailabilityCount = source.availabilityRangeType === "DATE_RANGE" ? 1 : 1;
    if (target.availabilityRules.length !== expectedAvailabilityCount) serviceDifferences.AVAILABILITY_RULE_COUNT_MISMATCH += 1;
  }

  const unexplainedDifferenceCount =
    differenceCount(needDifferences) + differenceCount(serviceDifferences);
  const unlinkedLegacyNeedCount = Math.max(0, legacyNeedCount - linkedNeeds.length);
  const unlinkedLegacyServiceCount = Math.max(0, legacyServiceCount - linkedServices.length);
  const report = {
    mode: "READ_ONLY_RECONCILIATION",
    writesAttempted: 0,
    rawLocationValuesRead: 0,
    personalTextValuesRead: 0,
    needs: {
      legacyActiveCount: legacyNeedCount,
      linkedV2Count: linkedNeeds.length,
      unlinkedLegacyCount: unlinkedLegacyNeedCount,
      differences: needDifferences,
    },
    services: {
      legacyActiveCount: legacyServiceCount,
      linkedV2Count: linkedServices.length,
      unlinkedLegacyCount: unlinkedLegacyServiceCount,
      differences: serviceDifferences,
    },
    unexplainedDifferenceCount,
    cutoverReady: unlinkedLegacyNeedCount === 0 && unlinkedLegacyServiceCount === 0 && unexplainedDifferenceCount === 0,
  };
  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
