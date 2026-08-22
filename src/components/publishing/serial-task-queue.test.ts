import { describe, expect, it } from "vitest";

import { createSerialTaskQueue } from "./serial-task-queue";

describe("serial draft task queue", () => {
  it("keeps the final save and publish operation atomic behind pending autosaves", async () => {
    const queue = createSerialTaskQueue();
    const events: string[] = [];
    let releaseAutosave!: () => void;
    const autosaveGate = new Promise<void>((resolve) => {
      releaseAutosave = resolve;
    });

    const pendingAutosave = queue.enqueue(async () => {
      events.push("autosave:start");
      await autosaveGate;
      events.push("autosave:end");
    });
    const publish = queue.enqueue(async () => {
      events.push("final-save");
      events.push("publish");
    });
    const laterAutosave = queue.enqueue(async () => {
      events.push("later-autosave");
    });

    await Promise.resolve();
    expect(events).toEqual(["autosave:start"]);

    releaseAutosave();
    await Promise.all([pendingAutosave, publish, laterAutosave]);

    expect(events).toEqual([
      "autosave:start",
      "autosave:end",
      "final-save",
      "publish",
      "later-autosave",
    ]);
  });
});
