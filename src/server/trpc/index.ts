//appRouter的最终聚合（唯一appRouter)
import { router } from "@/server/trpc/trpc";
import { authRouter } from "@/server/trpc/routers/auth";
import { needRouter } from "@/server/trpc/routers/need";
import { serviceProfileRouter } from "@/server/trpc/routers/serviceProfile";
import { serviceRouter } from "@/server/trpc/routers/service";
import { locationRouter } from "@/server/trpc/routers/location";
import { attachmentRouter } from "@/server/trpc/routers/attachment";
import { profileRouter } from "@/server/trpc/routers/profile";
import { petRouter } from "@/server/trpc/routers/pet";
import { savedLocationRouter } from "@/server/trpc/routers/savedLocation";
export const appRouter = router({
  auth: authRouter,
  need: needRouter,
  serviceProfile: serviceProfileRouter,
  service: serviceRouter,
  location: locationRouter,
  attachment: attachmentRouter,
  profile: profileRouter,
  pet: petRouter,
  savedLocation: savedLocationRouter,
});
export type AppRouter = typeof appRouter;
