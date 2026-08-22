import type {
  BoardingRoutine,
  BoardingTaskConfig,
} from "@/domain/publishing/legacy-need-draft-v3";

export type BoardingTaskItem = {
  config: BoardingTaskConfig;
  routine: BoardingRoutine;
};

export type BoardingDisplayTaskItem = BoardingTaskItem & {
  petIds: string[];
  sourceItems: BoardingTaskItem[];
};

export function mergeIdenticalBoardingTaskItems(
  items: BoardingTaskItem[],
  petIds: string[],
) {
  const merged = new Map<string, BoardingDisplayTaskItem>();
  items.forEach((item) => {
    const signature = [
      item.config.label,
      item.routine.scheduleType,
      item.routine.instructions,
    ].join("\u0000");
    const itemPetIds = petIds.filter((petId) =>
      item.routine.petIds.includes(petId),
    );
    const existing = merged.get(signature);
    if (existing) {
      itemPetIds.forEach((petId) => {
        if (!existing.petIds.includes(petId)) existing.petIds.push(petId);
      });
      existing.sourceItems.push(item);
      if (item.routine.order < existing.routine.order) {
        existing.config = item.config;
        existing.routine = item.routine;
      }
      return;
    }
    merged.set(signature, {
      ...item,
      petIds: itemPetIds,
      sourceItems: [item],
    });
  });
  return Array.from(merged.values()).sort(
    (a, b) => a.routine.order - b.routine.order,
  );
}
