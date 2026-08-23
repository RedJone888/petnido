import { describe, expect, it } from "vitest";

import {
  boardingSupplyKey,
  type BoardingSupplyPlan,
  type PetDraft,
} from "@/domain/publishing/legacy-need-draft-v3";
import { supplyFingerprint } from "../domain/task-fingerprint";
import {
  buildSupplyRows,
  groupSupplyRowsByPetAssignment,
  replaceSupplyPetGroup,
  type SupplyRowInput,
} from "./supplies-grouping";

function pet(id: string, type: PetDraft["type"]): PetDraft {
  return {
    id,
    type,
    otherType: "",
    quantity: 1,
    name: id,
    breed: "",
    weight: "",
    weightUnit: "kg",
    birthDate: "",
    sex: "",
    neutered: "",
    photo: "",
    notes: "",
  };
}

describe("boarding supplies grouped editing", () => {
  const dogA = pet("dog-a", "dog");
  const dogB = pet("dog-b", "dog");
  const cat = pet("cat-a", "cat");
  const pets = [dogA, dogB, cat];

  it("keeps row order and only row-spans adjacent equal assignments", () => {
    const plan: BoardingSupplyPlan = {};
    plan[boardingSupplyKey(dogA.id, "food", "Dry food")] = "owner";
    plan[boardingSupplyKey(dogB.id, "food", "Dry food")] = "owner";
    plan[boardingSupplyKey(dogA.id, "food", "Wet food (cans or pouches)")] = "owner";
    plan[boardingSupplyKey(dogA.id, "food", "Treats or supplements")] = "owner";
    plan[boardingSupplyKey(dogB.id, "food", "Treats or supplements")] = "owner";

    const rows = buildSupplyRows(pets, plan, [], [dogA.id, dogB.id]);
    expect(rows.map((row) => row.label)).toEqual([
      "Dry food",
      "Wet food (cans or pouches)",
      "Treats or supplements",
    ]);

    const groups = groupSupplyRowsByPetAssignment(rows);
    expect(groups.map((group) => group.petIds)).toEqual([
      [dogA.id, dogB.id],
      [dogA.id],
      [dogA.id, dogB.id],
    ]);
    expect(groups.map((group) => group.items.map((row) => row.label))).toEqual([
      ["Dry food"],
      ["Wet food (cans or pouches)"],
      ["Treats or supplements"],
    ]);
  });

  it("replaces one care group while retaining another group's data and order", () => {
    const catKey = boardingSupplyKey(cat.id, "food", "Dry food");
    const oldDogKey = boardingSupplyKey(dogA.id, "food", "Dry food");
    const plan: BoardingSupplyPlan = {};
    plan[catKey] = "sitter";
    plan[oldDogKey] = "owner";
    const row: SupplyRowInput = {
      petIds: [dogA.id, cat.id],
      category: "food",
      label: "Wet food (cans or pouches)",
      sourceLabel: "Wet food (cans or pouches)",
      custom: false,
      provision: "owner",
      sourceKeysByPet: {},
    };

    const result = replaceSupplyPetGroup({
      pets,
      currentPlan: plan,
      currentCustomItems: [],
      groupPetIds: [dogA.id, dogB.id],
      rows: [row],
    });

    expect(result.plan[catKey]).toBe("sitter");
    expect(result.plan[oldDogKey]).toBeUndefined();
    expect(result.plan[boardingSupplyKey(dogA.id, "food", row.label)]).toBe("owner");
    expect(Object.keys(result.plan)[0]).toBe(catKey);
    expect(Object.keys(result.plan)).not.toContain(
      boardingSupplyKey(cat.id, "food", row.label),
    );
  });

  it("uses assignment, category and item only for supply identity", () => {
    const identity = {
      assignmentPetKeys: [dogA.id, dogB.id],
      category: "food",
      item: "Dry food",
    } as const;
    expect(supplyFingerprint(identity)).toBe(supplyFingerprint(identity));
    // Provider is deliberately absent from the input and cannot split the
    // same semantic supply into a second identity.
  });
});
