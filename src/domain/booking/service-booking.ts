import { createHash } from "node:crypto";
import { z } from "zod";

export const bookingPetInputSchema = z.object({ petId: z.string().min(1).max(128), quantity: z.number().int().min(1).max(100) }).strict();
export const bookingWindowSchema = z.object({
  startsAt: z.coerce.date(), endsAt: z.coerce.date(),
  pets: z.array(bookingPetInputSchema).min(1).max(20),
}).strict().superRefine((value, ctx) => {
  if (value.startsAt >= value.endsAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "INVALID_TIME_RANGE" });
  if (new Set(value.pets.map((pet) => pet.petId)).size !== value.pets.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pets"], message: "DUPLICATE_PET" });
});

export function validateFutureBookingWindow(startsAt: Date, endsAt: Date, now: Date) {
  if (startsAt <= now || endsAt <= startsAt) throw new Error("INVALID_BOOKING_WINDOW");
}

export function bookingRequestKey(input: { serviceSource: string; serviceId: string; customerId: string; startsAt: Date; endsAt: Date; pets: { petId: string; quantity: number }[] }) {
  const normalizedPets = [...input.pets].sort((a, b) => a.petId.localeCompare(b.petId));
  return createHash("sha256").update(JSON.stringify({ ...input, startsAt: input.startsAt.toISOString(), endsAt: input.endsAt.toISOString(), pets: normalizedPets })).digest("hex");
}

function dateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function bookingLocalDateKeys(startsAt: Date, endsAt: Date, timeZone: string) {
  const first = dateKey(startsAt, timeZone);
  const last = dateKey(new Date(endsAt.getTime() - 1), timeZone);
  const keys: string[] = [];
  for (let day = new Date(`${first}T00:00:00.000Z`); day <= new Date(`${last}T00:00:00.000Z`); day = new Date(day.getTime() + 86_400_000)) keys.push(day.toISOString().slice(0, 10));
  return keys;
}

export function serviceAcceptsBookingDates(
  dates: string[],
  rules: { kind: string; weekdays: number[]; startsOn: string | null; endsOn: string | null }[],
  exceptions: { date: string; available: boolean }[],
) {
  return dates.every((date) => {
    const exception = exceptions.find((item) => item.date === date);
    if (exception) return exception.available;
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;
    return rules.some((rule) => rule.kind === "WEEKLY" ? rule.weekdays.includes(weekday) : Boolean(rule.startsOn && rule.endsOn && date >= rule.startsOn && date <= rule.endsOn));
  });
}

export function intervalsOverlap(first: { startsAt: Date; endsAt: Date }, second: { startsAt: Date; endsAt: Date }) {
  return first.startsAt < second.endsAt && second.startsAt < first.endsAt;
}

export function buildServiceBookingCalendar(input: {
  month: string;
  timeZone: string;
  mode: string;
  maxPetCapacity: number | null;
  bookings: { startsAt: Date; endsAt: Date; petCount: number }[];
}) {
  const first = new Date(`${input.month}-01T00:00:00.000Z`);
  const nextMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
  const days = [];
  for (let cursor = first; cursor < nextMonth; cursor = new Date(cursor.getTime() + 86_400_000)) {
    const date = cursor.toISOString().slice(0, 10);
    const active = input.bookings.filter((booking) => bookingLocalDateKeys(booking.startsAt, booking.endsAt, input.timeZone).includes(date));
    const confirmedPetCount = active.reduce((sum, booking) => sum + booking.petCount, 0);
    days.push({
      date,
      confirmedBookingCount: active.length,
      confirmedPetCount,
      remainingPetCapacity: input.mode === "BOARDING" && input.maxPetCapacity !== null
        ? Math.max(0, input.maxPetCapacity - confirmedPetCount)
        : null,
    });
  }
  return days;
}
