import { transition } from "../shared/state-machine";

export const bookingStates = ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"] as const;
export type BookingState = (typeof bookingStates)[number];

export const bookingCommands = ["CONFIRM", "REJECT", "CANCEL", "COMPLETE"] as const;
export type BookingCommand = (typeof bookingCommands)[number];

const transitions: Readonly<Record<BookingState, Readonly<Partial<Record<BookingCommand, BookingState>>>>> = {
  PENDING: { CONFIRM: "CONFIRMED", REJECT: "REJECTED", CANCEL: "CANCELLED" },
  CONFIRMED: { CANCEL: "CANCELLED", COMPLETE: "COMPLETED" },
  REJECTED: {},
  CANCELLED: {},
  COMPLETED: {},
};

export function transitionBooking(from: BookingState, command: BookingCommand): BookingState {
  return transition("Booking", transitions, from, command);
}
