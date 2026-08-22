import type {
  BoardingRoutine,
  BoardingTaskConfig,
} from "@/domain/publishing/legacy-need-draft-v3";

function routineSignature(
  config: BoardingTaskConfig,
  routine: BoardingRoutine,
) {
  return JSON.stringify({
    templateId: config.templateId,
    scheduleType: routine.scheduleType,
    instructions: routine.instructions,
    priority: routine.priority,
  });
}

export function copyBoardingTasksToPetGroup({
  value,
  sourcePetIds,
  targetPetIds,
  createId = () => crypto.randomUUID(),
}: {
  value: BoardingTaskConfig[];
  sourcePetIds: string[];
  targetPetIds: string[];
  createId?: () => string;
}) {
  const allItems = value.flatMap((config) =>
    config.routines.map((routine) => ({ config, routine })),
  );
  const sourceItems = allItems.filter(({ routine }) =>
    routine.petIds.some((petId) => sourcePetIds.includes(petId)),
  );
  const targetSignatures = new Set(
    allItems
      .filter(({ routine }) =>
        routine.petIds.some((petId) => targetPetIds.includes(petId)),
      )
      .map(({ config, routine }) => routineSignature(config, routine)),
  );
  let order = Math.max(-1, ...allItems.map(({ routine }) => routine.order)) + 1;
  let copiedCount = 0;
  const copiesByTemplateId = new Map<string, BoardingRoutine[]>();

  sourceItems.forEach(({ config, routine }) => {
    const signature = routineSignature(config, routine);
    if (targetSignatures.has(signature)) return;
    targetSignatures.add(signature);
    copiedCount += 1;
    targetPetIds.forEach((petId) => {
      copiesByTemplateId.set(config.templateId, [
        ...(copiesByTemplateId.get(config.templateId) ?? []),
        {
          ...routine,
          id: createId(),
          petIds: [petId],
          order: order++,
        },
      ]);
    });
  });

  return {
    copiedCount,
    value: value.map((config) => ({
      ...config,
      routines: [
        ...config.routines,
        ...(copiesByTemplateId.get(config.templateId) ?? []),
      ],
    })),
  };
}
