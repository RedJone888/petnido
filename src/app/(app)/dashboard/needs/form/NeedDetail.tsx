import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AddressInput, AddressMap } from "@/components/location/AddressField";
import {
  Car,
  ClockArrowUp,
  ImageUp,
  MapPin,
  MessageSquareText,
  Route,
} from "lucide-react";
import cn from "@/lib/cn";
import { FrequencyType, ServiceCategory } from "@prisma/client";
import {
  DISTANCE_RANGE_JA,
  FREQUENCY_TYPE_JA,
  TRANSPORT_METHOD_JA,
  FREQUENCY_TYPES,
  DISTANCE_RANGES,
  TRANSPORT_METHODS,
} from "@/domain/need/constant";
import ImageUploader from "@/components/ui/ImageUploader";
import { normalizeNumber } from "@/lib/normalizeNumber";
import FieldSection from "@/components/ui/FieldSection";
import { NeedForm } from "@/lib/zod/needs";
type Props = {
  activeNeedType: any;
  locController: any;
  category: ServiceCategory;
  frequencyType: FrequencyType | null;
  // photos: any;
};
export default function NeedDetail({
  activeNeedType,
  locController,
  category,
  frequencyType,
}: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<NeedForm>();
  const photos = useWatch({
    control,
    name: "photos",
  });
  return (
    <div className="space-y-4">
      <FieldSection title={activeNeedType.addressTitle} icon={MapPin}>
        <div>
          <AddressInput
            controller={locController}
            placeholder={activeNeedType.addressPlaceholder}
            className="w-full bg-gray-50 text-md rounded-xl p-3 border-none outline-none focus:ring-2 focus:ring-secondary/80 transition-all"
          />

          <p className="mt-1 text-[10px] text-gray-400 px-1">
            ※ {activeNeedType.addressHint}
          </p>
        </div>
        <div>
          <div className="w-full rounded-xl">
            <AddressMap
              controller={locController}
              // showPrivacyRadius={activeNeedType.showAddressCircle}
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400 px-1">
            ※ 詳しい住所はマッチング成立まで相手には公開されません。
          </p>
        </div>
      </FieldSection>
      {category === "VISIT" && (
        <div className="flex gap-3">
          <FieldSection title="訪問頻度" icon={ClockArrowUp}>
            <Controller
              name="frequencyType"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3 shrink-0">
                  {FREQUENCY_TYPES.map((frequency) => {
                    const active = frequency === field.value;
                    return (
                      <button
                        key={frequency}
                        className={cn(
                          "shrink-0 px-4 py-2 rounded-full border text-sm transition-all",
                          active
                            ? "bg-primary/90 border-primary/80 text-white"
                            : "border-gray-200 bg-gray-50/50 hover:bg-primary/5 text-gray-600 hover:border-primary/80",
                        )}
                        onClick={() => {
                          field.onChange(frequency);
                        }}
                      >
                        {FREQUENCY_TYPE_JA[frequency]}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </FieldSection>
          {frequencyType === FrequencyType.CUSTOM && (
            <FieldSection
              title="CUSTOM頻度"
              contentClassName="pl-0"
              titleClassName="block text-gray-600 font-medium"
            >
              <div className="flex gap-1 mt-3">
                <div className="flex items-center gap-1 min-w-0">
                  <Controller
                    name="customDays"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <input
                          {...field}
                          value={field.value ?? ""}
                          type="text"
                          inputMode="numeric"
                          placeholder="例：1"
                          className={cn(
                            "max-w-16 border-b border-gray-400 text-center text-sm outline-none p-2 focus:border-b-2",
                            errors.customDays
                              ? "border-red-500 focus:border-red-500"
                              : "focus:border-primary/80",
                          )}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              field.onChange("");
                            }
                          }}
                          onBlur={(e) => {
                            if (
                              e.target.value === "" ||
                              e.target.value === "0"
                            ) {
                              field.onChange("1");
                            }
                            field.onBlur();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(normalizeNumber(val));
                          }}
                        />
                        {errors.customDays && (
                          <span className="absolute -translate-y-full top-0 right-0 whitespace-nowrap text-red-500 text-[10px] z-10">
                            {errors.customDays.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                  <span className="shrink-0 text-xs text-gray-400">日に</span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <Controller
                    name="customTimes"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <input
                          {...field}
                          value={field.value ?? ""}
                          type="text"
                          inputMode="numeric"
                          placeholder="例：1"
                          className={cn(
                            "max-w-16 border-b border-gray-400 text-center text-sm outline-none p-2 focus:border-b-2",
                            errors.customTimes
                              ? "border-red-500 focus:border-red-500"
                              : "focus:border-primary/80",
                          )}
                          onFocus={(e) => {
                            if (e.target.value === "0") {
                              field.onChange("");
                            }
                          }}
                          onBlur={(e) => {
                            if (
                              e.target.value === "" ||
                              e.target.value === "0"
                            ) {
                              field.onChange("1");
                            }
                            field.onBlur();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(normalizeNumber(val));
                          }}
                        />
                        {errors.customTimes && (
                          <span className="absolute -translate-y-full top-0 right-0 whitespace-nowrap text-red-500 text-[10px] z-10">
                            {errors.customTimes.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                  <span className="shrink-0 text-xs text-gray-400">回</span>
                </div>
              </div>
            </FieldSection>
          )}
        </div>
      )}
      {category === "FOSTER" && (
        <FieldSection title="移動範囲と送迎の相談（預かりの場合）" icon={Route}>
          <Controller
            name="fosterRange"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-4 gap-3">
                {DISTANCE_RANGES.map((item) => {
                  const active = item === field.value;
                  return (
                    <button
                      key={item}
                      onClick={() => field.onChange(item)}
                      className={cn(
                        "p-4  transition-all group text-xs text-left rounded-lg",
                        active
                          ? "bg-white ring-2 ring-primary/80"
                          : "border border-gray-200 bg-gray-50/50 hover:bg-primary/5 hover:border-primary",
                      )}
                    >
                      <div
                        className={cn(
                          "font-bold",
                          active
                            ? "text-primary"
                            : "text-gray-800 group-hover:text-primary",
                        )}
                      >
                        {DISTANCE_RANGE_JA[item].label}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {DISTANCE_RANGE_JA[item].desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </FieldSection>
      )}
      {category === "FOSTER" && (
        <FieldSection
          title="送迎のご希望"
          icon={Car}
          className="ml-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100"
          iconClassName="text-orange-500"
        >
          <div>
            <Controller
              name="transportMethod"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {TRANSPORT_METHODS.map((item) => {
                    const active = item === field.value;
                    return (
                      <button
                        key={item}
                        onClick={() => field.onChange(item)}
                        className={cn(
                          "py-2 px-3 text-xs rounded-xl border transition-all",
                          active
                            ? "bg-white border-orange-500 text-orange-600 shadow-sm"
                            : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-300",
                        )}
                      >
                        {TRANSPORT_METHOD_JA[item].label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            <p className="mt-2 text-[10px] text-orange-400">
              ※シッターによる送迎を希望する場合、別途交通費が発生する場合があります。
            </p>
          </div>
        </FieldSection>
      )}
      <FieldSection title="依頼詳細・ご要望" icon={MessageSquareText}>
        <div>
          <div className="relative">
            <textarea
              {...register("requirement")}
              placeholder="ペットのお世話に関する具体的な要望や、守ってほしいルールを記入してください。"
              className={cn(
                "w-full p-4 bg-gray-50 rounded-xl h-32 outline-none focus:ring-2",
                errors.requirement
                  ? "border border-red-500 focus:ring-red-500 focus:border-0"
                  : "border-none focus:ring-secondary/80",
              )}
            />
            {errors.requirement && (
              <span className="absolute -translate-y-full top-0 right-3 text-xs text-red-500 whitespace-nowrap z-10">
                {errors.requirement.message}
              </span>
            )}
          </div>
          {category === "VISIT" && (
            <p className="text-[10px] text-gray-400 px-1 mt-1">
              ※
              鍵の受け渡し方法（スマートロック、手渡し、キーボックスなど）は、マッチング後のチャットで詳細を相談することをお勧めします。
            </p>
          )}
        </div>
      </FieldSection>

      <FieldSection
        title="参考写真"
        icon={ImageUp}
        right={
          <span className="text-xs text-gray-400">
            {photos.length} / {12}
          </span>
        }
      >
        <div>
          <Controller
            name="photos"
            control={control}
            render={({ field }) => (
              <ImageUploader
                value={field.value}
                onChange={(files) => {
                  field.onChange(files);
                }}
                folder="need"
                onRemove={(id: string) => {
                  field.onChange(field.value.filter((p) => p.id !== id));
                }}
              />
            )}
          />
          <p className="mt-2 text-[10px] text-gray-400 px-1">
            ※ {activeNeedType.photoHint}
          </p>
        </div>
      </FieldSection>
    </div>
  );
}
