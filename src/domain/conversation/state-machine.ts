import { transition } from "../shared/state-machine";

export type ConversationState = "ACTIVE" | "ARCHIVED";
export type ConversationCommand = "ARCHIVE" | "REOPEN";

const transitions: Readonly<
  Record<ConversationState, Readonly<Partial<Record<ConversationCommand, ConversationState>>>>
> = {
  ACTIVE: { ARCHIVE: "ARCHIVED" },
  ARCHIVED: { REOPEN: "ACTIVE" },
};

export function transitionConversation(
  from: ConversationState,
  command: ConversationCommand,
): ConversationState {
  return transition("Conversation", transitions, from, command);
}
