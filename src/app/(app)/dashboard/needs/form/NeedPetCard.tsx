import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Cat, Hash, MessageSquareWarning, Trash2 } from "lucide-react";
import cn from "@/lib/cn";
import { PetType } from "@prisma/client";
import { TAG_GROUPS } from "@/domain/need/constant";
import {
  COMMON_PET_TYPES,
  NOT_COMMON_PET_TYPES,
  PET_META,
} from "@/domain/pet/constant";
import ImageUploader from "@/components/ui/ImageUploader";
import { TagButton } from "@/components/ui/TagButton";
import { infer4PetTypeFromText } from "@/domain/pet/inferPetTypes";
import { useState } from "react";
import { normalizeNumber } from "@/lib/normalizeNumber";
import FieldSection from "@/components/ui/FieldSection";
import { NeedForm } from "@/lib/zod/needs";
type Props = {
  index: number;
  pet: any;
  remove: (index: number) => void;
  canRemove: boolean;
};
export default function NeedPetCard({ index, pet, remove, canRemove }: Props) {
  const {
    register,
    control,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<NeedForm>();
  const currentPet = useWatch({
    control,
    name: `needPets.${index}`,
    defaultValue: pet,
  });
  const petTypeError = errors.needPets?.[index]?.petType;
  const countError = errors.needPets?.[index]?.count;
  const [isComposing, setIsComposing] = useState(false);
  const toggleTag = (currentTags: string[], tagId: string) => {
    let nextTags: string[];
    const isExist = currentTags.includes(tagId);
    nextTags = isExist
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    if (tagId === "NO_CONTACT" && !isExist) {
      nextTags = nextTags.filter((t) => t !== "NO_CAT" && t !== "NO_DOG");
    }
    if ((tagId === "NO_CAT" || tagId === "NO_DOG") && !isExist) {
      nextTags = nextTags.filter((t) => t !== "NO_CONTACT");
    }
    return nextTags;
  };
  const handlePetTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isForce: boolean = false,
  ) => {
    if (!isForce && isComposing) return;
    const val = e.target.value;
    const currentCategory = getValues(`needPets.${index}.petCategory`);

    if (currentCategory === null && val.trim() !== "") {
      const uiCategory = infer4PetTypeFromText(val);
      setValue(`needPets.${index}.petCategory`, uiCategory);
    }
  };
  return (
    <div className="p-6 bg-primary/2 rounded-2xl border border-gray-100 group/card relative">
      {canRemove && (
        <button
          onClick={() => remove(index)}
          className="absolute -top-2 -right-2 bg-white text-red-500 border border-red-100 rounded-full p-1.5 shadow-md opacity-0 group-hover/card:opacity-100 transition"
        >
          <Trash2 size={14} />
        </button>
      )}
      <div className="space-y-4">
        <div>
          <div className="flex gap-1">
            <FieldSection title="ペットの種類" className="shrink-0" icon={Cat}>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  {/* 高频快捷键 */}
                  {COMMON_PET_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setValue(`needPets.${index}.petCategory`, type);
                        trigger(`needPets.${index}.petType`);
                      }}
                      className={cn(
                        "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition shadow-lg",
                        currentPet.petCategory === type
                          ? "bg-primary border-transparent text-white"
                          : "bg-white border-primary/80 text-gray-600 hover:bg-secondary/10",
                      )}
                    >
                      {PET_META[type].label.ja.name}
                    </button>
                  ))}

                  {/* 其他/自定义 */}
                  <button
                    type="button"
                    onClick={() => {
                      setValue(`needPets.${index}.petCategory`, "OTHER");
                      trigger(`needPets.${index}.petType`);
                    }}
                    className={cn(
                      "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition",
                      currentPet.petCategory &&
                        !COMMON_PET_TYPES.includes(
                          currentPet.petCategory as PetType,
                        )
                        ? "bg-primary border-transparent text-white shadow-sm"
                        : "bg-white border-primary/80 text-gray-600 hover:bg-secondary/10",
                    )}
                  >
                    その他
                  </button>
                </div>
                {/* 动态显示的详细输入框 */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={
                      PET_META[currentPet.petCategory as PetType]?.label.ja
                        .placeholder ?? "種類を選択・入力"
                    }
                    className={cn(
                      "w-full p-2 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:ring-2",
                      petTypeError
                        ? "border-red-500 focus:ring-red-500 focus:border-0"
                        : "border-none focus:ring-secondary/80",
                    )}
                    {...register(`needPets.${index}.petType`)}
                    onChange={(e) => {
                      register(`needPets.${index}.petType`).onChange(e);
                      trigger(`needPets.${index}.petType`);
                      handlePetTypeChange(e);
                    }}
                    onCompositionStart={() => {
                      setIsComposing(true);
                    }}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      handlePetTypeChange(e as any, true);
                    }}
                    list={`pet-suggestions-${index}`}
                  />
                  {petTypeError && (
                    <span className="absolute -translate-y-full top-0 right-0 whitespace-nowrap text-red-500 text-[10px] z-10">
                      {petTypeError.message}
                    </span>
                  )}
                  {/* 如果是 OTHER，可以提供枚举中剩下的选项作为 datalist 提示 */}
                  <datalist id={`pet-suggestions-${index}`}>
                    {NOT_COMMON_PET_TYPES.map((item) => (
                      <option key={item} value={PET_META[item].label.ja.name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </FieldSection>
            <FieldSection title="頭数" className="w-36" icon={Hash}>
              <div className="w-full flex gap-2 items-center">
                <Controller
                  name={`needPets.${index}.count`}
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        className={cn(
                          "w-full p-2 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:ring-2",
                          countError
                            ? "border-red-500 focus:ring-red-500 focus:border-0"
                            : "border-none focus:ring-secondary/80",
                        )}
                        onFocus={(e) => {
                          if (e.target.value === "0") {
                            field.onChange("");
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "" || e.target.value === "0") {
                            field.onChange("1");
                          }
                          field.onBlur();
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(normalizeNumber(val));
                        }}
                      />
                      {countError && (
                        <span className="absolute -translate-y-full top-0 right-0 whitespace-nowrap text-red-500 text-[10px] z-10">
                          {countError.message}
                        </span>
                      )}
                    </div>
                  )}
                />
                <span className="text-gray-400">羽</span>
              </div>
            </FieldSection>
          </div>
          <FieldSection className="flex mt-2">
            <Controller
              name={`needPets.${index}.tags`}
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  {TAG_GROUPS.map((group) => {
                    // 如果当前模式不需要显示这组标签（如 VISIT 模式下的健康标签），则跳过
                    // if (!group.showIf(needData.category)) return null;
                    return (
                      <div key={group.id}>
                        <div className="flex flex-wrap gap-1.5 items-center content-start">
                          <span className="text-[10px] font-bold text-gray-600 shrink-0 w-14 text-right mr-1">
                            {group.label}
                          </span>
                          {group.tags.map((tag) => {
                            const isActive = field.value.includes(tag.id);
                            return (
                              <TagButton
                                key={tag.id}
                                active={isActive}
                                tag={tag}
                                onClick={() =>
                                  field.onChange(toggleTag(field.value, tag.id))
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </FieldSection>
        </div>
        <FieldSection
          title="特記事項・参考写真"
          icon={MessageSquareWarning}
          description={
            <span className="text-[10px] font-medium text-gray-400 px-1 line-clamp-1">
              ※ フードの量や手順がわかる写真をアップロードしてください
            </span>
          }
          right={
            <div className="flex flex-col items-end">
              {currentPet.tags.includes("AGGRESSIVE") && (
                <span className="text-[10px] text-rose-500 font-medium">
                  ⚠️ 安全のため、攻撃性についての詳細を記入してください
                </span>
              )}
              <span className="text-xs text-gray-400">
                {currentPet.photos.length} / {12}
              </span>
            </div>
          }
          className="w-full"
        >
          <div className="grid grid-cols-12 gap-4 items-stretch">
            <textarea
              placeholder="この子（たち）に関する特に注意すべき点があれば記入してください"
              className="col-span-6 p-2 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-secondary/80 min-h-[100px]"
              {...register(`needPets.${index}.description`)}
            />
            <div className="col-span-6 gap-4 overflow-auto border border-gray-200 shadow-sm rounded-xl p-2">
              <Controller
                name={`needPets.${index}.photos`}
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    value={field.value}
                    onChange={(files) => {
                      console.log(files);
                      field.onChange(files);
                    }}
                    folder="needpet"
                    size="sm"
                    addClassName="hover:bg-white"
                    onRemove={(id: string) => {
                      field.onChange(field.value.filter((p) => p.id !== id));
                    }}
                  />
                )}
              />
            </div>
          </div>
        </FieldSection>
      </div>
    </div>
  );
}
