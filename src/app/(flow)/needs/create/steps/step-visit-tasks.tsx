"use client";

import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiCheckCircle,
  PiClock,
  PiCopy,
  PiDotsSixVertical,
  PiFlag,
  PiNote,
  PiPawPrint,
  PiPencilSimple,
  PiPlus,
  PiSparkle,
  PiTrash,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { useLanguage } from "@/components/providers/language-provider";
import { ModalShell } from "@/components/ui/modal-shell";
import type {
  CareType,
  PetDraft,
  TaskPlan,
  TaskPriority,
} from "@/domain/publishing/legacy-need-draft-v3";
import { localizeOtherPetType } from "@/domain/pet/profile-options";
import { useConfirm } from "@/hooks/useConfirm";
import cn from "@/lib/cn";
import { useConfirmStore } from "@/store/useConfirmStore";
import {
  VisitSelect,
  VisitTaskNameCombobox,
} from "../components/controls/visit-task-combobox";
import {
  applyVisitTaskModalChanges,
  buildPetCareGroups,
  buildPetTaskStates,
  copyVisitTasksWithFingerprint,
  explodePetTasks,
  Field,
  groupTaskRowsByPetGroup,
  groupTaskStatesByConfiguration,
  inputClass,
  normalizedTaskName,
  petDisplayType,
  PetDraftAvatar,
  PillChoice,
  removeVisitPetConfigWithFingerprint,
  taskPetLabelText,
  TaskPriorityButtons,
  textareaClass,
  togglePetGroup,
  visitTimeLabel,
  type PetTaskState,
} from "../guided-need-flow-shared";

