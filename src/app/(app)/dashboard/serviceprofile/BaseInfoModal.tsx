"use client";

import { useEffect, useState } from "react";
import { MapPin, Coins, Briefcase, UserRoundPen } from "lucide-react";
import { toast } from "sonner";

import type { BaseInfo } from "@/lib/zod/serviceProfile";

import Modal from "@/components/ui/Modal";
import FieldSection from "@/components/ui/FieldSection";

import { useLocationController } from "@/hooks/useLocationController";
import {
  AddressInput,
  AddressMap,
  AddressCurrencySelect,
} from "@/components/location/AddressField";
import { normalizeNumber } from "@/lib/normalizeNumber";
import { useServiceProfile } from "@/hooks/useServiceProfile";

type Props = {
  isSitter: boolean;
  initialValue: BaseInfo;
  onClose: () => void;
};

export default function BaseInfoModal({
  isSitter,
  initialValue,
  onClose,
}: Props) {
  const [introduction, setIntroduction] = useState(
    initialValue.introduction ?? "",
  );

  const locController = useLocationController({
    location: {
      label: initialValue.baseAreaRaw ?? "",
      lat: initialValue.baseLat ?? 0,
      lon: initialValue.baseLon ?? 0,
    },
    currency: initialValue.baseCurrency ?? "JPY",
  });
  const initialMonths = initialValue.monthsExperience;
  const [years, setYears] = useState<string>(
    initialMonths != null ? String(Math.floor(initialMonths / 12)) : "",
  );
  const [months, setMonths] = useState<string>(
    initialMonths != null ? String(initialMonths % 12) : "",
  );

  function handleExperienceChange(setter: (v: string) => void, max?: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = normalizeNumber(e.target.value);
      // 只保留数字
      if (!/^\d*$/.test(v)) return;
      if (max !== undefined && v !== "" && Number(v) > max) {
        v = String(max);
      }
      setter(v);
    };
  }
  useEffect(() => {
    const m = Number(months);
    if (!isNaN(m) && m >= 12) {
      setYears(String((Number(years) || 0) + Math.floor(m / 12)));
      setMonths(String(m % 12));
    }
  }, [months]);
  function isProfileChanged(original: BaseInfo, current: BaseInfo) {
    return (
      original.baseAreaRaw !== current.baseAreaRaw ||
      original.baseLat !== current.baseLat ||
      original.baseLon !== current.baseLon ||
      original.baseCurrency !== current.baseCurrency ||
      original.monthsExperience !== current.monthsExperience ||
      original.introduction !== current.introduction
    );
  }
  const { updateInfo } = useServiceProfile();
  const handleSubmit = async () => {
    const yearNumber = years === "" ? 0 : Number(years);
    const monthsNumber = months === "" ? 0 : Number(months);
    const totalMonths = yearNumber * 12 + monthsNumber;
    const payload = {
      baseAreaRaw: locController.location.label,
      baseLat: locController.location.lat,
      baseLon: locController.location.lon,
      baseCurrency: locController.currency,
      monthsExperience: totalMonths,
      introduction,
    };
    if (!isProfileChanged(initialValue, payload)) {
      toast.info("変更された内容がありません");
      return;
    }
    await updateInfo.mutateAsync(payload);
    onClose();
  };
  return (
    <Modal
      isSitter={isSitter}
      title={"プロフィールを編集"}
      onClose={onClose}
      onConfirm={handleSubmit}
      isProcessing={updateInfo.isLoading}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[2fr_1fr]">
          <FieldSection icon={MapPin} title="対応エリア">
            <AddressInput controller={locController} />
          </FieldSection>
          <FieldSection icon={Coins} title="使用通貨">
            <AddressCurrencySelect controller={locController} />
          </FieldSection>
        </div>
        <FieldSection>
          <div className="w-full rounded-xl">
            <AddressMap controller={locController} height="h-40" />
          </div>
        </FieldSection>
        <FieldSection icon={Briefcase} title="お世話経験">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20 rounded-xl border border-border bg-white px-3 py-2 text-xs focus:outline-none font-medium focus:border-primary"
              value={years}
              onChange={handleExperienceChange(setYears, 50)}
              onBlur={() => {
                if (years === "") setYears("0");
              }}
            />
            <span>年</span>
            <input
              type="text"
              inputMode="numeric"
              className="w-20 rounded-xl border border-border bg-white px-3 py-2 text-xs focus:outline-none font-medium focus:border-primary"
              value={months}
              onChange={handleExperienceChange(setMonths)}
              onBlur={() => {
                if (months === "") setMonths("0");
              }}
            />
            <span>ヶ月</span>
          </div>
        </FieldSection>
        <FieldSection icon={UserRoundPen} title="自己紹介">
          <textarea
            className="border border-border rounded-xl bg-white px-3 py-2 w-full text-xs focus:outline-none font-medium focus:border-primary"
            rows={8}
            placeholder="ペットシッターとしての経験や、ペットに対する想いなどを書いてください。"
            value={introduction ?? ""}
            onChange={(e) => setIntroduction(e.target.value)}
          />
        </FieldSection>
      </div>
    </Modal>
  );
}
