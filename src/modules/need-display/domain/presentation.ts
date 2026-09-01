import { messages } from "@/i18n/messages";
import type { Lang } from "@/domain/lang/types";
import type { PublicNeedItemDto } from "@/domain/marketplace/need-public-dto";
import { localizeTaskLabel } from "@/modules/need-publishing/domain/task-catalog";

type Serialized<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

export type NeedDisplayItem = Serialized<PublicNeedItemDto>;
export type NeedDisplayTask = NeedDisplayItem["tasks"][number];
export type NeedDisplayPet = NeedDisplayItem["pets"][number];

import {
  buildPublicNeedTitle,
  localizedModeLabel,
  localizedPetType,
} from "@/domain/marketplace/need-title";

export {
  buildPublicNeedTitle,
  localizedModeLabel,
  localizedPetType,
};

function representativeTasks(item: NeedDisplayItem, lang: Lang) {
  return Array.from(new Set(item.tasks.map((task) => localizeTaskLabel(task.label, lang, { category: task.category })).filter(Boolean))).slice(0, 3);
}

function petTypeSummary(item: NeedDisplayItem, lang: Lang) {
  return Array.from(new Set(item.pets.map((pet) => localizedPetType(pet, lang)))).join(lang === "en" ? ", " : "、");
}

export function buildNeedOverview(item: NeedDisplayItem, lang: Lang, options: { intervalDays: number; visitsPerDay: number; distanceLabel?: string | null; ownerSupplyLabels?: string[]; sitterSupplyLabels?: string[]; timeLabel?: string | null }) {
  const tasks = representativeTasks(item, lang);
  const pets = petTypeSummary(item, lang);
  const taskText = tasks.length ? tasks.join(lang === "en" ? ", " : "、") : "";
  if (item.mode === "HOME_VISIT") {
    if (lang === "zh") return `我需要离开一段时间，${pets || "宠物"}会留在熟悉的家中，因此想找一位宠物照护人${options.intervalDays === 1 ? "每天" : `每${options.intervalDays}天`}上门，并在每个上门日访问${options.visitsPerDay}次${taskText ? `，完成${taskText}等照护任务` : ""}。如果你有相关经验、时间合适并且愿意帮助，欢迎联系我。`;
    if (lang === "ja") return `留守の間も${pets || "ペット"}が慣れた自宅で過ごせるよう、${options.intervalDays === 1 ? "毎日" : `${options.intervalDays}日ごとに`}1日${options.visitsPerDay}回訪問してくださる方を探しています${taskText ? `。${taskText}などのお世話をお願いします` : ""}。経験があり、日程が合う方はぜひご連絡ください。`;
    return `I will be away and would like ${pets || "my pets"} to stay in their familiar home. I am looking for a sitter to visit ${options.intervalDays === 1 ? "every day" : `every ${options.intervalDays} days`}, ${options.visitsPerDay} ${options.visitsPerDay === 1 ? "time" : "times"} on each care day${taskText ? `, for ${taskText} and related care` : ""}. If you have relevant experience and the timing works, please get in touch.`;
  }
  if (item.mode === "BOARDING") {
    const distance = options.distanceLabel;
    const ownerItems = options.ownerSupplyLabels?.slice(0, 2) ?? [];
    const sitterItems = options.sitterSupplyLabels?.slice(0, 2) ?? [];
    if (lang === "zh") return `我需要离开一段时间，希望${distance ? `在宠物出发地${distance}内` : "在宠物出发地所在地区附近"}，为${pets || "宠物"}找到一个合适的家庭寄养环境。${ownerItems.length ? `我会准备${ownerItems.join("、")}` : ""}${ownerItems.length && sitterItems.length ? "，" : ""}${sitterItems.length ? `需要宠物照护人准备${sitterItems.join("、")}` : ""}${ownerItems.length || sitterItems.length ? "。" : ""}如果你的时间合适、家中环境适合这些宠物，欢迎联系我。`;
    if (lang === "ja") return `留守の間、${distance ? `ペットの出発地から${distance}以内で` : "ペットの出発地周辺で"}${pets || "ペット"}を預かってくださる家庭を探しています。ご自宅の環境と日程が合う方は、ぜひご連絡ください。`;
    return `I will be away and am looking for a suitable home boarding arrangement for ${pets || "my pets"}${distance ? ` within ${distance} of the pet origin` : " near the pet origin"}. If your schedule and home environment are a good fit, please get in touch.`;
  }
  if (lang === "zh") return `我想找一位帮手，为${pets || "宠物"}${taskText ? `完成${taskText}等任务` : "完成指定的照护任务"}。服务可以安排在日期范围内的任意一天${options.timeLabel ? `，最好能满足${options.timeLabel}的时间偏好` : ""}。如果你有相关经验并且有兴趣，欢迎联系我。`;
  if (lang === "ja") return `${pets || "ペット"}の${taskText || "指定されたお世話"}を手伝ってくださる方を探しています。期間内のいずれか1日${options.timeLabel ? `、できれば${options.timeLabel}` : ""}にお願いしたいです。経験があり興味のある方はご連絡ください。`;
  return `I am looking for help with ${taskText || "specific care tasks"} for ${pets || "my pets"}. The service can happen on any one day in the date window${options.timeLabel ? `, preferably ${options.timeLabel}` : ""}. If you have relevant experience and are interested, please get in touch.`;
}

