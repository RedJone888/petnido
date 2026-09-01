"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  HeartPulse,
  NotebookText,
  Pencil,
  Scale,
  Trash2,
} from "lucide-react";
import { PiPawPrint } from "react-icons/pi";
import { AppImage } from "@/components/ui/app-image";
import { useLanguage } from "@/components/providers/language-provider";
import {
  localizeOtherPetType,
  localizePetBreed,
  resolveOtherPetTypeKey,
} from "@/domain/pet/profile-options";
import { formatPetAge, formatPetWeight } from "@/domain/pet/presentation";
import {
  normalizePetTypeSelection,
  petTypeLabel,
} from "@/modules/need-publishing/domain/pet-types";
import cn from "@/lib/cn";
import type { PetProfileCardValue, PetProfileType } from "./pet-profile-types";
import {
  legacyPetTypeIcons,
  otherTypeIcons,
  OtherIcon,
  petTypeIcons,
} from "./pet-profile-icons";

function normalizeProfileEnum(value: string | null | undefined) {
  return value?.toUpperCase() ?? "";
}

export function PetProfileCard({
  pet,
  invalidMessage,
  sourceLabel,
  editLabel,
  deleteLabel,
  deleteDisabled = false,
  hideTypeFallback = false,
  cardAction,
  onEdit,
  onDelete,
}: {
  pet: PetProfileCardValue;
  invalidMessage?: string;
  sourceLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  deleteDisabled?: boolean;
  hideTypeFallback?: boolean;
  cardAction?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = t.settings.pets;
  const rawCustomType = pet.customType ?? "";
  const canonicalOtherType = resolveOtherPetTypeKey(rawCustomType);
  const normalizedType = normalizeProfileEnum(pet.type);
  const canonicalSelection = normalizePetTypeSelection(
    normalizedType,
    rawCustomType,
  );
  const localizedCustomType = localizeOtherPetType(rawCustomType, lang);
  const localizedBreed = localizePetBreed(
    pet.breed ?? "",
    lang,
    normalizedType,
    rawCustomType,
  );
  const DefaultPetIcon =
    normalizedType === "OTHER" && canonicalOtherType
      ? (otherTypeIcons[canonicalOtherType] ?? OtherIcon)
      : (petTypeIcons[normalizedType as PetProfileType] ??
        legacyPetTypeIcons[normalizedType] ??
        OtherIcon);
  const fallbackType =
    (canonicalSelection.petType === "OTHER"
      ? localizedCustomType
      : petTypeLabel(canonicalSelection.petType, lang)) || pet.type;
  const typeOrBreed = localizedBreed || (hideTypeFallback ? "" : fallbackType);
  const ageText = formatPetAge(pet.birthDate, t);
  const weightText = formatPetWeight(pet.weightGrams, lang);
  const sex = normalizeProfileEnum(pet.sex);
  const neutered = normalizeProfileEnum(pet.neutered);
  const sexText = sex
    ? (copy.sexLabels[sex as keyof typeof copy.sexLabels] ?? pet.sex ?? "")
    : "";
  let neuteringText = neutered
    ? (copy.neuteredLabels[neutered as keyof typeof copy.neuteredLabels] ??
      pet.neutered ??
      "")
    : "";
  if (sex === "MALE" && neutered === "YES")
    neuteringText = copy.neuteredMaleCard;
  else if (sex === "MALE" && neutered === "NO")
    neuteringText = copy.notNeuteredMaleCard;
  else if (sex === "FEMALE" && neutered === "YES")
    neuteringText = copy.neuteredFemaleCard;
  else if (sex === "FEMALE" && neutered === "NO")
    neuteringText = copy.notNeuteredFemaleCard;
  const hasSexDetails = Boolean(sexText || neuteringText);
  const hasDetails = Boolean(
    ageText || weightText || hasSexDetails || invalidMessage,
  );
  const hasManagementActions = Boolean(onEdit || onDelete);

  return (
    <article
      className={cn(
        "relative flex w-full min-w-0 flex-col rounded-2xl border bg-white p-4 transition hover:border-primary/20 hover:shadow-sm",
        invalidMessage ? "border-danger-border" : "border-slate-200",
      )}
    >
      <div className="grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] gap-3.5">
        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-slate-100">
          {pet.photoUrl ? (
            <AppImage
              src={pet.photoUrl}
              alt={pet.name || copy.photoAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            <DefaultPetIcon className="h-full w-full !rounded-none" />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col justify-center gap-0.5">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {pet.name}
              </h3>
              {typeOrBreed ? (
                <span className="truncate text-xs font-medium text-slate-500">
                  {typeOrBreed}
                </span>
              ) : null}
            </div>

            {cardAction ? (
              <div className="shrink-0">{cardAction}</div>
            ) : hasManagementActions ? (
              <div className="flex shrink-0 items-center gap-0.5">
                {onEdit ? (
                  <button
                    type="button"
                    aria-label={editLabel}
                    onClick={onEdit}
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    aria-label={deleteLabel}
                    disabled={deleteDisabled}
                    onClick={onDelete}
                    className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-danger-bg hover:text-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-ring disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {sourceLabel ? (
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold leading-3 text-primary">
              <PiPawPrint className="h-3 w-3 shrink-0" />
              <span className="truncate">{sourceLabel}</span>
            </span>
          ) : null}

          {hasDetails ? (
            <div className="mt-2.5 flex min-w-0 flex-col gap-1.5">
              {ageText || weightText ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-medium text-slate-600">
                  {ageText ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                      {ageText}
                    </span>
                  ) : null}
                  {weightText ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-emerald-600" />
                      {weightText}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {hasSexDetails ? (
                <div className="flex min-w-0 items-start gap-1.5 text-xs font-medium leading-5 text-slate-600">
                  <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                  <span className="flex min-w-0 flex-wrap gap-x-1">
                    {sexText ? <span>{sexText}</span> : null}
                    {sexText && neuteringText ? (
                      <span aria-hidden="true">·</span>
                    ) : null}
                    {neuteringText ? <span>{neuteringText}</span> : null}
                  </span>
                </div>
              ) : null}
              {invalidMessage ? (
                <p className="text-xs font-semibold text-danger-text">
                  {invalidMessage}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {pet.notes ? (
        <div className="mt-3 flex max-w-full gap-2 pt-0.5 text-xs leading-5 text-slate-500">
          <NotebookText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="line-clamp-2 break-words whitespace-pre-line">
            {pet.notes}
          </p>
        </div>
      ) : null}
    </article>
  );
}
export default PetProfileCard;
