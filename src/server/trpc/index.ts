//appRouter的最终聚合（唯一appRouter)
import { router } from "@/server/trpc/trpc";
import { authRouter } from "@/modules/auth/api/router";
import { serviceProfileRouter } from "@/server/trpc/routers/serviceProfile";
import { serviceV2Router } from "@/server/trpc/routers/serviceV2";
import { marketplaceNeedRouter } from "@/server/trpc/routers/marketplaceNeed";
import { marketplaceServiceRouter } from "@/server/trpc/routers/marketplaceService";
import { favoriteRouter } from "@/server/trpc/routers/favorite";
import { conversationRouter } from "@/server/trpc/routers/conversation";
import { needApplicationRouter } from "@/server/trpc/routers/needApplication";
import { serviceBookingRouter } from "@/server/trpc/routers/serviceBooking";
import { locationRouter } from "@/server/trpc/routers/location";
import { attachmentRouter } from "@/server/trpc/routers/attachment";
import { profileRouter } from "@/server/trpc/routers/profile";
import { petRouter } from "@/server/trpc/routers/pet";
import { savedLocationRouter } from "@/server/trpc/routers/savedLocation";
import { notificationPreferenceRouter } from "@/server/trpc/routers/notificationPreference";
import { publishDraftRouter } from "@/server/trpc/routers/publishDraft";
import { needPublishingRouter } from "@/modules/need-publishing/api/router";
import { matchingRouter } from "@/server/trpc/routers/matching";
import { notificationRouter } from "@/server/trpc/routers/notification";
import { dashboardSummaryRouter } from "@/server/trpc/routers/dashboardSummary";
export const appRouter = router({
  auth: authRouter,
  serviceProfile: serviceProfileRouter,
  serviceV2: serviceV2Router,
  marketplaceNeed: marketplaceNeedRouter,
  marketplaceService: marketplaceServiceRouter,
  favorite: favoriteRouter,
  conversation: conversationRouter,
  needApplication: needApplicationRouter,
  serviceBooking: serviceBookingRouter,
  location: locationRouter,
  attachment: attachmentRouter,
  profile: profileRouter,
  pet: petRouter,
  savedLocation: savedLocationRouter,
  notificationPreference: notificationPreferenceRouter,
  publishDraft: publishDraftRouter,
  needV2: needPublishingRouter,
  matching: matchingRouter,
  notification: notificationRouter,
  dashboardSummary: dashboardSummaryRouter,
});
import type { inferRouterOutputs } from "@trpc/server";

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
