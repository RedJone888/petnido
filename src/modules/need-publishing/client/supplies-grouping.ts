import {
  boardingSupplyKey,
  boardingSupplyOptions,
  type BoardingSupplyOption,
  type BoardingSupplyPlan,
  type CustomBoardingSupply,
  type PetDraft,
  type SupplyCategory,
} from "@/domain/publishing/legacy-need-draft-v3";
import {
  normalizeFingerprintText,
  supplyFingerprint,
} from "../domain/task-fingerprint";
import { groupTaskRowsByPetGroup } from "./task-grouping";

export type SelectedSupplyProvision = "owner" | "sitter";

/**
 * The row model used by the supplies table.  `sourceKeysByPet` lets a group
 * edit reuse existing custom-item ids when a row is unchanged, while the
 * fingerprint remains independent of provider and client ids.
 */
export type SupplyDisplayRow = {
  key: string;
  petIds: string[];
  category: SupplyCategory;
  categoryLabel?: string;
  label: string;
  sourceLabel: string;
  custom: boolean;
  provision: SelectedSupplyProvision;
  sourceKeysByPet: Record<string, string>;
};

export type SupplyGroupRows = {
  key: string;
  petIds: string[];
  items: SupplyDisplayRow[];
};

export type SupplyRowInput = Pick<
  SupplyDisplayRow,
  | "petIds"
  | "category"
  | "categoryLabel"
  | "label"
  | "sourceLabel"
  | "custom"
  | "provision"
  | "sourceKeysByPet"
>;

function optionIdentity(option: BoardingSupplyOption) {
  return [
    option.category,
    normalizeFingerprintText(option.categoryLabel),
    normalizeFingerprintText(option.label),
  ].join("\u0000");
}

function rowFingerprint(row: Pick<SupplyRowInput, "petIds" | "category" | "categoryLabel" | "label">) {
  return supplyFingerprint({
    assignmentPetKeys: row.petIds,
    category: row.category === "other" ? row.categoryLabel ?? "" : row.category,
    item: row.label,
  });
}

function hasSelectedProvision(
  provision: string | undefined,
): provision is SelectedSupplyProvision {
  return provision === "owner" || provision === "sitter";
}

function orderedOptions(
  options: BoardingSupplyOption[],
  plan: BoardingSupplyPlan,
) {
  const byKey = new Map(options.map((option) => [option.key, option]));
  const ordered: BoardingSupplyOption[] = [];
  const seen = new Set<string>();

  // Persisted object insertion order is the user's row order.  Include any
  // newly available option after it so old drafts remain readable if a pet
  // profile gains another standard item.
  Object.keys(plan).forEach((key) => {
    const option = byKey.get(key);
    if (option) {
      ordered.push(option);
      seen.add(key);
    }
  });
  options.forEach((option) => {
    if (!seen.has(option.key)) ordered.push(option);
  });
  return ordered;
}

/**
 * Builds rows for one pet-care group without sorting the source rows.  A
 * provider is kept as a presentation split so a mixed per-pet provision can
 * round-trip without silently changing it, but provider never participates in
 * duplicate identity (`rowFingerprint` / `supplyFingerprint`).
 */
export function buildSupplyRows(
  pets: PetDraft[],
  plan: BoardingSupplyPlan,
  customItems: CustomBoardingSupply[],
  petIds?: readonly string[],
): SupplyDisplayRow[] {
  const allowedPetIds = petIds ? new Set(petIds) : null;
  const options = boardingSupplyOptions(pets, customItems);
  const rows = new Map<string, SupplyDisplayRow>();

  orderedOptions(options, plan).forEach((option) => {
    if (allowedPetIds && !allowedPetIds.has(option.petId)) return;
    const provision = plan[option.key];
    if (!hasSelectedProvision(provision)) return;

    // Provider is intentionally included only in this display bucket.  The
    // save-time fingerprint below omits it, so two editor rows with different
    // providers still validate as the same semantic supply.
    const bucketKey = `${optionIdentity(option)}\u0000${provision}`;
    const existing = rows.get(bucketKey);
    if (existing) {
      if (!existing.petIds.includes(option.petId)) {
        existing.petIds.push(option.petId);
      }
      existing.sourceKeysByPet[option.petId] = option.key;
      return;
    }

    const row: SupplyDisplayRow = {
      key: "",
      petIds: [option.petId],
      category: option.category,
      categoryLabel: option.categoryLabel,
      label: option.label,
      sourceLabel: option.label,
      custom: option.custom,
      provision,
      sourceKeysByPet: { [option.petId]: option.key },
    };
    row.key = rowFingerprint(row);
    rows.set(bucketKey, row);
  });

  return Array.from(rows.values()).map((row) => ({
    ...row,
    // A row's assignment follows the source option order.  Recompute the key
    // after all pets have been gathered because assignment is part of identity.
    key: rowFingerprint(row),
  }));
}

