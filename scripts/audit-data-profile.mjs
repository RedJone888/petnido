import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const possiblePreciseAddress = /(?:室|号|階|楼|层|房|unit|room|floor|apt\.?|apartment)/i;

async function countBy(model, by) {
  return model.groupBy({ by: [by], _count: { _all: true } });
}

function locationSummary(values) {
  const normalized = values.filter((value) => typeof value === "string" && value.trim());
  return {
    populated: normalized.length,
    possiblePreciseText: normalized.filter((value) => possiblePreciseAddress.test(value)).length,
  };
}

function duplicateSummary(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const duplicateGroups = [...counts.values()].filter((count) => count > 1);
  return {
    duplicateGroups: duplicateGroups.length,
    rowsInDuplicateGroups: duplicateGroups.reduce((total, count) => total + count, 0),
  };
}

function nullableSummary(rows, fields) {
  return Object.fromEntries(
    fields.map((field) => [field, rows.filter((row) => row[field] === null || row[field] === "").length]),
  );
}

async function main() {
  const [
    users,
    profiles,
    pets,
    needs,
    needPets,
    serviceProfiles,
    services,
    applications,
    bookings,
    messages,
    attachments,
    needStatuses,
    serviceCategories,
    applicationStatuses,
    bookingStatuses,
    needLocations,
    serviceLocations,
    profileLocations,
    userRows,
    profileRows,
    needRows,
    needPetRows,
    petRows,
    serviceRows,
    serviceProfileRows,
    applicationRows,
    bookingRows,
    attachmentRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count(),
    prisma.pet.count(),
    prisma.need.count(),
    prisma.needPet.count(),
    prisma.serviceProfile.count(),
    prisma.service.count(),
    prisma.application.count(),
    prisma.booking.count(),
    prisma.message.count(),
    prisma.attachment.count(),
    countBy(prisma.need, "status"),
    countBy(prisma.service, "serviceType"),
    countBy(prisma.application, "status"),
    countBy(prisma.booking, "status"),
    prisma.need.findMany({ select: { addressRaw: true } }),
    prisma.service.findMany({ select: { areaRaw: true } }),
    prisma.serviceProfile.findMany({ select: { baseAreaRaw: true } }),
    prisma.user.findMany({ select: { email: true, name: true, image: true } }),
    prisma.profile.findMany({ select: { bio: true } }),
    prisma.need.findMany({
      select: {
        title: true,
        requirement: true,
        startDate: true,
        endDate: true,
        priceAmount: true,
        frequencyType: true,
        fosterRange: true,
        transportMethod: true,
        addressLat: true,
        addressLon: true,
      },
    }),
    prisma.needPet.findMany({ select: { petIds: true, description: true } }),
    prisma.pet.findMany({ select: { id: true } }),
    prisma.service.findMany({
      select: {
        description: true,
        customType: true,
        availableFrom: true,
        availableTo: true,
        createdAt: true,
        areaLat: true,
        areaLon: true,
      },
    }),
    prisma.serviceProfile.findMany({ select: { introduction: true, monthsExperience: true } }),
    prisma.application.findMany({ select: { price: true } }),
    prisma.booking.findMany({ select: { price: true, startDate: true, endDate: true, needId: true } }),
    prisma.attachment.findMany({
      select: { serviceId: true, needId: true, petId: true, needPetId: true, status: true },
    }),
  ]);

  const knownPetIds = new Set(petRows.map((pet) => pet.id));
  const referencedPetIds = needPetRows.flatMap((needPet) => needPet.petIds);
  const allTextForClassification = [
    ...needRows.flatMap((row) => [row.title, row.requirement]),
    ...serviceRows.map((row) => row.description),
    ...serviceProfileRows.map((row) => row.introduction),
  ].filter(Boolean);
  const demoTextPattern = /(?:lorem|fixture|demo|test|测试|示例|サンプル)/i;
  const attachmentParentCounts = attachmentRows.map((row) =>
    [row.serviceId, row.needId, row.petId, row.needPetId].filter(Boolean).length,
  );
  const safeDateRange = (values) => {
    const timestamps = values.filter(Boolean).map((value) => value.getTime());
    return timestamps.length
      ? { min: new Date(Math.min(...timestamps)).toISOString(), max: new Date(Math.max(...timestamps)).toISOString() }
      : null;
  };

  const output = {
    generatedAt: new Date().toISOString(),
    redaction: "Counts and aggregate classifications only; no user content is emitted.",
    counts: {
      users,
      profiles,
      pets,
      needs,
      needPets,
      serviceProfiles,
      services,
      applications,
      bookings,
      messages,
      attachments,
    },
    distributions: {
      needStatuses,
      serviceCategories,
      applicationStatuses,
      bookingStatuses,
    },
    legacyLocationText: {
      needs: locationSummary(needLocations.map((item) => item.addressRaw)),
      services: locationSummary(serviceLocations.map((item) => item.areaRaw)),
      serviceProfiles: locationSummary(profileLocations.map((item) => item.baseAreaRaw)),
    },
    nullCounts: {
      users: nullableSummary(userRows, ["email", "name", "image"]),
      profiles: nullableSummary(profileRows, ["bio"]),
      needs: nullableSummary(needRows, ["priceAmount", "frequencyType", "fosterRange", "transportMethod"]),
      needPets: nullableSummary(needPetRows, ["description"]),
      services: nullableSummary(serviceRows, ["description", "customType", "availableFrom", "availableTo"]),
      serviceProfiles: nullableSummary(serviceProfileRows, ["introduction", "monthsExperience"]),
    },
    duplicates: {
      needTitles: duplicateSummary(needRows.map((row) => row.title)),
      userEmails: duplicateSummary(userRows.map((row) => row.email).filter(Boolean)),
    },
    dates: {
      needStarts: safeDateRange(needRows.map((row) => row.startDate)),
      needEnds: safeDateRange(needRows.map((row) => row.endDate)),
      serviceCreated: safeDateRange(serviceRows.map((row) => row.createdAt)),
      bookingStarts: safeDateRange(bookingRows.map((row) => row.startDate)),
      bookingEnds: safeDateRange(bookingRows.map((row) => row.endDate)),
    },
    dataNatureSignals: {
      exampleInvalidEmails: userRows.filter((row) => row.email?.endsWith(".invalid")).length,
      demoLikeTextRows: allTextForClassification.filter((value) => demoTextPattern.test(value)).length,
      conclusion: "Cannot prove production/test ownership from content signals alone; treat as mixed/unknown until owner confirms.",
    },
    referentialSignals: {
      needPetPetIdReferences: referencedPetIds.length,
      unresolvedNeedPetPetIdReferences: referencedPetIds.filter((id) => !knownPetIds.has(id)).length,
      attachmentsWithoutParent: attachmentParentCounts.filter((count) => count === 0).length,
      attachmentsWithMultipleParents: attachmentParentCounts.filter((count) => count > 1).length,
      temporaryAttachments: attachmentRows.filter((row) => row.status === 0).length,
      deletedAttachments: attachmentRows.filter((row) => row.status === 2).length,
    },
    migrationChecks: {
      applicationFloatRows: applicationRows.length,
      applicationFractionalPrices: applicationRows.filter((row) => !Number.isInteger(row.price)).length,
      bookingFloatRows: bookingRows.length,
      bookingFractionalPrices: bookingRows.filter((row) => !Number.isInteger(row.price)).length,
      bookingsWithoutNeed: bookingRows.filter((row) => row.needId === null).length,
      invalidNeedCoordinates: needRows.filter(
        (row) => Math.abs(row.addressLat) > 90 || Math.abs(row.addressLon) > 180,
      ).length,
      invalidServiceCoordinates: serviceRows.filter(
        (row) => Math.abs(row.areaLat) > 90 || Math.abs(row.areaLon) > 180,
      ).length,
    },
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`Data profile failed: ${error?.code ?? error?.name ?? "unknown"}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
