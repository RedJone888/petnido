"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  mapLegacyNeedDraftV3,
  type NeedDraftSnapshotV3,
} from "@/domain/publishing/legacy-need-draft-v3";
import { trpc } from "@/utils/trpc";
import { createSerialTaskQueue } from "./serial-task-queue";
import { usePublishDraft } from "@/components/publishing/use-publish-draft";

function validDraftId(value: string | undefined) {
  return value && typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
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
  editingNeedId,
  onServerDraftId,
}: {
  enabled: boolean;
  authenticated: boolean;
  snapshot: NeedDraftSnapshotV3 | null;
  editingNeedId?: string;
  onServerDraftId: (id: string) => void;
}) {
  const persistence = usePublishDraft();
  const persistenceRef = useRef(persistence);
  const utils = trpc.useUtils();
  const abandonMutation = trpc.publishDraft.abandon.useMutation();
  const createEditDraftMutation = trpc.needV2.createEditDraft.useMutation();
  const createEditDraftMutationRef = useRef(createEditDraftMutation);
  createEditDraftMutationRef.current = createEditDraftMutation;
  const latestSnapshotRef = useRef(snapshot);
  const serverDraftIdRef = useRef<string | null>(
    validDraftId(snapshot?.serverDraftId),
  );
  const initializedRef = useRef(false);
  const taskQueueRef = useRef(createSerialTaskQueue());
  const autoSaveSignatureRef = useRef<string | null>(null);
  const lastSavedDraftRef = useRef<{
    signature: string;
    id: string;
    revision: number;
  } | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveRetrySignatureRef = useRef<string | null>(null);
  const autoSaveRetryCountRef = useRef(0);
  const publishingRef = useRef(false);
  const [lastSavedSignature, setLastSavedSignature] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  latestSnapshotRef.current = snapshot;
  persistenceRef.current = persistence;
  const snapshotSignature = draftContentSignature(snapshot);

  useEffect(() => {
    const snapshotId = validDraftId(snapshot?.serverDraftId);
    if (!snapshotId || snapshotId === serverDraftIdRef.current) return;
    serverDraftIdRef.current = snapshotId;
    initializedRef.current = false;
    lastSavedDraftRef.current = null;
    setLastSavedSignature(null);
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
      payload: {
        ...mapped.payload,
        workspace: {
          version: 1 as const,
          common: {
            careType: draft.careType,
            pets: draft.pets,
            attachments: draft.attachments ?? [],
            publishIdempotencyKey: draft.publishIdempotencyKey ?? null,
            confirmedScreenIds: draft.confirmedScreenIds ?? [],
          },
          draftByMode: draft.draftByMode ?? {},
        },
      },
    };
  }, []);

  const persistDraft = useCallback(
    async (draft: NeedDraftSnapshotV3) => {
      const signature = draftContentSignature(draft);
      let id = serverDraftIdRef.current;
      const hadServerDraftId = Boolean(id);
      if (!id) {
        id = crypto.randomUUID();
        serverDraftIdRef.current = id;
        onServerDraftId(id);
      }
      let command = commandFor(draft, id);
      if (!initializedRef.current) {
        const requestedId = id;
        const created = editingNeedId
          ? await createEditDraftMutationRef.current.mutateAsync({
              id,
              needId: editingNeedId,
              mode: command.mode!,
              currentStep: command.currentStep,
              payload: command.payload,
            })
          : await persistenceRef.current.createDraft(command);
        initializedRef.current = true;
        if (editingNeedId) {
          persistenceRef.current.adoptRevision(created.revision);
        }
        const adoptedExistingDraft = created.id !== requestedId;
        if (adoptedExistingDraft) {
          serverDraftIdRef.current = created.id;
          onServerDraftId(created.id);
          // Another tab may have created the editing draft between beginEdit
          // and this first autosave. Continue with the canonical server draft
          // id; sending the old optimistic id would turn a recoverable race
          // into RESOURCE_NOT_FOUND and leave Publish blocked indefinitely.
          command = commandFor(draft, created.id);
          id = created.id;
        }
        if (!hadServerDraftId && !adoptedExistingDraft) {
          const savedDraft = { id: created.id, revision: created.revision };
          if (signature) {
            lastSavedDraftRef.current = { signature, ...savedDraft };
            setLastSavedSignature(signature);
            autoSaveRetryCountRef.current = 0;
          }
          return savedDraft;
        }
      }
      const saved = await persistenceRef.current.saveDraft(command);
      const savedDraft = { id, revision: saved.revision };
      if (signature) {
        lastSavedDraftRef.current = { signature, ...savedDraft };
        setLastSavedSignature(signature);
        autoSaveRetryCountRef.current = 0;
      }
      return savedDraft;
    },
    [commandFor, editingNeedId, onServerDraftId],
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
    if (autoSaveRetrySignatureRef.current !== snapshotSignature) {
      autoSaveRetrySignatureRef.current = snapshotSignature;
      autoSaveRetryCountRef.current = 0;
    }
    autoSaveSignatureRef.current = snapshotSignature;
    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      const latestSnapshot = latestSnapshotRef.current;
      if (latestSnapshot) {
        void enqueueSave(latestSnapshot).catch(() => {
          // A transient create/save failure must not permanently suppress the
          // same snapshot. Re-arm autosave instead of leaving Preview stuck.
          autoSaveRetryCountRef.current += 1;
          if (
            autoSaveRetryCountRef.current <= 2 &&
            autoSaveSignatureRef.current === snapshotSignature
          ) {
            autoSaveSignatureRef.current = null;
            setRetryVersion((version) => version + 1);
          }
        });
      }
    }, 900);
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [authenticated, enabled, enqueueSave, retryVersion, snapshotSignature]);

  const keepCurrentChanges = useCallback(async () => {
    const draft = latestSnapshotRef.current;
    const id = serverDraftIdRef.current;
    if (!draft || !id) return;
    const latest = await utils.publishDraft.getMine.fetch({ id });
    await persistenceRef.current.saveDraft(commandFor(draft, id), latest.revision);
    const revision = persistenceRef.current.getRevision();
    const signature = draftContentSignature(draft);
    if (signature && revision !== null) {
      lastSavedDraftRef.current = { signature, id, revision };
      setLastSavedSignature(signature);
    }
    initializedRef.current = true;
  }, [commandFor, utils.publishDraft.getMine]);

  const abandonDraft = useCallback(async () => {
    const id = serverDraftIdRef.current;
    if (!enabled || !authenticated || !id) return;
    await abandonMutation.mutateAsync({ id });
    serverDraftIdRef.current = null;
    initializedRef.current = false;
    lastSavedDraftRef.current = null;
    setLastSavedSignature(null);
  }, [abandonMutation, authenticated, enabled]);

  const isSynced =
    Boolean(snapshotSignature) &&
    Boolean(serverDraftIdRef.current) &&
    lastSavedSignature === snapshotSignature;

  const finalizePublished = useCallback(() => {
    // Publishing marks the server draft PUBLISHED in the same transaction as
    // the need. Keep autosave permanently quiet while this page navigates
    // away so the completed draft is not presented as another sync operation.
    publishingRef.current = true;
    latestSnapshotRef.current = null;
    autoSaveSignatureRef.current = null;
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  return {
    draftId: serverDraftIdRef.current,
    isSynced,
    saveState:
      enabled && authenticated && snapshot
        ? createEditDraftMutation.isLoading
          ? "saving"
          : createEditDraftMutation.error
            ? "error"
            : persistence.saveState === "saved" && !isSynced
              ? "idle"
              : persistence.saveState
        : ("idle" as const),
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
          const signature = draftContentSignature(draft);
          const lastSaved = lastSavedDraftRef.current;
          if (
            signature &&
            lastSaved?.signature === signature &&
            lastSaved.id === serverDraftIdRef.current
          ) {
            return operation({ id: lastSaved.id, revision: lastSaved.revision });
          }
          const savedDraft = await persistDraft(draft);
          return operation(savedDraft);
        });
      } finally {
        publishingRef.current = false;
      }
    },
    keepCurrentChanges,
    abandonDraft,
    finalizePublished,
  };
}
