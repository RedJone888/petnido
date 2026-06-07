import type { Lang } from "@/domain/lang/types";
import { en } from "./en";
import { zh } from "./zh";
import { ja } from "./ja";

export const messages = {
  en: en,
  zh: zh,
  ja: ja,
} satisfies Record<Lang, unknown>;
