"use client";

import { useCallback, useState } from "react";

import type {
  PublishDraftCreateInput,
  PublishDraftSaveInput,
} from "@/domain/publishing/contracts";
import { trpc } from "@/utils/trpc";
import type { DraftSaveState } from "./publishing-flow-shell";

export function usePublishDraft() {
  const [revision, setRevision] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<DraftSaveState>("idle");
  const createMutation = trpc.publishDraft.create.useMutation();
  const saveMutation = trpc.publishDraft.save.useMutation();

  const createDraft = useCallback(
    async (input: PublishDraftCreateInput) => {
      setSaveState("saving");
      try {
        const draft = await createMutation.mutateAsync(input);
        setRevision(draft.revision);
        setSaveState("saved");
        return draft;
      } catch (error) {
        setSaveState("error");
        throw error;
      }
    },
    [createMutation],
  );

  const saveDraft = useCallback(
    async (input: Omit<PublishDraftSaveInput, "expectedRevision">) => {
      if (revision === null) throw new Error("DRAFT_NOT_CREATED");
      setSaveState("saving");
      try {
        const draft = await saveMutation.mutateAsync({
          ...input,
          expectedRevision: revision,
        } as PublishDraftSaveInput);
        setRevision(draft.revision);
        setSaveState("saved");
        return draft;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setSaveState(message.includes("DRAFT_REVISION_CONFLICT") ? "conflict" : "error");
        throw error;
      }
    },
    [revision, saveMutation],
  );

  const adoptRevision = useCallback((nextRevision: number) => {
    setRevision(nextRevision);
    setSaveState("saved");
  }, []);

  return {
    revision,
    saveState,
    createDraft,
    saveDraft,
    adoptRevision,
    isPending: createMutation.isLoading || saveMutation.isLoading,
  };
}
