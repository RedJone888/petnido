import { Controller, useFormContext } from "react-hook-form";
import { NEED_TYPE_JA, NEED_TYPES } from "@/domain/need/constant";
import cn from "@/lib/cn";
import { CalendarCheck, Layers, Calendar1, Type } from "lucide-react";
import FieldSection from "@/components/ui/FieldSection";
import { NeedForm } from "@/lib/zod/needs";
export default function NeedBase() {
  const {
    register,
    control,
    trigger,
    formState: { errors },
  } = useFormContext<NeedForm>();
  return (
    <div className="space-y-4">
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <FieldSection title="依頼タイプ" icon={Layers}>
            <div className="grid grid-cols-3 gap-4">
              {NEED_TYPES.map((cat) => {
                const isActive = cat === field.value;
                return (
                  <button
                    key={cat}
                    onClick={() => field.onChange(cat)}
                    className={cn(
                      "relative p-5 rounded-2xl text-left transition-all duration-300 group flex flex-col",
                      isActive
                        ? "border-transparent bg-white shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)] ring-2 ring-primary/80"
                        : "border-gray-200 bg-gray-50/50 hover:bg-white hover:border-secondary/70 hover:shadow-md border",
                    )}
                  >
                    {/* 选中时的角标或小对勾 */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-primary rounded-full p-0.5">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "font-black text-base",
                        isActive
                          ? "text-primary"
                          : "text-gray-700 group-hover:text-primary",
                      )}
                    >
                      {NEED_TYPE_JA[cat].label}
                    </div>

                    <div className="space-y-1">
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tighter uppercase",
                          isActive
                            ? "bg-secondary/10 text-primary"
                            : "bg-gray-200 text-gray-500",
                        )}
                      >
                        {NEED_TYPE_JA[cat].pricingStrategy}
                      </span>
                      <div
                        className={cn(
                          "text-[11px] leading-relaxed",
                          isActive ? "text-primary/80" : "text-gray-400",
                        )}
                      >
                        {NEED_TYPE_JA[cat].description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </FieldSection>
        )}
      />

      <FieldSection title="依頼タイトル" icon={Type}>
        <div className="relative">
          <input
            type="text"
            placeholder="例：阿倍野区・花枝鼠2匹の餌やり"
            {...register("title")}
            className={cn(
              "w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2",
              errors.title
                ? "border border-red-500 focus:ring-red-500 focus:border-0"
                : "border-none focus:ring-secondary/80",
            )}
          />
          {errors.title && (
            <span className="absolute right-3 top-0 -translate-y-full text-xs text-red-500 whitespace-nowrap z-10">
              {errors.title.message}
            </span>
          )}
        </div>
      </FieldSection>

      <div className="grid grid-cols-2 gap-4">
        <FieldSection title="開始日" icon={Calendar1}>
          <div className="relative">
            <input
              type="date"
              className={cn(
                "w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2",
                errors.startDate
                  ? "border border-red-500 focus:ring-red-500 focus:border-0"
                  : "border-none focus:ring-secondary/80",
              )}
              {...register("startDate", {
                onChange: () => trigger("endDate"),
              })}
            />
            {errors.startDate && (
              <span className="absolute right-3 top-0 -translate-y-full text-xs text-red-500 whitespace-nowrap z-10">
                {errors.startDate.message}
              </span>
            )}
          </div>
        </FieldSection>
        <FieldSection title="終了日" icon={CalendarCheck}>
          <div className="relative">
            <input
              type="date"
              className={cn(
                "w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2",
                errors.endDate
                  ? "border border-red-500 focus:ring-red-500 focus:border-0"
                  : "border-none focus:ring-secondary/80",
              )}
              {...register("endDate", {
                onChange: () => trigger("endDate"),
              })}
            />
            {errors.endDate && (
              <span className="absolute right-3 top-0 -translate-y-full text-xs text-red-500 whitespace-nowrap z-10">
                {errors.endDate.message}
              </span>
            )}
          </div>
        </FieldSection>
      </div>
    </div>
  );
}
