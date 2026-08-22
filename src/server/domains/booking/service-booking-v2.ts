import { Prisma, type PrismaClient } from "@prisma/client";

import { bookingLocalDateKeys, bookingRequestKey, serviceAcceptsBookingDates, validateFutureBookingWindow } from "@/domain/booking/service-booking";
import type { ConversationContextTarget } from "@/domain/messaging/conversation";
import { appendSystemMessage, ensureConversationWithUserMessage } from "@/server/domains/messaging/conversation-v2";
import { createNotificationEvent } from "@/server/domains/notification/notification-v2";

export type BookingCommandErrorCode = "RESOURCE_NOT_FOUND" | "FORBIDDEN_RESOURCE_ACTION" | "INVALID_STATE_TRANSITION" | "CONFLICTING_UPDATE" | "IDEMPOTENCY_KEY_REUSED" | "INVALID_BOOKING_WINDOW" | "SERVICE_UNAVAILABLE" | "PET_NOT_ACCEPTED" | "BOARDING_CAPACITY_EXCEEDED";
export class BookingCommandError extends Error {
  constructor(public readonly code: BookingCommandErrorCode) { super(code); }
}

function dateOnly(value: Date | null) { return value ? value.toISOString().slice(0, 10) : null; }

async function resolveBookableService(tx: Prisma.TransactionClient, target: ConversationContextTarget, actorId: string) {
  if (target.kind !== "SERVICE") throw new BookingCommandError("RESOURCE_NOT_FOUND");
  if (target.source === "V2") {
    const service = await tx.serviceV2.findFirst({
      where: { id: target.contextId, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
      select: {
        title: true, mode: true, timeZone: true, maxPetCapacity: true,
        serviceProfile: { select: { userId: true } },
        availabilityRules: { select: { kind: true, weekdays: true, startsOn: true, endsOn: true } },
        availabilityExceptions: { select: { date: true, available: true } },
        petPolicies: { where: { accepted: true }, select: { petType: true } },
      },
    });
    if (!service) throw new BookingCommandError("RESOURCE_NOT_FOUND");
    if (service.serviceProfile.userId === actorId) throw new BookingCommandError("FORBIDDEN_RESOURCE_ACTION");
    return {
      providerId: service.serviceProfile.userId, title: service.title, mode: service.mode, timeZone: service.timeZone,
      maxPetCapacity: service.maxPetCapacity,
      rules: service.availabilityRules.map((rule) => ({ ...rule, weekdays: rule.weekdays, startsOn: dateOnly(rule.startsOn), endsOn: dateOnly(rule.endsOn) })),
      exceptions: service.availabilityExceptions.map((item) => ({ date: dateOnly(item.date)!, available: item.available })),
      acceptedPetTypes: service.petPolicies.map((item) => item.petType),
    };
  }
  const service = await tx.service.findFirst({
    where: { id: target.contextId, isActive: true, archivedAt: null, serviceProfile: { isAccepting: true } },
    select: {
      serviceType: true, customType: true, availabilityRangeType: true, availabilityWeekPattern: true,
      availableFrom: true, availableTo: true, petTypes: true, serviceProfile: { select: { userId: true } },
    },
  });
  if (!service) throw new BookingCommandError("RESOURCE_NOT_FOUND");
  if (service.serviceProfile.userId === actorId) throw new BookingCommandError("FORBIDDEN_RESOURCE_ACTION");
  const mode = service.serviceType === "VISIT" ? "HOME_VISIT" : service.serviceType === "FOSTER" ? "BOARDING" : "CUSTOM";
  const weekdays = service.availabilityWeekPattern === "WEEKDAYS_ONLY" ? [1, 2, 3, 4, 5] : service.availabilityWeekPattern === "WEEKENDS_ONLY" ? [6, 7] : [1, 2, 3, 4, 5, 6, 7];
  return {
    providerId: service.serviceProfile.userId,
    title: mode === "CUSTOM" && service.customType ? service.customType : mode === "HOME_VISIT" ? "Home visit care" : "Boarding care",
    mode, timeZone: "Asia/Tokyo", maxPetCapacity: null,
    rules: [{ kind: service.availabilityRangeType === "DATE_RANGE" ? "DATE_RANGE" : "WEEKLY", weekdays: service.availabilityRangeType === "DATE_RANGE" ? [] : weekdays, startsOn: dateOnly(service.availableFrom), endsOn: dateOnly(service.availableTo) }],
    exceptions: [], acceptedPetTypes: service.petTypes.map(String),
  };
}

export async function createServiceBooking(prisma: PrismaClient, input: {
  actorId: string; target: ConversationContextTarget; startsAt: Date; endsAt: Date;
  pets: { petId: string; quantity: number }[]; body: string; idempotencyKey: string; now?: Date;
}) {
  const now = input.now ?? new Date();
  try { validateFutureBookingWindow(input.startsAt, input.endsAt, now); }
  catch { throw new BookingCommandError("INVALID_BOOKING_WINDOW"); }
  return prisma.$transaction(async (tx) => {
    const byKey = await tx.serviceBookingV2.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { pets: true } });
    if (byKey) {
      if (byKey.customerId !== input.actorId || byKey.serviceSource !== input.target.source || byKey.serviceId !== input.target.contextId) throw new BookingCommandError("IDEMPOTENCY_KEY_REUSED");
      return { bookingId: byKey.id, conversationId: byKey.conversationId, state: byKey.state, alreadyExists: true };
    }
    const key = bookingRequestKey({ serviceSource: input.target.source, serviceId: input.target.contextId, customerId: input.actorId, startsAt: input.startsAt, endsAt: input.endsAt, pets: input.pets });
    const duplicate = await tx.serviceBookingV2.findUnique({ where: { requestKey: key } });
    if (duplicate) return { bookingId: duplicate.id, conversationId: duplicate.conversationId, state: duplicate.state, alreadyExists: true };
    const service = await resolveBookableService(tx, input.target, input.actorId);
    const pets = await tx.pet.findMany({ where: { id: { in: input.pets.map((pet) => pet.petId) }, ownerId: input.actorId, archivedAt: null }, select: { id: true, name: true, type: true, customType: true, quantity: true } });
    if (pets.length !== input.pets.length) throw new BookingCommandError("RESOURCE_NOT_FOUND");
    const snapshots = input.pets.map((selection) => {
      const pet = pets.find((item) => item.id === selection.petId)!;
      if (selection.quantity > pet.quantity) throw new BookingCommandError("CONFLICTING_UPDATE");
      const petType = pet.customType || String(pet.type);
      if (service.acceptedPetTypes.length && !service.acceptedPetTypes.includes(petType) && !service.acceptedPetTypes.includes(String(pet.type))) throw new BookingCommandError("PET_NOT_ACCEPTED");
      return { sourcePetId: pet.id, name: pet.name || petType, petType, quantity: selection.quantity };
    });
    const dates = bookingLocalDateKeys(input.startsAt, input.endsAt, service.timeZone);
    if (!serviceAcceptsBookingDates(dates, service.rules, service.exceptions)) throw new BookingCommandError("SERVICE_UNAVAILABLE");
    const conversation = await ensureConversationWithUserMessage(tx, {
      actorId: input.actorId, counterpartId: service.providerId, target: input.target,
      contextTitle: service.title, contextMode: service.mode, body: input.body, clientMessageId: input.idempotencyKey,
    });
    const booking = await tx.serviceBookingV2.create({
      data: {
        idempotencyKey: input.idempotencyKey, requestKey: key, serviceSource: input.target.source, serviceId: input.target.contextId,
        serviceTitleSnapshot: service.title, serviceModeSnapshot: service.mode, providerId: service.providerId, customerId: input.actorId,
        conversationId: conversation.conversationId, startsAt: input.startsAt, endsAt: input.endsAt, timeZone: service.timeZone,
        petCount: snapshots.reduce((sum, pet) => sum + pet.quantity, 0), pets: { create: snapshots },
      },
      select: { id: true, state: true },
    });
    await createNotificationEvent(tx, {
      eventKey: `booking:${booking.id}:requested`, recipientId: service.providerId, actorId: input.actorId,
      type: "BOOKING_REQUESTED", resourceKind: "BOOKING", resourceId: booking.id, subject: service.title,
    });
    return { bookingId: booking.id, conversationId: conversation.conversationId, state: booking.state, alreadyExists: false };
  });
}

