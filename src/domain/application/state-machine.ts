import { transition } from "../shared/state-machine";

export const applicationStates = ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "NEED_ENDED"] as const;
export type ApplicationState = (typeof applicationStates)[number];

export const applicationCommands = ["ACCEPT", "DECLINE", "CANCEL", "END_WITH_NEED"] as const;
export type ApplicationCommand = (typeof applicationCommands)[number];

const transitions: Readonly<
  Record<ApplicationState, Readonly<Partial<Record<ApplicationCommand, ApplicationState>>>>
> = {
  PENDING: {
    ACCEPT: "ACCEPTED",
    DECLINE: "DECLINED",
    CANCEL: "CANCELLED",
    END_WITH_NEED: "NEED_ENDED",
  },
  ACCEPTED: { CANCEL: "CANCELLED", END_WITH_NEED: "NEED_ENDED" },
  DECLINED: {},
  CANCELLED: {},
  NEED_ENDED: {},
};

export function transitionApplication(
  from: ApplicationState,
  command: ApplicationCommand,
): ApplicationState {
  return transition("Application", transitions, from, command);
}
