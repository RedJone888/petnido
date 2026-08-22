"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  mapLegacyNeedDraftV3,
  type NeedDraftSnapshotV3,
} from "@/domain/publishing/legacy-need-draft-v3";
import { trpc } from "@/utils/trpc";
import { createSerialTaskQueue } from "./serial-task-queue";
import { usePublishDraft } from "./use-publish-draft";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validDraftId(value: string | undefined) {
  return value && uuidPattern.test(value) ? value : null;
}

function draftContentSignature(snapshot: NeedDraftSnapshotV3 | null) {
  if (!snapshot) return null;
  const {
    currentId: _currentId,
    visitedScreenIds: _visitedScreenIds,
    savedAt: _savedAt,
    serverDraftId: _serverDraftId,
    publishIdempotencyKey: _publishIdempotencyKey,
    ...persistableDraft
  } = snapshot;
  return JSON.stringify(persistableDraft);
}

export function useNeedDraftV2Persistence({
  enabled,
  authenticated,
  snapshot,
  onServerDraftId,
}: {
  enabled: boolean;
  authenticated: boolean;
  snapshot: NeedDraftSnapshotV3 | null;
  onServerDraftId: (id: string) => void;
}) {
  const persistence = usePublishDraft();
  const persistenceRef = useRef(persistence);
  const utils = trpc.useUtils();
  const abandonMutation = trpc.publishDraft.abandon.useMutation();
  const latestSnapshotRef = useRef(snapshot);
  const serverDraftIdRef = useRef<string | null>(
    validDraftId(snapshot?.serverDraftId),
  );
  const initializedRef = useRef(false);
  const taskQueueRef = useRef(createSerialTaskQueue());
  const autoSaveSignatureRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const publishingRef = useRef(false);

  latestSnapshotRef.current = snapshot;
  persistenceRef.current = persistence;
  const snapshotSignature = draftContentSignature(snapshot);

  useEffect(() => {
    const snapshotId = validDraftId(snapshot?.serverDraftId);
    if (!snapshotId || snapshotId === serverDraftIdRef.current) return;
    serverDraftIdRef.current = snapshotId;
    initializedRef.current = false;
  }, [snapshot?.serverDraftId]);

  const commandFor = useCallback((draft: NeedDraftSnapshotV3, id: string) => {
    const mapped = mapLegacyNeedDraftV3(
      draft,
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    );
    return {
      id,
      kind: "NEED" as const,
      mode: mapped.mode,
      currentStep: draft.currentId,
      payload: mapped.payload,
    };
  }, []);

  const persistDraft = useCallback(
    async (draft: NeedDraftSnapshotV3) => {
      let id = serverDraftIdRef.current;
      const hadServerDraftId = Boolean(id);
      if (!id) {
        id = crypto.randomUUID();
        serverDraftIdRef.current = id;
        onServerDraftId(id);
      }
      const command = commandFor(draft, id);
      if (!initializedRef.current) {
        const created = await persistenceRef.current.createDraft(command);
        initializedRef.current = true;
        if (!hadServerDraftId) return { id, revision: created.revision };
      }
      const saved = await persistenceRef.current.saveDraft(command);
      return { id, revision: saved.revision };
    },
    [commandFor, onServerDraftId],
  );

  const enqueue = useCallback(
    <T,>(operation: () => Promise<T>) => taskQueueRef.current.enqueue(operation),
    [],
  );

  const enqueueSave = useCallback(
    (draft: NeedDraftSnapshotV3) => enqueue(() => persistDraft(draft)),
    [enqueue, persistDraft],
  );

  useEffect(() => {
    if (
      !enabled ||
      !authenticated ||
      !snapshotSignature ||
      publishingRef.current
    ) {
      autoSaveSignatureRef.current = null;
      return;
    }
    if (autoSaveSignatureRef.current === snapshotSignature) return;
    autoSaveSignatureRef.current = snapshotSignature;
    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      const latestSnapshot = latestSnapshotRef.current;
      if (latestSnapshot) void enqueueSave(latestSnapshot);
    }, 900);
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [authenticated, enabled, enqueueSave, snapshotSignature]);

  const keepCurrentChanges = useCallback(async () => {
    const draft = latestSnapshotRef.current;
    const id = serverDraftIdRef.current;
    if (!draft || !id) return;
    const latest = await utils.publishDraft.getMine.fetch({ id });
    await persistenceRef.current.saveDraft(commandFor(draft, id), latest.revision);
    initializedRef.current = true;
  }, [commandFor, utils.publishDraft.getMine]);

  const abandonDraft = useCallback(async () => {
    const id = serverDraftIdRef.current;
    if (!enabled || !authenticated || !id) return;
    await abandonMutation.mutateAsync({ id });
    serverDraftIdRef.current = null;
    initializedRef.current = false;
  }, [abandonMutation, authenticated, enabled]);

  return {
    draftId: serverDraftIdRef.current,
    saveState:
      enabled && authenticated && snapshot ? persistence.saveState : ("idle" as const),
    saveNow: async (draft: NeedDraftSnapshotV3) => {
      return enqueueSave(draft);
    },
    saveAndRun: async <T,>(
      draft: NeedDraftSnapshotV3,
      operation: (savedDraft: { id: string; revision: number }) => Promise<T>,
    ) => {
      publishingRef.current = true;
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      autoSaveSignatureRef.current = draftContentSignature(draft);
      try {
        return await enqueue(async () => {
          const savedDraft = await persistDraft(draft);
          return operation(savedDraft);
        });
      } finally {
        publishingRef.current = false;
      }
    },
    keepCurrentChanges,
    abandonDraft,
  };
}
