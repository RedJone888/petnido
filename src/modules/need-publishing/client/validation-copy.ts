import type { Lang } from "@/domain/lang/types";

const visitTaskValidation: Record<Lang, (visit: number) => string> = {
  en: (visit) => `Add at least one care task to visit ${visit}.`,
  zh: (visit) => `请为第 ${visit} 次上门至少添加一项照护任务。`,
  ja: (visit) => `訪問 ${visit} にお世話作業を1つ以上追加してください。`,
};

export function visitTaskRequiredMessage(lang: Lang, visit: number) {
  return visitTaskValidation[lang](visit);
}
