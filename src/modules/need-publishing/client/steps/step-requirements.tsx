"use client";

import { useState } from "react";
import { PiCheck, PiPlus, PiTrash } from "react-icons/pi";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import {
  boardingHomeSituationOptions,
  boardingRequirementOptions,
  type CompatibilityChoice,
} from "@/domain/publishing/legacy-need-draft-v3";
import cn from "@/lib/cn";
import {
  Field,
  inputClass,
  textareaClass,
  toggleValue,
} from "../guided-need-flow-shared";

export function BoardingMustHavePicker({
  value,
  onChange,
  customOptions,
  onCustomOptionsChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  customOptions: string[];
  onCustomOptionsChange: (value: string[]) => void;
}) {
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingEnvironment;
  const [custom, setCustom] = useState("");
  const builtInRequirements = boardingRequirementOptions.map(
    (value, index) => ({
      value,
      label: copy.requirements[index] ?? value,
    }),
  );
  const items = [...boardingRequirementOptions, ...customOptions];
  const add = () => {
    const item = custom.trim();
    if (
      !item ||
      items.some((existing) => existing.toLowerCase() === item.toLowerCase())
    )
      return;
    setCustom("");
    onCustomOptionsChange([...customOptions, item]);
    onChange([...value, item]);
  };
  const remove = (item: string) => {
    onCustomOptionsChange(customOptions.filter((option) => option !== item));
    onChange(value.filter((option) => option !== item));
  };
  const optionButton = (item: string, label = item, deletable = false) => {
    const active = value.includes(item);
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChange(toggleValue(value, item))}
        className={cn(
          "flex min-h-12 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition",
          deletable && "pr-12",
          active
            ? "border-[var(--primary-border-strong)] bg-[var(--primary-subtle)] text-[var(--primary-strong)]"
            : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[var(--primary-border)]",
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
            active
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[#bcb5bf]",
          )}
        >
          {active && <PiCheck size={12} />}
        </span>
        <span className="min-w-0 flex-1">{label}</span>
      </button>
    );
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {builtInRequirements.map(({ value: item, label }) => (
          <div key={item} className="inline-flex max-w-full">{optionButton(item, label)}</div>
        ))}
        {customOptions.map((item) => (
          <div key={item} className="relative inline-flex max-w-full">
            {optionButton(item, item, true)}
            <button
              type="button"
              aria-label={copy.deleteRequirement}
              title={copy.deleteRequirement}
              onClick={() => remove(item)}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-danger-bg text-danger-text transition hover:bg-danger-ring"
            >
              <PiTrash size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 inline-flex max-w-full items-center gap-2">
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            add();
          }}
          className={cn(inputClass, "h-11 w-52 min-w-0")}
          placeholder={copy.addRequirement}
        />
        <button
          type="button"
          aria-label={copy.addRequirement}
          onClick={add}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
        >
          <PiPlus />
        </button>
      </div>
    </div>
  );
}

