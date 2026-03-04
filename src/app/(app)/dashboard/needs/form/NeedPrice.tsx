import { AddressCurrencySelect } from "@/components/location/AddressField";
import FieldSection from "@/components/ui/FieldSection";
import { CURRENCY_META } from "@/domain/location/constants";
import { FREQUENCY_TYPE_JA } from "@/domain/need/constant";
import { normalizeNumber } from "@/lib/normalizeNumber";
import { NeedForm } from "@/lib/zod/needs";
import { Currency, FrequencyType, ServiceCategory } from "@prisma/client";
import { CircleDollarSign, HandCoins } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
type Props = {
  activeNeedType: any;
  locController: any;
  category: ServiceCategory;
  currency: Currency;
  totalPrice: string;
  days: number;
  frequencyType: FrequencyType | null;
  customDays: string | null;
  customTimes: string | null;
  actualTimes?: number;
};
export default function NeedPrice({
  activeNeedType,
  locController,
  category,
  currency,
  totalPrice,
  days,
  frequencyType,
  customDays,
  customTimes,
  actualTimes,
}: Props) {
  const { control } = useFormContext<NeedForm>();
  return (
    <div className="flex gap-8 items-start">
      <div className="w-64 shrink-0 space-y-6">
        <FieldSection title="使用通貨" icon={CircleDollarSign}>
          <AddressCurrencySelect
            size={20}
            controller={locController}
            triggerClass="bg-gray-50 p-3 font-bold border-none outline-none focus:ring-2 focus:ring-secondary/80"
            dorpdownClass="font-medium"
            commonClass="text-sm"
            flagClass="gap-4"
          />
        </FieldSection>
        <FieldSection
          title={`${activeNeedType.priceInputTitle}（${CURRENCY_META[currency].label.ja.short}）`}
          icon={HandCoins}
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
              {CURRENCY_META[currency].symbol}
            </span>
            <Controller
              name="priceAmount"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  inputMode="numeric"
                  className="w-full pl-12 p-3 bg-gray-50 rounded-xl border-none text-xl font-bold outline-none focus:ring-2 focus:ring-secondary/80"
                  placeholder="例：1000"
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      field.onChange("");
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      field.onChange("0");
                    }
                    field.onBlur();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(normalizeNumber(val));
                  }}
                />
              )}
            />
          </div>
        </FieldSection>
      </div>

      <div className="flex-1 bg-primary/10 rounded-2xl p-6 text-gray-900 shadow-lg">
        <div className="text-xs opacity-70">お見積り</div>
        <div className="text-4xl font-bold mb-4 italic text-primary">
          {CURRENCY_META[currency].symbol} {totalPrice}{" "}
          <span className="text-sm font-normal not-italic opacity-80">
            合計金額
          </span>
        </div>

        <div className="text-[10px] my-2 opacity-70">
          <div className="text-primary">
            {category === "VISIT"
              ? "計算式：単価 × 合計回数"
              : "計算式：単価 × 日数"}
          </div>
          {category === "VISIT" && (
            <div className="mt-1 text-[9px] italic">
              ※
              合計回数は、各周期の開始日にサービスを実施する想定で、最大発生しうる回数を算出しています。
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-primary/50 pt-4 text-[10px] opacity-80">
          <div className="flex justify-between">
            <span>タイプ</span>
            <span className="text-xs font-semibold text-primary">
              {activeNeedType.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span>期間</span>
            <span className="text-primary">
              {days > 0 ? `計 ${days} 日間` : "日程を選択してください"}
            </span>
          </div>
          {category === "VISIT" && (
            <div className="flex justify-between">
              <span>頻度</span>
              <span className="text-primary">
                {frequencyType === "CUSTOM"
                  ? `カスタム（${customDays && customTimes ? `${customDays} 日に ${customTimes} 回` : "未設定"}）`
                  : frequencyType
                    ? FREQUENCY_TYPE_JA[frequencyType]
                    : "未選択"}
              </span>
            </div>
          )}
          {category === "VISIT" && (
            <div className="flex justify-between">
              <span>合計回数</span>
              <span className="text-primary">
                {actualTimes
                  ? `${actualTimes}回`
                  : "期間・頻度を設定してください"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
