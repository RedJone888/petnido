import { NextResponse } from "next/server";

import {
  validationFailureCookie,
  validationProfileCookie,
  validationProfileEnabled,
  validationProfileUserId,
} from "@/server/validation/profile-session";

function validToken(request: Request) {
  const url = new URL(request.url);
  return (
    validationProfileEnabled() &&
    url.searchParams.get("token") === process.env.VALIDATION_TEST_TOKEN
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !validToken(request)) {
    return new NextResponse(null, { status: 404 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(validationProfileCookie, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30,
  });
  return response;
}

export async function POST(request: Request) {
  if (!validToken(request)) return new NextResponse(null, { status: 404 });
  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;
  if (body?.action === "setConversationFailure") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(validationFailureCookie, "conversation-list", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60,
    });
    return response;
  }
  if (body?.action === "clearFailure") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(validationFailureCookie, "", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
  if (body?.action === "resetProfileFixture") {
    const { getValidationPrisma } = await import("@/lib/validation-prisma");
    const prisma = getValidationPrisma();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: validationProfileUserId },
        data: {
          name: "Mika",
          emailVerified: new Date("2026-08-04T00:00:00.000Z"),
          image:
            "https://res.cloudinary.com/petnido-validation/image/upload/avatar.jpg",
        },
      }),
      prisma.profile.update({
        where: { userId: validationProfileUserId },
        data: {
          onboardingStep: "COMPLETE",
          initialIntent: null,
          preferredLocale: "en",
          timeZone: "Asia/Tokyo",
          bio: "I care for cats and rabbits.",
          isOwner: true,
          isSitter: true,
        },
      }),
      prisma.serviceProfile.update({
        where: { userId: validationProfileUserId },
        data: {
          introduction: "Experienced with cats, rabbits, and medication routines.",
          monthsExperience: 48,
          baseCurrency: "JPY",
          isAccepting: true,
        },
      }),
      prisma.notificationPreference.upsert({
        where: { userId: validationProfileUserId },
        update: { emailInstant: true },
        create: { userId: validationProfileUserId, emailInstant: true },
      }),
    ]);
    const baselineLocation = await prisma.userLocation.findFirst({
      where: {
        userId: validationProfileUserId,
        regionLabel: "Chiyoda, Tokyo",
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (baselineLocation) {
      await prisma.$transaction([
        prisma.serviceProfile.update({
          where: { userId: validationProfileUserId },
          data: { defaultLocationId: baselineLocation.id },
        }),
        prisma.userLocation.deleteMany({
          where: {
            userId: validationProfileUserId,
            id: { not: baselineLocation.id },
          },
        }),
        prisma.userLocation.update({
          where: { id: baselineLocation.id },
          data: { isDefault: true, archivedAt: null },
        }),
      ]);
    }
    return NextResponse.json({ ok: true });
  }
  if (body?.action !== "resetOnboarding") {
    return NextResponse.json({ code: "INVALID_ACTION" }, { status: 400 });
  }

  const { getValidationPrisma } = await import("@/lib/validation-prisma");
  const prisma = getValidationPrisma();
  await prisma.profile.update({
    where: { userId: validationProfileUserId },
    data: {
      onboardingStep: "PROFILE",
      initialIntent: null,
      isSitter: false,
    },
  });
  return NextResponse.json({ ok: true });
}
