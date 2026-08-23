import type { TaskPlan } from "@/domain/publishing/legacy-need-draft-v3";
import { homeVisitTaskFingerprint } from "@/modules/need-publishing/domain/task-fingerprint";
import {
  localizeTaskLabel,
  taskPersistenceLabel,
} from "@/modules/need-publishing/domain/task-catalog";

const customTaskId = "__custom-visit-task__";

export type VisitTaskEditRow = {
  id: string;
  petIds: string[];
  templateId: string;
  customLabel: string;
  label: string;
  custom: boolean;
  priority: "must" | "nice";
  notes: string;
};

/**
 * Resolve a task's display position for one visit. The global order is only a
 * compatibility fallback for drafts created before visit-scoped ordering.
 */
type VisitTaskOrderInput = Pick<TaskPlan, "orderByVisit"> & {
  // Persisted NeedTaskV2 rows use NULL for HOME_VISIT's obsolete global
  // order. Keep the UI fallback tolerant of that DTO shape as well as the
  // draft's omitted/undefined value.
  order?: number | null;
};

export function visitTaskOrder(task: VisitTaskOrderInput, visit: number) {
  return task.orderByVisit?.[visit] ?? task.order ?? Number.MAX_SAFE_INTEGER;
}

/** Sort a visit's tasks without mutating the draft task collection. */
export function sortVisitTasks(tasks: TaskPlan[], visit: number) {
  return [...tasks].sort(
    (a, b) => visitTaskOrder(a, visit) - visitTaskOrder(b, visit),
  );
}

function rowFingerprint(
  row: Pick<
    VisitTaskEditRow,
    "petIds" | "templateId" | "custom" | "label" | "priority" | "notes"
  >,
) {
  return homeVisitTaskFingerprint({
    assignmentPetKeys: row.petIds,
    taskName: row.label,
    taskCode: row.custom ? null : row.templateId,
    custom: row.custom,
    priority: row.priority,
    notes: row.notes,
  });
}

export function rowsForVisit(
  tasks: TaskPlan[],
  visit: number,
  lang: "en" | "zh" | "ja",
): VisitTaskEditRow[] {
  const rows = new Map<string, VisitTaskEditRow>();
  [...tasks]
    .filter((task) => task.visitNumbers.includes(visit))
    .sort((a, b) => visitTaskOrder(a, visit) - visitTaskOrder(b, visit))
    .forEach((task) => {
      const key = homeVisitTaskFingerprint({
        assignmentPetKeys: task.petIds,
        taskName: task.label,
        taskCode: task.custom ? null : task.templateId,
        custom: task.custom,
        priority: task.priority,
        notes: task.notes,
      });
      const existing = rows.get(key);
      if (existing) {
        task.petIds.forEach((petId) => {
          if (!existing.petIds.includes(petId)) existing.petIds.push(petId);
        });
        return;
      }
      rows.set(key, {
        id: crypto.randomUUID(),
        petIds: [...task.petIds],
        templateId: task.custom ? customTaskId : task.templateId,
        customLabel: task.custom ? task.label : "",
        label: localizeTaskLabel(task.label, lang, {
          templateId: task.templateId,
          custom: task.custom,
        }),
        custom: task.custom,
        priority: task.priority,
        notes: task.notes ?? "",
      });
    });
  return Array.from(rows.values());
}

/**
 * Replace one visit's editor rows while preserving shared semantic tasks.
 * Content edits cause copy-on-write; a pure reorder only updates the target
 * visit's relation order and leaves the source visit untouched.
 */
export function replaceVisitRows(
  tasks: TaskPlan[],
  visit: number,
  rows: VisitTaskEditRow[],
): TaskPlan[] {
  const remaining = tasks.flatMap((task) => {
    if (!task.visitNumbers.includes(visit)) return [task];
    const visitNumbers = task.visitNumbers.filter((number) => number !== visit);
    if (!visitNumbers.length) return [];
    const orderByVisit = task.orderByVisit
      ? Object.fromEntries(
          Object.entries(task.orderByVisit).filter(
            ([visitNumber]) => Number(visitNumber) !== visit,
          ),
        )
      : undefined;
    return [
      {
        ...task,
        visitNumbers,
        ...(orderByVisit && Object.keys(orderByVisit).length
          ? { orderByVisit }
          : { orderByVisit: undefined }),
      },
    ];
  });

  rows.forEach((row, order) => {
    const fingerprint = rowFingerprint(row);
    const reusable = remaining.find(
      (task) =>
        rowFingerprint({
          petIds: task.petIds,
          templateId: task.custom ? customTaskId : task.templateId,
          custom: task.custom,
          label: task.label,
          priority: task.priority,
          notes: task.notes ?? "",
        }) === fingerprint,
    );
    const reusableIndex = reusable ? remaining.indexOf(reusable) : -1;
    if (reusable && reusableIndex >= 0) {
      const orderByVisit = {
        ...(reusable.orderByVisit ?? {}),
        [visit]: order,
      };
      remaining[reusableIndex] = {
        ...reusable,
        visitNumbers: Array.from(
          new Set([...reusable.visitNumbers, visit]),
        ).sort((a, b) => a - b),
        orderByVisit,
      };
      return;
    }
    remaining.push({
      id: `visit-task-${crypto.randomUUID()}`,
      templateId: row.custom
        ? row.templateId === customTaskId
          ? `custom-${crypto.randomUUID()}`
          : row.templateId
        : row.templateId,
      label: row.custom
        ? row.label
        : taskPersistenceLabel({
            code: row.templateId,
            label: row.label,
            custom: false,
          }),
      priority: row.priority,
      petIds: [...row.petIds].sort(),
      visitNumbers: [visit],
      custom: row.custom,
      notes: row.notes.trim() || undefined,
      order,
      orderByVisit: { [visit]: order },
    });
  });
  return remaining;
}
