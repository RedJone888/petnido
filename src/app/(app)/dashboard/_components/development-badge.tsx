"use client";

import { Construction } from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";

export function DevelopmentBadge() {
  const { lang } = useLanguage();
  const label =
    lang === "zh" ? "开发中" : lang === "ja" ? "開発中" : "Under development";
  const description =
    lang === "zh"
      ? "此部分功能仍在完善，页面内容和操作可能继续调整。"
      : lang === "ja"
        ? "この機能は現在開発中です。内容や操作は今後変更される場合があります。"
        : "This section is still being built. Its content and actions may continue to change.";

  return (
    <div
      role="status"
      className="flex w-full items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-xs"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-200/70 text-amber-800">
        <Construction size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm font-bold">{label}</strong>
        <span className="mt-0.5 block text-xs leading-5 text-amber-800">{description}</span>
      </span>
    </div>
  );
}
