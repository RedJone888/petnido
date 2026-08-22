import type { Lang } from "@/domain/lang/types";

import { localizedPageMetadata, supportedLanguages } from "./localized-page-metadata";

export type PublicDetailKind = "need" | "service" | "provider";

const pageForKind = {
  need: "needs",
  service: "services",
  provider: "providers",
} as const;

const detailCopy: Record<PublicDetailKind, Record<Lang, { suffix: string; description: (subject: string) => string }>> = {
  need: {
    en: { suffix: "Pet care request", description: (subject) => `View the open, unexpired pet care request “${subject}” on PetNido.` },
    zh: { suffix: "宠物照护需求", description: (subject) => `在 PetNido 查看公开且未过期的宠物照护需求“${subject}”。` },
    ja: { suffix: "ペットケア依頼", description: (subject) => `PetNidoで募集中・期限内のペットケア依頼「${subject}」を確認できます。` },
  },
  service: {
    en: { suffix: "Pet care service", description: (subject) => `View the active pet care service “${subject}” on PetNido.` },
    zh: { suffix: "宠物照护服务", description: (subject) => `在 PetNido 查看正在接单的宠物照护服务“${subject}”。` },
    ja: { suffix: "ペットケアサービス", description: (subject) => `PetNidoで受付中のペットケアサービス「${subject}」を確認できます。` },
  },
  provider: {
    en: { suffix: "Pet care provider", description: (subject) => `View active pet care services offered by ${subject} on PetNido.` },
    zh: { suffix: "宠物照护服务者", description: (subject) => `在 PetNido 查看 ${subject} 当前提供的宠物照护服务。` },
    ja: { suffix: "ペットケアのシッター", description: (subject) => `PetNidoで${subject}が現在提供しているペットケアサービスを確認できます。` },
  },
};

function normalizeSubject(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function publicDetailMetadata(kind: PublicDetailKind, lang: Lang, path: string, subject: string | null) {
  const cleanSubject = subject ? normalizeSubject(subject) : "";
  if (!cleanSubject) return localizedPageMetadata(pageForKind[kind], lang, path);
  const copy = detailCopy[kind][lang];
  return {
    title: `${cleanSubject} — ${copy.suffix} | PetNido`,
    description: copy.description(cleanSubject),
    alternates: {
      canonical: `/${lang}${path}`,
      languages: Object.fromEntries(supportedLanguages.map((language) => [language, `/${language}${path}`])),
    },
  };
}