/**
 * Groups only adjacent equal assignments.  It deliberately delegates to the
 * shared helper so rowSpan is a presentation optimization and never reorders
 * supplies or merges across an intervening assignment.
 */
export function groupSupplyRowsByPetAssignment(
  rows: SupplyDisplayRow[],
): SupplyGroupRows[] {
  return groupTaskRowsByPetGroup(rows).map((group) => ({
    key: group.key,
    petIds: group.petIds,
    items: group.items,
  }));
}

function optionMatchesRow(
  option: BoardingSupplyOption | undefined,
  row: SupplyRowInput,
  petId: string,
) {
  if (!option || option.petId !== petId) return false;
  return (
    option.category === row.category &&
    normalizeFingerprintText(option.categoryLabel) ===
      normalizeFingerprintText(row.categoryLabel) &&
    normalizeFingerprintText(option.label) === normalizeFingerprintText(row.label)
  );
}

export type ReplaceSupplyGroupInput = {
  pets: PetDraft[];
  currentPlan: BoardingSupplyPlan;
  currentCustomItems: CustomBoardingSupply[];
  groupPetIds: readonly string[];
  rows: readonly SupplyRowInput[];
  /** Injectable for tests; the UI passes crypto.randomUUID. */
  createId?: () => string;
};

export type ReplaceSupplyGroupResult = {
  plan: BoardingSupplyPlan;
  customItems: CustomBoardingSupply[];
};

/**
 * Replaces only supplies assigned to `groupPetIds`.
 *
 * Existing entries outside the group are deleted/rebuilt in place, preserving
 * their object insertion order.  New rows are appended in modal order.  The
 * helper also filters assignments defensively, so a stale caller cannot save a
 * cross-type row even if the UI selection was changed elsewhere.
 */
export function replaceSupplyPetGroup({
  pets,
  currentPlan,
  currentCustomItems,
  groupPetIds,
  rows,
  createId = () => "generated-supply-id",
}: ReplaceSupplyGroupInput): ReplaceSupplyGroupResult {
  const groupSet = new Set(groupPetIds);
  const options = boardingSupplyOptions(pets, currentCustomItems);
  const optionsByKey = new Map(options.map((option) => [option.key, option]));
  const currentGroupKeys = new Set(
    options.filter((option) => groupSet.has(option.petId)).map((option) => option.key),
  );

  // Object spread followed by deletions preserves insertion order for all
  // unaffected groups.  Do not rebuild from boardingSupplyOptions, which would
  // silently reorder other type groups.
  const nextPlan: BoardingSupplyPlan = { ...currentPlan };
  currentGroupKeys.forEach((key) => delete nextPlan[key]);
  const nextCustomItems = currentCustomItems.filter(
    (item) => !groupSet.has(item.petId),
  );

  const usedCustomIds = new Set(nextCustomItems.map((item) => item.id));
  const orderedGroupPetIds = (petIds: readonly string[]) =>
    groupPetIds.filter((petId) => petIds.includes(petId));

  rows.forEach((row) => {
    const selectedPetIds = orderedGroupPetIds(row.petIds);
    if (!selectedPetIds.length) return;
    selectedPetIds.forEach((petId) => {
      const sourceKey = row.sourceKeysByPet[petId];
      const sourceOption = sourceKey ? optionsByKey.get(sourceKey) : undefined;
      const canReuseSource =
        row.custom &&
        sourceKey?.startsWith("custom:") &&
        optionMatchesRow(sourceOption, row, petId);

      if (!row.custom && row.category !== "other") {
        nextPlan[boardingSupplyKey(petId, row.category, row.label)] = row.provision;
        return;
      }

      const customId = canReuseSource
        ? sourceKey.slice("custom:".length)
        : (() => {
            const base = createId();
            let candidate = base;
            let suffix = 1;
            while (usedCustomIds.has(candidate)) {
              candidate = `${base}-${suffix}`;
              suffix += 1;
            }
            return candidate;
          })();
      usedCustomIds.add(customId);
      nextCustomItems.push({
        id: customId,
        petId,
        category: row.category,
        categoryLabel: row.category === "other" ? row.categoryLabel?.trim() : undefined,
        label: row.label.trim(),
      });
      nextPlan[`custom:${customId}`] = row.provision;
    });
  });

  return { plan: nextPlan, customItems: nextCustomItems };
}
