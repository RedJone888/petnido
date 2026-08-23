export type SerialTaskQueue = {
  enqueue<T>(operation: () => Promise<T>): Promise<T>;
};

export function createSerialTaskQueue(): SerialTaskQueue {
  let tail: Promise<void> = Promise.resolve();

  return {
    enqueue<T>(operation: () => Promise<T>) {
      const queued = tail.then(operation, operation);
      tail = queued.then(
        () => undefined,
        () => undefined,
      );
      return queued;
    },
  };
}
