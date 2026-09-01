import { describe, expect, it } from "vitest";

import type { TaskPlan } from "@/domain/publishing/legacy-need-draft-v3";
import {
  replaceVisitRows,
  sortVisitTasks,
  visitTaskOrder,
  type VisitTaskEditRow,
} from "./visit-task-order";

function task(
  id: string,
  orderByVisit: Record<number, number>,
): TaskPlan {
  return {
    id,
    templateId: id,
    label: id,
    priority: "must",
    petIds: ["pet-1"],
    visitNumbers: [1, 2],
    custom: false,
    order: 0,
    orderByVisit,
  };
}

function row(label: string, templateId = label.toLowerCase()): VisitTaskEditRow {
  return {
    id: `row-${label}`,
    petIds: ["pet-1"],
    templateId,
    customLabel: "",
    label,
    custom: false,
    priority: "must",
    notes: "",
  };
}

describe("visit-scoped task ordering", () => {
  it("sorts the same shared tasks independently for each visit", () => {
    const first = task("first", { 1: 0, 2: 1 });
    const second = task("second", { 1: 1, 2: 0 });

    expect(sortVisitTasks([first, second], 1).map((item) => item.id)).toEqual([
      "first",
      "second",
    ]);
    expect(sortVisitTasks([first, second], 2).map((item) => item.id)).toEqual([
      "second",
      "first",
    ]);
  });

  it("uses the legacy global order only when a visit order is absent", () => {
    expect(visitTaskOrder({ order: 4 }, 2)).toBe(4);
    expect(visitTaskOrder({ order: 4, orderByVisit: { 2: 0 } }, 2)).toBe(0);
  });

  it("falls back deterministically when persisted HOME order is null", () => {
    expect(visitTaskOrder({ order: null }, 2)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("merges an unchanged copy into visitNumbers without changing the source order", () => {
    const source = {
      ...task("Feed", { 1: 0 }),
      templateId: "feeding",
      visitNumbers: [1],
    };

    const copied = replaceVisitRows([source], 2, [row("Feed")]);

    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatchObject({
      visitNumbers: [1, 2],
      orderByVisit: { 1: 0, 2: 0 },
    });
  });

  it("updates only the edited visit when a shared task is reordered", () => {
    const first = task("first", { 1: 0, 2: 1 });
    const second = task("second", { 1: 1, 2: 0 });
    const reordered = replaceVisitRows([first, second], 2, [
      row("first", "first"),
      row("second", "second"),
    ]);

    expect(reordered).toHaveLength(2);
    expect(reordered.find((item) => item.id === "first")?.orderByVisit).toEqual({
      1: 0,
      2: 0,
    });
    expect(reordered.find((item) => item.id === "second")?.orderByVisit).toEqual({
      1: 1,
      2: 1,
    });
  });
});
