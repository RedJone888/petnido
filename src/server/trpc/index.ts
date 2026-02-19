//appRouter的最终聚合（唯一appRouter)
import { router } from "@/server/trpc/trpc";
import { authRouter } from "@/server/trpc/routers/auth";
import { needRouter } from "@/server/trpc/routers/need";
import { serviceProfileRouter } from "@/server/trpc/routers/serviceProfile";
import { serviceRouter } from "@/server/trpc/routers/service";
import { locationRouter } from "@/server/trpc/routers/location";
import { attachmentRouter } from "@/server/trpc/routers/attachment";
export const appRouter = router({
  auth: authRouter,
  need: needRouter,
  serviceProfile: serviceProfileRouter,
  service: serviceRouter,
  location: locationRouter,
  attachment: attachmentRouter,
});
export type AppRouter = typeof appRouter;
