import prisma from "@/lib/prisma";
export function getNeedById(id: string) {
  return prisma.need.findUnique({
    where: { id },
    include: {
      photos: {
        where: { status: 1 },
        orderBy: { order: "asc" },
      },
      needPets: {
        include: {
          photos: {
            where: { status: 1 },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
}
export function listBrowseNeeds(options?: { limit?: number }) {
  const limit = options?.limit ?? 50;
  return prisma.need.findMany({
    where: { status: "OPEN", endDate: { gt: new Date() } },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      photos: {
        where: { status: 1 },
        orderBy: { order: "asc" },
      },
      needPets: {
        include: {
          photos: {
            where: { status: 1 },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function listUserNeeds(userId: string) {
  return prisma.need.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      frequencyType: true,
      customDays: true,
      customTimes: true,
      fosterRange: true,
      transportMethod: true,
      addressRaw: true,
      totalPrice: true,
      priceAmount: true,
      currency: true,
      category: true,
      photos: {
        where: { status: 1 },
        orderBy: { order: "asc" },
        take: 1,
        select: { url: true },
      },
      needPets: {
        select: {
          petCategory: true,
          petType: true,
          count: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
