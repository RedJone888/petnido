import { AddressCurrencySelect } from "@/components/location/AddressField";
import FieldSection from "@/components/ui/FieldSection";
import { CURRENCY_META } from "@/domain/location/constants";
import { DEFAULT_PRICE_RULE, PRICE_UNIT_JA } from "@/domain/service/constant";
import cn from "@/lib/cn";
import { normalizeNumber } from "@/lib/normalizeNumber";
import { ServiceForm } from "@/lib/zod/services";
import { Currency, PriceUnit } from "@prisma/client";
import { Coins, Plus, PlusCircle, X } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

type Props = {
  locController: any;
  currency: Currency;
  priceUnit: PriceUnit;
};
export default function ServicePriceRule({
  locController,
  currency,
  priceUnit,
}: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ServiceForm>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceRules",
  });
  return (
    <FieldSection
      title="料金ルール設定"
      icon={Coins}
      description={
        <p className="text-[10px] font-medium text-gray-400 px-1 line-clamp-1">
          ※
          対象ごとに異なる料金を設定できます、同一価格が適用されるペットのまとまりを入力してください
        </p>
      }
      right={
        <div className="relative w-40">
          <span className="absolute -top-5 left-1 text-muted-foreground text-xs">
            使用通貨
          </span>
          <AddressCurrencySelect
            controller={locController}
            triggerClass="bg-purple-50/40 p-3 font-bold border border-purple-200"
          />
        </div>
      }
    >
      <div className="space-y-3">
        <div className="space-y-3">
          {fields.map((priceRule, index) => {
            const currentError = errors.priceRules?.[index];
            const groupLabelError = currentError?.groupLabel;
            const priceError = currentError?.price;
            return (
              <div
                key={priceRule.id}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all duration-200",
                  "bg-purple-50/40 border-slate-100 hover:border-purple-200 hover:shadow-md",
                  currentError ? "border-red-100 bg-red-50/10" : "",
                )}
              >
                {/* 削除按钮 - 浮动在右上角 */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border  
                      text-red-500 border-red-200 shadow-sm flex items-center justify-center 
                       transition-all z-20 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* 左侧：对象描述 */}
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 ml-1">
                      対象ペット
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register(`priceRules.${index}.groupLabel`)}
                        placeholder="例：猫・小型犬"
                        className={cn(
                          "w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition-all outline-none focus:ring-2",
                          groupLabelError
                            ? "border-red-500 focus:border-0 focus:ring-red-500"
                            : "border-none focus:ring-purple-400",
                        )}
                      />
                      {groupLabelError && (
                        <p className="absolute -top-1 -translate-y-full right-1 text-[10px] text-red-500 font-medium whitespace-nowrap">
                          {groupLabelError.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 右侧：价格输入 */}
                  <div className="sm:w-48 space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 ml-1">
                      価格 ({CURRENCY_META[currency].symbol})
                    </label>
                    <div className="relative flex items-center">
                      <Controller
                        name={`priceRules.${index}.price`}
                        control={control}
                        render={({ field }) => (
                          <div className="relative flex-1">
                            <input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              className={cn(
                                "w-full rounded-xl border bg-white pl-3 pr-12 py-2.5 shadow-sm text-sm font-bold transition-all outline-none focus:ring-2",
                                priceError
                                  ? "border-red-500 focus:border-0 focus:ring-red-500"
                                  : "border-none focus:ring-purple-500",
                              )}
                              placeholder="0"
                              onFocus={(e) =>
                                e.target.value === "0" && field.onChange("")
                              }
                              onBlur={(e) => {
                                if (e.target.value === "") field.onChange("0");
                                field.onBlur();
                              }}
                              onChange={(e) =>
                                field.onChange(normalizeNumber(e.target.value))
                              }
                            />
                            {/* 单位内嵌在输入框右侧 */}
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              / {PRICE_UNIT_JA[priceUnit]}
                            </span>

                            {priceError && (
                              <p className="absolute -top-1 -translate-y-full right-1 text-[10px] text-red-500 font-medium whitespace-nowrap">
                                {priceError.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 追加按钮 */}
        <button
          type="button"
          onClick={() => append(DEFAULT_PRICE_RULE())}
          className="p-3 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-bold 
               hover:border-purple-300 text-purple-500 hover:bg-purple-50/30 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          新しいルールを追加
        </button>
      </div>
    </FieldSection>
  );
}
