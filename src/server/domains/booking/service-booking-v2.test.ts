import { describe, expect, it, vi } from "vitest";

import { BookingCommandError, cancelServiceBooking, confirmServiceBooking, createServiceBooking } from "./service-booking-v2";

const baseBooking = { id: "booking-1", idempotencyKey: "booking:key-1", requestKey: "request-1", serviceSource: "V2" as const, serviceId: "service-1", serviceTitleSnapshot: "Boarding", serviceModeSnapshot: "BOARDING", providerId: "provider", customerId: "customer", conversationId: "conversation-1", state: "PENDING" as const, startsAt: new Date("2026-08-05T00:00:00Z"), endsAt: new Date("2026-08-06T00:00:00Z"), timeZone: "UTC", petCount: 1, decidedAt: null, cancelledAt: null, createdAt: new Date(), updatedAt: new Date(), pets: [] };
function fixture() {
  const tx = {
    serviceBookingV2: { findUnique: vi.fn().mockResolvedValue(null), findFirst: vi.fn().mockResolvedValue(baseBooking), create: vi.fn().mockResolvedValue({ id: "booking-1", state: "PENDING" }), update: vi.fn().mockResolvedValue({}), updateMany: vi.fn().mockResolvedValue({ count: 1 }), aggregate: vi.fn().mockResolvedValue({ _sum: { petCount: 0 } }) },
    serviceV2: { findFirst: vi.fn().mockResolvedValue({ title: "Boarding", mode: "BOARDING", timeZone: "UTC", maxPetCapacity: 2, serviceProfile: { userId: "provider" }, availabilityRules: [{ kind: "WEEKLY", weekdays: [1,2,3,4,5,6,7], startsOn: null, endsOn: null }], availabilityExceptions: [], petPolicies: [{ petType: "DOG" }] }) },
    service: { findFirst: vi.fn() },
    pet: { findMany: vi.fn().mockResolvedValue([{ id: "pet-1", name: "Mochi", type: "DOG", customType: null, quantity: 1 }]) },
    conversationV2: { upsert: vi.fn().mockResolvedValue({ id: "conversation-1" }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    conversationParticipantV2: { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
    messageV2: { upsert: vi.fn().mockResolvedValue({ id: "message-1", createdAt: new Date("2026-08-04T00:00:00Z") }) },
    notificationV2: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) },
    user: { findFirst: vi.fn().mockResolvedValue(null) },
    emailOutboxV2: { upsert: vi.fn().mockResolvedValue({ id: "outbox-1" }) },
  };
  return { tx, prisma: { $transaction: vi.fn((callback: (value: typeof tx) => unknown, _options?: unknown) => callback(tx)) } };
}
const createInput = { actorId: "customer", target: { kind: "SERVICE" as const, publicId: "v2:service-1", source: "V2" as const, contextId: "service-1" }, startsAt: new Date("2026-08-05T00:00:00Z"), endsAt: new Date("2026-08-06T00:00:00Z"), pets: [{ petId: "pet-1", quantity: 1 }], body: "Please confirm", idempotencyKey: "booking:new-key", now: new Date("2026-08-04T00:00:00Z") };

describe("ServiceBookingV2 commands", () => {
  it("creates a PENDING request with owned pet snapshots, conversation and first message", async () => {
    const { tx, prisma } = fixture();
    const result = await createServiceBooking(prisma as never, createInput);
    expect(result).toMatchObject({ state: "PENDING", alreadyExists: false });
    expect(tx.serviceBookingV2.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ petCount: 1, pets: { create: [expect.objectContaining({ name: "Mochi", petType: "DOG" })] } }) }));
    expect(tx.messageV2.upsert).toHaveBeenCalledOnce();
    expect(tx.notificationV2.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ type: "BOOKING_REQUESTED", recipientId: "provider" }) }));
  });
  it("does not create another message when the idempotent booking already exists", async () => {
    const { tx, prisma } = fixture(); tx.serviceBookingV2.findUnique.mockResolvedValueOnce(baseBooking);
    const result = await createServiceBooking(prisma as never, { ...createInput, idempotencyKey: baseBooking.idempotencyKey });
    expect(result.alreadyExists).toBe(true); expect(tx.messageV2.upsert).not.toHaveBeenCalled();
  });
  it("rejects a new request when the service is paused or otherwise unavailable", async () => {
    const { tx, prisma } = fixture(); tx.serviceV2.findFirst.mockResolvedValueOnce(null);
    await expect(createServiceBooking(prisma as never, createInput)).rejects.toBeInstanceOf(BookingCommandError);
  });
  it("confirms an existing pending request without rechecking a later service pause", async () => {
    const { tx, prisma } = fixture();
    const result = await confirmServiceBooking(prisma as never, { providerId: "provider", bookingId: "booking-1", now: new Date("2026-08-04T00:00:00Z") });
    expect(result.state).toBe("CONFIRMED");
    expect(tx.serviceV2.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "service-1", serviceProfile: { userId: "provider" } } }));
    expect(tx.serviceV2.findFirst.mock.calls[0][0].where).not.toHaveProperty("state");
    expect(tx.notificationV2.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ type: "BOOKING_CONFIRMED", recipientId: "customer" }) }));
  });
  it("does not allow a provider to use cancellation as a substitute for declining PENDING", async () => {
    const { tx, prisma } = fixture(); tx.serviceBookingV2.findUnique.mockResolvedValueOnce(baseBooking);
    await expect(cancelServiceBooking(prisma as never, { actorId: "provider", bookingId: "booking-1" })).rejects.toEqual(expect.objectContaining({ code: "INVALID_STATE_TRANSITION" }));
    expect(tx.serviceBookingV2.update).not.toHaveBeenCalled();
  });
  it("allows the exact boarding capacity boundary and uses end-exclusive overlap", async () => {
    const { tx, prisma } = fixture(); tx.serviceBookingV2.aggregate.mockResolvedValueOnce({ _sum: { petCount: 1 } });
    await expect(confirmServiceBooking(prisma as never, { providerId: "provider", bookingId: "booking-1", now: new Date("2026-08-04T00:00:00Z") })).resolves.toMatchObject({ state: "CONFIRMED" });
    expect(tx.serviceBookingV2.aggregate).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ serviceId: "service-1", state: "CONFIRMED", startsAt: { lt: baseBooking.endsAt }, endsAt: { gt: baseBooking.startsAt } }) }));
    expect(prisma.$transaction.mock.calls[0][1]).toEqual(expect.objectContaining({ isolationLevel: "Serializable" }));
  });
  it("rejects a boarding confirmation that would exceed pet capacity", async () => {
    const { tx, prisma } = fixture(); tx.serviceBookingV2.aggregate.mockResolvedValueOnce({ _sum: { petCount: 2 } });
    await expect(confirmServiceBooking(prisma as never, { providerId: "provider", bookingId: "booking-1", now: new Date("2026-08-04T00:00:00Z") })).rejects.toEqual(expect.objectContaining({ code: "BOARDING_CAPACITY_EXCEEDED" }));
    expect(tx.serviceBookingV2.updateMany).not.toHaveBeenCalled();
  });
  it("does not apply boarding capacity to other service modes", async () => {
    const { tx, prisma } = fixture(); tx.serviceBookingV2.findFirst.mockResolvedValueOnce({ ...baseBooking, serviceModeSnapshot: "HOME_VISIT" });
    await confirmServiceBooking(prisma as never, { providerId: "provider", bookingId: "booking-1", now: new Date("2026-08-04T00:00:00Z") });
    expect(tx.serviceBookingV2.aggregate).not.toHaveBeenCalled();
  });
});
