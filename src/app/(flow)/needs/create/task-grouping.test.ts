import { describe, expect, it } from "vitest";
import type { TaskPlan } from "@/domain/publishing/legacy-need-draft-v3";
import {
  applyVisitTaskModalChanges,
  atomicMapToTaskPlans,
  copyVisitTasksWithFingerprint,
  removeVisitPetConfigWithFingerprint,
  tasksToAtomicMap,
} from "./task-grouping";

describe("task-grouping dual-fingerprint engine", () => {
  it("merges multiple pets with identical task configuration into a single TaskPlan", () => {
    const result = applyVisitTaskModalChanges({
      currentTasks: [],
      visit: 1,
      selectedPetIds: ["snowball", "huihui"],
      modalTasks: [
        {
          templateId: "feeding",
          label: "Feeding",
          priority: "must",
          notes: "",
          custom: false,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Feeding");
    expect(result[0].priority).toBe("must");
    expect(result[0].petIds).toEqual(["huihui", "snowball"]);
    expect(result[0].visitNumbers).toEqual([1]);
  });

  it("forks into independent TaskPlans when one pet has divergent notes/priority", () => {
    // 1. Initial shared task
    const initial = applyVisitTaskModalChanges({
      currentTasks: [],
      visit: 1,
      selectedPetIds: ["snowball", "huihui"],
      modalTasks: [
        {
          templateId: "feeding",
          label: "Feeding",
          priority: "must",
          notes: "",
          custom: false,
        },
      ],
    });
    expect(initial).toHaveLength(1);

    // 2. User edits Huihui only and changes notes to "Rabbit pellets only"
    const forked = applyVisitTaskModalChanges({
      currentTasks: initial,
      visit: 1,
      selectedPetIds: ["huihui"],
      modalTasks: [
        {
          templateId: "feeding",
          label: "Feeding",
          priority: "must",
          notes: "Rabbit pellets only",
          custom: false,
        },
      ],
      originalPetIds: ["huihui"],
      originalNames: ["Feeding"],
    });

    expect(forked).toHaveLength(2);
    const snowballTask = forked.find((t) => t.petIds.includes("snowball"));
    const huihuiTask = forked.find((t) => t.petIds.includes("huihui"));

    expect(snowballTask).toBeDefined();
    expect(snowballTask?.petIds).toEqual(["snowball"]);
    expect(snowballTask?.notes).toBeUndefined();

    expect(huihuiTask).toBeDefined();
    expect(huihuiTask?.petIds).toEqual(["huihui"]);
    expect(huihuiTask?.notes).toBe("Rabbit pellets only");
  });

  it("unbinds a deselected pet and deletes task if no pets remain", () => {
    const initial = applyVisitTaskModalChanges({
      currentTasks: [],
      visit: 1,
      selectedPetIds: ["snowball", "huihui"],
      modalTasks: [
        {
          templateId: "grooming",
          label: "Grooming",
          priority: "nice",
          notes: "",
          custom: false,
        },
      ],
    });

    // Deselect Huihui in edit modal
    const afterDeselect = applyVisitTaskModalChanges({
      currentTasks: initial,
      visit: 1,
      selectedPetIds: ["snowball"],
      modalTasks: [
        {
          templateId: "grooming",
          label: "Grooming",
          priority: "nice",
          notes: "",
          custom: false,
        },
      ],
      originalPetIds: ["snowball", "huihui"],
      originalNames: ["Grooming"],
    });

    expect(afterDeselect).toHaveLength(1);
    expect(afterDeselect[0].petIds).toEqual(["snowball"]);

    // Now remove Snowball too
    const empty = removeVisitPetConfigWithFingerprint(
      afterDeselect,
      1,
      ["snowball"],
      ["Grooming"],
    );
    expect(empty).toHaveLength(0);
  });

  it("copies tasks from visit 1 to visit 2 and merges visitNumbers if identical", () => {
    const visit1Tasks = applyVisitTaskModalChanges({
      currentTasks: [],
      visit: 1,
      selectedPetIds: ["snowball", "huihui"],
      modalTasks: [
        {
          templateId: "feeding",
          label: "Feeding",
          priority: "must",
          notes: "",
          custom: false,
        },
      ],
    });

    const withCopy = copyVisitTasksWithFingerprint(visit1Tasks, 1, 2);

    expect(withCopy).toHaveLength(1);
    expect(withCopy[0].petIds).toEqual(["huihui", "snowball"]);
    expect(withCopy[0].visitNumbers).toEqual([1, 2]);
  });

  it("forks on edit in visit 2 and re-merges when reverted back", () => {
    // 1. Start with shared visit [1, 2]
    const shared: TaskPlan[] = [
      {
        id: "task-1",
        templateId: "feeding",
        label: "Feeding",
        priority: "must",
        petIds: ["snowball", "huihui"],
        visitNumbers: [1, 2],
        custom: false,
        order: 0,
      },
    ];

    // 2. Modify visit 2 with special evening notes
    const forked = applyVisitTaskModalChanges({
      currentTasks: shared,
      visit: 2,
      selectedPetIds: ["snowball", "huihui"],
      modalTasks: [
        {
          templateId: "feeding",
          label: "Feeding",
          priority: "must",
          notes: "Evening wet food",
          custom: false,
        },
      ],
      originalPetIds: ["snowball", "huihui"],
      originalNames: ["Feeding"],
    });

    expect(forked).toHaveLength(2);
    const v1Task = forked.find((t) => t.visitNumbers.includes(1));
    const v2Task = forked.find((t) => t.visitNumbers.includes(2));
    expect(v1Task?.notes).toBeUndefined();
    expect(v1Task?.visitNumbers).toEqual([1]);
    expect(v2Task?.notes).toBe("Evening wet food");
    expect(v2Task?.visitNumbers).toEqual([2]);

    // 3. Revert visit 2 back to standard notes (empty)
    const remerged = applyVisitTaskModalChanges({
      currentTasks: forked,
      visit: 2,
      selectedPetIds: ["snowball", "huihui"],
      modalTasks: [
        {
          templateId: "feeding",
          label: "Feeding",
          priority: "must",
          notes: "",
          custom: false,
        },
      ],
      originalPetIds: ["snowball", "huihui"],
      originalNames: ["Feeding"],
    });

    expect(remerged).toHaveLength(1);
    expect(remerged[0].visitNumbers).toEqual([1, 2]);
  });
});
