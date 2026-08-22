"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiPencilSimple,
  PiPlus,
  PiSparkle,
  PiTrash,
  PiWarningCircle,
} from "react-icons/pi";
import { ModalShell } from "@/components/ui/modal-shell";
import { useLanguage } from "@/components/providers/language-provider";
import type {
  PetDraft,
  TaskPlan,
} from "@/domain/publishing/legacy-need-draft-v3";
import { localizeOtherPetType } from "@/domain/pet/profile-options";
import cn from "@/lib/cn";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { VisitTaskNameCombobox } from "../components/controls/visit-task-combobox";
import {
  buildPetTaskStates,
  explodePetTasks,
  Field,
  groupTaskRowsByPetGroup,
  groupTaskStatesByConfiguration,
  inputClass,
  normalizedTaskName,
  petDisplayType,
  PetDraftAvatar,
  textareaClass,
  type PetTaskState,
} from "../guided-need-flow-shared";

const customTaskId = "__custom-task__";

type CustomTaskModalRow = {
  id: string;
  templateId: string;
  customLabel: string;
  notes: string;
};

type CustomTaskModalState = {
  petIds: string[];
  rows: CustomTaskModalRow[];
  originalPetIds?: string[];
  originalNames?: string[];
};

export function StepCustomTasks({
  options,
  pets,
  value,
  onChange,
  notes,
  onNotesChange,
  showValidation,
}: {
  options: Array<{ id: string; label: string; icon: IconType }>;
  pets: PetDraft[];
  value: TaskPlan[];
  onChange: (value: TaskPlan[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  showValidation: boolean;
}) {
  const { lang, t } = useLanguage();
  const copy = t.core.needPublishingTaskForm;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const localizedOptions = options.map((option) => ({
    ...option,
    label:
      t.core.needPublishing.taskLabels[
        option.id as keyof typeof t.core.needPublishing.taskLabels
      ] ?? option.label,
  }));
  const localizedPetDisplayType = (pet: PetDraft) => {
    const normalizedType = pet.type.trim().toUpperCase();
    if (normalizedType !== "OTHER") {
      return (
        t.settings.pets.typeLabels[
          normalizedType as keyof typeof t.settings.pets.typeLabels
        ] ?? petDisplayType(pet)
      );
    }
    const customType = pet.otherType.trim();
    return customType
      ? localizeOtherPetType(customType, lang)
      : t.settings.pets.typeLabels.OTHER;
  };
  const [modal, setModal] = useState<CustomTaskModalState | null>(null);
  const [modalError, setModalError] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const taskTableRef = useRef<HTMLDivElement | null>(null);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  const taskRows = groupTaskStatesByConfiguration(buildPetTaskStates(value));
  const allPetIds = pets.map((pet) => pet.id);
  const allModalPetsSelected =
    Boolean(modal) &&
    modal!.petIds.length > 0 &&
    modal!.petIds.length === allPetIds.length;

  const createRow = (): CustomTaskModalRow => ({
    id: crypto.randomUUID(),
    templateId: "",
    customLabel: "",
    notes: "",
  });

  const openAddModal = () => {
    setModal({ petIds: [...allPetIds], rows: [createRow()] });
    setModalError("");
    setRowErrors({});
  };

  const openEditModal = (group: {
    petIds: string[];
    states: PetTaskState[];
  }) => {
    const sortedStates = [...group.states].sort((a, b) => a.order - b.order);
    setModal({
      petIds: [...group.petIds],
      originalPetIds: [...group.petIds],
      originalNames: group.states.map((state) =>
        normalizedTaskName(state.name),
      ),
      rows: sortedStates.map((state) => ({
        id: crypto.randomUUID(),
        templateId: state.custom ? customTaskId : state.templateId,
        customLabel: state.custom ? state.name : "",
        notes: state.notes,
      })),
    });
    setModalError("");
    setRowErrors({});
  };

  const closeModal = () => {
    setModal(null);
    setModalError("");
    setRowErrors({});
  };

  const updateModal = (patch: Partial<CustomTaskModalState>) => {
    if ("petIds" in patch) setModalError("");
    setModal((current) => (current ? { ...current, ...patch } : current));
  };

  const updateRow = (rowId: string, patch: Partial<CustomTaskModalRow>) => {
    setRowErrors((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    setModal((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row) =>
              row.id === rowId ? { ...row, ...patch } : row,
            ),
          }
        : current,
    );
  };

  const addRow = () => {
    const id = crypto.randomUUID();
    setModal((current) =>
      current
        ? {
            ...current,
            rows: [
              ...current.rows,
              { id, templateId: "", customLabel: "", notes: "" },
            ],
          }
        : current,
    );
    setFocusRowId(id);
  };
  useEffect(() => {
    if (!focusRowId || !modal) return;
    const frame = requestAnimationFrame(() => {
      taskTableRef.current?.scrollTo({
        top: taskTableRef.current.scrollHeight,
        behavior: "smooth",
      });
      requestAnimationFrame(() => setFocusRowId(null));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRowId, modal]);

  const removeRow = (rowId: string) =>
    setModal((current) =>
      current
        ? { ...current, rows: current.rows.filter((row) => row.id !== rowId) }
        : current,
    );

  const moveRow = (rowId: string, direction: -1 | 1) =>
    setModal((current) => {
      if (!current) return current;
      const rows = [...current.rows];
      const index = rows.findIndex((row) => row.id === rowId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= rows.length) return current;
      [rows[index], rows[target]] = [rows[target], rows[index]];
      return { ...current, rows };
    });

  const saveModal = () => {
    if (!modal) return;
    if (!modal.petIds.length) {
      setRowErrors({});
      setModalError(copy.validationPetRequired);
      return;
    }
    const taskNames = modal.rows.map((row) => {
      if (row.templateId === customTaskId) return row.customLabel.trim();
      const option = localizedOptions.find(
        (candidate) => candidate.id === row.templateId,
      );
      return option?.label ?? "";
    });
    const normalizedCounts = taskNames.reduce<Map<string, number>>(
      (counts, label) => {
        const normalized = label
          .trim()
          .replace(/\s+/g, " ")
          .toLocaleLowerCase(lang);
        if (normalized)
          counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        return counts;
      },
      new Map(),
    );
    const errors = Object.fromEntries(
      modal.rows.flatMap((row, index) => {
        const label = taskNames[index];
        if (!label) return [[row.id, copy.validationTaskNameRequired]];
        const normalized = label
          .trim()
          .replace(/\s+/g, " ")
          .toLocaleLowerCase(lang);
        if ((normalizedCounts.get(normalized) ?? 0) > 1)
          return [[row.id, copy.validationDuplicateTaskName]];
        return [];
      }),
    );
    setRowErrors(errors);
    if (Object.keys(errors).length) {
      setModalError("");
      return;
    }

    const originalPets = modal.originalPetIds ?? [];
    const originalNames = modal.originalNames ?? [];
    const removalNames = new Set(
      originalPets.length
        ? originalNames
        : taskNames.map((name) => normalizedTaskName(name)),
    );
    const removalPets = new Set(
      originalPets.length
        ? [...originalPets, ...modal.petIds]
        : modal.petIds,
    );
    const exploded = explodePetTasks(value);
    const kept = exploded.filter((task) => {
      const petId = task.petIds[0];
      return !(
        removalPets.has(petId) &&
        removalNames.has(normalizedTaskName(task.label))
      );
    });
    const nextOrder =
      Math.max(-1, ...exploded.map((task) => task.order ?? -1)) + 1;
    const newTasks: TaskPlan[] = [];
    modal.rows.forEach((row, rowIndex) => {
      const custom = row.templateId === customTaskId;
      const option = localizedOptions.find(
        (candidate) => candidate.id === row.templateId,
      );
      const label = custom
        ? row.customLabel.trim()
        : (option?.label ?? "Custom care task");
      const templateId = custom
        ? `custom-${crypto.randomUUID()}`
        : row.templateId;
      modal.petIds.forEach((petId) => {
        newTasks.push({
          id: `custom-task-${crypto.randomUUID()}`,
          templateId,
          label,
          priority: "must",
          petIds: [petId],
          visitNumbers: [],
          custom,
          notes: row.notes.trim() || undefined,
          order: nextOrder + rowIndex,
        } satisfies TaskPlan);
      });
    });
    onChange([...kept, ...newTasks]);
    closeModal();
  };

  const removeGroupTasks = (petIds: string[], names?: string[]) => {
    const scope = new Set(petIds);
    const nameScope = names
      ? new Set(names.map((name) => normalizedTaskName(name)))
      : null;
    onChange(
      value.filter(
        (task) =>
          !(
            task.petIds.some((petId) => scope.has(petId)) &&
            (!nameScope ||
              nameScope.has(normalizedTaskName(task.label)))
          ),
      ),
    );
    if (modal?.petIds.some((petId) => scope.has(petId))) {
      closeModal();
    }
  };
  const confirmDeleteGroupTasks = async (group: {
    petIds: string[];
    names: string[];
  }) => {
    const petNames = group.petIds
      .map((petId) => {
        const pet = pets.find((candidate) => candidate.id === petId);
        return pet
          ? pet.name || localizedPetDisplayType(pet)
          : "";
      })
      .join(" & ");
    const accepted = await confirm({
      title: copy.deleteConfirmTitle,
      content: (
        <p>
          {copy.deleteConfirmMessage.replace("{pets}", petNames)}
        </p>
      ),
      confirmText: copy.delete,
      cancelText: copy.cancel,
      variant: "danger",
    });
    if (!accepted) return;
    removeGroupTasks(group.petIds, group.names);
    closeConfirm();
  };

  const petsWithoutTasks = pets.filter(
    (pet) => !value.some((task) => task.petIds.includes(pet.id)),
  );
  const petsWithoutTasksMessage = petsWithoutTasks.length
    ? copy.validationPets.replace(
        "{pets}",
        petsWithoutTasks
          .map((pet) => {
            const petLabel =
              pet.name ||
              localizedPetDisplayType(pet) ||
              String(pets.indexOf(pet) + 1);
            return copy.petGroupPrefix.replace("{name}", petLabel);
          })
          .join(", "),
      )
    : "";
  const comboboxOptions = localizedOptions.map((option) => ({
    value: option.id,
    label: option.label,
    icon: option.icon,
  }));

  return (
    <div className="space-y-5">
      <section className="space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
          {copy.careTasks}
        </h3>
        <div className="relative w-fit max-w-full">
          <p className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap text-right text-[11px] font-medium text-[#817a85]">
            {copy.tasksCount.replace("{n}", String(taskRows.length))}
          </p>
          <div className="w-fit max-w-full overflow-x-auto rounded-[15px] border border-[var(--primary-border)] bg-white">
            <table className="w-fit max-w-full table-auto border-collapse text-left text-xs">
              <thead className="border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold tracking-[0.02em] text-[var(--on-primary-fixed-variant)]">
                <tr>
                  <th className="max-w-[280px] whitespace-normal px-3 py-2.5 text-center">
                    {copy.whoNeeds}
                  </th>
                  <th className="max-w-[320px] whitespace-normal px-3 py-2.5 text-center">
                    {copy.task}
                  </th>
                  <th className="max-w-[320px] whitespace-normal px-3 py-2.5 text-center">
                    {copy.notes}
                  </th>
                  <th className="w-20 max-w-20 whitespace-normal px-3 py-2.5 text-center">
                    {copy.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9ef]">
                {taskRows.length ? (
                  (() => {
                    const itemGroups = groupTaskRowsByPetGroup(taskRows);
                    return itemGroups.flatMap((petTaskGroup) => {
                      const targetPets = petTaskGroup.petIds.flatMap((petId) => {
                        const pet = pets.find(
                          (candidate) => candidate.id === petId,
                        );
                        return pet ? [pet] : [];
                      });
                      const targetPetNames = targetPets
                        .map(
                          (pet) =>
                            pet.name ||
                            localizedPetDisplayType(pet) ||
                            `Pet ${pets.indexOf(pet) + 1}`,
                        )
                        .join(" & ");
                      return petTaskGroup.items.map((taskRow, taskIndex) => {
                        const state = taskRow.state;
                        const TaskIcon =
                          localizedOptions.find(
                            (option) => option.id === state.templateId,
                          )?.icon ?? PiSparkle;
                        return (
                          <tr
                            key={state.representativeTaskId}
                            className="text-[#514956]"
                          >
                            {taskIndex === 0 ? (
                              <td
                                rowSpan={petTaskGroup.items.length}
                                className="max-w-[280px] px-3 py-3 text-left align-middle"
                              >
                                <div className="flex max-w-full flex-wrap items-start justify-start gap-2 text-left">
                                  {targetPets.map((pet) => (
                                    <div
                                      key={pet.id}
                                      className="flex min-w-0 max-w-full items-center gap-2 rounded-[12px] border border-[#dcd3e3] bg-transparent p-2"
                                    >
                                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                                        <PetDraftAvatar pet={pet} />
                                      </span>
                                      <span className="min-w-0 max-w-[120px]">
                                        <span className="block truncate text-xs font-bold text-[#35243f]">
                                          {pet.name ||
                                            localizedPetDisplayType(pet)}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[10px] text-[#817a85]">
                                          {localizedPetDisplayType(pet)}
                                        </span>
                                      </span>
                                    </div>
                                  ))}
                                  {!targetPets.length ? (
                                    <span className="text-xs text-[#9a939f]">
                                      {copy.noPets}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            ) : null}
                            <td className="max-w-[320px] whitespace-normal px-3 py-3 align-middle">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-fixed)] text-[10px] font-bold text-[var(--primary)]">
                                  {taskIndex + 1}
                                </span>
                                <span className="flex min-w-0 items-center gap-2 font-semibold text-[#514956]">
                                  <TaskIcon
                                    size={16}
                                    className="shrink-0 text-[#8a5d34]"
                                  />
                                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                                    {state.name}
                                  </span>
                                </span>
                              </div>
                            </td>
                            <td className="max-w-[320px] whitespace-normal px-3 py-3 text-center align-middle">
                              <span
                                className={cn(
                                  "block min-w-0 break-words text-xs [overflow-wrap:anywhere]",
                                  state.notes
                                    ? "text-[#514956]"
                                    : "text-[#aaa4ae]",
                                )}
                              >
                                {state.notes || "—"}
                              </span>
                            </td>
                            {taskIndex === 0 ? (
                              <td
                                rowSpan={petTaskGroup.items.length}
                                className="w-20 max-w-20 px-2 py-3 align-middle"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    aria-label={`${copy.edit} ${targetPetNames}`}
                                    title={copy.edit}
                                    onClick={() =>
                                      openEditModal({
                                        petIds: petTaskGroup.petIds,
                                        states: petTaskGroup.items.map(
                                          (item) => item.state,
                                        ),
                                      })
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-fixed)]"
                                  >
                                    <PiPencilSimple size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`${copy.deleteConfiguration} ${targetPetNames}`}
                                    title={copy.deleteConfiguration}
                                    onClick={() =>
                                      void confirmDeleteGroupTasks({
                                        petIds: petTaskGroup.petIds,
                                        names: petTaskGroup.items.map(
                                          (item) => item.state.name,
                                        ),
                                      })
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text transition hover:bg-danger-ring"
                                  >
                                    <PiTrash size={15} />
                                  </button>
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        );
                      });
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-xs">
                      {showValidation ? (
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-left font-bold text-danger-text">
                          <PiWarningCircle className="shrink-0" size={14} />
                          {copy.validationNoTask}
                        </span>
                      ) : (
                        copy.noTasksYet
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!pets.length}
                        onClick={openAddModal}
                        className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary-fixed)] py-1 pl-1.5 pr-3.5 text-[11px] font-bold text-[var(--on-primary-fixed-variant)] shadow-[0_3px_10px_-7px_rgba(58,35,98,0.65)] transition enabled:hover:-translate-y-0.5 enabled:hover:border-[var(--primary-border-strong)] enabled:hover:shadow-[0_6px_14px_-9px_rgba(58,35,98,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-white">
                          <PiPlus size={15} />
                        </span>
                        {copy.addTask}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {showValidation && petsWithoutTasksMessage ? (
          <div
            role="alert"
            className="inline-flex max-w-full items-start gap-2.5 whitespace-normal rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold leading-6 text-danger-text"
          >
            <PiWarningCircle className="mt-0.5 shrink-0" size={18} />
            <span>{petsWithoutTasksMessage}</span>
          </div>
        ) : null}
      </section>
      <section>
        <Field
          label={copy.additionalNotes}
          optional
          hint={copy.customAdditionalHint}
          hintInline
          hintInlineRight
        >
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className={textareaClass}
            placeholder={copy.customAdditionalPlaceholder}
          />
        </Field>
      </section>
      {modal ? (
        <ModalShell
          title={copy.configureTask}
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={copy.save}
          onClose={closeModal}
          onCancel={closeModal}
          onSave={saveModal}
          panelRef={panelRef}
          panelClassName="max-w-[960px] rounded-[20px] border-[#d8c9e3] bg-white"
          bodyClassName="bg-white md:px-6"
        >
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {copy.whoNeeds}
              </p>
              <button
                type="button"
                onClick={() =>
                  updateModal({
                    petIds: allModalPetsSelected
                      ? []
                      : allPetIds,
                  })
                }
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
                  allModalPetsSelected
                    ? "border-[var(--primary-border-strong)] bg-[var(--primary-fixed)] text-[var(--primary)] hover:bg-[#e6d8ee]"
                    : "border-[#bba9c8] bg-[var(--primary-subtle)] text-[var(--primary)] hover:border-[var(--primary-border-strong)] hover:bg-[var(--primary-fixed)]",
                )}
              >
                <PiCheck size={14} />
                {allModalPetsSelected
                  ? copy.deselectAll
                  : copy.selectAll}
              </button>
            </div>
            {pets.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {pets.map((pet) => {
                  const selected = modal.petIds.includes(pet.id);
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        updateModal({
                          petIds: selected
                            ? modal.petIds.filter((id) => id !== pet.id)
                            : [...modal.petIds, pet.id],
                        })
                      }
                      className={cn(
                        "flex w-fit max-w-full min-w-0 items-center gap-3 rounded-[14px] border p-2.5 text-left transition",
                        selected
                          ? "border-[var(--primary)] bg-[#f4ecfa] ring-2 ring-[#e7d9f0]"
                          : "border-[#ded9e0] bg-white hover:border-[var(--primary-border)]",
                      )}
                    >
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#e3d7c8] bg-[#fff8e8]">
                        <PetDraftAvatar pet={pet} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#35243f]">
                          {pet.name || localizedPetDisplayType(pet)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#817a85]">
                          {localizedPetDisplayType(pet)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[#cfc3d7] text-transparent",
                        )}
                      >
                        <PiCheck size={14} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#9a939f]">{copy.noPetGroups}</p>
            )}
            {modalError ? (
              <p
                role="alert"
                className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-xs font-bold text-danger-text"
              >
                <PiWarningCircle size={14} className="shrink-0" />
                {modalError}
              </p>
            ) : null}
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {copy.task}
              </p>
              <span className="text-[11px] text-[#9a939f]">
                {modal.rows.length}{" "}
                {lang === "zh"
                  ? "项"
                  : lang === "ja"
                    ? "件"
                    : modal.rows.length === 1
                      ? "task"
                      : "tasks"}
              </span>
            </div>
            <div
              ref={taskTableRef}
              className="max-h-[310px] overflow-auto rounded-[14px] border border-[var(--primary-border)] bg-white"
            >
              <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold tracking-[0.02em] text-[var(--on-primary-fixed-variant)]">
                  <tr>
                    <th className="w-[7%] px-3 py-2.5 text-center">
                      {copy.index}
                    </th>
                    <th className="w-[42%] px-3 py-2.5 text-center">
                      {copy.task}
                    </th>
                    <th className="w-[36%] px-3 py-2.5 text-center">
                      {copy.notes}
                    </th>
                    <th className="w-[15%] px-3 py-2.5 text-center">
                      {copy.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee9ef]">
                  {modal.rows.map((row, index) => {
                    const nameError = rowErrors[row.id];
                    return (
                      <tr key={row.id} className="text-[#514956]">
                        <td className="px-3 py-3 text-center align-middle font-bold text-[var(--primary)]">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <VisitTaskNameCombobox
                            ariaLabel={`${copy.task} ${index + 1}`}
                            value={row.templateId}
                            customValue={row.customLabel}
                            customValueKey={customTaskId}
                            options={comboboxOptions}
                            placeholder={copy.taskNamePlaceholder}
                            autoFocus={row.id === focusRowId}
                            error={nameError}
                            errorId={`custom-task-name-error-${row.id}`}
                            onChange={(next) =>
                              updateRow(row.id, {
                                templateId: next.value,
                                customLabel: next.customValue,
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <input
                            aria-label={`${copy.notes} ${index + 1}`}
                            value={row.notes}
                            onChange={(event) =>
                              updateRow(row.id, { notes: event.target.value })
                            }
                            className={cn(
                              inputClass,
                              "h-10 w-full rounded-lg px-3 text-xs",
                            )}
                            placeholder={copy.taskNotesPlaceholder}
                          />
                        </td>
                        <td className="px-2 py-3 align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              aria-label={`${copy.task} ${index + 1} ${copy.moveUp}`}
                              disabled={index === 0}
                              onClick={() => moveRow(row.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] transition hover:bg-[var(--primary-fixed)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <PiCaretUp size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={`${copy.task} ${index + 1} ${copy.moveDown}`}
                              disabled={index === modal.rows.length - 1}
                              onClick={() => moveRow(row.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] transition hover:bg-[var(--primary-fixed)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <PiCaretDown size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={`${copy.deleteConfiguration} ${index + 1}`}
                              onClick={() => removeRow(row.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text transition hover:bg-danger-ring"
                            >
                              <PiTrash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-fixed)]"
            >
              <PiPlus size={15} />
              {copy.addTask}
            </button>
          </section>
        </ModalShell>
      ) : null}
    </div>
  );
}

// Compatibility exports
export const CustomTaskEditor = StepCustomTasks;
export const GuidedNeedCustomTasksStep = StepCustomTasks;
