import { describe, expect, it } from "vitest";

import { mergeAdjacentTaskTargets, taskTargetKey } from "./presentation";

const pet = (id: string, name: string) => ({ id, name, petType: "DOG" });
const task = (id: string, pets: ReturnType<typeof pet>[]) => ({
  id, category: "FEEDING", label: "Feeding", instructions: null, priority: "MUST", scheduleKind: null, visitNumbers: [1], order: 0, orderByVisit: { 1: 0 }, pets,
});

describe("need display task grouping", () => {
  it("uses a stable set key regardless of pet order", () => {
    expect(taskTargetKey(task("a", [pet("1", "Ding"), pet("2", "Momo")]) as never)).toBe(
      taskTargetKey(task("b", [pet("2", "Momo"), pet("1", "Ding")]) as never),
    );
  });

  it("merges only adjacent tasks with the same target set", () => {
    const ding = [pet("1", "Ding")];
    const momo = [pet("2", "Momo")];
    const groups = mergeAdjacentTaskTargets([
      task("1", ding), task("2", ding), task("3", momo), task("4", ding),
    ] as never);
    expect(groups.map((group) => group.tasks.map((item) => item.id))).toEqual([["1", "2"], ["3"], ["4"]]);
  });
});
