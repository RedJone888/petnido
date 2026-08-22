import {
  assessLegacyNeedCompatibility,
  assessLegacyServiceCompatibility,
  legacyNeedCompatibilitySelect,
  legacyServiceCompatibilitySelect,
  summarizeCompatibility,
} from "@/domain/publishing/legacy-record-compatibility";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const publishingCompatibilityRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const ownerId = ctx.session.user.id;
    const [needs, services] = await Promise.all([
      ctx.prisma.need.findMany({
        where: { ownerId, archivedAt: null },
        select: legacyNeedCompatibilitySelect,
        orderBy: { createdAt: "desc" },
      }),
      ctx.prisma.service.findMany({
        where: {
          archivedAt: null,
          serviceProfile: { userId: ownerId },
        },
        select: legacyServiceCompatibilitySelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const needAssessments = needs.map(assessLegacyNeedCompatibility);
    const serviceAssessments = services.map(assessLegacyServiceCompatibility);
    return {
      needs: needAssessments,
      services: serviceAssessments,
      summaries: {
        needs: summarizeCompatibility(needAssessments),
        services: summarizeCompatibility(serviceAssessments),
      },
    };
  }),
});
