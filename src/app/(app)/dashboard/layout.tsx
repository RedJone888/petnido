import NavLinks from "./_components/nav-links";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?returnTo=%2Fdashboard");
  }
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingStep: true },
  });
  if (!profile || profile.onboardingStep !== "COMPLETE") {
    redirect("/auth/continue?returnTo=%2Fdashboard");
  }
  return (
    <div className="bg-[#f6f7fb] h-full">
      <div className="mx-auto flex h-full max-w-7xl overflow-hidden md:py-2">
        <NavLinks />
        <main className="min-w-0 flex-1 md:px-4">
          <div className="h-full overflow-hidden bg-white md:rounded-xl md:shadow-[0px_0px_20px_rgba(15,23,42,0.08)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
