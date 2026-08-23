"use client";

import { useEffect, useRef, useState } from "react";
import {
  PiCaretDown,
  PiCaretUp,
  PiCheck,
  PiCursorClick,
  PiPawPrint,
  PiPlus,
  PiWarningCircle,
} from "react-icons/pi";
import type { Lang } from "@/domain/lang/types";
import { useLanguage } from "@/components/providers/language-provider";
import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
import {
  PetProfileCard,
  PetProfileEditorDialog,
  type PetProfileEditorValue,
} from "@/components/pets/pet-profile-components";
import {
  localizeOtherPetType,
  localizePetBreed,
} from "@/domain/pet/profile-options";
import type { PetDraft } from "@/domain/publishing/legacy-need-draft-v3";
import {
  normalizePetTypeSelection,
} from "@/modules/need-publishing/domain/pet-types";
import { useConfirm } from "@/hooks/useConfirm";
import cn from "@/lib/cn";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { PublishingValidationAlert } from "../components/publishing-validation-alert";
import {
  isPetProfileComplete,
  petDisplayType,
  petGroupKey,
  petProfileMissingFields,
  SavedPetAvatar,
  type SavedPetOption,
} from "../guided-need-flow-shared";

export type PetProfileChoiceCopy = {
  syncProfile: string;
  addAsNewProfile: string;
};

export function createPet(): PetDraft {
  return {
    id: crypto.randomUUID(),
    profileAction: "none",
    type: "",
    typeCode: undefined,
    otherType: "",
    quantity: 1,
    name: "",
    breed: "",
    weight: "",
    weightUnit: "kg",
    birthDate: "",
    sex: "",
    neutered: "",
    photo: "",
    notes: "",
  };
}

export function draftPetFromProfile(pet: SavedPetOption): PetDraft {
  const normalizedType = pet.type.toLowerCase();
  const normalizedSelection = normalizePetTypeSelection(
    pet.type,
    pet.customType,
  );
  const supportedType = ["dog", "cat", "rabbit", "bird"].includes(
    normalizedType,
  );
  const birthDate = pet.birthDate
    ? new Date(pet.birthDate).toISOString().slice(0, 10)
    : "";
  return {
    id: crypto.randomUUID(),
    sourcePetId: pet.id,
    profileAction: "update",
    type: supportedType ? normalizedType : "other",
    typeCode: normalizedSelection.petType,
    otherType: supportedType
      ? ""
      : pet.customType || pet.type.toLowerCase().replaceAll("_", " "),
    quantity: pet.quantity,
    name: pet.name ?? "",
    breed: pet.breed ?? "",
    weight: pet.weightGrams ? String(pet.weightGrams / 1000) : "",
    weightUnit: "kg",
    birthDate,
    sex: pet.sex?.toLowerCase() ?? "unknown",
    neutered: pet.neutered?.toLowerCase() ?? "unknown",
    photo: pet.photos[0]?.url ?? "",
    notes: pet.notes ?? "",
  };
}

export function draftPetToProfileEditorValue(
  pet: PetDraft,
  lang: Lang = "en",
): PetProfileEditorValue {
  const normalizedType = pet.type.trim().toUpperCase();
  const editorType = ["DOG", "CAT", "RABBIT", "BIRD", "OTHER"].includes(
    normalizedType,
  )
    ? normalizedType
    : "OTHER";
  const rawCustomType =
    editorType === "OTHER"
      ? pet.otherType.trim() ||
        (normalizedType === "OTHER" ? "" : pet.type.trim())
      : "";
  return {
    id: pet.id,
    name: pet.name,
    type: editorType as PetProfileEditorValue["type"],
    customType: localizeOtherPetType(rawCustomType, lang),
    breed: localizePetBreed(pet.breed, lang, editorType, rawCustomType),
    birthDate: pet.birthDate,
    weight: pet.weight,
    weightUnit: pet.weightUnit,
    sex: pet.sex ? (pet.sex.toUpperCase() as PetProfileEditorValue["sex"]) : "",
    neutered: pet.neutered
      ? (pet.neutered.toUpperCase() as PetProfileEditorValue["neutered"])
      : "",
    photos: pet.photo
      ? [
          {
            id: `need-pet-${pet.id}`,
            url: pet.photo,
            signature: `need-pet-${pet.id}`,
            isUploading: false,
          },
        ]
      : [],
    notes: pet.notes,
  };
}

export function profileEditorValueToDraftPatch(
  value: PetProfileEditorValue,
): Partial<PetDraft> {
  const normalizedPetType = normalizePetTypeSelection(
    value.type,
    value.customType,
  );
  return {
    name: value.name,
    type: value.type.toLowerCase(),
    typeCode: normalizedPetType.petType,
    otherType: normalizedPetType.customPetType ?? value.customType,
    breed: value.breed,
    birthDate: value.birthDate,
    weight: value.weight,
    weightUnit: value.weightUnit,
    sex: value.sex.toLowerCase(),
    neutered: value.neutered.toLowerCase(),
    photo: value.photos[0]?.url ?? "",
    notes: value.notes,
  };
}

