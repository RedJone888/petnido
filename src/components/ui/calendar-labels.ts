import type { Labels } from "react-day-picker";
import type { Lang } from "@/domain/lang/types";

export function calendarLabels(lang: Lang): Partial<Labels> {
  const locale = { en: "en-US", ja: "ja-JP", zh: "zh-CN" }[lang];
  const text = {
    en: ["Today", "Selected", "Previous month", "Next month", "Month", "Year"],
    ja: ["今日", "選択済み", "前の月", "次の月", "月", "年"],
    zh: ["今天", "已选择", "上个月", "下个月", "月份", "年份"],
  }[lang];
  const day: Labels["labelDayButton"] = (date, modifiers) =>
    [
      modifiers.today ? text[0] : "",
      modifiers.selected ? text[1] : "",
      new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date),
    ]
      .filter(Boolean)
      .join(" · ");
  return {
    labelDayButton: day,
    labelGridcell: (date, modifiers, options, dateLib) =>
      day(date, modifiers ?? {}, options, dateLib),
    labelPrevious: () => text[2],
    labelNext: () => text[3],
    labelMonthDropdown: () => text[4],
    labelYearDropdown: () => text[5],
  };
}
