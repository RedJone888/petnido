"use client";

import { PawPrint } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import {
  emptyPetProfileEditorValue,
  petProfileTypes,
  PetProfileAddButton,
  PetProfileCard,
  PetProfileEditorDialog,
  type PetProfileEditorErrors,
  type PetProfileEditorValue,
  type PetProfileType,
} from "@/components/pets/pet-profile-components";
import {
  localizeOtherPetType,
  localizePetBreed,
} from "@/domain/pet/profile-options";
import { useConfirm } from "@/hooks/useConfirm";
import { useConfirmStore } from "@/store/useConfirmStore";
import { trpc } from "@/utils/trpc";
import { SettingsCard, SettingsTabSkeleton } from "./settings-card";

const legacyCustomTypes: Record<string, string> = {
  CHINCHILLA: "Chinchilla",
  GUINEA_PIG: "Guinea pig",
  HAMSTER: "Hamster",
};

const emptyErrors: PetProfileEditorErrors = {};

function freshEmptyForm(): PetProfileEditorValue {
  return { ...emptyPetProfileEditorValue, photos: [] };
}

export function PetSettings() {
  const { t, lang } = useLanguage();
  const copy = t.settings.pets;
  const confirm = useConfirm();
  const setConfirmLoading = useConfirmStore((state) => state.setIsDeleting);
  const closeConfirm = useConfirmStore((state) => state.close);
  const utils = trpc.useUtils();
  const pets = trpc.pet.listMine.useQuery();
  const [form, setForm] = useState<PetProfileEditorValue>(freshEmptyForm);
  const [errors, setErrors] = useState<PetProfileEditorErrors>(emptyErrors);
  const [showForm, setShowForm] = useState(false);
  const previousLanguage = useRef(lang);
  const refresh = () => utils.pet.listMine.invalidate();
  const create = trpc.pet.create.useMutation({ onSuccess: refresh });
  const update = trpc.pet.update.useMutation({ onSuccess: refresh });
  const archive = trpc.pet.archive.useMutation({ onSuccess: refresh });
  const busy = create.isLoading || update.isLoading;
  const petCount = pets.data?.length ?? 0;
  const petCountLabel = copy.countSummary
    .replace("{count}", String(petCount))
    .replace(/^You currently have ([01]) pets$/, "You currently have $1 pet");

  useEffect(() => {
    if (previousLanguage.current === lang) return;
    setForm((current) => {
      const localizedCustomType =
        current.type === "OTHER"
          ? localizeOtherPetType(current.customType, lang)
          : current.customType;
      return {
        ...current,
        customType: localizedCustomType,
        breed: localizePetBreed(
          current.breed,
          lang,
          current.type,
          current.customType,
        ),
      };
    });
    previousLanguage.current = lang;
  }, [lang]);

  function resetForm() {
    setForm(freshEmptyForm());
    setErrors(emptyErrors);
    setShowForm(false);
  }

  async function submit() {
    const nextErrors: PetProfileEditorErrors = {
      name: form.name.trim() ? "" : copy.nameRequired,
      type: form.type ? "" : copy.typeRequired,
      customType:
        form.type === "OTHER" && !form.customType.trim()
          ? copy.customTypeRequired
          : "",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.type || nextErrors.customType) return;

    const petType = form.type as PetProfileType;
    const values = {
      name: form.name.trim(),
      type: petType,
      customType: petType === "OTHER" ? form.customType.trim() || null : null,
      breed: form.breed.trim() || null,
      age: null,
      birthDate: form.birthDate
        ? new Date(`${form.birthDate}T00:00:00.000Z`)
        : null,
      weightGrams:
        form.weight === ""
          ? null
          : Math.round(
              Number(form.weight) * (form.weightUnit === "kg" ? 1000 : 1),
            ),
      sex: form.sex || null,
      neutered: form.neutered || null,
      notes: form.notes.trim() || null,
      photoIds: form.photos.map((photo) => photo.id),
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...values });
      else await create.mutateAsync(values);
      toast.success(form.id ? copy.updateSuccess : copy.createSuccess);
      resetForm();
    } catch {
      toast.error(copy.saveError);
    }
  }

  function openEditor(pet: NonNullable<typeof pets.data>[number]) {
    const editType =
      petProfileTypes.includes(pet.type as PetProfileType) &&
      pet.type !== "OTHER"
        ? (pet.type as PetProfileType)
        : "OTHER";
    const editCustomType = pet.customType ?? legacyCustomTypes[pet.type] ?? "";
    setForm({
      id: pet.id,
      name: pet.name ?? "",
      type: editType,
      customType: localizeOtherPetType(editCustomType, lang),
      breed: localizePetBreed(
        pet.breed ?? "",
        lang,
        pet.type,
        editCustomType,
      ),
      birthDate: pet.birthDate
        ? new Date(pet.birthDate).toISOString().slice(0, 10)
        : "",
      weight:
        pet.weightGrams == null ? "" : String(pet.weightGrams / 1000),
      weightUnit: "kg",
      sex: (pet.sex ?? "") as PetProfileEditorValue["sex"],
      neutered: (pet.neutered ?? "") as PetProfileEditorValue["neutered"],
      photos: pet.photos.map((photo) => ({
        ...photo,
        isUploading: false,
      })),
      notes: pet.notes ?? "",
    });
    setErrors(emptyErrors);
    setShowForm(true);
  }

  return (
    <SettingsCard
      id="pets"
      icon={PawPrint}
      title={copy.title}
      description={copy.description}
      showHeader={false}
    >
      {pets.isLoading ? (
        <SettingsTabSkeleton variant="pets" />
      ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {petCountLabel}
          </p>
          <PetProfileAddButton
            label={copy.add}
            onClick={() => {
              setForm(freshEmptyForm());
              setErrors(emptyErrors);
              setShowForm(true);
            }}
          />
        </div>

        {showForm ? (
          <PetProfileEditorDialog
            value={form}
            mode={form.id ? "edit" : "create"}
            errors={errors}
            busy={busy}
            onChange={(next) => {
              setForm(next);
              if (errors.name || errors.type || errors.customType) {
                setErrors(emptyErrors);
              }
            }}
            onCancel={resetForm}
            onSubmit={() => void submit()}
          />
        ) : null}

        {pets.data?.length ? (
          <div className="flex flex-wrap items-start gap-3">
            {pets.data.map((pet) => (
              <PetProfileCard
                key={pet.id}
                pet={{
                  id: pet.id,
                  name: pet.name ?? "",
                  type: pet.type,
                  customType:
                    pet.customType ?? legacyCustomTypes[pet.type] ?? "",
                  breed: pet.breed,
                  birthDate: pet.birthDate,
                  weightGrams: pet.weightGrams,
                  sex: pet.sex,
                  neutered: pet.neutered,
                  notes: pet.notes,
                  photoUrl: pet.photos[0]?.url,
                }}
                editLabel={copy.editAria.replace("{name}", pet.name ?? "")}
                deleteLabel={copy.deleteAria.replace("{name}", pet.name ?? "")}
                deleteDisabled={archive.isLoading}
                onEdit={() => openEditor(pet)}
                onDelete={async () => {
                  const deleteLabel = copy.deleteAria.replace(
                    "{name}",
                    pet.name ?? "",
                  );
                  const accepted = await confirm({
                    title: deleteLabel,
                    content: (
                      <p>
                        {copy.deleteQuestion.replace(
                          "{name}",
                          pet.name ?? "",
                        )}
                      </p>
                    ),
                    confirmText: deleteLabel,
                    variant: "danger",
                  });
                  if (!accepted) return;
                  setConfirmLoading(true);
                  try {
                    await archive.mutateAsync({ id: pet.id });
                    toast.success(copy.deleteSuccess);
                  } catch {
                    toast.error(copy.deleteError);
                  } finally {
                    setConfirmLoading(false);
                    closeConfirm();
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            {copy.none}
          </p>
        )}
      </div>
      )}
    </SettingsCard>
  );
}
