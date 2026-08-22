import { describe, expect, it } from "vitest";
import type {
  BoardingRoutine,
  BoardingTaskConfig,
} from "@/domain/publishing/legacy-need-draft-v3";
import { mergeIdenticalBoardingTaskItems } from "./boarding-task-grouping";
import { copyBoardingTasksToPetGroup } from "./boarding-task-copy";

function routine(
  id: string,
  petIds: string[],
  overrides: Partial<BoardingRoutine> = {},
): BoardingRoutine {
  return {
    id,
    petIds,
    priority: "must",
    scheduleType: "daily",
    instructions: "20 g per rabbit",
    order: 0,
    ...overrides,
  };
}

describe("copyBoardingTasksToPetGroup", () => {
  it("copies source routines to every pet in the target group as independent routines", () => {
    const value: BoardingTaskConfig[] = [
      {
        templateId: "boarding-feeding",
        label: "Feeding",
        custom: false,
        routines: [routine("source", ["rabbit-1", "rabbit-2"])],
      },
    ];

    const result = copyBoardingTasksToPetGroup({
      value,
      sourcePetIds: ["rabbit-1", "rabbit-2"],
      targetPetIds: ["cat-1"],
      createId: () => "copy",
    });

    expect(result.copiedCount).toBe(1);
    expect(result.value[0].routines).toHaveLength(2);
    expect(result.value[0].routines[1]).toMatchObject({
      id: "copy",
      petIds: ["cat-1"],
      instructions: "20 g per rabbit",
      order: 1,
    });
  });

  it("does not add the same configured routine twice to a target group", () => {
    const source = routine("source", ["rabbit-1"]);
    const target = routine("target", ["cat-1"], { order: 1 });
    const value: BoardingTaskConfig[] = [
      {
        templateId: "boarding-feeding",
        label: "Feeding",
        custom: false,
        routines: [source, target],
      },
    ];

    const result = copyBoardingTasksToPetGroup({
      value,
      sourcePetIds: ["rabbit-1"],
      targetPetIds: ["cat-1"],
      createId: () => "unused",
    });

    expect(result.copiedCount).toBe(0);
    expect(result.value[0].routines).toHaveLength(2);
  });
});

describe("mergeIdenticalBoardingTaskItems", () => {
  const config = (label: string, routines: BoardingRoutine[]) => ({
    templateId: `boarding-${label.toLowerCase()}`,
    label,
    custom: false,
    routines,
  });

  it("combines separately assigned identical tasks into one pet group row", () => {
    const snowball = routine("snowball-task", ["snowball"], { order: 2 });
    const huihui = routine("huihui-task", ["huihui"], { order: 1 });
    const taskConfig = config("Feeding", [snowball, huihui]);

    const result = mergeIdenticalBoardingTaskItems(
      [
        { config: taskConfig, routine: snowball },
        { config: taskConfig, routine: huihui },
      ],
      ["snowball", "huihui"],
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      petIds: ["snowball", "huihui"],
      config: taskConfig,
      routine: huihui,
      sourceItems: [
        { config: taskConfig, routine: snowball },
        { config: taskConfig, routine: huihui },
      ],
    });
  });

  it("keeps tasks separate when notes differ", () => {
    const taskConfig = config("Feeding", []);
    const snowball = routine("snowball-task", ["snowball"], {
      instructions: "10 g",
    });
    const huihui = routine("huihui-task", ["huihui"], {
      instructions: "20 g",
    });

    const result = mergeIdenticalBoardingTaskItems(
      [
        { config: taskConfig, routine: snowball },
        { config: taskConfig, routine: huihui },
      ],
      ["snowball", "huihui"],
    );

    expect(result).toHaveLength(2);
  });
});