function petIdentity(pet: NeedDisplayTask["pets"][number]) {
  return "id" in pet && pet.id ? pet.id : `${pet.petType}:${pet.name ?? ""}`;
}

export function taskTargetKey(task: NeedDisplayTask) {
  return task.pets.map(petIdentity).sort().join("|");
}

export function mergeAdjacentTaskTargets(tasks: NeedDisplayTask[]) {
  return tasks.reduce<Array<{ key: string; pets: NeedDisplayTask["pets"]; tasks: NeedDisplayTask[] }>>((groups, task) => {
    const key = taskTargetKey(task);
    const previous = groups.at(-1);
    if (previous?.key === key) previous.tasks.push(task);
    else groups.push({ key, pets: task.pets, tasks: [task] });
    return groups;
  }, []);
}

export function tasksForVisit(item: NeedDisplayItem, visitNumber: number) {
  return item.tasks
    .filter((task) => task.visitNumbers.includes(visitNumber))
    .map((task, originalIndex) => ({ task, originalIndex }))
    .sort((a, b) => {
      const aOrders = a.task.orderByVisit as Record<string, number>;
      const bOrders = b.task.orderByVisit as Record<string, number>;
      return (aOrders[String(visitNumber)] ?? a.task.order ?? a.originalIndex) - (bOrders[String(visitNumber)] ?? b.task.order ?? b.originalIndex);
    })
    .map(({ task }) => task);
}

export function orderedModeTasks(item: NeedDisplayItem) {
  return item.tasks
    .map((task, originalIndex) => ({ task, originalIndex }))
    .sort((a, b) => (a.task.order ?? a.originalIndex) - (b.task.order ?? b.originalIndex))
    .map(({ task }) => task);
}

export function boardingTaskGroups(item: NeedDisplayItem) {
  const groups = new Map<string, NeedDisplayTask[]>();
  for (const task of orderedModeTasks(item)) {
    const key = Array.from(new Set(task.pets.map((pet) => pet.petType))).sort().join("|") || "OTHER";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return Array.from(groups, ([key, tasks]) => ({ key, tasks }));
}

export function scheduleKindLabel(kind: string | null | undefined, lang: Lang) {
  const labels: Record<string, Record<Lang, string>> = {
    EACH_VISIT: { en: "Each visit", zh: "每次访问", ja: "毎回" },
    DAILY: { en: "Daily", zh: "每天", ja: "毎日" },
    REPEATING: { en: "Regular", zh: "定期", ja: "定期" },
    ONCE: { en: "One time", zh: "一次", ja: "1回" },
    AS_NEEDED: { en: "As needed", zh: "按需", ja: "必要時" },
  };
  return labels[kind ?? ""]?.[lang] ?? (kind || "—");
}
