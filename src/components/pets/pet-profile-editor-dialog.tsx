"use client";

import type { ReactNode } from "react";
import {
  PiCheckCircle,
  PiGenderFemale,
  PiGenderMale,
  PiQuestion,
  PiWarningCircle,
  PiXCircle,
} from "react-icons/pi";
import { ModalShell } from "@/components/ui/modal-shell";
import { useLanguage } from "@/components/providers/language-provider";
import ImageUploader from "@/components/ui/image-uploader";
import { DatePicker } from "@/components/ui/date-picker";
import {
  getOtherPetTypeOptions,
  getPetBreedSuggestions,
} from "@/domain/pet/profile-options";
import cn from "@/lib/cn";
import {
  petProfileTypes,
  type PetProfileEditorErrors,
  type PetProfileEditorValue,
  type PetProfileType,
} from "./pet-profile-types";
import { petTypeIcons } from "./pet-profile-icons";
import {
  FieldCaption,
  IconSelect,
  OtherTypeField,
  selectPrompts,
  SuggestionField,
  UnitSelect,
  fieldClass,
  textareaClass,
} from "./pet-profile-form-fields";

export function PetProfileEditorDialog({
  value,
  mode,
  errors = {},
  busy = false,
  extraContent,
  submitLabel,
  renderPhotoControl,
  localPhotoOnly = false,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: PetProfileEditorValue;
  mode: "create" | "edit";
  errors?: PetProfileEditorErrors;
  busy?: boolean;
  extraContent?: ReactNode;
  submitLabel?: string;
  renderPhotoControl?: (value: PetProfileEditorValue) => ReactNode;
  localPhotoOnly?: boolean;
  onChange: (value: PetProfileEditorValue) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = t.settings.pets;
  const breedSuggestions = getPetBreedSuggestions(
    lang,
    value.type,
    value.customType,
  );
  const otherTypeOptions = getOtherPetTypeOptions(lang);
  const neuteredLabel =
    value.sex === "FEMALE"
      ? copy.neuteredFemale
      : value.sex === "MALE"
        ? copy.neuteredMale
        : copy.neuteredGeneric;
  const title = mode === "edit" ? copy.edit : copy.newPet;

  const maxDate = new Date();
  maxDate.setHours(0, 0, 0, 0);

  return (
    <ModalShell
      title={title}
      titleId="pet-profile-editor-title"
      closeLabel={copy.close}
      cancelLabel={copy.cancel}
      saveLabel={submitLabel ?? copy.saveOnly}
      savingLabel={copy.saving}
      saving={busy}
      saveDisabled={value.photos.some((photo) => photo.isUploading)}
      onClose={onCancel}
      onCancel={onCancel}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      bodyClassName="space-y-6"
      panelClassName="max-h-[80dvh]"
    >
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <label className="relative col-span-2 lg:col-span-1">
          <FieldCaption label={copy.name} />
          <input
            id="pet-name"
            maxLength={80}
            value={value.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "pet-name-error" : undefined}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            className={cn(
              fieldClass,
              errors.name &&
                "border-danger-border focus:border-danger-text focus:ring-danger-ring",
            )}
          />
          {errors.name ? (
            <p
              id="pet-name-error"
              role="alert"
              className="absolute left-0 top-full mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={13} />
              {errors.name}
            </p>
          ) : null}
        </label>
        <div
          className={cn(
            "relative",
            value.type === "OTHER" && "col-span-2 lg:col-span-2",
          )}
        >
          <FieldCaption label={copy.type} />
          <div className={value.type === "OTHER" ? "grid grid-cols-2" : ""}>
            <IconSelect
              value={value.type}
              placeholder={selectPrompts[lang]}
              invalid={Boolean(errors.type)}
              ariaDescribedBy={
                errors.type || errors.customType ? "pet-type-error" : undefined
              }
              triggerClassName={
                value.type === "OTHER" ? "rounded-r-none" : undefined
              }
              options={petProfileTypes.map((type) => ({
                value: type,
                label: copy.typeLabels[type],
                icon: petTypeIcons[type],
              }))}
              onChange={(nextType) =>
                onChange({
                  ...value,
                  type: nextType as PetProfileType,
                  customType: nextType === "OTHER" ? value.customType : "",
                  breed: "",
                })
              }
            />
            {value.type === "OTHER" ? (
              <OtherTypeField
                value={value.customType}
                options={otherTypeOptions}
                placeholder={copy.customTypePlaceholder}
                ariaLabel={copy.customType}
                connected
                invalid={Boolean(errors.customType)}
                ariaDescribedBy={
                  errors.customType ? "pet-type-error" : undefined
                }
                onChange={(customType) =>
                  onChange({ ...value, customType, breed: "" })
                }
              />
            ) : null}
          </div>
          {errors.type || errors.customType ? (
            <p
              id="pet-type-error"
              role="alert"
              className="absolute left-0 top-full mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={13} />
              {errors.type || errors.customType}
            </p>
          ) : null}
        </div>
        <div className={cn(value.type === "OTHER" && "col-span-2 lg:col-span-1")}>
          <FieldCaption label={copy.breed} optional={copy.optional} />
          <SuggestionField
            value={value.breed}
            options={breedSuggestions}
            ariaLabel={copy.breed}
            onChange={(breed) => onChange({ ...value, breed })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <div>
          <FieldCaption label={copy.birthDate} optional={copy.optional} />
          <DatePicker
            value={value.birthDate}
            onChange={(birthDate) => onChange({ ...value, birthDate })}
            maxDate={maxDate}
            placeholder={copy.optional}
            triggerClassName="mt-2 h-11"
            popoverClassName="w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] md:w-[var(--radix-popover-trigger-width)]"
          />
        </div>
        <div>
          <FieldCaption label={copy.weight} optional={copy.optional} />
          <div className="mt-2 flex h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-purple-100">
            <input
              aria-label={copy.weight}
              type="number"
              min={value.weightUnit === "kg" ? 0.001 : 1}
              step={value.weightUnit === "kg" ? "0.001" : "1"}
              value={value.weight}
              onChange={(event) =>
                onChange({ ...value, weight: event.target.value })
              }
              className="pet-weight-control min-w-0 flex-1 appearance-none border-0 bg-transparent px-3 text-sm text-slate-900 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <UnitSelect
              value={value.weightUnit}
              onChange={(weightUnit) => onChange({ ...value, weightUnit })}
            />
          </div>
        </div>
        <div>
          <FieldCaption label={copy.sex} optional={copy.optional} />
          <IconSelect
            value={value.sex}
            placeholder={selectPrompts[lang]}
            options={[
              { value: "MALE", label: copy.male, icon: PiGenderMale },
              {
                value: "FEMALE",
                label: copy.female,
                icon: PiGenderFemale,
              },
              { value: "UNKNOWN", label: copy.unknown, icon: PiQuestion },
            ]}
            onChange={(sex) =>
              onChange({
                ...value,
                sex: sex as PetProfileEditorValue["sex"],
              })
            }
          />
        </div>
        <div>
          <FieldCaption label={neuteredLabel} optional={copy.optional} />
          <IconSelect
            value={value.neutered}
            placeholder={selectPrompts[lang]}
            options={[
              { value: "YES", label: copy.yes, icon: PiCheckCircle },
              { value: "NO", label: copy.no, icon: PiXCircle },
              { value: "UNKNOWN", label: copy.unknown, icon: PiQuestion },
            ]}
            onChange={(neutered) =>
              onChange({
                ...value,
                neutered: neutered as PetProfileEditorValue["neutered"],
              })
            }
          />
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-4">
        <label className="lg:col-span-3">
          <FieldCaption label={copy.notes} optional={copy.optional} />
          <textarea
            rows={4}
            maxLength={3000}
            value={value.notes}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value })
            }
            className={`${textareaClass} h-24 resize-none`}
          />
        </label>
        <div>
          <FieldCaption label={copy.photo} optional={copy.optional} />
          <div className="mt-2">
            {renderPhotoControl ? (
              renderPhotoControl(value)
            ) : (
              <ImageUploader
                value={value.photos}
                onChange={(photos) => onChange({ ...value, photos })}
                onRemove={(id) =>
                  onChange({
                    ...value,
                    photos: value.photos.filter((photo) => photo.id !== id),
                  })
                }
                maxCount={1}
                folder="pets"
                size="md"
                localOnly={localPhotoOnly}
              />
            )}
          </div>
          {errors.photo ? (
            <p
              role="alert"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger-text"
            >
              <PiWarningCircle className="shrink-0" size={13} />
              {errors.photo}
            </p>
          ) : null}
        </div>
      </div>

      {extraContent ? <div>{extraContent}</div> : null}
    </ModalShell>
  );
}
