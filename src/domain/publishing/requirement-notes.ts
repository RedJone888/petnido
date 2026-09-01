function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Older custom needs stored the free-form requirements note as OTHER_NEED.
 * The original field remains in the publishing workspace, which lets readers
 * restore its meaning without guessing from the text or row position.
 */
export function customRequirementNoteFromDraftPayload(
  payloadJson: string | null | undefined,
) {
  if (!payloadJson) return null;
  try {
    const payload = record(JSON.parse(payloadJson));
    const workspace = record(payload?.workspace);
    const draftByMode = record(workspace?.draftByMode);
    const custom = record(draftByMode?.custom);
    const note = custom?.customRequirementsNotes;
    return typeof note === "string" && note.trim() ? note.trim() : null;
  } catch {
    return null;
  }
}

export function isLegacyCustomRequirementNote(
  requirement: { kind: string; label: string },
  note: string | null,
) {
  return (
    requirement.kind === "OTHER_NEED" &&
    Boolean(note) &&
    requirement.label.trim() === note
  );
}
