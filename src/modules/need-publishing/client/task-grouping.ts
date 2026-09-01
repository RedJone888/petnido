import type { TaskPriority } from "@/domain/publishing/legacy-need-draft-v3";

export type PetTaskState = {
  name: string;
  templateId: string;
  custom: boolean;
  priority: TaskPriority;
  notes: string;
  order: number;
  representativeTaskId: string;
};

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
    const petIds = Array.from(new Set(item.petIds)).sort();
    const key = petIds.join("|");
    const previous = groups.at(-1);
    // rowSpan is a presentation-only optimization. Only adjacent rows may be
    // merged; looking up an older group would silently reorder intervening
    // rows and change the task sequence the user saved.
    if (previous?.key === key) previous.items.push(item);
    else groups.push({ key, petIds, items: [item] });
    return groups;
  }, []);
}
