export class DomainTransitionError extends Error {
  readonly code = "INVALID_STATE_TRANSITION";

  constructor(
    readonly aggregate: string,
    readonly from: string,
    readonly command: string,
  ) {
    super(`${aggregate} cannot execute ${command} from ${from}`);
    this.name = "DomainTransitionError";
  }
}

export function transition<State extends string, Command extends string>(
  aggregate: string,
  table: Readonly<Record<State, Readonly<Partial<Record<Command, State>>>>>,
  from: State,
  command: Command,
): State {
  const next = table[from][command];
  if (!next) throw new DomainTransitionError(aggregate, from, command);
  return next;
}