export async function confirmServiceBooking(prisma: PrismaClient, input: { providerId: string; bookingId: string; now?: Date }, options: { enforceBoardingCapacity?: boolean } = {}) {
  const now = input.now ?? new Date();
  try {
    return await prisma.$transaction(async (tx) => {
    const booking = await tx.serviceBookingV2.findFirst({ where: { id: input.bookingId, providerId: input.providerId } });
    if (!booking) throw new BookingCommandError("RESOURCE_NOT_FOUND");
    if (booking.state === "CONFIRMED") return { bookingId: booking.id, state: booking.state };
    if (booking.state !== "PENDING" || booking.endsAt <= now) throw new BookingCommandError("INVALID_STATE_TRANSITION");
    if (options.enforceBoardingCapacity !== false && booking.serviceSource === "V2" && booking.serviceModeSnapshot === "BOARDING") {
      const service = await tx.serviceV2.findFirst({ where: { id: booking.serviceId, serviceProfile: { userId: input.providerId } }, select: { mode: true, maxPetCapacity: true } });
      if (!service) throw new BookingCommandError("RESOURCE_NOT_FOUND");
      if (service.mode === "BOARDING" && service.maxPetCapacity !== null) {
        const occupied = await tx.serviceBookingV2.aggregate({
          where: {
            serviceSource: "V2", serviceId: booking.serviceId, state: "CONFIRMED",
            startsAt: { lt: booking.endsAt }, endsAt: { gt: booking.startsAt },
          },
          _sum: { petCount: true },
        });
        if ((occupied._sum.petCount ?? 0) + booking.petCount > service.maxPetCapacity) throw new BookingCommandError("BOARDING_CAPACITY_EXCEEDED");
      }
    }
    const updated = await tx.serviceBookingV2.updateMany({ where: { id: booking.id, providerId: input.providerId, state: "PENDING" }, data: { state: "CONFIRMED", decidedAt: now } });
    if (updated.count !== 1) throw new BookingCommandError("CONFLICTING_UPDATE");
    await appendSystemMessage(tx, { conversationId: booking.conversationId, systemCode: "BOOKING_CONFIRMED", body: "The service provider confirmed this booking.", clientMessageId: `booking:${booking.id}:confirmed` });
    await createNotificationEvent(tx, {
      eventKey: `booking:${booking.id}:confirmed`, recipientId: booking.customerId, actorId: input.providerId,
      type: "BOOKING_CONFIRMED", resourceKind: "BOOKING", resourceId: booking.id, subject: booking.serviceTitleSnapshot,
    });
    return { bookingId: booking.id, state: "CONFIRMED" as const };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof BookingCommandError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") throw new BookingCommandError("CONFLICTING_UPDATE");
    throw error;
  }
}

export async function declineServiceBooking(prisma: PrismaClient, input: { providerId: string; bookingId: string; now?: Date }) {
  const now = input.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const booking = await tx.serviceBookingV2.findFirst({ where: { id: input.bookingId, providerId: input.providerId } });
    if (!booking) throw new BookingCommandError("RESOURCE_NOT_FOUND");
    if (booking.state === "DECLINED") return { bookingId: booking.id, state: booking.state };
    if (booking.state !== "PENDING") throw new BookingCommandError("INVALID_STATE_TRANSITION");
    await tx.serviceBookingV2.update({ where: { id: booking.id }, data: { state: "DECLINED", decidedAt: now } });
    await appendSystemMessage(tx, { conversationId: booking.conversationId, systemCode: "BOOKING_DECLINED", body: "The service provider declined this booking request.", clientMessageId: `booking:${booking.id}:declined` });
    await createNotificationEvent(tx, {
      eventKey: `booking:${booking.id}:declined`, recipientId: booking.customerId, actorId: input.providerId,
      type: "BOOKING_DECLINED", resourceKind: "BOOKING", resourceId: booking.id, subject: booking.serviceTitleSnapshot,
    });
    return { bookingId: booking.id, state: "DECLINED" as const };
  });
}

