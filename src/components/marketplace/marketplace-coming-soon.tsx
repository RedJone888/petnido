"use client";

import { Sparkles } from "lucide-react";

import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";

type MarketplaceKind = "services" | "providers" | "knowledge";

const copy = {
  en: {
    knowledge: "Care knowledge",
    knowledgeDescription: "The knowledge library is being prepared and is not available in this preview.",
    services: "Care services",
    providers: "Sitters",
    title: "Coming soon",
    servicesDescription:
      "Care service browsing is currently under development. Stay tuned!",
    providersDescription:
      "Sitter browsing is currently under development. Stay tuned!",
  },
  zh: {
    knowledge: "照护知识",
    knowledgeDescription: "知识库的内容与布局仍在整理，暂不开放展示。",
    services: "照护服务",
    providers: "Sitter",
    title: "正在开发中",
    servicesDescription: "照护服务浏览功能正在开发中，敬请期待！",
    providersDescription: "Sitter 浏览功能正在开发中，敬请期待！",
  },
  ja: {
    knowledge: "お世話の知識",
    knowledgeDescription: "知識ページの内容とレイアウトを準備中です。このプレビューでは公開していません。",
    services: "お世話サービス",
    providers: "シッター",
    title: "現在開発中です",
    servicesDescription:
      "お世話サービスの閲覧機能は現在開発中です。公開まで今しばらくお待ちください。",
    providersDescription:
      "シッターの閲覧機能は現在開発中です。公開まで今しばらくお待ちください。",
  },
} as const;

export function MarketplaceComingSoon({
  kind,
  initialLanguage,
}: {
  kind: MarketplaceKind;
  initialLanguage?: Lang;
}) {
  const lang = usePageLanguage(initialLanguage);
  const text = copy[lang];
  const description =
    kind === "knowledge" ? text.knowledgeDescription : kind === "services" ? text.servicesDescription : text.providersDescription;

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#fffdf9] px-5 py-16">
      <section className="w-full max-w-2xl rounded-[28px] border border-[#ddd1e5] bg-white px-6 py-14 text-center shadow-[0_24px_70px_-48px_rgba(57,40,71,.55)] sm:px-12 sm:py-16">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eee7f5] text-[var(--primary)]">
          <Sparkles size={27} aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
          {text[kind]}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#392847] sm:text-4xl">
          {text.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#706a78] sm:text-base">
          {description}
        </p>
      </section>
    </main>
  );
}
