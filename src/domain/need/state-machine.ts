import { transition } from "../shared/state-machine";

export const needStates = ["OPEN", "MATCHED", "CLOSED"] as const;
export type NeedState = (typeof needStates)[number];

export const needCommands = [
  "SELECT_PROVIDER",
  "REMOVE_PROVIDER",
  "CANCEL_MATCH",
  "CLOSE",
  "REOPEN",
] as const;
export type NeedCommand = (typeof needCommands)[number];

const transitions: Readonly<Record<NeedState, Readonly<Partial<Record<NeedCommand, NeedState>>>>> = {
  OPEN: { SELECT_PROVIDER: "MATCHED", CLOSE: "CLOSED" },
  // Removing a provider is retained for the matching workflow's legacy
  // transition. User-facing need editing must use CANCEL_MATCH, which moves
  // the request to CLOSED until the owner explicitly reopens it.
  MATCHED: {
    REMOVE_PROVIDER: "OPEN",
    CANCEL_MATCH: "CLOSED",
    CLOSE: "CLOSED",
  },
  CLOSED: { REOPEN: "OPEN" },
};

export function transitionNeed(from: NeedState, command: NeedCommand): NeedState {
  return transition("Need", transitions, from, command);
}

export function isNeedExpired(endDate: Date, now: Date): boolean {
  return endDate.getTime() <= now.getTime();
}

export function isNeedPublic(state: NeedState, endDate: Date, now: Date): boolean {
  return state === "OPEN" && !isNeedExpired(endDate, now);
}

export function canStartNeedInteraction(state: NeedState, endDate: Date, now: Date): boolean {
  return isNeedPublic(state, endDate, now);
}

/** Published NeedV2 records that may enter the shared edit flow. */
export function canEditPublishedNeed(state: NeedState): boolean {
  return state === "OPEN" || state === "CLOSED";
}

/** A deleted/archived need can never be edited or used as a template. */
export function canReusePublishedNeed(state: NeedState): boolean {
  return state === "OPEN" || state === "MATCHED" || state === "CLOSED";
}
