import { transition } from "../shared/state-machine";

export const serviceStates = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type ServiceState = (typeof serviceStates)[number];

export const serviceCommands = ["PUBLISH", "PAUSE", "RESUME", "ARCHIVE"] as const;
export type ServiceCommand = (typeof serviceCommands)[number];

const transitions: Readonly<Record<ServiceState, Readonly<Partial<Record<ServiceCommand, ServiceState>>>>> = {
  DRAFT: { PUBLISH: "ACTIVE", ARCHIVE: "ARCHIVED" },
  ACTIVE: { PAUSE: "PAUSED", ARCHIVE: "ARCHIVED" },
  PAUSED: { RESUME: "ACTIVE", ARCHIVE: "ARCHIVED" },
  ARCHIVED: {},
};

export function transitionService(from: ServiceState, command: ServiceCommand): ServiceState {
  return transition("Service", transitions, from, command);
}
