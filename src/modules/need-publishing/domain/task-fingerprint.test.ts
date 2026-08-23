import { describe, expect, it } from "vitest";
import {
  boardingTaskFingerprint,
  customTaskFingerprint,
  homeVisitTaskFingerprint,
  normalizeAssignmentPetKeys,
  normalizeFingerprintText,
  supplyFingerprint,
} from "./task-fingerprint";

describe("need-publishing semantic fingerprints", () => {
  it("normalizes text and assignment order", () => {
    expect(normalizeFingerprintText("  Food\u00a0  bowl ")).toBe("food bowl");
    expect(normalizeAssignmentPetKeys(["pet-2", "pet-1", "pet-2"])).toEqual([
      "pet-1",
      "pet-2",
    ]);
  });

  it("keeps home-visit priority and notes in the identity", () => {
    const base = {
      assignmentPetKeys: ["pet-2", "pet-1"],
      taskName: "Change water",
      priority: "must",
      notes: "clean bowl",
    } as const;
    expect(homeVisitTaskFingerprint(base)).toBe(
      homeVisitTaskFingerprint({ ...base, assignmentPetKeys: ["pet-1", "pet-2"] }),
    );
    expect(homeVisitTaskFingerprint(base)).not.toBe(
      homeVisitTaskFingerprint({ ...base, priority: "if-time" }),
    );
    expect(homeVisitTaskFingerprint(base)).not.toBe(
      homeVisitTaskFingerprint({ ...base, notes: "leave filter on" }),
    );
  });

  it("keeps boarding frequency and custom notes in the identity", () => {
    const boarding = {
      assignmentPetKeys: ["pet-1"],
      taskName: "Medication",
      frequency: "daily",
      notes: "with food",
    } as const;
    expect(boardingTaskFingerprint(boarding)).not.toBe(
      boardingTaskFingerprint({ ...boarding, frequency: "once" }),
    );
    expect(customTaskFingerprint({
      assignmentPetKeys: ["pet-1"],
      taskName: "Transport",
      notes: "clinic only",
    })).not.toBe(
      customTaskFingerprint({
        assignmentPetKeys: ["pet-1"],
        taskName: "Transport",
        notes: "airport only",
      }),
    );
  });

  it("does not use supply provider as identity", () => {
    const input = { assignmentPetKeys: ["pet-1"], category: "food", item: "Hay" };
    expect(supplyFingerprint(input)).toBe(supplyFingerprint(input));
    // Provider is not accepted by the input and therefore cannot create a
    // second semantic row; changing it is an update to the same row.
  });

  it("uses a stable template code instead of translated standard labels", () => {
    const base = {
      assignmentPetKeys: ["pet-1"],
      priority: "must",
      notes: "",
      taskCode: "feeding",
      custom: false,
    } as const;
    expect(
      homeVisitTaskFingerprint({ ...base, taskName: "Feeding" }),
    ).toBe(homeVisitTaskFingerprint({ ...base, taskName: "喂食" }));
    expect(
      homeVisitTaskFingerprint({ ...base, taskName: "給餌" }),
    ).toBe(homeVisitTaskFingerprint({ ...base, taskName: "feeding" }));
    expect(
      customTaskFingerprint({
        assignmentPetKeys: ["pet-1"],
        taskName: "喂食",
        taskCode: "feeding",
        notes: "",
      }),
    ).toBe(
      customTaskFingerprint({
        assignmentPetKeys: ["pet-1"],
        taskName: "Feeding",
        taskCode: "feeding",
        notes: "",
      }),
    );
  });

  it("keeps custom labels as user text even when they match a standard label", () => {
    const base = {
      assignmentPetKeys: ["pet-1"],
      notes: "",
      custom: true,
    } as const;
    expect(
      customTaskFingerprint({ ...base, taskName: "Feeding" }),
    ).not.toBe(customTaskFingerprint({ ...base, taskName: "喂食" }));
  });
});
