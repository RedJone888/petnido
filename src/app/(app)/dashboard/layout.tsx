import NavLinks from "./_components/nav-links";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  hasValidProfileValidationToken,
  validationProfileCookie,
  validationProfileUserId,
} from "@/server/validation/profile-session";
import { getValidationPrisma } from "@/lib/validation-prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const validationRequest = new Request("http://localhost", {
    headers: {
      cookie: `${validationProfileCookie}=${cookies().get(validationProfileCookie)?.value ?? ""}`,
    },
  });
  const validationSession = hasValidProfileValidationToken(validationRequest);
  const session = validationSession
    ? {
        user: {
          id: validationProfileUserId,
          email: "profile-e2e@petnido.invalid",
          name: "Profile E2E",
        },
      }
    : await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?returnTo=%2Fdashboard");
  }
  const database = validationSession
    ? (getValidationPrisma() as unknown as typeof prisma)
    : prisma;
  const profile = await database.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingStep: true },
  });
  if (!profile || profile.onboardingStep !== "COMPLETE") {
    redirect("/auth/continue?returnTo=%2Fdashboard");
  }
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-[#f6f7fb]">
      <div
        data-dashboard-shell
        className="site-shell flex flex-col md:flex-row h-full gap-5 lg:gap-6 py-3 md:py-4 overflow-hidden"
      >
        <NavLinks user={session.user} />
        <div
          data-dashboard-panel
          className="min-w-0 flex-1 h-full flex flex-col overflow-hidden"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