export async function cancelServiceBooking(prisma: PrismaClient, input: { actorId: string; bookingId: string; now?: Date }) {
  const now = input.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const booking = await tx.serviceBookingV2.findUnique({ where: { id: input.bookingId } });
    if (!booking) throw new BookingCommandError("RESOURCE_NOT_FOUND");
    const customer = booking.customerId === input.actorId;
    const provider = booking.providerId === input.actorId;
    if (!customer && !provider) throw new BookingCommandError("FORBIDDEN_RESOURCE_ACTION");
    if (booking.state === "CANCELLED") return { bookingId: booking.id, state: booking.state };
    if (booking.state !== "PENDING" && booking.state !== "CONFIRMED") throw new BookingCommandError("INVALID_STATE_TRANSITION");
    if (provider && booking.state !== "CONFIRMED") throw new BookingCommandError("INVALID_STATE_TRANSITION");
    await tx.serviceBookingV2.update({ where: { id: booking.id }, data: { state: "CANCELLED", cancelledAt: now } });
    await appendSystemMessage(tx, { conversationId: booking.conversationId, systemCode: provider ? "BOOKING_PROVIDER_CANCELLED" : "BOOKING_CUSTOMER_CANCELLED", body: provider ? "The service provider cancelled the confirmed booking." : "The customer cancelled the booking request.", clientMessageId: `booking:${booking.id}:cancelled` });
    await createNotificationEvent(tx, {
      eventKey: `booking:${booking.id}:cancelled:${input.actorId}`,
      recipientId: provider ? booking.customerId : booking.providerId,
      actorId: input.actorId, type: "BOOKING_CANCELLED", resourceKind: "BOOKING", resourceId: booking.id,
      subject: booking.serviceTitleSnapshot,
    });
    return { bookingId: booking.id, state: "CANCELLED" as const };
  });
}
