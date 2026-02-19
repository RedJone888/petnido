import FieldSection from "@/components/ui/FieldSection";
import { SERVICE_TYPE_JA } from "@/domain/service/constant";
import cn from "@/lib/cn";
import { ServiceForm } from "@/lib/zod/services";
import { ServiceCategory } from "@prisma/client";
import { AlertCircle, Check, FileText, Info, Layers } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
type Props = {
  serviceType: ServiceCategory;
};
export default function ServiceBase({ serviceType }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ServiceForm>();
  return (
    <div className="space-y-4">
      <FieldSection title="サービス種別" icon={Layers}>
        <div className="space-y-4">
          <Controller
            name="serviceType"
            control={control}
            render={({ field }) => (
              <div
                ref={field.ref}
                tabIndex={-1}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {(Object.keys(SERVICE_TYPE_JA) as ServiceCategory[]).map(
                  (type) => {
                    const active = type === field.value;
                    const config = SERVICE_TYPE_JA[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => field.onChange(type)}
                        className={cn(
                          "relative rounded-2xl p-4 text-left flex flex-col h-full transition-all duration-300 group",
                          active
                            ? "bg-white ring-2 ring-primary shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)]"
                            : "border-gray-200 bg-gray-50/50 hover:bg-white hover:border-purple-300 border",
                        )}
                      >
                        {active && (
                          <div className="absolute top-2 right-2">
                            <div className="p-0.5 bg-primary rounded-full shadow-sm">
                              <Check
                                className="w-3 h-3 text-white"
                                strokeWidth={4}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={cn(
                              "p-2 rounded-xl w-fit transition-colors",
                              active
                                ? "bg-purple-100 text-primary"
                                : "bg-white text-gray-400 group-hover:text-primary",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span
                            className={cn(
                              "font-bold text-sm",
                              active ? "text-purple-700" : "text-gray-700",
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        {/* Description */}
                        <p
                          className={cn(
                            "text-[10px] leading-relaxed",
                            active ? "text-purple-900/60" : "text-gray-400",
                          )}
                        >
                          {config.description}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          />
          <div
            className={cn(
              "overflow-hidden duration-300 transition-all",
              serviceType === ServiceCategory.OTHER
                ? "opacity-100 mt-4"
                : "max-h-0 opacity-0",
            )}
          >
            <div className="relative p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <label className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1 block">
                カスタムサービス名（必須）
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register("customType")}
                  placeholder={SERVICE_TYPE_JA.OTHER.placeholder}
                  className={cn(
                    "w-full rounded-xl px-4 py-2.5 text-sm shadow-sm bg-white outline-none ring-1 focus:ring-2 transition-all",
                    errors.customType
                      ? "ring-red-500"
                      : "ring-transparent focus:ring-purple-500",
                  )}
                />
                {errors.customType && (
                  <p className="absolute -top-1 -translate-y-full right-1 text-[10px] text-red-500 font-medium flex items-center gap-1 pl-1 whitespace-nowrap">
                    <AlertCircle className="h-3 w-3" />
                    {errors.customType.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </FieldSection>
      <FieldSection
        title="サービスの説明"
        icon={FileText}
        description={
          <p className="text-[10px] font-medium text-gray-400 px-1 line-clamp-1">
            {SERVICE_TYPE_JA[serviceType].contentHelperText}
          </p>
        }
      >
        <textarea
          rows={4}
          className="w-full rounded-xl bg-gray-50 p-4 outline-none focus:ring-2 h-32 focus:ring-purple-500"
          placeholder={SERVICE_TYPE_JA[serviceType].contentPlaceHolder}
          {...register("description")}
        />
      </FieldSection>
    </div>
  );
}
