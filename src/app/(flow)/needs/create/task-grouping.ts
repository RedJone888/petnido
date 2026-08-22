import type {
  TaskPlan,
  TaskPriority,
} from "@/domain/publishing/legacy-need-draft-v3";

export type PetTaskState = {
  name: string;
  templateId: string;
  custom: boolean;
  priority: TaskPriority;
  notes: string;
  order: number;
  representativeTaskId: string;
};

export function normalizedTaskName(label: string) {
  return label.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function explodePetTasks(tasks: TaskPlan[]): TaskPlan[] {
  return tasks.flatMap((task) => {
    if (task.petIds.length <= 1) return [task];
    const baseId = task.id.includes(":") ? task.id.split(":")[0] : task.id;
    return task.petIds.map((petId) => ({
      ...task,
      id: `${baseId}:${petId}`,
      petIds: [petId],
    }));
  });
}

export function buildPetTaskStates(
  tasks: TaskPlan[],
): Map<string, Map<string, PetTaskState>> {
  const states = new Map<string, Map<string, PetTaskState>>();
  for (const task of explodePetTasks(tasks)) {
    const petId = task.petIds[0];
    if (!petId) continue;
    const petMap = states.get(petId) ?? new Map<string, PetTaskState>();
    const key = normalizedTaskName(task.label);
    const state: PetTaskState = {
      name: task.label,
      templateId: task.templateId,
      custom: task.custom,
      priority: task.priority,
      notes: task.notes ?? "",
      order: task.order ?? 0,
      representativeTaskId: task.id,
    };
    const existing = petMap.get(key);
    if (!existing || (task.order ?? 0) >= existing.order) {
      petMap.set(key, state);
    }
    states.set(petId, petMap);
  }
  return states;
}

export function groupTaskStatesByConfiguration(
  petStates: Map<string, Map<string, PetTaskState>>,
): Array<{ petIds: string[]; state: PetTaskState }> {
  const rows = new Map<string, { petIds: string[]; state: PetTaskState }>();
  for (const [petId, stateMap] of petStates) {
    for (const state of stateMap.values()) {
      const key = [
        normalizedTaskName(state.name),
        state.priority,
        state.notes.trim(),
      ].join("\u0000");
      const existing = rows.get(key);
      if (existing) {
        if (!existing.petIds.includes(petId)) existing.petIds.push(petId);
        if (state.order < existing.state.order) existing.state = state;
      } else {
        rows.set(key, { petIds: [petId], state });
      }
    }
  }
  return Array.from(rows.values()).sort(
    (a, b) => a.state.order - b.state.order,
  );
}

export type TaskRowItem = { petIds: string[]; state: PetTaskState };

export type PetTaskGroupItem<T extends { petIds: string[] } = TaskRowItem> = {
  key: string;
  petIds: string[];
  items: T[];
};

export function groupTaskRowsByPetGroup<T extends { petIds: string[] }>(
  taskRows: T[],
): PetTaskGroupItem<T>[] {
  return taskRows.reduce<PetTaskGroupItem<T>[]>((groups, item) => {
    const key = [...item.petIds].sort().join("|");
    const existing = groups.find((candidate) => candidate.key === key);
    if (existing) existing.items.push(item);
    else groups.push({ key, petIds: item.petIds, items: [item] });
    return groups;
  }, []);
}

export type AtomicTaskEntry = {
  visitNumber: number;
  petId: string;
  templateId: string;
  label: string;
  priority: TaskPriority;
  notes: string;
  custom: boolean;
  order: number;
};

export function getAtomicTaskKey(
  visitNumber: number,
  petId: string,
  label: string,
): string {
  return `${visitNumber}::${petId}::${normalizedTaskName(label)}`;
}

export function tasksToAtomicMap(
  tasks: TaskPlan[],
): Map<string, AtomicTaskEntry> {
  const map = new Map<string, AtomicTaskEntry>();
  for (const task of tasks) {
    const visits = task.visitNumbers?.length ? task.visitNumbers : [1];
    const pets = task.petIds?.length ? task.petIds : [];
    for (const visitNumber of visits) {
      for (const petId of pets) {
        const key = getAtomicTaskKey(visitNumber, petId, task.label);
        const existing = map.get(key);
        if (!existing || (task.order ?? 0) >= existing.order) {
          map.set(key, {
            visitNumber,
            petId,
            templateId: task.templateId,
            label: task.label,
            priority: task.priority,
            notes: (task.notes ?? "").trim(),
            custom: Boolean(task.custom),
            order: task.order ?? 0,
          });
        }
      }
    }
  }
  return map;
}

export function atomicMapToTaskPlans(
  atomicMap: Map<string, AtomicTaskEntry>,
): TaskPlan[] {
  // Stage 1: Group by (visitNumber, normalizedName, priority, notes) -> aggregate petIds
  type VisitGroup = {
    visitNumber: number;
    templateId: string;
    label: string;
    priority: TaskPriority;
    notes: string;
    custom: boolean;
    order: number;
    petIds: string[];
  };

  const visitGroups = new Map<string, VisitGroup>();

  for (const entry of atomicMap.values()) {
    const normName = normalizedTaskName(entry.label);
    const key = `${entry.visitNumber}::${normName}::${entry.priority}::${entry.notes.trim()}`;
    const existing = visitGroups.get(key);

    if (existing) {
      if (!existing.petIds.includes(entry.petId)) {
        existing.petIds.push(entry.petId);
      }
      if (entry.order < existing.order) {
        existing.order = entry.order;
      }
    } else {
      visitGroups.set(key, {
        visitNumber: entry.visitNumber,
        templateId: entry.templateId,
        label: entry.label,
        priority: entry.priority,
        notes: entry.notes.trim(),
        custom: entry.custom,
        order: entry.order,
        petIds: [entry.petId],
      });
    }
  }

  // Stage 2: Group by (normalizedName, priority, notes, sortedPetIds) -> aggregate visitNumbers
  type CrossVisitGroup = {
    templateId: string;
    label: string;
    priority: TaskPriority;
    notes: string;
    custom: boolean;
    order: number;
    petIds: string[];
    visitNumbers: number[];
  };

  const crossGroups = new Map<string, CrossVisitGroup>();

  for (const vg of visitGroups.values()) {
    const normName = normalizedTaskName(vg.label);
    const sortedPetsKey = [...vg.petIds].sort().join(",");
    const key = `${normName}::${vg.priority}::${vg.notes}::${sortedPetsKey}`;
    const existing = crossGroups.get(key);

    if (existing) {
      if (!existing.visitNumbers.includes(vg.visitNumber)) {
        existing.visitNumbers.push(vg.visitNumber);
      }
      if (vg.order < existing.order) {
        existing.order = vg.order;
      }
    } else {
      crossGroups.set(key, {
        templateId: vg.templateId,
        label: vg.label,
        priority: vg.priority,
        notes: vg.notes,
        custom: vg.custom,
        order: vg.order,
        petIds: [...vg.petIds].sort(),
        visitNumbers: [vg.visitNumber],
      });
    }
  }

  // Stage 3: Convert to TaskPlan[] with stable IDs and order
  const sorted = Array.from(crossGroups.values()).sort(
    (a, b) => a.order - b.order,
  );

  return sorted.map((item, index) => ({
    id: `visit-task-${item.templateId}-${index + 1}-${crypto.randomUUID().slice(0, 8)}`,
    templateId: item.templateId,
    label: item.label,
    priority: item.priority,
    petIds: item.petIds,
    visitNumbers: item.visitNumbers.sort((a, b) => a - b),
    custom: item.custom,
    notes: item.notes || undefined,
    order: index,
  }));
}

export type ModalTaskRowInput = {
  templateId: string;
  label: string;
  priority: TaskPriority;
  notes: string;
  custom: boolean;
};

export function applyVisitTaskModalChanges(params: {
  currentTasks: TaskPlan[];
  visit: number;
  selectedPetIds: string[];
  modalTasks: ModalTaskRowInput[];
  originalPetIds?: string[];
  originalNames?: string[];
}): TaskPlan[] {
  const {
    currentTasks,
    visit,
    selectedPetIds,
    modalTasks,
    originalPetIds,
    originalNames,
  } = params;

  const atomicMap = tasksToAtomicMap(currentTasks);

  // If editing an existing configuration group:
  if (originalPetIds && originalPetIds.length > 0) {
    const unselectedPets = originalPetIds.filter(
      (petId) => !selectedPetIds.includes(petId),
    );
    const targetNames = originalNames && originalNames.length > 0
      ? originalNames
      : modalTasks.map((t) => t.label);

    // 1. Unbind tasks for pets that were deselected in the modal
    for (const petId of unselectedPets) {
      for (const name of targetNames) {
        atomicMap.delete(getAtomicTaskKey(visit, petId, name));
      }
    }

    // 2. Remove tasks that were deleted inside the modal for remaining pets
    const currentModalNameSet = new Set(
      modalTasks.map((t) => normalizedTaskName(t.label)),
    );
    if (originalNames && originalNames.length > 0) {
      for (const name of originalNames) {
        if (!currentModalNameSet.has(normalizedTaskName(name))) {
          for (const petId of selectedPetIds) {
            atomicMap.delete(getAtomicTaskKey(visit, petId, name));
          }
        }
      }
    }
  }

  // Next order base for this visit
  const existingOrdersInVisit = Array.from(atomicMap.values())
    .filter((e) => e.visitNumber === visit)
    .map((e) => e.order);
  const baseOrder =
    existingOrdersInVisit.length > 0 ? Math.max(...existingOrdersInVisit) + 1 : 0;

  // Set / update atomic entries for all selected pets and modal tasks
  modalTasks.forEach((task, rowIndex) => {
    for (const petId of selectedPetIds) {
      atomicMap.set(getAtomicTaskKey(visit, petId, task.label), {
        visitNumber: visit,
        petId,
        templateId: task.templateId,
        label: task.label,
        priority: task.priority,
        notes: task.notes.trim(),
        custom: task.custom,
        order: baseOrder + rowIndex,
      });
    }
  });

  return atomicMapToTaskPlans(atomicMap);
}

export function copyVisitTasksWithFingerprint(
  tasks: TaskPlan[],
  sourceVisit: number,
  targetVisit: number,
): TaskPlan[] {
  if (sourceVisit === targetVisit) return tasks;

  const atomicMap = tasksToAtomicMap(tasks);

  // Extract all atomic entries from source visit
  const sourceEntries = Array.from(atomicMap.values()).filter(
    (e) => e.visitNumber === sourceVisit,
  );

  // Copy to target visit
  for (const entry of sourceEntries) {
    const key = getAtomicTaskKey(targetVisit, entry.petId, entry.label);
    atomicMap.set(key, {
      ...entry,
      visitNumber: targetVisit,
    });
  }

  return atomicMapToTaskPlans(atomicMap);
}

export function removeVisitPetConfigWithFingerprint(
  tasks: TaskPlan[],
  visit: number,
  petIds: string[],
  taskNames?: string[],
): TaskPlan[] {
  const atomicMap = tasksToAtomicMap(tasks);
  const petSet = new Set(petIds);
  const nameSet = taskNames?.length
    ? new Set(taskNames.map((n) => normalizedTaskName(n)))
    : null;

  for (const [key, entry] of Array.from(atomicMap.entries())) {
    if (entry.visitNumber === visit && petSet.has(entry.petId)) {
      if (!nameSet || nameSet.has(normalizedTaskName(entry.label))) {
        atomicMap.delete(key);
      }
    }
  }

  return atomicMapToTaskPlans(atomicMap);
}
