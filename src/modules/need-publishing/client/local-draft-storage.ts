import type {
  CareType,
  NeedDraftSnapshotV3,
} from "@/domain/publishing/legacy-need-draft-v3";

/**
 * The active branch is already represented by the snapshot's top-level fields.
 * Keeping it in draftByMode as well nearly doubles larger drafts. Remove only
 * that redundant copy for browser storage; inactive branches remain intact.
 */
export function compactLocalNeedDraft(
  snapshot: NeedDraftSnapshotV3,
): NeedDraftSnapshotV3 {
  const draftByMode = { ...(snapshot.draftByMode ?? {}) };
  if (snapshot.careType) delete draftByMode[snapshot.careType as CareType];
  return {
    ...snapshot,
    savedAt: Date.now(),
    draftByMode,
    pets: snapshot.pets.map((pet) => ({
      ...pet,
      // Object URLs cannot survive a reload. Data URLs can be several MB and
      // must not make the entire structured draft exceed the browser quota.
      photo:
        pet.photo.startsWith("blob:") || pet.photo.startsWith("data:")
          ? ""
          : pet.photo,
    })),
    attachments: snapshot.attachments?.filter(
      (attachment) =>
        !attachment.url.startsWith("blob:") &&
        !attachment.url.startsWith("data:"),
    ),
  };
}

export function saveLocalNeedDraft(
  storage: Pick<Storage, "setItem">,
  key: string,
  snapshot: NeedDraftSnapshotV3,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(compactLocalNeedDraft(snapshot)));
    return true;
  } catch (error) {
    // Storage is a resilience layer, not a reason to crash the publishing UI.
    console.error("Failed to save local need draft", error);
    return false;
  }
}
