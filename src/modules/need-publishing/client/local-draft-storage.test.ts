import { describe, expect, it, vi } from "vitest";

import type { NeedDraftSnapshotV3 } from "@/domain/publishing/legacy-need-draft-v3";
import { compactLocalNeedDraft, saveLocalNeedDraft } from "./local-draft-storage";

const snapshot = {
  careType: "boarding",
  pets: [{ photo: "data:image/png;base64,large" }],
  attachments: [
    { id: "local", url: "blob:local", signature: "a" },
    { id: "saved", url: "https://cdn.example/pet.jpg", signature: "b" },
  ],
  draftByMode: {
    visit: { visitPlans: [{ id: "visit-task" }] },
    boarding: { boardingRoutines: [{ id: "duplicated-active-row" }] },
    custom: { customPlans: [{ id: "custom-task" }] },
  },
} as unknown as NeedDraftSnapshotV3;

describe("local need draft storage", () => {
  it("keeps inactive branches while removing the duplicated active branch and temporary images", () => {
    const compact = compactLocalNeedDraft(snapshot);

    expect(compact.draftByMode).toEqual({
      visit: { visitPlans: [{ id: "visit-task" }] },
      custom: { customPlans: [{ id: "custom-task" }] },
    });
    expect(compact.pets[0]?.photo).toBe("");
    expect(compact.attachments).toEqual([
      { id: "saved", url: "https://cdn.example/pet.jpg", signature: "b" },
    ]);
  });

  it("does not throw when browser storage is full", () => {
    const setItem = vi.fn(() => {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(saveLocalNeedDraft({ setItem }, "draft", snapshot)).toBe(false);
    expect(setItem).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});