export function StepBoardingRequirements({
  needs,
  onNeedsChange,
  customRequirements,
  onCustomRequirementsChange,
  compatibility,
  onCompatibilityChange,
  customSituations,
  onCustomSituationsChange,
  notes,
  onNotesChange,
}: {
  needs: string[];
  onNeedsChange: (value: string[]) => void;
  customRequirements: string[];
  onCustomRequirementsChange: (value: string[]) => void;
  compatibility: Record<string, CompatibilityChoice>;
  onCompatibilityChange: (value: Record<string, CompatibilityChoice>) => void;
  customSituations: string[];
  onCustomSituationsChange: (value: string[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingEnvironment;
  const ui = needMessages.needPublishingClient.requirements.boarding;
  const [customSituation, setCustomSituation] = useState("");
  const builtInSituations = boardingHomeSituationOptions.map(
    (value, index) => ({
      value,
      label: copy.situations[index] ?? value,
    }),
  );
  const situations = [...boardingHomeSituationOptions, ...customSituations];
  const toggleAvoid = (label: string) => {
    const next = { ...compatibility };
    if (next[label] === "not-ok") delete next[label];
    else next[label] = "not-ok";
    onCompatibilityChange(next);
  };
  const addSituation = () => {
    const label = customSituation.trim();
    if (
      !label ||
      situations.some((item) => item.toLowerCase() === label.toLowerCase())
    )
      return;
    setCustomSituation("");
    onCustomSituationsChange([...customSituations, label]);
    onCompatibilityChange({ ...compatibility, [label]: "not-ok" });
  };
  const removeSituation = (label: string) => {
    onCustomSituationsChange(customSituations.filter((item) => item !== label));
    const next = { ...compatibility };
    delete next[label];
    onCompatibilityChange(next);
  };
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            {ui.mustHave}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#817a85]">
            {ui.mustHaveDetail}
          </p>
        </div>
        <BoardingMustHavePicker
          value={needs}
          onChange={onNeedsChange}
          customOptions={customRequirements}
          onCustomOptionsChange={onCustomRequirementsChange}
        />
      </section>
      <section>
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            {ui.situations}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#817a85]">
            {ui.situationsDetail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {situations.map((item) => {
            const custom = customSituations.includes(item);
            const active = compatibility[item] === "not-ok";
            const displayLabel =
              builtInSituations.find((option) => option.value === item)
                ?.label ?? item;
            return (
              <div
                key={item}
                className="relative inline-flex max-w-full"
              >
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleAvoid(item)}
                  className={cn(
                    "flex min-h-12 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition",
                    active
                      ? "border-danger-border bg-danger-bg text-danger-text"
                      : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[#d9b4a4]",
                  )}
                >
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                    active
                      ? "border-danger-text bg-danger-text text-white"
                      : "border-[#bcb5bf]",
                  )}>
                    {active && <PiCheck size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">{displayLabel}</span>
                  {active && (
                    <span className={cn(
                      "rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
                      custom && "mr-7",
                    )}>
                      {ui.avoid}
                    </span>
                  )}
                </button>
                {custom && (
                  <button
                    type="button"
                    aria-label={copy.deleteSituation}
                    title={copy.deleteSituation}
                    onClick={() => removeSituation(item)}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-danger-text shadow-sm transition hover:bg-danger-ring"
                  >
                    <PiTrash size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 inline-flex max-w-full items-center gap-2">
            <input
              value={customSituation}
              onChange={(event) => setCustomSituation(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing)
                  return;
                event.preventDefault();
                addSituation();
              }}
              className={cn(inputClass, "h-11 w-52 min-w-0")}
              placeholder={copy.addSituation}
            />
            <button
              type="button"
              aria-label={copy.addSituation}
              onClick={addSituation}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
            >
              <PiPlus />
            </button>
        </div>
      </section>
      <section>
        <Field label={copy.additionalNotes} optional>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className={textareaClass}
            placeholder={copy.notesPlaceholder}
          />
        </Field>
      </section>
    </div>
  );
}

export function StepCustomRequirements({
  requirements,
  onRequirementsChange,
  cautions,
  onCautionsChange,
  notes,
  onNotesChange,
}: {
  requirements: string[];
  onRequirementsChange: (value: string[]) => void;
  cautions: string[];
  onCautionsChange: (value: string[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing;
  const ui = needMessages.needPublishingClient.requirements.custom;
  const [customReq, setCustomReq] = useState("");
  const [customCaution, setCustomCaution] = useState("");

  const defaultRequirementKeys = [
    "Pet-friendly vehicle",
    "Medication experience",
    "Exotic pet experience",
    "Able to lift a large pet",
    "Carrier handling",
  ];

  const defaultCautionKeys = [
    "May bite or scratch",
    "Nervous around strangers",
    "Heavy lifting involved",
    "Limited building access",
    "Time-sensitive task",
  ];

  const builtInRequirements = defaultRequirementKeys.map((key, index) => ({
    key,
    label: copy.requirementLabels[index] ?? key,
  }));

  const builtInCautions = defaultCautionKeys.map((key, index) => ({
    key,
    label: copy.cautionLabels[index] ?? key,
  }));

  const customReqItems = requirements.filter(
    (item) => !defaultRequirementKeys.includes(item),
  );

  const customCautionItems = cautions.filter(
    (item) => !defaultCautionKeys.includes(item),
  );

  const addRequirement = () => {
    const item = customReq.trim();
    if (!item || requirements.includes(item)) return;
    onRequirementsChange([...requirements, item]);
    setCustomReq("");
  };

  const removeRequirement = (item: string) => {
    onRequirementsChange(requirements.filter((r) => r !== item));
  };

  const addCaution = () => {
    const item = customCaution.trim();
    if (!item || cautions.includes(item)) return;
    onCautionsChange([...cautions, item]);
    setCustomCaution("");
  };

  const removeCaution = (item: string) => {
    onCautionsChange(cautions.filter((c) => c !== item));
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            {ui.requirementsTitle}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#817a85]">
            {ui.requirementsDetail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {builtInRequirements.map(({ key, label }) => {
            const active = requirements.includes(key);
            return (
              <div key={key} className="inline-flex max-w-full">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onRequirementsChange(toggleValue(requirements, key))}
                  className={cn(
                    "flex min-h-12 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition",
                    active
                      ? "border-[var(--primary-border-strong)] bg-[var(--primary-subtle)] text-[var(--primary-strong)]"
                      : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[var(--primary-border)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[#bcb5bf]",
                    )}
                  >
                    {active && <PiCheck size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">{label}</span>
                </button>
              </div>
            );
          })}
          {customReqItems.map((item) => {
            const active = requirements.includes(item);
            return (
              <div key={item} className="relative inline-flex max-w-full">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onRequirementsChange(toggleValue(requirements, item))}
                  className={cn(
                    "flex min-h-12 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 pr-12 text-left text-sm font-bold transition",
                    active
                      ? "border-[var(--primary-border-strong)] bg-[var(--primary-subtle)] text-[var(--primary-strong)]"
                      : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[var(--primary-border)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      active
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[#bcb5bf]",
                    )}
                  >
                    {active && <PiCheck size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">{item}</span>
                </button>
                <button
                  type="button"
                  aria-label={ui.deleteRequirement}
                  title={ui.deleteRequirement}
                  onClick={() => removeRequirement(item)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-danger-bg text-danger-text transition hover:bg-danger-ring"
                >
                  <PiTrash size={13} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 inline-flex max-w-full items-center gap-2">
          <input
            value={customReq}
            onChange={(event) => setCustomReq(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              addRequirement();
            }}
            className={cn(inputClass, "h-11 w-52 min-w-0")}
            placeholder={ui.addRequirement}
          />
          <button
            type="button"
            aria-label={ui.addRequirement}
            onClick={addRequirement}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
          >
            <PiPlus />
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
            {ui.cautionsTitle}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#817a85]">
            {ui.cautionsDetail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {builtInCautions.map(({ key, label }) => {
            const active = cautions.includes(key);
            return (
              <div key={key} className="inline-flex max-w-full">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCautionsChange(toggleValue(cautions, key))}
                  className={cn(
                    "flex min-h-12 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-bold transition",
                    active
                      ? "border-[#d8b082] bg-[#fdf8f3] text-[#7d481d]"
                      : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[#dfc8b3]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      active
                        ? "border-[#b87033] bg-[#b87033] text-white"
                        : "border-[#bcb5bf]",
                    )}
                  >
                    {active && <PiCheck size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">{label}</span>
                </button>
              </div>
            );
          })}
          {customCautionItems.map((item) => {
            const active = cautions.includes(item);
            return (
              <div key={item} className="relative inline-flex max-w-full">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCautionsChange(toggleValue(cautions, item))}
                  className={cn(
                    "flex min-h-12 max-w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 pr-12 text-left text-sm font-bold transition",
                    active
                      ? "border-[#d8b082] bg-[#fdf8f3] text-[#7d481d]"
                      : "border-[#ded9e0] bg-white text-[#706a78] hover:border-[#dfc8b3]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      active
                        ? "border-[#b87033] bg-[#b87033] text-white"
                        : "border-[#bcb5bf]",
                    )}
                  >
                    {active && <PiCheck size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">{item}</span>
                </button>
                <button
                  type="button"
                  aria-label={ui.deleteCaution}
                  title={ui.deleteCaution}
                  onClick={() => removeCaution(item)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-danger-bg text-danger-text transition hover:bg-danger-ring"
                >
                  <PiTrash size={13} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-3 inline-flex max-w-full items-center gap-2">
          <input
            value={customCaution}
            onChange={(event) => setCustomCaution(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              addCaution();
            }}
            className={cn(inputClass, "h-11 w-52 min-w-0")}
            placeholder={ui.addCaution}
          />
          <button
            type="button"
            aria-label={ui.addCaution}
            onClick={addCaution}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
          >
            <PiPlus />
          </button>
        </div>
      </section>

      <section>
        <Field label={ui.additionalNotes} optional>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            className={textareaClass}
            placeholder={ui.notesPlaceholder}
          />
        </Field>
      </section>
    </div>
  );
}

// Compatibility exports
export const StepRequirementsBoarding = StepBoardingRequirements;
export const StepRequirementsCustom = StepCustomRequirements;
export const BoardingEnvironmentScreen = StepBoardingRequirements;
export const CustomRequirementsScreen = StepCustomRequirements;
export const GuidedNeedRequirementsStep = StepBoardingRequirements;
