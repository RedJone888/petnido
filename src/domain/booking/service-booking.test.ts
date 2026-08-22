import { describe, expect, it } from "vitest";

import { bookingLocalDateKeys, bookingRequestKey, bookingWindowSchema, buildServiceBookingCalendar, intervalsOverlap, serviceAcceptsBookingDates, validateFutureBookingWindow } from "./service-booking";

describe("service booking domain", () => {
  it("requires a future, non-empty time range and unique selected pets", () => {
    const now = new Date("2026-08-04T00:00:00.000Z");
    expect(() => validateFutureBookingWindow(new Date("2026-08-05T00:00:00Z"), new Date("2026-08-06T00:00:00Z"), now)).not.toThrow();
    expect(() => validateFutureBookingWindow(now, new Date("2026-08-06T00:00:00Z"), now)).toThrow("INVALID_BOOKING_WINDOW");
    expect(bookingWindowSchema.safeParse({ startsAt: "2026-08-05", endsAt: "2026-08-06", pets: [{ petId: "pet-1", quantity: 1 }, { petId: "pet-1", quantity: 1 }] }).success).toBe(false);
  });

  it("builds the same duplicate-request key regardless of pet selection order", () => {
    const base = { serviceSource: "V2", serviceId: "service-1", customerId: "user-1", startsAt: new Date("2026-08-05T00:00:00Z"), endsAt: new Date("2026-08-06T00:00:00Z") };
    expect(bookingRequestKey({ ...base, pets: [{ petId: "b", quantity: 1 }, { petId: "a", quantity: 2 }] })).toBe(bookingRequestKey({ ...base, pets: [{ petId: "a", quantity: 2 }, { petId: "b", quantity: 1 }] }));
  });

  it("checks every local calendar date and gives explicit exceptions priority", () => {
    const dates = bookingLocalDateKeys(new Date("2026-08-03T15:00:00Z"), new Date("2026-08-05T15:00:00Z"), "Asia/Tokyo");
    expect(dates).toEqual(["2026-08-04", "2026-08-05"]);
    const rules = [{ kind: "WEEKLY", weekdays: [2, 3], startsOn: null, endsOn: null }];
    expect(serviceAcceptsBookingDates(dates, rules, [])).toBe(true);
    expect(serviceAcceptsBookingDates(dates, rules, [{ date: "2026-08-05", available: false }])).toBe(false);
  });

  it("uses end-exclusive overlap boundaries", () => {
    expect(intervalsOverlap({ startsAt: new Date("2026-08-05T00:00:00Z"), endsAt: new Date("2026-08-06T00:00:00Z") }, { startsAt: new Date("2026-08-06T00:00:00Z"), endsAt: new Date("2026-08-07T00:00:00Z") })).toBe(false);
  });

  it("sums confirmed pets per local day and shows boarding capacity remaining", () => {
    const days = buildServiceBookingCalendar({
      month: "2026-08", timeZone: "Asia/Tokyo", mode: "BOARDING", maxPetCapacity: 3,
      bookings: [
        { startsAt: new Date("2026-08-04T06:00:00Z"), endsAt: new Date("2026-08-05T15:00:00Z"), petCount: 2 },
        { startsAt: new Date("2026-08-05T00:00:00Z"), endsAt: new Date("2026-08-05T15:00:00Z"), petCount: 1 },
      ],
    });
    expect(days.find((day) => day.date === "2026-08-05")).toMatchObject({ confirmedBookingCount: 2, confirmedPetCount: 3, remainingPetCapacity: 0 });
    expect(days.find((day) => day.date === "2026-08-06")).toMatchObject({ confirmedBookingCount: 0, confirmedPetCount: 0, remainingPetCapacity: 3 });
  });

  it("does not invent capacity for non-boarding services", () => {
    const [day] = buildServiceBookingCalendar({ month: "2026-08", timeZone: "UTC", mode: "HOME_VISIT", maxPetCapacity: null, bookings: [] });
    expect(day.remainingPetCapacity).toBeNull();
  });
});
