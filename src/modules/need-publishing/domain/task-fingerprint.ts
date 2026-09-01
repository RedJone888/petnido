/**
 * Business identity helpers for need-publishing rows.
 *
 * These functions deliberately do not include database/client ids or display
 * order. They are the single source of truth for duplicate detection in the
 * editors and for normalising legacy rows before they are persisted.
 */

import {
  normalizeCustomTaskLabel,
  resolveStandardTaskCode,
} from "./task-catalog";

export type HomeVisitTaskFingerprintInput = {
  assignmentPetKeys: readonly string[];
  taskName: string;
  /** Stable template code for standard tasks. */
  taskCode?: string | null;
  /** Explicitly keep a user-entered label out of the standard catalog. */
  custom?: boolean;
  priority: string;
  notes?: string | null;
};

export type BoardingTaskFingerprintInput = {
  assignmentPetKeys: readonly string[];
  taskName: string;
  taskCode?: string | null;
  custom?: boolean;
  frequency: string;
  notes?: string | null;
};

export type CustomTaskFingerprintInput = {
  assignmentPetKeys: readonly string[];
  taskName: string;
  taskCode?: string | null;
  custom?: boolean;
  notes?: string | null;
};

export type SupplyFingerprintInput = {
  assignmentPetKeys: readonly string[];
  category: string;
  item: string;
};

/** Locale-independent text normalisation for semantic identities. */
export function normalizeFingerprintText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("en-US");
}

function taskIdentity(input: {
  taskName: string;
  taskCode?: string | null;
  custom?: boolean;
}) {
  if (input.custom) {
    return normalizeFingerprintText(normalizeCustomTaskLabel(input.taskName));
  }
  return (
    resolveStandardTaskCode({
      templateId: input.taskCode,
      label: input.taskName,
      custom: false,
    }) ?? normalizeFingerprintText(input.taskName)
  );
}

/** Stable assignment key. Empty assignments are intentionally distinguishable. */
export function normalizeAssignmentPetKeys(
  petKeys: readonly string[] | null | undefined,
) {
  return Array.from(
    new Set(
      (petKeys ?? [])
        .map((petKey) => petKey.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function serialize(parts: readonly unknown[]) {
  // JSON avoids collisions that can occur when user text contains a separator.
  return JSON.stringify(["need-publishing", 1, ...parts]);
}

export function homeVisitTaskFingerprint(
  input: HomeVisitTaskFingerprintInput,
) {
  return serialize([
    "HOME_VISIT_TASK",
    normalizeAssignmentPetKeys(input.assignmentPetKeys),
    taskIdentity(input),
    normalizeFingerprintText(input.priority),
    normalizeFingerprintText(input.notes),
  ]);
}

export function boardingTaskFingerprint(
  input: BoardingTaskFingerprintInput,
) {
  return serialize([
    "BOARDING_TASK",
    normalizeAssignmentPetKeys(input.assignmentPetKeys),
    taskIdentity(input),
    normalizeFingerprintText(input.frequency),
    normalizeFingerprintText(input.notes),
  ]);
}

export function customTaskFingerprint(input: CustomTaskFingerprintInput) {
  return serialize([
    "CUSTOM_TASK",
    normalizeAssignmentPetKeys(input.assignmentPetKeys),
    taskIdentity(input),
    normalizeFingerprintText(input.notes),
  ]);
}

/** Provider is intentionally not part of supply identity. */
export function supplyFingerprint(input: SupplyFingerprintInput) {
  return serialize([
    "BOARDING_SUPPLY",
    normalizeAssignmentPetKeys(input.assignmentPetKeys),
    normalizeFingerprintText(input.category),
    normalizeFingerprintText(input.item),
  ]);
}