export function profileEditorValueToPetInput(
  pet: PetDraft,
  value: PetProfileEditorValue,
) {
  const normalizedPetType = normalizePetTypeSelection(
    value.type,
    value.customType,
  );
  return {
    name: value.name.trim(),
    type: normalizedPetType.petType,
    customType: normalizedPetType.customPetType,
    quantity: pet.quantity,
    breed: value.breed.trim() || null,
    age: null,
    birthDate: value.birthDate
      ? new Date(`${value.birthDate}T00:00:00.000Z`)
      : null,
    weightGrams:
      value.weight === ""
        ? null
        : Math.round(
            Number(value.weight) * (value.weightUnit === "kg" ? 1000 : 1),
          ),
    sex: value.sex || null,
    neutered: value.neutered || null,
    notes: value.notes.trim() || null,
  };
}

export function StepPets({
  pets,
  savedPets,
  savedPetsLoading,
  onUseSavedPet,
  onChange,
  onAdd,
  onRemove,
  showValidation,
}: {
  pets: PetDraft[];
  savedPets: SavedPetOption[];
  savedPetsLoading: boolean;
  onUseSavedPet: (pet: SavedPetOption) => void;
  onChange: (id: string, patch: Partial<PetDraft>) => void;
  onAdd: (pet?: PetDraft) => string;
  onRemove: (id: string) => void;
  showValidation: boolean;
}) {
  const { t, lang } = useLanguage();
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishing;
  const form = copy.petForm;
  const taskForm = needMessages.needPublishingTaskForm;
  const confirm = useConfirm();
  const closeConfirm = useConfirmStore((state) => state.close);
  const [expanded, setExpanded] = useState("");
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);
  const profilePickerRef = useRef<HTMLDivElement>(null);
  const [validatedPetIds, setValidatedPetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const profileUpdate = trpc.pet.update.useMutation();
  const profileUtils = trpc.useUtils();
  const profileMutationBusy = profileUpdate.isLoading;
  const [profileSaveError, setProfileSaveError] = useState("");
  const previousExpandedRef = useRef("");
  const newPetIdsRef = useRef(new Set<string>());
  const [editorPet, setEditorPet] = useState<PetDraft | null>(null);

  const cancelPetEditor = () => {
    if (!expanded) return;
    if (newPetIdsRef.current.has(expanded)) {
      newPetIdsRef.current.delete(expanded);
    }
    setEditorPet(null);
    setExpanded("");
  };

  const savePetEditor = async () => {
    const pet = editorPet?.id === expanded ? editorPet : null;
    if (!pet) return;
    if (!isPetProfileComplete(pet)) {
      setValidatedPetIds((items) => new Set(items).add(pet.id));
      return;
    }
    setProfileSaveError("");
    const editorValue = draftPetToProfileEditorValue(pet, lang);
    const draftPatch = profileEditorValueToDraftPatch(editorValue);
    try {
      if (pet.sourcePetId && pet.profileAction !== "create") {
        const profileInput = profileEditorValueToPetInput(pet, editorValue);
        await profileUpdate.mutateAsync({
          id: pet.sourcePetId,
          ...profileInput,
        });
        onChange(pet.id, { ...draftPatch, profileAction: "none" });
        void profileUtils.pet.listMine.invalidate();
      } else if (pet.sourcePetId) {
        onChange(pet.id, {
          ...draftPatch,
          sourcePetId: undefined,
          profileAction: "none",
        });
      } else if (newPetIdsRef.current.has(pet.id)) {
        onAdd({ ...pet, ...draftPatch, profileAction: "none" });
      } else {
        onChange(pet.id, { ...draftPatch, profileAction: "none" });
      }
      newPetIdsRef.current.delete(pet.id);
      setEditorPet(null);
      setExpanded("");
    } catch {
      setProfileSaveError(t.settings.pets.saveError);
    }
  };

  const openPetEditor = (pet: PetDraft) => {
    if (expanded === pet.id) {
      cancelPetEditor();
      return;
    }
    if (expanded) cancelPetEditor();
    setProfileSaveError("");
    setEditorPet({ ...pet });
    setExpanded(pet.id);
  };

  const addPetDraft = () => {
    if (expanded) cancelPetEditor();
    const pet = createPet();
    newPetIdsRef.current.add(pet.id);
    setEditorPet(pet);
    setExpanded(pet.id);
  };

  useEffect(() => {
    if (showValidation) setValidatedPetIds(new Set(pets.map((pet) => pet.id)));
  }, [showValidation]);

  useEffect(() => {
    const previous = previousExpandedRef.current;
    if (previous && previous !== expanded)
      setValidatedPetIds((items) => new Set(items).add(previous));
    previousExpandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  useEffect(() => {
    if (!profilePickerOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!profilePickerRef.current?.contains(event.target as Node)) {
        setProfilePickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [profilePickerOpen]);

  const displayPets = Array.from(
    new Set(pets.map((pet) => petGroupKey(pet))),
  ).flatMap((groupKey) => pets.filter((pet) => petGroupKey(pet) === groupKey));
  const selectedProfilePetIds = new Set(
    pets.flatMap((pet) => (pet.sourcePetId ? [pet.sourcePetId] : [])),
  );
  const profileChoiceCopy = needMessages.needPublishingClient.petProfile;
  const activePet = editorPet?.id === expanded ? editorPet : null;
  const activeEditorValue = activePet
    ? draftPetToProfileEditorValue(activePet, lang)
    : null;
  const confirmRemovePet = async (pet: PetDraft, petLabel: string) => {
    const accepted = await confirm({
      title: `${taskForm.delete} ${petLabel}`,
      content: (
        <p>
          {taskForm.deletePetMessage.replace("{pet}", petLabel)}
        </p>
      ),
      confirmText: taskForm.delete,
      cancelText: form.cancel,
      variant: "danger",
    });
    if (!accepted) return;
    newPetIdsRef.current.delete(pet.id);
    onRemove(pet.id);
    closeConfirm();
  };

  return (
    <div className="space-y-5">
      <section className="relative z-30 flex flex-wrap items-center gap-3">
        {savedPetsLoading ? (
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-400">
            <PiPawPrint size={18} /> {form.loadingSavedPets}
          </span>
        ) : savedPets.length > 0 ? (
          <div ref={profilePickerRef} className="relative inline-flex">
            <button
              type="button"
              aria-expanded={profilePickerOpen}
              onClick={() => setProfilePickerOpen((open) => !open)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--primary-border)] bg-white py-1.5 pl-2 pr-3.5 text-sm font-bold text-[var(--primary)] transition hover:border-[var(--primary-border-strong)] hover:bg-[var(--primary-subtle)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)]">
                <PiCursorClick size={17} />
              </span>
              {form.savedProfileTitle}
              {profilePickerOpen ? (
                <PiCaretUp size={16} />
              ) : (
                <PiCaretDown size={16} />
              )}
            </button>
            {profilePickerOpen ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="max-h-80 space-y-1 overflow-y-auto overscroll-contain">
                  {savedPets.map((savedPet) => {
                    const selected = selectedProfilePetIds.has(savedPet.id);
                    const normalizedType = savedPet.type.toUpperCase();
                    const localizedBreed = localizePetBreed(
                      savedPet.breed ?? "",
                      lang,
                      normalizedType,
                      savedPet.customType ?? "",
                    );
                    const localizedCustomType = localizeOtherPetType(
                      savedPet.customType ?? "",
                      lang,
                    );
                    const typeLabel =
                      localizedBreed ||
                      localizedCustomType ||
                      t.settings.pets.typeLabels[
                        normalizedType as keyof typeof t.settings.pets.typeLabels
                      ] ||
                      savedPet.type.toLowerCase().replaceAll("_", " ");
                    const displayName =
                      savedPet.name ||
                      localizedCustomType ||
                      t.settings.pets.typeLabels[
                        normalizedType as keyof typeof t.settings.pets.typeLabels
                      ] ||
                      savedPet.type.toLowerCase().replaceAll("_", " ");
                    return (
                      <button
                        key={savedPet.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          const selectedPet = pets.find(
                            (pet) => pet.sourcePetId === savedPet.id,
                          );
                          if (selectedPet) {
                            if (expanded === selectedPet.id) {
                              setEditorPet(null);
                              setExpanded("");
                            }
                            newPetIdsRef.current.delete(selectedPet.id);
                            onRemove(selectedPet.id);
                          } else {
                            onUseSavedPet(savedPet);
                          }
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-purple-50",
                          selected && "bg-emerald-50",
                        )}
                      >
                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#fff8e8]">
                          <SavedPetAvatar pet={savedPet} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-900">
                            {displayName}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                            {typeLabel}
                          </span>
                        </span>
                        {selected ? (
                          <PiCheck
                            className="shrink-0 text-emerald-700"
                            size={18}
                          />
                        ) : (
                          <PiPlus className="shrink-0 text-primary" size={18} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={addPetDraft}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--primary-border)] bg-white py-1.5 pl-2 pr-3.5 text-sm font-bold text-[var(--primary)] transition hover:border-[var(--primary-border-strong)] hover:bg-[var(--primary-subtle)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)]">
            <PiPlus size={17} />
          </span>
          {
            pets.some((pet) => !newPetIdsRef.current.has(pet.id))
              ? form.addAnotherPet
              : form.addPet
          }
        </button>
        {showValidation && !pets.length ? (
          <PublishingValidationAlert>{form.atLeastOne}</PublishingValidationAlert>
        ) : null}
      </section>

      <div className="flex flex-wrap items-start gap-3">
        {displayPets
          .filter((pet) => !newPetIdsRef.current.has(pet.id))
          .map((pet, index) => {
            const petError = validatedPetIds.has(pet.id)
              ? (petProfileMissingFields(pet)[0] ?? "")
              : "";
            const petLabel =
              pet.name || petDisplayType(pet) || `Pet ${index + 1}`;
            return (
              <PetProfileCard
                key={pet.id}
                pet={{
                  id: pet.id,
                  name: petLabel,
                  type: pet.type.toUpperCase(),
                  customType: pet.otherType,
                  breed: pet.breed,
                  birthDate: pet.birthDate || null,
                  weightGrams: pet.weight.trim()
                    ? Math.round(
                        Number(pet.weight) *
                          (pet.weightUnit === "kg" ? 1000 : 1),
                      )
                    : null,
                  sex: pet.sex,
                  neutered: pet.neutered,
                  notes: pet.notes,
                  photoUrl: pet.photo,
                }}
                invalidMessage={petError ? form.completeDetails : undefined}
                sourceLabel={pet.sourcePetId ? form.fromProfile : undefined}
                editLabel={t.settings.pets.editAria.replace("{name}", petLabel)}
                deleteLabel={t.settings.pets.deleteAria.replace(
                  "{name}",
                  petLabel,
                )}
                onEdit={() => openPetEditor(pet)}
                onDelete={() => void confirmRemovePet(pet, petLabel)}
              />
            );
          })}
      </div>

      {activePet && activeEditorValue ? (
        <PetProfileEditorDialog
          value={activeEditorValue}
          mode={newPetIdsRef.current.has(expanded) ? "create" : "edit"}
          errors={{
            name:
              validatedPetIds.has(expanded) && !activePet.name.trim()
                ? form.invalidPetName
                : "",
            type:
              validatedPetIds.has(expanded) && !activePet.type
                ? form.choosePetType
                : "",
            customType:
              validatedPetIds.has(expanded) &&
              activePet.type === "other" &&
              !activePet.otherType.trim()
                ? form.invalidOtherPet
                : "",
          }}
          localPhotoOnly
          extraContent={
            activePet.sourcePetId ? (
              <div className="flex flex-wrap items-center gap-2">
                <PetProfileQuestion
                  name={`pet-profile-action-${activePet.id}`}
                  checked={activePet.profileAction !== "create"}
                  title={profileChoiceCopy.syncProfile}
                  onChange={() =>
                    setEditorPet((current) =>
                      current
                        ? { ...current, profileAction: "update" }
                        : current,
                    )
                  }
                />
                <PetProfileQuestion
                  name={`pet-profile-action-${activePet.id}`}
                  checked={activePet.profileAction === "create"}
                  title={profileChoiceCopy.addAsNewProfile}
                  onChange={() =>
                    setEditorPet((current) =>
                      current
                        ? { ...current, profileAction: "create" }
                        : current,
                    )
                  }
                />
                {profileSaveError ? (
                  <p
                    role="alert"
                    className="basis-full items-center gap-1 text-xs font-semibold text-danger-text"
                  >
                    <PiWarningCircle className="mr-1 inline-block shrink-0 align-[-2px]" size={13} />
                    {profileSaveError}
                  </p>
                ) : null}
              </div>
            ) : null
          }
          busy={profileMutationBusy}
          submitLabel={t.settings.pets.saveOnly}
          onChange={(next) =>
            setEditorPet((current) =>
              current
                ? { ...current, ...profileEditorValueToDraftPatch(next) }
                : current,
            )
          }
          onCancel={cancelPetEditor}
          onSubmit={savePetEditor}
        />
      ) : null}
    </div>
  );
}

export function PetProfileQuestion({
  checked,
  title,
  name,
  onChange,
}: {
  checked: boolean;
  title: string;
  name: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      onPointerDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        onChange(true);
      }}
      className="group inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 transition focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2"
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => onChange(true)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
          checked
            ? "border-primary"
            : "border-slate-300 group-hover:border-primary/60",
        )}
      >
        {checked ? (
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        ) : null}
      </span>
      <span className={checked ? "text-primary" : undefined}>{title}</span>
    </label>
  );
}

// Compatibility exports
export const PetsScreen = StepPets;
export const GuidedNeedPetsStep = StepPets;
