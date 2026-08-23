import { summarizeOwnedRecords, type DashboardOwnedRecord } from "@/domain/dashboard/summary";
import { hasUnreadMessages } from "@/domain/messaging/conversation";
import { protectedProcedure, router } from "@/server/trpc/trpc";

function mode(value: string) {
  return value === "VISIT" ? "HOME_VISIT" as const : value === "FOSTER" ? "BOARDING" as const : "CUSTOM" as const;
}

export const dashboardSummaryRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [needsV2, legacyNeeds, servicesV2, legacyServices, favorites, receivedApplications, submittedApplications, receivedBookings, requestedBookings, notifications, participants, serviceProfile] = await Promise.all([
      ctx.prisma.needV2.findMany({ where: { ownerId: userId, archivedAt: null }, select: { mode: true, state: true } }),
      ctx.prisma.need.findMany({ where: { ownerId: userId, archivedAt: null }, select: { category: true, status: true } }),
      ctx.prisma.serviceV2.findMany({ where: { serviceProfile: { userId }, archivedAt: null }, select: { mode: true, state: true } }),
      ctx.prisma.service.findMany({ where: { serviceProfile: { userId }, archivedAt: null }, select: { serviceType: true, isActive: true } }),
      ctx.prisma.favoriteV2.findMany({ where: { userId }, select: { targetKind: true, targetSource: true, targetId: true } }),
      ctx.prisma.needApplicationV2.count({ where: { ownerId: userId, state: "PENDING" } }),
      ctx.prisma.needApplicationV2.count({ where: { applicantId: userId, state: { in: ["PENDING", "ACCEPTED"] } } }),
      ctx.prisma.serviceBookingV2.count({ where: { providerId: userId, state: "PENDING" } }),
      ctx.prisma.serviceBookingV2.count({ where: { customerId: userId, state: { in: ["PENDING", "CONFIRMED"] } } }),
      ctx.prisma.notificationV2.count({ where: { recipientId: userId, readAt: null } }),
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
      ...legacyNeeds.map((item) => ({
        kind: "NEED" as const,
        mode: mode(item.category),
        // Legacy CANCELLED requests share the same terminal meaning as CLOSED
        // in the publishing module. Keep that distinction out of the current
        // dashboard even while legacy rows remain readable.
        state: item.status === "CANCELLED" ? "CLOSED" : item.status,
      })),
      ...servicesV2.map((item) => ({ kind: "SERVICE" as const, mode: item.mode, state: item.state })),
      ...legacyServices.map((item) => ({ kind: "SERVICE" as const, mode: mode(item.serviceType), state: item.isActive ? "ACTIVE" : "PAUSED" })),
    ];
    const owned = summarizeOwnedRecords(records);

    const favNeedV2Ids = favorites.filter((f) => f.targetKind === "NEED" && f.targetSource === "V2").map((f) => f.targetId);
    const favNeedLegacyIds = favorites.filter((f) => f.targetKind === "NEED" && f.targetSource === "LEGACY").map((f) => f.targetId);
    const favServiceV2Ids = favorites.filter((f) => f.targetKind === "SERVICE" && f.targetSource === "V2").map((f) => f.targetId);
    const favServiceLegacyIds = favorites.filter((f) => f.targetKind === "SERVICE" && f.targetSource === "LEGACY").map((f) => f.targetId);

    const [favV2Needs, favLegacyNeeds, favV2Services, favLegacyServices] = await Promise.all([
      favNeedV2Ids.length ? ctx.prisma.needV2.findMany({ where: { id: { in: favNeedV2Ids } }, select: { mode: true } }) : Promise.resolve([]),
      favNeedLegacyIds.length && "need" in ctx.prisma ? ctx.prisma.need.findMany({ where: { id: { in: favNeedLegacyIds } }, select: { category: true } }) : Promise.resolve([]),
      favServiceV2Ids.length ? ctx.prisma.serviceV2.findMany({ where: { id: { in: favServiceV2Ids } }, select: { mode: true } }) : Promise.resolve([]),
      favServiceLegacyIds.length && "service" in ctx.prisma ? ctx.prisma.service.findMany({ where: { id: { in: favServiceLegacyIds } }, select: { serviceType: true } }) : Promise.resolve([]),
    ]);

    const favNeedModes = [
      ...favV2Needs.map((n) => n.mode),
      ...favLegacyNeeds.map((n) => mode(n.category)),
    ];
    const favServiceModes = [
      ...favV2Services.map((s) => s.mode),
      ...favLegacyServices.map((s) => mode(s.serviceType)),
    ];

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
        unreadNotifications: notifications,
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
