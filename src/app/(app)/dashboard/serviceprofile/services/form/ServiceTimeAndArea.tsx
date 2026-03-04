import { AddressInput, AddressMap } from "@/components/location/AddressField";
import FieldSection from "@/components/ui/FieldSection";
import {
  AVAILABILITY_RANGE_TYPE_JA,
  AVAILABILITY_WEEK_PATTERN_JA,
} from "@/domain/service/constant";
import cn from "@/lib/cn";
import { ServiceForm } from "@/lib/zod/services";
import { AvailabilityRangeType, AvailabilityWeekPattern } from "@prisma/client";
import { format } from "date-fns";
import { CalendarClock, MapPin } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

type Props = {
  locController: any;
};
export default function ServiceTimeAndArea({ locController }: Props) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ServiceForm>();
  // 监听模式切换
  const availabilityRangeType = useWatch({
    control,
    name: "availabilityRangeType",
  });
  const availableFrom = useWatch({ control, name: "availableFrom" });
  const includeHolidays = useWatch({ control, name: "includeHolidays" });

  useEffect(() => {
    if (!availabilityRangeType) return;

    if (availabilityRangeType === AvailabilityRangeType.LONG_TERM) {
      // 切换到长期时，清理特定日期
      setValue("availableFrom", null);
      setValue("availableTo", null);
    } else if (availabilityRangeType === AvailabilityRangeType.DATE_RANGE) {
      // 切换到特定期间时，如果没有开始日期，默认设为今天
      if (!availableFrom) {
        setValue("availableFrom", format(new Date(), "yyyy-MM-dd"));
      }
    }
  }, [availabilityRangeType, availableFrom, setValue]);
  return (
    <div className="space-y-3">
      <FieldSection title="対応スケジュール" icon={CalendarClock}>
        <div className="space-y-3">
          {/* 1. 対応期间设置 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                1
              </span>
              <label className="text-sm font-bold text-slate-700">
                対応期間を選択
              </label>
            </div>
            <div className="space-y-3 pl-7">
              <Controller
                name="availabilityRangeType"
                control={control}
                render={({ field }) => (
                  <div
                    ref={field.ref}
                    className="flex p-1 bg-slate-100 w-fit rounded-xl"
                  >
                    {(
                      Object.keys(
                        AVAILABILITY_RANGE_TYPE_JA,
                      ) as AvailabilityRangeType[]
                    ).map((k) => {
                      const active = k === field.value;
                      return (
                        <button
                          type="button"
                          key={k}
                          className={cn(
                            "rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
                            active
                              ? "bg-white text-primary shadow-sm"
                              : "text-slate-500 hover:text-slate-700",
                          )}
                          onClick={() => field.onChange(k)}
                        >
                          <span>{AVAILABILITY_RANGE_TYPE_JA[k].label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {availabilityRangeType === "DATE_RANGE" && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex-1 space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-400 ml-1">
                      開始日
                    </span>
                    <div className="relative">
                      <input
                        type="date"
                        {...register("availableFrom")}
                        className={cn(
                          "w-full rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 focus:ring-2",
                          errors.availableFrom
                            ? "ring-red-500"
                            : "ring-transparent focus:ring-purple-500",
                        )}
                      />
                      {errors.availableFrom && (
                        <span className="absolute -top-1 -translate-y-full right-1 whitespace-nowrap text-[10px] text-red-500">
                          {errors.availableFrom.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-300 mt-5">〜</span>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 ml-1">
                      終了日
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        {...register("availableTo")}
                        className={cn(
                          "w-full rounded-xl bg-white px-3 py-2 text-sm outline-none ring-1 focus:ring-2",
                          "focus:outline-none",
                          errors.availableTo
                            ? "ring-red-500"
                            : "ring-transparent focus:ring-purple-500",
                        )}
                      />
                      {errors.availableTo && (
                        <span className="absolute -top-1 -translate-y-full right-1 whitespace-nowrap text-[10px] text-red-500">
                          {errors.availableTo.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. 对应星期设置 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                2
              </span>
              <label className="text-sm font-bold text-slate-700">
                対応可能な曜日
              </label>
            </div>
            <div className="pl-7 flex flex-wrap items-center gap-4">
              <Controller
                name="availabilityWeekPattern"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {(
                      Object.keys(
                        AVAILABILITY_WEEK_PATTERN_JA,
                      ) as AvailabilityWeekPattern[]
                    ).map((k) => {
                      const active = k === field.value;
                      return (
                        <button
                          key={k}
                          className={cn(
                            "rounded-xl px-4 py-2 text-xs font-bold border transition-all",
                            active
                              ? "border-purple-600 bg-purple-600 text-white shadow-md shadow-primary/20"
                              : "border-slate-200 bg-slate-50/50 hover:bg-purple-50 text-slate-600 hover:border-purple-500",
                          )}
                          onClick={() => field.onChange(k)}
                        >
                          <span>{AVAILABILITY_WEEK_PATTERN_JA[k].label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              <label className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-transparent cursor-pointer hover:border-slate-200 transition-all">
                <input
                  type="checkbox"
                  {...register("includeHolidays")}
                  className="accent-primary w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
                <span
                  className={cn(
                    "text-xs font-bold transition-colors",
                    includeHolidays ? "text-primary" : "text-slate-500",
                  )}
                >
                  祝日も対応可
                </span>
              </label>
            </div>
          </div>
        </div>
      </FieldSection>
      <FieldSection icon={MapPin} title="対応エリア">
        <AddressInput
          controller={locController}
          className="w-full bg-gray-50 text-md rounded-xl p-3 border-none outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        <div className="w-full rounded-xl">
          <AddressMap controller={locController} />
        </div>
      </FieldSection>
    </div>
  );
}