export function StepVisitTasks({
  options,
  pets,
  value,
  onChange,
  notes,
  onNotesChange,
  careType,
  visitsPerDay,
  visitTimes,
  exactTimes,
  showValidation,
}: {
  options: Array<{ id: string; label: string; icon: IconType }>;
  pets: PetDraft[];
  value: TaskPlan[];
  onChange: (value: TaskPlan[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  careType: CareType;
  visitsPerDay: number;
  visitTimes: string[];
  exactTimes: string[];
  showValidation: boolean;
}) {
  const { lang, t } = useLanguage();
  const copy = t.core.needPublishingTaskForm;
  const formatVisitName = (visit: number) =>
    t.core.needPublishing.visitSchedule.visit.replace("{n}", String(visit));
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
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
  const petCareGroups = buildPetCareGroups(pets, localizedPetDisplayType);
  type VisitDraft = {
    visit: number;
    enabled: boolean;
    petIds: string[];
    priority: TaskPriority;
    notes: string;
  };
  type ConfigDraft = {
    templateId: string;
    label: string;
    custom: boolean;
    visits: VisitDraft[];
  };
  type VisitTaskModalRow = {
    id: string;
    templateId: string;
    customLabel: string;
    priority: TaskPriority;
    notes: string;
  };
  type VisitTaskModalState = {
    visit: number;
    petIds: string[];
    tasks: VisitTaskModalRow[];
    originalPetIds?: string[];
    originalNames?: string[];
  };
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<ConfigDraft | null>(null);
  const [editorError, setEditorError] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [visitTaskModal, setVisitTaskModal] =
    useState<VisitTaskModalState | null>(null);
  const [visitTaskModalError, setVisitTaskModalError] = useState("");
  const [visitTaskModalTaskErrors, setVisitTaskModalTaskErrors] = useState<
    Record<string, string>
  >({});
  const [focusVisitTaskId, setFocusVisitTaskId] = useState<string | null>(null);
  const [copyFromVisitOpen, setCopyFromVisitOpen] = useState<number | null>(
    null,
  );
  const dragHandlePressedRef = useRef<string | null>(null);
  const overlayAnchorRef = useRef<HTMLDivElement | null>(null);
  const overlayPanelRef = useRef<HTMLDivElement | null>(null);
  const taskTableRef = useRef<HTMLDivElement | null>(null);
  const overlayOpen = pickerOpen || Boolean(draft);
  const anyOverlayOpen = overlayOpen || Boolean(visitTaskModal);
  const visitNumbers =
    careType === "visit"
      ? Array.from(
          { length: Math.max(1, visitsPerDay) },
          (_, index) => index + 1,
        )
      : [1];
  const configuredTemplateIds = new Set(value.map((task) => task.templateId));
  const localizedOptions = options.map((option) => {
    const label =
      t.core.needPublishing.taskLabels[
        option.id as keyof typeof t.core.needPublishing.taskLabels
      ] ?? option.label;
    return { ...option, label };
  });
  const inlineTaskOptions = Array.from(
    new Map(
      [
        ...localizedOptions,
        ...value.map((task) => ({
          id: task.templateId,
          label: task.label,
          icon:
            localizedOptions.find((option) => option.id === task.templateId)
              ?.icon ?? PiSparkle,
        })),
      ].map((option) => [option.id, option]),
    ).values(),
  );
  const customVisitTaskId = "__custom_visit_task__";
  const available = localizedOptions.filter(
    (option) => !configuredTemplateIds.has(option.id),
  );
  const configured = Array.from(
    new Map(
      value.map((task) => [
        task.templateId,
        { templateId: task.templateId, label: task.label, custom: task.custom },
      ]),
    ).values(),
  );
  const DraftTaskIcon = draft
    ? (options.find((option) => option.id === draft.templateId)?.icon ??
      PiSparkle)
    : PiSparkle;
  const emptyVisits = () =>
    visitNumbers.map((visit) => ({
      visit,
      enabled: false,
      petIds: pets.map((pet) => pet.id),
      priority: "must" as TaskPriority,
      notes: "",
    }));
  const closeOverlay = () => {
    setPickerOpen(false);
    setDraft(null);
    setEditorError("");
    setCustomLabel("");
    setExpandedVisit(null);
  };
  const startNew = (option: { id: string; label: string }) => {
    setPickerOpen(false);
    setEditorError("");
    setExpandedVisit(null);
    setDraft({
      templateId: option.id,
      label: option.label,
      custom: false,
      visits: emptyVisits(),
    });
  };
  const startCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    setPickerOpen(false);
    setEditorError("");
    setExpandedVisit(null);
    setDraft({
      templateId: `custom-${crypto.randomUUID()}`,
      label,
      custom: true,
      visits: emptyVisits(),
    });
  };
  const editConfigured = (templateId: string) => {
    const assignments = value.filter((task) => task.templateId === templateId);
    const first = assignments[0];
    if (!first) return;
    setPickerOpen(false);
    setEditorError("");
    setExpandedVisit(null);
    setDraft({
      templateId,
      label: first.label,
      custom: first.custom,
      visits: visitNumbers.map((visit) => {
        const assignment = assignments.find((task) =>
          task.visitNumbers.includes(visit),
        );
        return {
          visit,
          enabled: Boolean(assignment),
          petIds: assignment?.petIds ?? pets.map((pet) => pet.id),
          priority: assignment?.priority ?? "must",
          notes: assignment?.notes ?? "",
        };
      }),
    });
  };
  const removeConfiguration = (templateId: string) => {
    onChange(value.filter((task) => task.templateId !== templateId));
    if (draft?.templateId === templateId) closeOverlay();
  };
  const openVisitTaskModal = (
    visit: number,
    configuration?: { petIds: string[]; states: PetTaskState[] },
  ) => {
    if (!pets.length) return;
    setFocusVisitTaskId(null);
    const editingStates = configuration
      ? [...configuration.states].sort((a, b) => a.order - b.order)
      : [];
    setVisitTaskModal({
      visit,
      petIds: configuration?.petIds ?? pets.map((pet) => pet.id),
      originalPetIds: configuration ? [...configuration.petIds] : undefined,
      originalNames: configuration
        ? configuration.states.map((state) => normalizedTaskName(state.name))
        : undefined,
      tasks: configuration
        ? editingStates.map((state) => {
            const isBuiltIn = localizedOptions.some(
              (option) => option.id === state.templateId,
            );
            return {
              id: `visit-task-${crypto.randomUUID()}`,
              templateId: isBuiltIn ? state.templateId : customVisitTaskId,
              customLabel: isBuiltIn ? "" : state.name,
              priority: state.priority,
              notes: state.notes,
            };
          })
        : [
            {
              id: `visit-task-${crypto.randomUUID()}`,
              templateId: "",
              customLabel: "",
              priority: "must",
              notes: "",
            },
          ],
    });
    setVisitTaskModalError("");
    setVisitTaskModalTaskErrors({});
  };
  const closeVisitTaskModal = () => {
    setVisitTaskModal(null);
    setVisitTaskModalError("");
    setVisitTaskModalTaskErrors({});
    setFocusVisitTaskId(null);
  };
  const updateVisitTaskModal = (patch: Partial<VisitTaskModalState>) => {
    if ("petIds" in patch) setVisitTaskModalError("");
    setVisitTaskModal((current) =>
      current ? { ...current, ...patch } : current,
    );
  };
  const updateVisitTaskModalRow = (
    id: string,
    patch: Partial<VisitTaskModalRow>,
  ) => {
    if ("templateId" in patch || "customLabel" in patch) {
      setVisitTaskModalTaskErrors((current) => {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
    setVisitTaskModal((current) =>
      current
        ? {
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === id ? { ...task, ...patch } : task,
            ),
          }
        : current,
    );
  };
  const addVisitTaskModalRow = () => {
    const id = `visit-task-${crypto.randomUUID()}`;
    setVisitTaskModal((current) =>
      current
        ? {
            ...current,
            tasks: [
              ...current.tasks,
              {
                id,
                templateId: "",
                customLabel: "",
                priority: "must",
                notes: "",
              },
            ],
          }
        : current,
    );
    setFocusVisitTaskId(id);
  };
  useEffect(() => {
    if (!focusVisitTaskId || !visitTaskModal) return;
    const frame = requestAnimationFrame(() => {
      taskTableRef.current?.scrollTo({
        top: taskTableRef.current.scrollHeight,
        behavior: "smooth",
      });
      requestAnimationFrame(() => setFocusVisitTaskId(null));
    });
    return () => cancelAnimationFrame(frame);
  }, [focusVisitTaskId, visitTaskModal]);
  const removeVisitTaskModalRow = (id: string) =>
    setVisitTaskModal((current) =>
      current
        ? { ...current, tasks: current.tasks.filter((task) => task.id !== id) }
        : current,
    );
  const moveVisitTaskModalRow = (id: string, direction: -1 | 1) =>
    setVisitTaskModal((current) => {
      if (!current) return current;
      const index = current.tasks.findIndex((task) => task.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.tasks.length) {
        return current;
      }
      const tasks = [...current.tasks];
      [tasks[index], tasks[nextIndex]] = [tasks[nextIndex], tasks[index]];
      return { ...current, tasks };
    });
  const saveVisitTaskModal = () => {
    if (!visitTaskModal) return;
    const optionsById = new Map(
      inlineTaskOptions.map((option) => [option.id, option]),
    );
    if (!visitTaskModal.petIds.length) {
      setVisitTaskModalTaskErrors({});
      setVisitTaskModalError(
        lang === "zh"
          ? "请至少选择一只宠物。"
          : lang === "ja"
            ? "ペットを1匹以上選択してください。"
            : "Choose at least one pet.",
      );
      return;
    }
    const taskNames = visitTaskModal.tasks.map((task) =>
      task.templateId === customVisitTaskId
        ? task.customLabel.trim()
        : (optionsById.get(task.templateId)?.label.trim() ?? ""),
    );
    if (!visitTaskModal.tasks.length || taskNames.some((name) => !name)) {
      const errors = Object.fromEntries(
        visitTaskModal.tasks
          .map((task, index) => [
            task.id,
            taskNames[index] ? "" : copy.validationTaskNameRequired,
          ])
          .filter(([, error]) => error),
      );
      setVisitTaskModalTaskErrors(errors);
      setVisitTaskModalError(
        visitTaskModal.tasks.length ? "" : copy.validationTaskNameRequired,
      );
      return;
    }
    const normalizedTaskNames = taskNames.map((name) =>
      name.replace(/\s+/g, " ").toLocaleLowerCase(lang),
    );
    if (new Set(normalizedTaskNames).size !== normalizedTaskNames.length) {
      const counts = new Map<string, number>();
      normalizedTaskNames.forEach((name) =>
        counts.set(name, (counts.get(name) ?? 0) + 1),
      );
      setVisitTaskModalTaskErrors(
        Object.fromEntries(
          visitTaskModal.tasks
            .map((task, index) => [
              task.id,
              (counts.get(normalizedTaskNames[index]) ?? 0) > 1
                ? copy.validationDuplicateTaskName
                : "",
            ])
            .filter(([, error]) => error),
        ),
      );
      setVisitTaskModalError("");
      return;
    }
    const visit = visitTaskModal.visit;
    const modalTasks = visitTaskModal.tasks.map((row) => {
      const option = optionsById.get(row.templateId);
      const isCustom = row.templateId === customVisitTaskId;
      const templateId = isCustom
        ? `custom-${crypto.randomUUID()}`
        : row.templateId;
      const label = isCustom
        ? row.customLabel.trim()
        : (option?.label ?? row.templateId);
      return {
        templateId,
        label,
        priority: row.priority,
        notes: row.notes.trim(),
        custom:
          isCustom ||
          !localizedOptions.some((item) => item.id === row.templateId),
      };
    });

    const nextTasks = applyVisitTaskModalChanges({
      currentTasks: value,
      visit,
      selectedPetIds: visitTaskModal.petIds,
      modalTasks,
      originalPetIds: visitTaskModal.originalPetIds,
      originalNames: visitTaskModal.originalNames,
    });

    onChange(nextTasks);
    closeVisitTaskModal();
  };
  const updateVisitDraft = (visit: number, patch: Partial<VisitDraft>) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            visits: current.visits.map((item) =>
              item.visit === visit ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  const saveDraft = () => {
    if (!draft) return;
    const enabled = draft.visits.filter((item) => item.enabled);
    if (!enabled.length) {
      setEditorError(copy.selectVisit);
      return;
    }
    if (enabled.some((item) => !item.petIds.length)) {
      setEditorError(copy.validationPetGroup);
      return;
    }
    const existing = value.filter(
      (task) => task.templateId === draft.templateId,
    );
    const remaining = value.filter(
      (task) => task.templateId !== draft.templateId,
    );
    const assignments = enabled.map((item) => {
      const previous = existing.find((task) =>
        task.visitNumbers.includes(item.visit),
      );
      const nextOrder =
        previous?.order ??
        Math.max(
          -1,
          ...remaining
            .filter((task) => task.visitNumbers.includes(item.visit))
            .map((task) => task.order ?? 0),
        ) + 1;
      return {
        id:
          previous?.visitNumbers.length === 1
            ? previous.id
            : `${draft.templateId}-visit-${item.visit}-${crypto.randomUUID()}`,
        templateId: draft.templateId,
        label: draft.label,
        priority: item.priority,
        petIds: item.petIds,
        visitNumbers: [item.visit],
        custom: draft.custom,
        notes: item.notes.trim(),
        order: nextOrder,
      } satisfies TaskPlan;
    });
    const existingIndex = value.findIndex(
      (task) => task.templateId === draft.templateId,
    );
    const insertIndex =
      existingIndex < 0
        ? remaining.length
        : value
            .slice(0, existingIndex)
            .filter((task) => task.templateId !== draft.templateId).length;
    remaining.splice(insertIndex, 0, ...assignments);
    onChange(remaining);
    closeOverlay();
  };
  useEffect(() => {
    if (!anyOverlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [anyOverlayOpen]);
  const groups =
    careType === "visit"
      ? visitNumbers.map((visit, index) => ({
          key: `visit-${visit}`,
          visit,
          title: t.core.needPublishing.visitSchedule.visit.replace(
            "{n}",
            String(visit),
          ),
          subtitle: visitTimeLabel(visitTimes[index], exactTimes[index]),
          tasks: value
            .filter((task) => task.visitNumbers.includes(visit))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }))
      : [
          {
            key: "all",
            visit: 0,
            title: copy.careTasks,
            subtitle: "",
            tasks: [...value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          },
        ];
  const visitTaskCopyKey = (task: TaskPlan) => {
    const petKey = [...task.petIds].sort().join("|");
    const taskName = task.label
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase(lang);
    return `${petKey}::${taskName}`;
  };
  const getCopyableVisitTasks = (
    sourceVisit: number,
    targetVisit: number,
  ) => {
    const targetKeys = new Set(
      value
        .filter((task) => task.visitNumbers.includes(targetVisit))
        .map(visitTaskCopyKey),
    );
    const includedKeys = new Set<string>();
    return value
      .filter((task) => task.visitNumbers.includes(sourceVisit))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter((task) => {
        const key = visitTaskCopyKey(task);
        if (targetKeys.has(key) || includedKeys.has(key)) return false;
        includedKeys.add(key);
        return true;
      });
  };
  const copyVisitTasks = (sourceVisit: number, targetVisit: number) => {
    if (sourceVisit === targetVisit) return;
    const nextTasks = copyVisitTasksWithFingerprint(value, sourceVisit, targetVisit);
    onChange(nextTasks);
    setCopyFromVisitOpen(null);
  };
  const moveTask = (sourceId: string, targetId: string, visit: number) => {
    if (sourceId === targetId) return;
    const ordered = (
      careType === "visit"
        ? value.filter((task) => task.visitNumbers.includes(visit))
        : value
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const sourceIndex = ordered.findIndex((task) => task.id === sourceId);
    const targetIndex = ordered.findIndex((task) => task.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    const orderById = new Map(ordered.map((task, index) => [task.id, index]));
    onChange(
      value.map((task) =>
        orderById.has(task.id)
          ? { ...task, order: orderById.get(task.id) }
          : task,
      ),
    );
  };
  const removeAssignment = (id: string) =>
    onChange(value.filter((task) => task.id !== id));
  const removeVisitPetConfiguration = (
    petIds: string[],
    visit: number,
    names?: string[],
  ) => {
    const nextTasks = removeVisitPetConfigWithFingerprint(
      value,
      visit,
      petIds,
      names,
    );
    onChange(nextTasks);
    if (
      visitTaskModal &&
      visitTaskModal.visit === visit &&
      visitTaskModal.petIds.some((petId) => petIds.includes(petId))
    ) {
      closeVisitTaskModal();
    }
  };
  const confirmRemoveVisitPetConfiguration = async (
    petIds: string[],
    visit: number,
    names?: string[],
  ) => {
    const petNames = petIds
      .map((petId) => {
        const pet = pets.find((candidate) => candidate.id === petId);
        return pet ? pet.name || localizedPetDisplayType(pet) : "";
      })
      .filter(Boolean)
      .join(" & ");
    const accepted = await confirm({
      title:
        lang === "zh"
          ? "删除任务配置"
          : lang === "ja"
            ? "タスク設定を削除"
            : "Delete task configuration",
      content: (
        <p>
          {lang === "zh"
            ? `确定要删除「${petNames}」这次上门的全部任务吗？`
            : lang === "ja"
              ? `「${petNames}」のこの訪問のすべての作業を削除しますか？`
              : `Delete all tasks for this visit assigned to ${petNames}?`}
        </p>
      ),
      confirmText: lang === "zh" ? "删除" : lang === "ja" ? "削除" : "Delete",
      cancelText: copy.cancel,
      variant: "danger",
    });
    if (!accepted) return;
    removeVisitPetConfiguration(petIds, visit, names);
    closeConfirm();
  };
  const petsWithoutTasks = pets.filter(
    (pet) => !value.some((task) => task.petIds.includes(pet.id)),
  );
  const taskWithoutPetGroup = value.some(
    (task) =>
      !task.petIds.some((petId) => pets.some((pet) => pet.id === petId)),
  );
  const missingVisits =
    careType === "visit"
      ? groups
          .filter((group) => !group.tasks.length)
          .map((group) => group.visit)
      : [];
  const missingVisitNames = missingVisits.map(formatVisitName);
  const missingVisitsLabel =
    missingVisitNames.length === 1
      ? missingVisitNames[0]
      : missingVisitNames.length > 1
        ? lang === "en"
          ? `${missingVisitNames.slice(0, -1).join(", ")} and ${missingVisitNames[missingVisitNames.length - 1]}`
          : missingVisitNames.join("、")
        : "";
  const petsWithoutTasksMessage = petsWithoutTasks.length
    ? copy.validationPets.replace(
        "{pets}",
        petsWithoutTasks
          .map((pet) => {
            const petLabel =
              pet.name ||
              localizedPetDisplayType(pet) ||
              String(pets.indexOf(pet) + 1);
            return lang === "zh"
              ? `宠物 ${petLabel}`
              : lang === "ja"
                ? `ペット ${petLabel}`
                : `Pet ${petLabel}`;
          })
          .join(", "),
      )
    : "";
  const visitPetValidationMessage =
    showValidation &&
    careType === "visit" &&
    value.length > 0 &&
    !missingVisits.length &&
    !taskWithoutPetGroup
      ? petsWithoutTasksMessage
      : "";
  const taskValidationMessage = !showValidation
    ? ""
    : careType === "visit" && missingVisits.length
      ? ""
      : !value.length
        ? copy.validationNoTask
        : missingVisits.length
          ? copy.validationMissing.replace("{visits}", missingVisitsLabel)
          : taskWithoutPetGroup
            ? copy.validationPetGroup
            : careType !== "visit"
              ? petsWithoutTasksMessage
              : "";
  return (
    <div className="space-y-5">
      {!petCareGroups.length && (
        <p
          role="alert"
          className="inline-flex max-w-full items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm font-bold leading-6 text-danger-text"
        >
          <PiWarningCircle className="shrink-0" size={18} />
          {copy.noPetGroups}
        </p>
      )}
      {careType !== "visit" ? (
        <section className="relative">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
              {copy.careTasks}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {configured.map((item) => {
              const ConfiguredIcon =
                options.find((option) => option.id === item.templateId)?.icon ??
                PiSparkle;
              return (
                <div
                  key={item.templateId}
                  className="inline-flex items-center overflow-hidden rounded-full border border-[#cfc3d7] bg-white text-[var(--primary)]"
                >
                  <span
                    title={item.label}
                    className="inline-flex min-w-0 max-w-[240px] items-center gap-1.5 px-3 py-2 text-xs font-bold"
                  >
                    <ConfiguredIcon size={14} className="shrink-0" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`${copy.edit} ${item.label}`}
                    title={copy.editConfiguration}
                    onClick={() => editConfigured(item.templateId)}
                    className="flex h-8 w-8 items-center justify-center border-l border-[#e5dfe7] hover:bg-[var(--primary-subtle)]"
                  >
                    <PiPencilSimple size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`${copy.deleteConfiguration} ${item.label}`}
                    title={copy.deleteConfiguration}
                    onClick={() => removeConfiguration(item.templateId)}
                    className="flex h-8 w-8 items-center justify-center border-l border-danger-border text-danger-text hover:bg-danger-bg"
                  >
                    <PiTrash size={14} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setPickerOpen(true);
                setEditorError("");
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--primary-border)] bg-[var(--primary-subtle)] px-3 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-fixed)]"
            >
              <PiPlus size={15} />
              {value.length ? copy.addTask : copy.addATask}
            </button>
            {taskValidationMessage && (
              <span role="alert" className="inline-flex items-center gap-1 text-sm font-semibold text-danger-text">
                <PiWarningCircle className="shrink-0" size={14} />
                {taskValidationMessage}
              </span>
            )}
          </div>
        </section>
      ) : null}
      {careType !== "visit" ? (
        <div ref={overlayAnchorRef} className="relative h-0 w-full" />
      ) : null}
      {overlayOpen && (
        <ModalShell
          title={pickerOpen ? copy.chooseTask : copy.configureTask}
          titleId={pickerOpen ? "choose-task-title" : "configure-task-title"}
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={t.settings.pets.saveOnly}
          showSave={Boolean(draft)}
          onClose={closeOverlay}
          onCancel={closeOverlay}
          onSave={draft ? saveDraft : undefined}
          panelRef={overlayPanelRef}
          panelClassName="max-w-[760px] rounded-[20px] border-[#d8c9e3] bg-[var(--primary-subtle)]"
          bodyClassName="bg-white md:px-6"
        >
          {pickerOpen ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {available.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => startNew(option)}
                      className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ded9e0] bg-white px-3 text-left text-xs font-bold text-[#706a78]"
                    >
                      <Icon size={17} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
                <div className="flex max-w-full items-center gap-2">
                  <input
                    value={customLabel}
                    onChange={(event) => setCustomLabel(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && startCustom()
                    }
                    className={cn(inputClass, "h-11 w-48 bg-white")}
                    placeholder={copy.customTask}
                  />
                  <button
                    type="button"
                    aria-label={copy.configureCustom}
                    onClick={startCustom}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
                  >
                    <PiPlus />
                  </button>
                </div>
              </div>
              {!available.length && (
                <p className="mt-3 text-xs text-[#817a85]">
                  {copy.allConfigured}
                </p>
              )}
            </>
          ) : draft ? (
            <>
              <div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                    {copy.task}
                  </p>
                  <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#e0d5e5] bg-white px-3 py-2 text-[var(--primary)] shadow-[0_5px_16px_-12px_rgba(65,40,84,0.55)]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f2ebf5] text-[#7a5796]">
                      <DraftTaskIcon size={16} />
                    </span>
                    <h3 className="truncate text-base font-semibold text-[var(--primary)]">
                      {draft.label}
                    </h3>
                  </div>
                </div>
                <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                  {copy.whenTask}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {draft.visits.map((item) => {
                  const selectedGroupLabel = petCareGroups
                    .filter((group) =>
                      group.petIds.every((petId) =>
                        item.petIds.includes(petId),
                      ),
                    )
                    .map((group) => group.label)
                    .join(", ");
                  const note = item.notes.trim();
                  const isExpanded =
                    item.enabled && expandedVisit === item.visit;
                  const toggleExpanded = () => {
                    if (!item.enabled) return;
                    setExpandedVisit((current) =>
                      current === item.visit ? null : item.visit,
                    );
                  };
                  return (
                    <section
                      key={item.visit}
                      className={cn(
                        "rounded-[14px] border p-3 transition-colors",
                        item.enabled
                          ? "border-[#ded9e0] bg-white"
                          : "border-[#e8e3e8] bg-[#faf9f7]",
                        isExpanded &&
                          "border-[#bda9cb] shadow-[0_12px_28px_-22px_rgba(65,40,84,0.65)]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-pressed={item.enabled}
                          aria-label={
                            (item.enabled
                              ? copy.deselectVisit
                              : copy.selectVisit) +
                            " " +
                            item.visit
                          }
                          onClick={() => {
                            const nextEnabled = !item.enabled;
                            updateVisitDraft(item.visit, {
                              enabled: nextEnabled,
                            });
                            setExpandedVisit(
                              nextEnabled
                                ? item.visit
                                : expandedVisit === item.visit
                                  ? null
                                  : expandedVisit,
                            );
                          }}
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                            item.enabled
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                              : "border-[#bcb5bf] bg-white text-transparent",
                          )}
                        >
                          {item.enabled && <PiCheck size={14} />}
                        </button>
                        <button
                          type="button"
                          disabled={!item.enabled}
                          aria-expanded={isExpanded}
                          onClick={toggleExpanded}
                          className="min-w-0 flex-1 text-left outline-none disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="inline-flex max-w-[190px] min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-[#35243f]">
                              <span className="shrink-0">
                                Visit {item.visit}
                              </span>
                              <span className="text-[#b2a8b6]">·</span>
                              <PiClock
                                size={14}
                                className="shrink-0 text-[var(--primary-muted)]"
                              />
                              <span className="truncate text-xs font-medium text-[#817a85]">
                                {visitTimeLabel(
                                  visitTimes[item.visit - 1],
                                  exactTimes[item.visit - 1],
                                )}
                              </span>
                            </span>
                            {item.enabled && selectedGroupLabel && (
                              <span className="inline-flex max-w-[260px] min-w-0 items-center gap-1.5 text-xs font-semibold text-[#5f5364]">
                                <PiPawPrint
                                  size={14}
                                  className="shrink-0 text-[var(--primary-muted)]"
                                />
                                <span className="truncate">
                                  {selectedGroupLabel}
                                </span>
                              </span>
                            )}
                            {item.enabled && (
                              <span
                                className={cn(
                                  "inline-flex max-w-[120px] min-w-0 items-center gap-1.5 text-xs font-semibold",
                                  item.priority === "must"
                                    ? "text-danger-text"
                                    : "text-[#7b6a52]",
                                )}
                              >
                                {item.priority === "must" ? (
                                  <PiWarningCircle
                                    size={14}
                                    className="shrink-0"
                                  />
                                ) : (
                                  <PiFlag size={14} className="shrink-0" />
                                )}
                                <span className="truncate">
                                  {item.priority === "must"
                                    ? "Must do"
                                    : "If time"}
                                </span>
                              </span>
                            )}
                            {item.enabled && note && (
                              <span className="inline-flex max-w-[300px] min-w-0 items-center gap-1.5 text-xs text-[#817a85]">
                                <PiNote
                                  size={14}
                                  className="shrink-0 text-[#9a8a9f]"
                                />
                                <span className="truncate">{note}</span>
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          disabled={!item.enabled}
                          aria-label={
                            (isExpanded
                              ? copy.collapseVisit
                              : copy.expandVisit) +
                            " " +
                            item.visit
                          }
                          aria-expanded={isExpanded}
                          onClick={toggleExpanded}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-fixed)] text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {isExpanded ? (
                            <PiCaretUp size={16} />
                          ) : (
                            <PiCaretDown size={16} />
                          )}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 grid gap-4 border-t border-[#eee9ef] pt-4 sm:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                              {copy.whoNeeds}
                            </p>
                            {petCareGroups.length ? (
                              <div className="flex flex-wrap gap-2">
                                {petCareGroups.map((group) => (
                                  <PillChoice
                                    key={group.key}
                                    label={group.label}
                                    active={group.petIds.every((petId) =>
                                      item.petIds.includes(petId),
                                    )}
                                    onClick={() =>
                                      updateVisitDraft(item.visit, {
                                        petIds: togglePetGroup(
                                          item.petIds,
                                          group.petIds,
                                        ),
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <p
                                role="alert"
                                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs font-bold leading-5 text-danger-text"
                              >
                                <PiWarningCircle
                                  className="shrink-0"
                                  size={16}
                                />
                                {copy.noPetGroups}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                              {copy.priority}
                            </p>
                            <div className="flex gap-2">
                              <PillChoice
                                label={copy.mustDo}
                                active={item.priority === "must"}
                                onClick={() =>
                                  updateVisitDraft(item.visit, {
                                    priority: "must",
                                  })
                                }
                              />
                              <PillChoice
                                label={copy.ifTime}
                                active={item.priority === "nice"}
                                onClick={() =>
                                  updateVisitDraft(item.visit, {
                                    priority: "nice",
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="mb-2 flex items-baseline gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                              {copy.visitNotes}{" "}
                              <span className="text-[9px] font-semibold normal-case tracking-normal text-[#aaa4ae]">
                                {copy.optional}
                              </span>
                            </p>
                            <textarea
                              aria-label={"Notes for visit " + item.visit}
                              value={item.notes}
                              onChange={(event) =>
                                updateVisitDraft(item.visit, {
                                  notes: event.target.value,
                                })
                              }
                              className={cn(textareaClass, "h-20 text-xs")}
                              placeholder={copy.preferredNotesPlaceholder}
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
              {editorError && (
                <p
                  role="alert"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
                >
                  <PiWarningCircle className="shrink-0" size={13} />
                  {editorError}
                </p>
              )}
            </>
          ) : null}
        </ModalShell>
      )}
      {visitTaskModal && typeof document !== "undefined" ? (
        <ModalShell
          title={`${copy.configureTask} · ${t.core.needPublishing.visitSchedule.visit.replace(
            "{n}",
            String(visitTaskModal.visit),
          )}`}
          titleId="visit-task-modal-title"
          closeLabel={copy.cancel}
          cancelLabel={copy.cancel}
          saveLabel={lang === "zh" ? "保存" : lang === "ja" ? "保存" : "Save"}
          onClose={closeVisitTaskModal}
          onCancel={closeVisitTaskModal}
          onSave={saveVisitTaskModal}
          panelClassName="max-w-[960px] rounded-[20px] border-[#d8c9e3] bg-white"
          bodyClassName="bg-white md:px-6"
        >
          <p className="text-sm text-[#817a85]">
            {lang === "zh"
              ? "选择需要照护的宠物，然后添加、备注并排序任务。"
              : lang === "ja"
                ? "お世話するペットを選び、作業を追加して並べ替えます。"
                : "Choose the pets, then add, note, and order the tasks for this visit."}
          </p>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {copy.whoNeeds}
              </p>
              <button
                type="button"
                onClick={() =>
                  updateVisitTaskModal({
                    petIds:
                      pets.length > 0 &&
                      pets.every((pet) =>
                        visitTaskModal.petIds.includes(pet.id),
                      )
                        ? []
                        : pets.map((pet) => pet.id),
                  })
                }
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
                  pets.length > 0 &&
                    pets.every((pet) =>
                      visitTaskModal.petIds.includes(pet.id),
                    )
                    ? "border-[var(--primary-border-strong)] bg-[var(--primary-fixed)] text-[var(--primary)] hover:bg-[#e6d8ee]"
                    : "border-[#bba9c8] bg-[var(--primary-subtle)] text-[var(--primary)] hover:border-[var(--primary-border-strong)] hover:bg-[var(--primary-fixed)]",
                )}
              >
                <PiCheck size={14} />
                {pets.length > 0 &&
                pets.every((pet) => visitTaskModal.petIds.includes(pet.id))
                  ? lang === "zh"
                    ? "取消全选"
                    : lang === "ja"
                      ? "すべて解除"
                      : "Deselect all"
                  : lang === "zh"
                    ? "全选"
                    : lang === "ja"
                      ? "すべて選択"
                      : "Select all"}
              </button>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {pets.map((pet, index) => {
                  const selected = visitTaskModal.petIds.includes(pet.id);
                  const petName =
                    pet.name ||
                    localizedPetDisplayType(pet) ||
                    `Pet ${index + 1}`;
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        updateVisitTaskModal({
                          petIds: selected
                            ? visitTaskModal.petIds.filter(
                                (id) => id !== pet.id,
                              )
                            : [...visitTaskModal.petIds, pet.id],
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
                          {petName}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#817a85]">
                          {localizedPetDisplayType(pet) ||
                            (lang === "zh"
                              ? "宠物"
                              : lang === "ja"
                                ? "ペット"
                                : "Pet")}
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
                {visitTaskModalError ? (
                  <p
                    role="alert"
                    className="inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-xs font-bold leading-5 text-danger-text"
                  >
                    <PiWarningCircle className="shrink-0" size={14} />
                    <span>{visitTaskModalError}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
                {copy.task}
              </p>
              <span className="text-[11px] text-[#9a939f]">
                {visitTaskModal.tasks.length}{" "}
                {lang === "zh"
                  ? "项"
                  : lang === "ja"
                    ? "件"
                    : visitTaskModal.tasks.length === 1
                      ? "task"
                      : "tasks"}
              </span>
            </div>
            <div
              ref={taskTableRef}
              className="max-h-[280px] overflow-y-auto rounded-[14px] border border-[var(--primary-border)] bg-white"
            >
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[var(--outline-variant)] bg-[var(--primary-fixed)] text-[11px] font-semibold tracking-[0.02em] text-[var(--on-primary-fixed-variant)]">
                  <tr>
                    <th className="w-[7%] px-3 py-2.5 text-center">
                      {lang === "zh" ? "序号" : lang === "ja" ? "番号" : "No."}
                    </th>
                    <th className="w-[30%] px-3 py-2.5 text-center">
                      {lang === "zh"
                        ? "任务名"
                        : lang === "ja"
                          ? "作業名"
                          : "Task name"}
                    </th>
                    <th className="w-[19%] px-3 py-2.5 text-center">
                      {lang === "zh" ? "紧急度" : copy.priority}
                    </th>
                    <th className="w-[32%] px-3 py-2.5 text-center">
                      {lang === "zh"
                        ? "备注"
                        : lang === "ja"
                          ? "メモ"
                          : "Notes"}
                    </th>
                    <th className="w-[12%] px-3 py-2.5 text-center">
                      {lang === "zh"
                        ? "操作"
                        : lang === "ja"
                          ? "操作"
                          : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee9ef]">
                  {visitTaskModal.tasks.map((row, index) => (
                    <tr key={row.id} className="align-middle text-[#514956]">
                      <td className="px-3 py-3 text-center font-bold text-[var(--primary)]">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <VisitTaskNameCombobox
                          ariaLabel={`${copy.task} ${index + 1}`}
                          value={row.templateId}
                          customValue={row.customLabel}
                          customValueKey={customVisitTaskId}
                          options={inlineTaskOptions.map((option) => ({
                            value: option.id,
                            label: option.label,
                            icon: option.icon,
                          }))}
                          placeholder={copy.taskNamePlaceholder}
                          autoFocus={row.id === focusVisitTaskId}
                          error={visitTaskModalTaskErrors[row.id]}
                          errorId={`visit-task-name-error-${row.id}`}
                          onChange={(next) =>
                            updateVisitTaskModalRow(row.id, {
                              templateId: next.value,
                              customLabel: next.customValue,
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <TaskPriorityButtons
                          value={row.priority}
                          onChange={(priority) =>
                            updateVisitTaskModalRow(row.id, { priority })
                          }
                          mustLabel={copy.mustDo}
                          ifTimeLabel={copy.ifTime}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative">
                          <input
                            aria-label={`${copy.visitNotes} ${index + 1}`}
                            value={row.notes}
                            onChange={(event) =>
                              updateVisitTaskModalRow(row.id, {
                                notes: event.target.value,
                              })
                            }
                            className={cn(
                              inputClass,
                              "h-10 w-full rounded-lg py-2 pl-3 pr-9 text-xs font-semibold text-[#35243f] placeholder:font-normal placeholder:text-[#aaa4ae]",
                            )}
                            placeholder={copy.taskNotesPlaceholder}
                          />
                          {row.notes ? (
                            <button
                              type="button"
                              aria-label={
                                lang === "zh"
                                  ? `清空备注 ${index + 1}`
                                  : lang === "ja"
                                    ? `メモをクリア ${index + 1}`
                                    : `Clear notes ${index + 1}`
                              }
                              onClick={() =>
                                updateVisitTaskModalRow(row.id, { notes: "" })
                              }
                              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8b838f] transition hover:bg-[#eee9f0] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
                            >
                              <PiX size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`${copy.reorder} ${index + 1}`}
                            disabled={index === 0}
                            onClick={() => moveVisitTaskModalRow(row.id, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] transition hover:bg-[var(--primary-fixed)] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <PiCaretUp size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={`${copy.reorder} ${index + 1}`}
                            disabled={index === visitTaskModal.tasks.length - 1}
                            onClick={() => moveVisitTaskModalRow(row.id, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#706a78] transition hover:bg-[var(--primary-fixed)] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <PiCaretDown size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={copy.cancel}
                            disabled={visitTaskModal.tasks.length <= 1}
                            onClick={() => removeVisitTaskModalRow(row.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger-text transition hover:bg-danger-ring disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <PiTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addVisitTaskModalRow}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary-fixed)] py-1 pl-1.5 pr-3.5 text-xs font-bold text-[var(--on-primary-fixed-variant)] shadow-[0_3px_10px_-7px_rgba(58,35,98,0.65)] transition hover:-translate-y-0.5 hover:border-[var(--primary-border-strong)] hover:shadow-[0_6px_14px_-9px_rgba(58,35,98,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-white">
                <PiPlus size={15} />
              </span>
              {copy.addTask}
            </button>
          </section>
        </ModalShell>
      ) : null}
      {(value.length > 0 || careType === "visit") && (
        <section className="space-y-5">
          {careType === "visit" ? (
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
              {copy.careTasks}
            </h3>
          ) : null}
          {groups
          .filter((group) => careType === "visit" || group.tasks.length)
          .map((group) => (
            <div key={group.key} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[var(--primary)]">
                  <span className="shrink-0">{group.title}</span>
                  {group.subtitle && (
                    <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-[#817a85]">
                      <PiClock size={14} className="shrink-0 text-[var(--primary-muted)]" />
                      <span className="truncate">{group.subtitle}</span>
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {careType !== "visit" && group.tasks.length > 1 ? (
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9a939f]">
                      <PiDotsSixVertical
                        size={14}
                        className="shrink-0 text-[#b5acb8]"
                      />
                      {copy.reorder}
                    </p>
                  ) : null}
                </div>
              </div>
              {careType === "visit" && (
                <div className="relative w-fit max-w-full">
                  <p className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap text-right text-[11px] font-medium text-[#817a85]">
                    {lang === "zh"
                      ? `共 ${groupTaskStatesByConfiguration(
                          buildPetTaskStates(group.tasks),
                        ).length} 项任务`
                      : lang === "ja"
                        ? `全 ${groupTaskStatesByConfiguration(
                            buildPetTaskStates(group.tasks),
                          ).length} 件のタスク`
                        : `${groupTaskStatesByConfiguration(
                            buildPetTaskStates(group.tasks),
                          ).length} ${
                            groupTaskStatesByConfiguration(
                              buildPetTaskStates(group.tasks),
                            ).length <= 1
                              ? "task"
                              : "tasks"
                          } total`}
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
                          {copy.visitNotes}
                        </th>
                        <th className="w-20 max-w-20 whitespace-normal px-3 py-2.5 text-center">
                          {lang === "zh"
                            ? "操作"
                            : lang === "ja"
                              ? "操作"
                              : "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee9ef]">
                      {group.tasks.length ? (
                        (() => {
                          const taskRows =
                            groupTaskStatesByConfiguration(
                              buildPetTaskStates(group.tasks),
                            );
                          const itemGroups = groupTaskRowsByPetGroup(taskRows);
                          return itemGroups.flatMap((petTaskGroup) => {
                            const targetPets = petTaskGroup.petIds.flatMap(
                              (petId) => {
                                const pet = pets.find(
                                  (candidate) => candidate.id === petId,
                                );
                                return pet ? [pet] : [];
                              },
                            );
                            const targetPetNames = targetPets
                              .map(
                                (pet) =>
                                  pet.name ||
                                  localizedPetDisplayType(pet) ||
                                  `Pet ${pets.indexOf(pet) + 1}`,
                              )
                              .join(" & ");
                            return petTaskGroup.items.map(
                              (taskRow, taskIndex) => {
                                const state = taskRow.state;
                                const TaskIcon =
                                  inlineTaskOptions.find(
                                    (option) =>
                                      option.id === state.templateId,
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
                                          {targetPets.map((pet) => {
                                            const petName =
                                              pet.name ||
                                              localizedPetDisplayType(pet) ||
                                              `Pet ${pets.indexOf(pet) + 1}`;
                                            return (
                                              <div
                                                key={pet.id}
                                                className="flex min-w-0 max-w-full items-center gap-2 rounded-[12px] border border-[#dcd3e3] bg-transparent p-2"
                                              >
                                                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                                                  <PetDraftAvatar pet={pet} />
                                                </span>
                                                <span className="min-w-0 max-w-[120px]">
                                                  <span className="block truncate text-xs font-bold text-[#35243f]">
                                                    {petName}
                                                  </span>
                                                  <span className="mt-0.5 block truncate text-[10px] text-[#817a85]">
                                                    {localizedPetDisplayType(
                                                      pet,
                                                    )}
                                                  </span>
                                                </span>
                                              </div>
                                            );
                                          })}
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
                                        <span
                                          className={cn(
                                            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold",
                                            state.priority === "must"
                                              ? "border-amber-300 bg-amber-50 text-amber-800"
                                              : "border-sky-200 bg-sky-50 text-sky-700",
                                          )}
                                        >
                                          {state.priority === "must" ? (
                                            <PiCheckCircle size={12} />
                                          ) : (
                                            <PiFlag size={11} />
                                          )}
                                          {state.priority === "must"
                                            ? copy.mustDo
                                            : copy.ifTime}
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
                                              openVisitTaskModal(group.visit, {
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
                                              void confirmRemoveVisitPetConfiguration(
                                                petTaskGroup.petIds,
                                                group.visit,
                                                petTaskGroup.items.map(
                                                  (item) => item.state.name,
                                                ),
                                              )
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
                              },
                            );
                          });
                        })()
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            role={showValidation ? "alert" : undefined}
                            className={cn(
                              "px-3 py-4 text-center text-xs",
                              !showValidation && "text-[#9a939f]",
                            )}
                          >
                            {showValidation ? (
                              <span className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] border border-danger-border bg-danger-bg px-3 py-2 text-left font-bold text-danger-text">
                                <PiWarningCircle
                                  className="shrink-0"
                                  size={14}
                                />
                                {copy.validationMissing.replace(
                                  "{visits}",
                                  formatVisitName(group.visit),
                                )}
                              </span>
                            ) : lang === "zh" ? (
                              "本次上门暂未安排任务。"
                            ) : lang === "ja" ? (
                              "この訪問にはまだタスクがありません。"
                            ) : (
                              "No tasks assigned to this visit yet."
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
                              onClick={() => openVisitTaskModal(group.visit)}
                              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-[var(--primary-fixed)] py-1 pl-1.5 pr-3.5 text-[11px] font-bold text-[var(--on-primary-fixed-variant)] shadow-[0_3px_10px_-7px_rgba(58,35,98,0.65)] transition enabled:hover:-translate-y-0.5 enabled:hover:border-[var(--primary-border-strong)] enabled:hover:shadow-[0_6px_14px_-9px_rgba(58,35,98,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-white">
                                <PiPlus size={15} />
                              </span>
                              {copy.addTask}
                            </button>
                            <Popover
                              open={copyFromVisitOpen === group.visit}
                              onOpenChange={(open) =>
                                setCopyFromVisitOpen(
                                  open ? group.visit : null,
                                )
                              }
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  disabled={
                                    !groups.some(
                                      (candidate) =>
                                        candidate.visit !== group.visit &&
                                        getCopyableVisitTasks(
                                          candidate.visit,
                                          group.visit,
                                        ).length > 0,
                                    )
                                  }
                                  className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--primary-border)] bg-white py-1 pl-1.5 pr-3.5 text-[11px] font-bold text-[var(--primary)] shadow-[0_3px_10px_-7px_rgba(58,35,98,0.5)] transition enabled:hover:-translate-y-0.5 enabled:hover:border-[var(--primary-border-strong)] enabled:hover:bg-[var(--primary-subtle)] enabled:hover:shadow-[0_6px_14px_-9px_rgba(58,35,98,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                                >
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary-fixed)] text-[var(--primary)]">
                                    <PiCopy size={14} />
                                  </span>
                                  {lang === "zh"
                                    ? "从其他上门复制"
                                    : lang === "ja"
                                      ? "他の訪問からコピー"
                                      : "Copy from other visit"}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="z-[80] w-56 p-2"
                              >
                                <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34]">
                                  {lang === "zh"
                                    ? "选择来源上门"
                                    : lang === "ja"
                                      ? "コピー元の訪問を選択"
                                      : "Copy tasks from"}
                                </p>
                                <div className="space-y-1">
                                  {groups
                                    .filter(
                                      (candidate) =>
                                        candidate.visit !== group.visit &&
                                        getCopyableVisitTasks(
                                          candidate.visit,
                                          group.visit,
                                        ).length > 0,
                                    )
                                    .map((candidate) => {
                                      const copyableTaskCount =
                                        getCopyableVisitTasks(
                                          candidate.visit,
                                          group.visit,
                                        ).length;
                                      return (
                                        <button
                                          key={candidate.key}
                                          type="button"
                                          onClick={() =>
                                            copyVisitTasks(
                                              candidate.visit,
                                              group.visit,
                                            )
                                          }
                                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#514956] transition hover:bg-[var(--primary-fixed)]"
                                        >
                                          <span>{candidate.title}</span>
                                          <span className="shrink-0 text-[10px] font-medium text-[#817a85]">
                                            {lang === "zh"
                                              ? `${copyableTaskCount} 项任务`
                                              : lang === "ja"
                                                ? `${copyableTaskCount} 件`
                                                : `${copyableTaskCount} ${
                                                    copyableTaskCount <= 1
                                                      ? "task"
                                                      : "tasks"
                                                  }`}
                                          </span>
                                        </button>
                                      );
                                    })}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "flex flex-wrap gap-3",
                  careType === "visit" && "hidden",
                )}
              >
                {group.tasks.map((task) => {
                  const Icon =
                    options.find((option) => option.id === task.templateId)
                      ?.icon ?? PiSparkle;
                  const petLabels = taskPetLabelText(
                    task,
                    pets,
                    petCareGroups,
                    localizedPetDisplayType,
                  );
                  return (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        if (dragHandlePressedRef.current !== task.id) {
                          event.preventDefault();
                          return;
                        }
                        event.dataTransfer.effectAllowed = "move";
                        setDraggedId(task.id);
                      }}
                      onDragEnd={() => {
                        dragHandlePressedRef.current = null;
                        setDraggedId(null);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedId)
                          moveTask(draggedId, task.id, group.visit);
                        setDraggedId(null);
                      }}
                      className={cn(
                        "flex w-full min-w-0 items-center rounded-[15px] border border-[#ded9e0] bg-white p-3 transition",
                        careType === "visit"
                          ? "sm:w-fit sm:max-w-[320px] sm:flex-none"
                          : "sm:w-[300px] sm:min-w-0 sm:max-w-[300px] sm:flex-none",
                        draggedId === task.id && "opacity-50 shadow-lg",
                      )}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Reorder ${task.label}`}
                        onPointerDown={() => {
                          dragHandlePressedRef.current = task.id;
                        }}
                        onPointerUp={() => {
                          dragHandlePressedRef.current = null;
                        }}
                        className="mr-2 flex h-9 w-6 shrink-0 cursor-grab items-center justify-center text-[#9b929f]"
                      >
                        <PiDotsSixVertical size={20} />
                      </span>
                      <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f6f2f7] text-[#8a5d34]">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          title={task.label}
                          className="block max-w-full truncate text-sm font-bold leading-5"
                        >
                          {task.label}
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px]">
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold",
                              task.priority === "must"
                                ? "text-danger-text"
                                : "text-[#7b6a52]",
                            )}
                          >
                            {task.priority === "must" ? (
                              <PiWarningCircle size={12} />
                            ) : (
                              <PiFlag size={12} />
                            )}
                            <span>
                              {task.priority === "must"
                                ? copy.mustDo
                                : copy.ifTime}
                            </span>
                          </span>
                          {petLabels && (
                            <span
                              title={petLabels}
                              className="inline-flex min-w-0 max-w-[180px] flex-1 items-center gap-1 text-[11px] font-medium text-[#6c4f80]"
                            >
                              <PiPawPrint size={12} className="shrink-0" />
                              <span className="min-w-0 truncate">
                                {petLabels}
                              </span>
                            </span>
                          )}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${task.label} from ${group.title}`}
                        onClick={() => removeAssignment(task.id)}
                        className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-bg text-danger-text"
                      >
                        <PiTrash size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
          {visitPetValidationMessage ? (
            <div
              role="alert"
              className="inline-flex max-w-full items-start gap-2.5 whitespace-normal rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold leading-6 text-danger-text"
            >
              <PiWarningCircle className="mt-0.5 shrink-0" size={18} />
              <span>{visitPetValidationMessage}</span>
            </div>
          ) : null}
        </section>
      )}
      <section>
        <Field
          label={copy.additionalNotes}
          optional
          hint={copy.additionalHint}
          hintInline
          hintInlineRight
        >
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className={textareaClass}
            placeholder={copy.additionalPlaceholder}
          />
        </Field>
      </section>
    </div>
  );
}

// Compatibility exports
export const TaskListEditor = StepVisitTasks;
export const VisitTasksScreen = StepVisitTasks;
export const GuidedNeedTasksStep = StepVisitTasks;
