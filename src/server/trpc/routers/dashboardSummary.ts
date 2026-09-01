import { summarizeOwnedRecords, type DashboardOwnedRecord } from "@/domain/dashboard/summary";
import { hasUnreadMessages } from "@/domain/messaging/conversation";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const dashboardSummaryRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [needsV2, servicesV2, favorites, receivedApplications, submittedApplications, receivedBookings, requestedBookings, participants, serviceProfile] = await Promise.all([
      ctx.prisma.needV2.findMany({ where: { ownerId: userId, archivedAt: null }, select: { mode: true, state: true } }),
      ctx.prisma.serviceV2.findMany({ where: { serviceProfile: { userId }, archivedAt: null }, select: { mode: true, state: true } }),
      ctx.prisma.favoriteV2.findMany({ where: { userId }, select: { targetKind: true, targetSource: true, targetId: true } }),
      ctx.prisma.needApplicationV2.count({ where: { ownerId: userId, state: "PENDING" } }),
      ctx.prisma.needApplicationV2.count({ where: { applicantId: userId, state: { in: ["PENDING", "ACCEPTED"] } } }),
      ctx.prisma.serviceBookingV2.count({ where: { providerId: userId, state: "PENDING" } }),
      ctx.prisma.serviceBookingV2.count({ where: { customerId: userId, state: { in: ["PENDING", "CONFIRMED"] } } }),
      ctx.prisma.conversationParticipantV2.findMany({ where: { userId, archivedAt: null }, select: { lastReadAt: true, conversation: { select: { lastMessageAt: true } } } }),
      ctx.prisma.serviceProfile.findUnique({
        where: { userId },
        select: {
          isAccepting: true,
          introduction: true,
          monthsExperience: true,
          baseCurrency: true,
          baseAreaRaw: true,
          defaultLocation: { select: { label: true, regionLabel: true } },
        },
      }),
    ]);
    const records: DashboardOwnedRecord[] = [
      ...needsV2.map((item) => ({ kind: "NEED" as const, mode: item.mode, state: item.state })),
      ...servicesV2.map((item) => ({ kind: "SERVICE" as const, mode: item.mode, state: item.state })),
    ];
    const owned = summarizeOwnedRecords(records);

    const favNeedV2Ids = favorites.filter((f) => f.targetKind === "NEED").map((f) => f.targetId);
    const favServiceV2Ids = favorites.filter((f) => f.targetKind === "SERVICE").map((f) => f.targetId);

    const [favV2Needs, favV2Services] = await Promise.all([
      favNeedV2Ids.length ? ctx.prisma.needV2.findMany({ where: { id: { in: favNeedV2Ids } }, select: { mode: true } }) : Promise.resolve([]),
      favServiceV2Ids.length ? ctx.prisma.serviceV2.findMany({ where: { id: { in: favServiceV2Ids } }, select: { mode: true } }) : Promise.resolve([]),
    ]);

    const favNeedModes = favV2Needs.map((need) => need.mode);
    const favServiceModes = favV2Services.map((service) => service.mode);

    const favoritedNeedByMode = {
      HOME_VISIT: favNeedModes.filter((m) => m === "HOME_VISIT").length,
      BOARDING: favNeedModes.filter((m) => m === "BOARDING").length,
      CUSTOM: favNeedModes.filter((m) => m === "CUSTOM").length,
    };

    const favoritedServiceByMode = {
      HOME_VISIT: favServiceModes.filter((m) => m === "HOME_VISIT").length,
      BOARDING: favServiceModes.filter((m) => m === "BOARDING").length,
      CUSTOM: favServiceModes.filter((m) => m === "CUSTOM").length,
    };

    return {
      ...owned,
      favoritedNeedByMode,
      favoritedServiceByMode,
      favoritedNeedsCount: favNeedModes.length,
      favoritedServicesCount: favServiceModes.length,
      counts: {
        favorites: favorites.length,
        receivedApplications,
        submittedApplications,
        receivedBookings,
        requestedBookings,
        unreadNotifications: participants.filter((item) => hasUnreadMessages(item.conversation.lastMessageAt, item.lastReadAt)).length,
        unreadMessages: participants.filter((item) => hasUnreadMessages(item.conversation.lastMessageAt, item.lastReadAt)).length,
      },
      serviceProfile: serviceProfile
        ? {
            exists: true,
            isAccepting: serviceProfile.isAccepting,
            introduction: serviceProfile.introduction,
            monthsExperience: serviceProfile.monthsExperience,
            baseCurrency: serviceProfile.baseCurrency,
            locationLabel:
              serviceProfile.defaultLocation?.label ||
              serviceProfile.defaultLocation?.regionLabel ||
              serviceProfile.baseAreaRaw ||
              null,
          }
        : {
            exists: false,
            isAccepting: false,
            introduction: null,
            monthsExperience: null,
            baseCurrency: null,
            locationLabel: null,
          },
    };
  }),
});
