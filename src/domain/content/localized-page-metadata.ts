import type { Lang } from "@/domain/lang/types";

export const supportedLanguages = ["en", "zh", "ja"] as const;
export type LocalizedPage = "knowledge" | "needs" | "services" | "providers" | "care-types" | "care-home-visits" | "care-boarding" | "care-custom" | "how-it-works" | "how-needs" | "how-services";

const copy: Record<LocalizedPage, Record<Lang, { title: string; description: string }>> = {
  needs: {
    en: { title: "Nearby pet care requests | PetNido", description: "Browse open, unexpired pet care requests without revealing exact home addresses." },
    zh: { title: "附近的宠物照护需求 | PetNido", description: "浏览公开且未过期的宠物照护需求，不显示家庭精确地址。" },
    ja: { title: "近くのペットケア依頼 | PetNido", description: "自宅の正確な住所を公開せず、募集中で期限内の依頼を探せます。" },
  },
  services: {
    en: { title: "Nearby pet care services | PetNido", description: "Find active home visit, boarding and custom pet care services." },
    zh: { title: "附近的宠物照护服务 | PetNido", description: "寻找正在接单的上门、寄养和自定义宠物照护服务。" },
    ja: { title: "近くのペットケアサービス | PetNido", description: "受付中の訪問、ホームステイ、カスタムケアを探せます。" },
  },
  providers: {
    en: { title: "Pet care providers | PetNido", description: "Browse people who currently offer active pet care services." },
    zh: { title: "宠物照护服务者 | PetNido", description: "浏览当前正在提供有效宠物照护服务的用户。" },
    ja: { title: "ペットケアのシッター | PetNido", description: "現在ペットケアサービスを公開しているシッターを探せます。" },
  },
  knowledge: {
    en: { title: "Pet care knowledge library | PetNido", description: "Browse sourced pet-care references by animal and care topic." },
    zh: { title: "宠物照护知识库 | PetNido", description: "按照宠物类型和照护事项查找注明来源的照护资料。" },
    ja: { title: "ペットケア知識ライブラリ | PetNido", description: "動物とケア項目から、出典付きのお世話資料を探せます。" },
  },
  "care-types": {
    en: { title: "Compare three pet care types | PetNido", description: "Compare home visits, family boarding and custom pet care." },
    zh: { title: "比较三种宠物照护方式 | PetNido", description: "比较上门照护、家庭寄养和自定义宠物服务。" },
    ja: { title: "3つのペットケア形式を比較 | PetNido", description: "訪問ケア、家庭預かり、カスタムケアを比較できます。" },
  },
  "care-home-visits": {
    en: { title: "Home-visit pet care | PetNido", description: "Learn when home visits fit and what owners and sitters should agree in advance." },
    zh: { title: "上门宠物照护 | PetNido", description: "了解上门照护适用的情况，以及双方开始前应确认的事项。" },
    ja: { title: "訪問ペットケア | PetNido", description: "訪問ケアが向く場面と、開始前に確認する内容を紹介します。" },
  },
  "care-boarding": {
    en: { title: "Family pet boarding | PetNido", description: "Learn when family boarding fits and how to review the home environment and capacity." },
    zh: { title: "宠物家庭寄养 | PetNido", description: "了解家庭寄养适用的情况，以及环境与接待容量如何确认。" },
    ja: { title: "家庭でのペット預かり | PetNido", description: "家庭預かりが向く場面と、住環境・受入数の確認方法を紹介します。" },
  },
  "care-custom": {
    en: { title: "Custom pet services | PetNido", description: "Learn how to define a safe, lawful and clearly scoped custom pet task." },
    zh: { title: "自定义宠物服务 | PetNido", description: "了解如何描述安全、合法且任务边界清晰的自定义服务。" },
    ja: { title: "カスタムペットサービス | PetNido", description: "安全で合法、範囲が明確なカスタム作業の伝え方を紹介します。" },
  },
  "how-it-works": {
    en: { title: "How PetNido works", description: "Choose whether to post a need, publish a service or compare care types." },
    zh: { title: "PetNido 如何使用", description: "选择发布需求、发布服务，或先比较三种照护类型。" },
    ja: { title: "PetNidoの使い方", description: "依頼の投稿、サービス公開、ケア形式の比較から選べます。" },
  },
  "how-needs": {
    en: { title: "How to post a pet-care need | PetNido", description: "Follow the structured steps for publishing a clear pet-care need." },
    zh: { title: "如何发布宠物照护需求 | PetNido", description: "按照结构化步骤发布清晰的宠物照护需求。" },
    ja: { title: "ペットケア依頼の投稿方法 | PetNido", description: "わかりやすい依頼を投稿する手順を紹介します。" },
  },
  "how-services": {
    en: { title: "How to publish a pet-care service | PetNido", description: "Follow the steps for turning real experience and availability into a clear service." },
    zh: { title: "如何发布宠物照护服务 | PetNido", description: "把真实经验和可用时间整理成清晰服务的发布步骤。" },
    ja: { title: "ペットケアサービスの公開方法 | PetNido", description: "経験と空き時間をサービスとして公開する手順を紹介します。" },
  },
};

export function isSupportedLanguage(value: string): value is Lang {
  return supportedLanguages.includes(value as Lang);
}

export function localizedPageMetadata(page: LocalizedPage, lang: Lang, path: string) {
  return {
    ...copy[page][lang],
    alternates: {
      canonical: `/${lang}${path}`,
      languages: Object.fromEntries(supportedLanguages.map((language) => [language, `/${language}${path}`])),
    },
  };
}
