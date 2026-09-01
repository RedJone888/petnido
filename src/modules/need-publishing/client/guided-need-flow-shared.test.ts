import { describe, expect, it } from "vitest";

import { boardingNights } from "@/domain/publishing/boarding-date-math";
import {
  groupTaskRowsByPetGroup,
  type PetTaskState,
  type TaskRowItem,
} from "./task-grouping";

describe("boardingNights", () => {
  it("charges the one-night minimum when drop-off and pickup use the same date", () => {
    expect(
      boardingNights({ startDate: "2026-08-14", endDate: "2026-08-14" }),
    ).toBe(1);
  });

  it("counts calendar nights between drop-off and pickup", () => {
    expect(
      boardingNights({ startDate: "2026-08-14", endDate: "2026-08-20" }),
    ).toBe(6);
  });

  it("does not produce a charge for an invalid reversed range", () => {
    expect(
      boardingNights({ startDate: "2026-08-20", endDate: "2026-08-14" }),
    ).toBe(0);
  });
});

describe("groupTaskRowsByPetGroup", () => {
  const createTask = (name: string, order: number): PetTaskState => ({
    name,
    templateId: name.toLowerCase(),
    custom: false,
    priority: "must",
    notes: "",
    order,
    representativeTaskId: `task-${name}`,
  });

  it("groups consecutive and shared-pet tasks into single pet groups for row merging", () => {
    const taskRows: TaskRowItem[] = [
      { petIds: ["pet-a"], state: createTask("Task 1", 1) },
      { petIds: ["pet-a", "pet-b"], state: createTask("Task 2", 2) },
      { petIds: ["pet-a", "pet-b"], state: createTask("Task 3", 3) },
      { petIds: ["pet-b", "pet-a"], state: createTask("Task 4", 4) },
      { petIds: ["pet-a", "pet-b"], state: createTask("Task 5", 5) },
      { petIds: ["pet-c"], state: createTask("Task 6", 6) },
    ];

    const groups = groupTaskRowsByPetGroup(taskRows);

    expect(groups).toHaveLength(3);
    expect(groups[0].petIds).toEqual(["pet-a"]);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].items[0].state.name).toBe("Task 1");

    expect(groups[1].petIds).toEqual(["pet-a", "pet-b"]);
    expect(groups[1].items).toHaveLength(4);
    expect(groups[1].items.map((i) => i.state.name)).toEqual([
      "Task 2",
      "Task 3",
      "Task 4",
      "Task 5",
    ]);

    expect(groups[2].petIds).toEqual(["pet-c"]);
    expect(groups[2].items).toHaveLength(1);
    expect(groups[2].items[0].state.name).toBe("Task 6");
  });

  it("returns empty array when taskRows is empty", () => {
    expect(groupTaskRowsByPetGroup([])).toEqual([]);
  });

  it("does not merge equal assignments across an intervening row", () => {
    const taskRows: TaskRowItem[] = [
      { petIds: ["pet-a"], state: createTask("Task 1", 1) },
      { petIds: ["pet-b"], state: createTask("Task 2", 2) },
      { petIds: ["pet-a"], state: createTask("Task 3", 3) },
    ];

    expect(groupTaskRowsByPetGroup(taskRows).map((group) => group.key)).toEqual([
      "pet-a",
      "pet-b",
      "pet-a",
    ]);
  });

  it("merges adjacent assignments after removing duplicate pet ids", () => {
    const taskRows: TaskRowItem[] = [
      { petIds: ["pet-a", "pet-b"], state: createTask("Task 1", 1) },
      {
        petIds: ["pet-b", "pet-a", "pet-a"],
        state: createTask("Task 2", 2),
      },
      { petIds: ["pet-a", "pet-b"], state: createTask("Task 3", 3) },
    ];

    const groups = groupTaskRowsByPetGroup(taskRows);

    expect(groups).toHaveLength(1);
    expect(groups[0].petIds).toEqual(["pet-a", "pet-b"]);
    expect(groups[0].items).toHaveLength(3);
  });
});
