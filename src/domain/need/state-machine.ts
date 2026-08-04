import { transition } from "../shared/state-machine";

export const needStates = ["DRAFT", "OPEN", "MATCHED", "CLOSED", "CANCELLED"] as const;
export type NeedState = (typeof needStates)[number];

export const needCommands = ["PUBLISH", "SELECT_PROVIDER", "REMOVE_PROVIDER", "CLOSE", "CANCEL"] as const;
export type NeedCommand = (typeof needCommands)[number];

const transitions: Readonly<Record<NeedState, Readonly<Partial<Record<NeedCommand, NeedState>>>>> = {
  DRAFT: { PUBLISH: "OPEN", CANCEL: "CANCELLED" },
  OPEN: { SELECT_PROVIDER: "MATCHED", CLOSE: "CLOSED", CANCEL: "CANCELLED" },
  MATCHED: { REMOVE_PROVIDER: "OPEN", CLOSE: "CLOSED", CANCEL: "CANCELLED" },
  CLOSED: {},
  CANCELLED: {},
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
