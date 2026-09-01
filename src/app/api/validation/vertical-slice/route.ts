import { NextRequest, NextResponse } from "next/server";

import { validationPrisma } from "@/validation/vertical-slice/client";
import {
  confirmValidationBooking,
  listPublicNeeds,
  publishHomeVisit,
} from "@/validation/vertical-slice/service";

function isEnabled(request: NextRequest) {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.FEATURE_VERTICAL_SLICE === "true" &&
    request.headers.get("x-validation-token") === process.env.VALIDATION_TEST_TOKEN
  );
}

export async function GET(request: NextRequest) {
  if (!isEnabled(request)) return new NextResponse(null, { status: 404 });
  const nowParam = request.nextUrl.searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : new Date();
  if (Number.isNaN(now.getTime())) return NextResponse.json({ code: "INVALID_TIME_RANGE" }, { status: 400 });
  return NextResponse.json({ needs: await listPublicNeeds(validationPrisma, now) });
}

export async function POST(request: NextRequest) {
  if (!isEnabled(request)) return new NextResponse(null, { status: 404 });

  try {
    const body = (await request.json()) as { action?: string; userId?: string; input?: unknown };
    if (body.action === "reset") {
      await validationPrisma.validationBooking.deleteMany();
      await validationPrisma.validationCapacityBucket.deleteMany();
      await validationPrisma.validationService.deleteMany();
      await validationPrisma.validationNeedTask.deleteMany();
      await validationPrisma.validationPetSnapshot.deleteMany();
      await validationPrisma.validationNeed.deleteMany();
      await validationPrisma.validationLocation.deleteMany();
      await validationPrisma.validationPet.deleteMany();
      await validationPrisma.validationUser.deleteMany();
      const owner = await validationPrisma.validationUser.create({
        data: {
          email: "e2e-owner@petnido.example.invalid",
          pets: { create: { name: "Mugi", petType: "CAT" } },
        },
        include: { pets: true },
      });
      const boardingService = await validationPrisma.validationService.create({
        data: { mode: "BOARDING", state: "ACTIVE", maxPetCapacity: 4 },
      });
      return NextResponse.json({ ownerId: owner.id, petId: owner.pets[0].id, serviceId: boardingService.id });
    }
    if (body.action === "publish" && body.userId) {
      return NextResponse.json({ need: await publishHomeVisit(validationPrisma, body.userId, body.input) });
    }
    if (body.action === "confirmBooking") {
      return NextResponse.json({ booking: await confirmValidationBooking(validationPrisma, body.input) });
    }
    return NextResponse.json({ code: "INVALID_ACTION" }, { status: 400 });
  } catch (error) {
    const message = String(error);
    const code = message.includes("BOARDING_CAPACITY_EXCEEDED")
      ? "BOARDING_CAPACITY_EXCEEDED"
      : "VALIDATION_SLICE_ERROR";
    return NextResponse.json({ code }, { status: code === "BOARDING_CAPACITY_EXCEEDED" ? 409 : 400 });
  }
}
