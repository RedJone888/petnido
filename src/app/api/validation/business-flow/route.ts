import { NextResponse } from "next/server";

import { getValidationPrisma } from "@/lib/validation-prisma";
import { conversationPairKey } from "@/domain/messaging/conversation";
import {
  hasValidProfileValidationToken,
  validationProfileUserId,
} from "@/server/validation/profile-session";

const fixture = {
  counterpartUserId: "validation-business-counterpart",
  ownerNeedId: "validation-business-owner-need",
  publicNeedId: "validation-business-public-need",
  providerServiceId: "validation-business-provider-service",
  applicationId: "validation-business-application",
  bookingId: "validation-business-booking",
  applicationConversationId: "validation-business-application-conversation",
  bookingConversationId: "validation-business-booking-conversation",
  ownerNeedLocationId: "validation-business-owner-need-location",
  publicNeedLocationId: "validation-business-public-need-location",
  providerServiceLocationId: "validation-business-provider-service-location",
} as const;

export async function DELETE(request: Request) {
  if (!hasValidProfileValidationToken(request)) {
    return new NextResponse(null, { status: 404 });
  }
  const prisma = getValidationPrisma();
  await prisma.$transaction(async (tx) => {
    const conversations = await tx.conversationV2.findMany({
      where: {
        OR: [
          { id: { in: [fixture.applicationConversationId, fixture.bookingConversationId] } },
          {
            contextSource: "V2",
            contextId: { in: [fixture.ownerNeedId, fixture.publicNeedId, fixture.providerServiceId] },
          },
        ],
      },
      select: { id: true },
    });
    const conversationIds = conversations.map((conversation) => conversation.id);
    await tx.notificationV2.deleteMany({
      where: { resourceId: { in: [fixture.applicationId, fixture.bookingId, ...conversationIds] } },
    });
    await tx.needApplicationV2.deleteMany({ where: { id: fixture.applicationId } });
    await tx.serviceBookingV2.deleteMany({ where: { id: fixture.bookingId } });
    await tx.conversationV2.deleteMany({ where: { id: { in: conversationIds } } });
    await tx.favoriteV2.deleteMany({
      where: {
        userId: validationProfileUserId,
        targetSource: "V2",
        targetId: { in: [fixture.ownerNeedId, fixture.publicNeedId, fixture.providerServiceId] },
      },
    });
    await tx.needV2.deleteMany({
      where: { id: { in: [fixture.ownerNeedId, fixture.publicNeedId] } },
    });
    await tx.serviceV2.deleteMany({ where: { id: fixture.providerServiceId } });
    await tx.locationSnapshotV2.deleteMany({
      where: {
        id: {
          in: [
            fixture.ownerNeedLocationId,
            fixture.publicNeedLocationId,
            fixture.providerServiceLocationId,
          ],
        },
      },
    });
  });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!hasValidProfileValidationToken(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const prisma = getValidationPrisma();
  const now = new Date();
  const startsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const endsAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const conversations = await tx.conversationV2.findMany({
      where: {
        OR: [
          { id: { in: [fixture.applicationConversationId, fixture.bookingConversationId] } },
          {
            contextSource: "V2",
            contextId: { in: [fixture.ownerNeedId, fixture.publicNeedId, fixture.providerServiceId] },
          },
        ],
      },
      select: { id: true },
    });
    const conversationIds = conversations.map((conversation) => conversation.id);
    await tx.notificationV2.deleteMany({
      where: { resourceId: { in: [fixture.applicationId, fixture.bookingId, ...conversationIds] } },
    });
    await tx.needApplicationV2.deleteMany({ where: { id: fixture.applicationId } });
    await tx.serviceBookingV2.deleteMany({ where: { id: fixture.bookingId } });
    await tx.conversationV2.deleteMany({ where: { id: { in: conversationIds } } });
    await tx.favoriteV2.deleteMany({
      where: {
        userId: validationProfileUserId,
        targetSource: "V2",
        targetId: { in: [fixture.ownerNeedId, fixture.publicNeedId, fixture.providerServiceId] },
      },
    });
    await tx.needV2.deleteMany({
      where: { id: { in: [fixture.ownerNeedId, fixture.publicNeedId] } },
    });
    await tx.serviceV2.deleteMany({ where: { id: fixture.providerServiceId } });
    await tx.locationSnapshotV2.deleteMany({
      where: {
        id: {
          in: [
            fixture.ownerNeedLocationId,
            fixture.publicNeedLocationId,
            fixture.providerServiceLocationId,
          ],
        },
      },
    });

    await tx.user.upsert({
      where: { id: fixture.counterpartUserId },
      update: { name: "Alex Chen" },
      create: {
        id: fixture.counterpartUserId,
        email: "business-counterpart@petnido.invalid",
        name: "Alex Chen",
        profile: {
          create: {
            onboardingStep: "COMPLETE",
            preferredLocale: "en",
            timeZone: "Asia/Tokyo",
            isOwner: true,
            isSitter: true,
            bio: "Fixture counterpart for isolated browser acceptance.",
          },
        },
        serviceProfile: {
          create: {
            introduction: "Experienced with calm indoor pets and daily routines.",
            monthsExperience: 24,
            baseCurrency: "JPY",
            isAccepting: true,
          },
        },
      },
    });
    await tx.profile.upsert({
      where: { userId: fixture.counterpartUserId },
      update: { onboardingStep: "COMPLETE", isSitter: true },
      create: {
        userId: fixture.counterpartUserId,
        onboardingStep: "COMPLETE",
        preferredLocale: "en",
        timeZone: "Asia/Tokyo",
        isOwner: true,
        isSitter: true,
      },
    });
    await tx.serviceProfile.upsert({
      where: { userId: fixture.counterpartUserId },
      update: {
        introduction: "Experienced with calm indoor pets and daily routines.",
        monthsExperience: 24,
        baseCurrency: "JPY",
        isAccepting: true,
      },
      create: {
        userId: fixture.counterpartUserId,
        introduction: "Experienced with calm indoor pets and daily routines.",
        monthsExperience: 24,
        baseCurrency: "JPY",
        isAccepting: true,
      },
    });
    const providerProfile = await tx.serviceProfile.findUniqueOrThrow({
      where: { userId: validationProfileUserId },
      select: { id: true },
    });

    await tx.locationSnapshotV2.createMany({
      data: [
        {
          id: fixture.ownerNeedLocationId,
          lat: 35.6812,
          lon: 139.7671,
          regionLabel: "Chiyoda, Tokyo",
          displayPrecision: "DISTRICT",
        },
        {
          id: fixture.publicNeedLocationId,
          lat: 35.6895,
          lon: 139.6917,
          regionLabel: "Shinjuku, Tokyo",
          displayPrecision: "DISTRICT",
        },
        {
          id: fixture.providerServiceLocationId,
          lat: 35.6812,
          lon: 139.7671,
          regionLabel: "Chiyoda, Tokyo",
          displayPrecision: "DISTRICT",
        },
      ],
    });
    await tx.needV2.create({
      data: {
        id: fixture.ownerNeedId,
        idempotencyKey: "validation-business-owner-need-key",
        ownerId: validationProfileUserId,
        mode: "HOME_VISIT",
        state: "OPEN",
        description: "A real state-machine fixture for received applications.",
        startsAt,
        endsAt,
        timeZone: "Asia/Tokyo",
        locationSnapshotId: fixture.ownerNeedLocationId,
        budgetKind: "EXACT",
        minAmountMinor: 6000,
        currency: "JPY",
        pets: {
          create: {
            clientPetKey: "owner-cat",
            quantity: 1,
            name: "Mochi",
            petType: "CAT",
            sex: "UNKNOWN",
            neutered: "UNKNOWN",
          },
        },
      },
    });
    await tx.needV2.create({
      data: {
        id: fixture.publicNeedId,
        idempotencyKey: "validation-business-public-need-key",
        ownerId: fixture.counterpartUserId,
        mode: "CUSTOM",
        state: "OPEN",
        description: "Feed a rabbit and refresh water during the weekend.",
        startsAt,
        endsAt,
        timeZone: "Asia/Tokyo",
        locationSnapshotId: fixture.publicNeedLocationId,
        budgetKind: "EXACT",
        minAmountMinor: 5000,
        currency: "JPY",
        pets: {
          create: {
            clientPetKey: "public-rabbit",
            quantity: 1,
            name: "Bun",
            petType: "RABBIT",
            sex: "UNKNOWN",
            neutered: "UNKNOWN",
          },
        },
        tasks: {
          create: {
            clientTaskKey: "feed-rabbit",
            category: "FEEDING",
            label: "Feed and refresh water",
            priority: "MUST",
            scheduleKind: "DAILY",
            visitNumbers: "[]",
            order: 0,
          },
        },
      },
    });
    await tx.serviceV2.create({
      data: {
        id: fixture.providerServiceId,
        idempotencyKey: "validation-business-provider-service-key",
        serviceProfileId: providerProfile.id,
        mode: "BOARDING",
        state: "ACTIVE",
        title: "Mika's home boarding",
        description: "Quiet boarding for cats and rabbits.",
        timeZone: "Asia/Tokyo",
        locationSnapshotId: fixture.providerServiceLocationId,
        currency: "JPY",
        serviceRadiusMeters: 20_000,
        maxPetCapacity: 3,
      },
    });

    const pairKey = conversationPairKey(
      validationProfileUserId,
      fixture.counterpartUserId,
    );
    await tx.conversationV2.create({
      data: {
        id: fixture.applicationConversationId,
        contextKind: "NEED",
        contextSource: "V2",
        contextId: fixture.ownerNeedId,
        contextTitle: "Care for Mika's cat",
        contextMode: "HOME_VISIT",
        participantPairKey: pairKey,
        createdById: fixture.counterpartUserId,
        lastMessageAt: now,
        participants: {
          create: [
            { userId: validationProfileUserId },
            { userId: fixture.counterpartUserId, lastReadAt: now },
          ],
        },
        messages: {
          create: {
            id: "validation-business-application-message",
            senderId: fixture.counterpartUserId,
            kind: "USER",
            body: "I can help with this request and have relevant cat-care experience.",
            clientMessageId: "validation-business-application-message-key",
            createdAt: now,
          },
        },
      },
    });
    await tx.conversationV2.create({
      data: {
        id: fixture.bookingConversationId,
        contextKind: "SERVICE",
        contextSource: "V2",
        contextId: fixture.providerServiceId,
        contextTitle: "Mika's home boarding",
        contextMode: "BOARDING",
        participantPairKey: pairKey,
        createdById: fixture.counterpartUserId,
        lastMessageAt: new Date(now.getTime() + 1000),
        participants: {
          create: [
            { userId: validationProfileUserId },
            { userId: fixture.counterpartUserId, lastReadAt: now },
          ],
        },
        messages: {
          create: {
            id: "validation-business-booking-message",
            senderId: fixture.counterpartUserId,
            kind: "USER",
            body: "Could you host my rabbit during this time window?",
            clientMessageId: "validation-business-booking-message-key",
            createdAt: new Date(now.getTime() + 1000),
          },
        },
      },
    });
    await tx.needApplicationV2.create({
      data: {
        id: fixture.applicationId,
        idempotencyKey: "validation-business-application-key",
        needSource: "V2",
        needId: fixture.ownerNeedId,
        needTitleSnapshot: "Care for Mika's cat",
        needModeSnapshot: "HOME_VISIT",
        ownerId: validationProfileUserId,
        applicantId: fixture.counterpartUserId,
        conversationId: fixture.applicationConversationId,
      },
    });
    await tx.serviceBookingV2.create({
      data: {
        id: fixture.bookingId,
        idempotencyKey: "validation-business-booking-key",
        requestKey: "validation-business-booking-request-key",
        serviceSource: "V2",
        serviceId: fixture.providerServiceId,
        serviceTitleSnapshot: "Mika's home boarding",
        serviceModeSnapshot: "BOARDING",
        providerId: validationProfileUserId,
        customerId: fixture.counterpartUserId,
        conversationId: fixture.bookingConversationId,
        startsAt,
        endsAt,
        timeZone: "Asia/Tokyo",
        petCount: 1,
        pets: {
          create: {
            name: "Bun",
            petType: "RABBIT",
            quantity: 1,
          },
        },
      },
    });
    await tx.notificationV2.createMany({
      data: [
        {
          eventKey: "validation-business-application-received",
          recipientId: validationProfileUserId,
          actorId: fixture.counterpartUserId,
          type: "APPLICATION_RECEIVED",
          resourceKind: "APPLICATION",
          resourceId: fixture.applicationId,
          subject: "Care for Mika's cat",
        },
        {
          eventKey: "validation-business-booking-requested",
          recipientId: validationProfileUserId,
          actorId: fixture.counterpartUserId,
          type: "BOOKING_REQUESTED",
          resourceKind: "BOOKING",
          resourceId: fixture.bookingId,
          subject: "Mika's home boarding",
        },
      ],
    });
  });

  return NextResponse.json({
    ok: true,
    publicNeedId: `v2:${fixture.publicNeedId}`,
    applicationId: fixture.applicationId,
    bookingId: fixture.bookingId,
    applicationConversationId: fixture.applicationConversationId,
  });
}
