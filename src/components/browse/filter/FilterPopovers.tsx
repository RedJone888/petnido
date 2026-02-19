"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { DayPicker, DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { Input } from "@/components/ui/Input";
import { CircleDollarSignIcon } from "lucide-react";
import { StarIcon } from "lucide-react";
import { PawPrintIcon } from "lucide-react";
const triggerBtnClass = "whitespace-nowrap h-10 px-4 text-sm rounded-2xl";
const confirmBtnClass = "h-8 px-3 text-xs rounded-2xl";
export function DateFilterPopover() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  const label =
    range?.from && range?.to
      ? `${range.from.toLocaleDateString(
          "ja-JP"
        )} 〜 ${range.to.toLocaleDateString("ja-JP")}`
      : "日付";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outlineLight" className={triggerBtnClass}>
          <CalendarIcon className="w-4 h-4 mr-2 text-primary/50" />
          {label}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto z-45">
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">日付を選択</p>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            locale={undefined} // 默认浏览器日历格式
          />
          <div className="flex justify-between pt-1">
            <Button
              variant="ghost"
              className={confirmBtnClass}
              onClick={() => setRange(undefined)}
            >
              クリア
            </Button>
            <Button className={confirmBtnClass} onClick={() => setOpen(false)}>
              適用
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const OPTIONS = [
  { value: "BEGINNER", label: "初心者" },
  { value: "INTERMEDIATE", label: "中級者" },
  { value: "ADVANCED", label: "上級者" },
];

export function ExperienceFilterPopover() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const label = selected
    ? OPTIONS.find((o) => o.value === selected)?.label ?? "経験レベル"
    : "経験レベル";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outlineLight" className={triggerBtnClass}>
          <StarIcon className="w-4 h-4 mr-2 text-primary/50" />
          {label}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 z-45">
        <p className="font-medium text-sm mb-3">経験レベルを選択</p>
        <div className="space-y-2 mb-3">
          {OPTIONS.map((o) => (
            <Button
              key={o.value}
              variant={selected === o.value ? "primary" : "outlineLight"}
              className="w-full justify-start rounded-2xl h-8 px-3 text-xs"
              onClick={() =>
                setSelected((prev) => (prev === o.value ? null : o.value))
              }
            >
              {o.label}
            </Button>
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            variant="ghost"
            className={confirmBtnClass}
            onClick={() => setSelected(null)}
          >
            クリア
          </Button>
          <Button className={confirmBtnClass} onClick={() => setOpen(false)}>
            適用
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const PET_OPTIONS = [
  { value: "DOG", label: "犬" },
  { value: "CAT", label: "猫" },
  { value: "RABBIT", label: "ウサギ" },
  { value: "BIRD", label: "鳥" },
  { value: "OTHER", label: "その他" },
];

export function PetFilterPopover() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (v: string) => {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]
    );
  };

  const label =
    selected.length === 0
      ? "ペットの種類"
      : `ペットの種類（${selected.length}）`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outlineLight" className={triggerBtnClass}>
          <PawPrintIcon className="w-4 h-4 mr-2 text-primary/50" />
          {label}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 z-45">
        <p className="font-medium text-sm mb-3">ペットの種類を選択</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PET_OPTIONS.map((o) => (
            <Button
              key={o.value}
              variant={selected.includes(o.value) ? "primary" : "outlineLight"}
              className="rounded-xl justify-center h-10 px-4 text-sm"
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            variant="ghost"
            className={confirmBtnClass}
            onClick={() => setSelected([])}
          >
            クリア
          </Button>
          <Button className={confirmBtnClass} onClick={() => setOpen(false)}>
            適用
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PriceFilterPopover() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 10000]);

  const [min, max] = range;
  const label =
    min === 0 && max === 10000
      ? "料金"
      : `¥${min.toLocaleString()} 〜 ¥${max.toLocaleString()}`;

  const updateMin = (v: number) => {
    setRange(([_, m]) => [Math.min(v, m), m]);
  };

  const updateMax = (v: number) => {
    setRange(([n, _]) => [n, Math.max(v, n)]);
  };

  const reset = () => setRange([0, 10000]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outlineLight" className={triggerBtnClass}>
          <CircleDollarSignIcon className="w-4 h-4 mr-2 text-primary/50" />
          {label}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 z-45">
        <p className="font-medium text-sm mb-3">料金の範囲を設定</p>

        <div className="space-y-2 mb-3">
          <Slider
            min={0}
            max={20000}
            step={500}
            value={range}
            onValueChange={(v) => setRange(v as [number, number])}
          />
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>0</span>
            <span className="ml-auto">20,000+</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="space-y-1">
            <label className="text-xs text-neutral-600">最低料金（¥）</label>
            <Input
              type="number"
              value={min}
              onChange={(e) => updateMin(Number(e.target.value || 0))}
              className="h-9 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-600">最高料金（¥）</label>
            <Input
              type="number"
              value={max}
              onChange={(e) => updateMax(Number(e.target.value || 0))}
              className="h-9 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" className={confirmBtnClass} onClick={reset}>
            クリア
          </Button>
          <Button className={confirmBtnClass} onClick={() => setOpen(false)}>
            適用
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
