"use client";

import { BookOpen, ExternalLink, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { usePageLanguage } from "@/components/providers/language-provider";
import type { Lang } from "@/domain/lang/types";
import {
  filterCareKnowledge,
  knowledgePetTypes,
  knowledgeTopics,
  type KnowledgePetType,
  type KnowledgeTopic,
} from "@/domain/knowledge/care-knowledge";

const copy = {
  en: {
    eyebrow: "Sourced reference links", title: "Pet care knowledge library", intro: "Filter reliable external starting points by animal and care topic. PetNido stores only our short summary and the source link—not a copied article.", pet: "Animal", topic: "Care topic", all: "All", result: "resources", source: "Open source", checked: "Link checked", empty: "No resource matches both filters yet.", disclaimerTitle: "General information only", disclaimer: "These links do not replace diagnosis, treatment or advice from a veterinarian who knows the individual animal. For illness, injury, poisoning, breathing difficulty or other urgent concerns, contact a local veterinarian or emergency clinic immediately.",
  },
  zh: {
    eyebrow: "注明来源的参考链接", title: "宠物照护知识库", intro: "按照宠物和照护事项筛选可靠的外部资料入口。PetNido 只保存我们撰写的简短摘要和来源链接，不复制外部文章。", pet: "宠物类型", topic: "照护事项", all: "全部", result: "条资料", source: "打开来源", checked: "链接核对", empty: "目前没有同时符合这两个条件的资料。", disclaimerTitle: "仅供一般信息参考", disclaimer: "这些链接不能替代了解宠物个体情况的兽医所做的诊断、治疗或建议。如果宠物生病、受伤、疑似中毒、呼吸困难或有其他紧急情况，请立即联系当地兽医或急诊机构。",
  },
  ja: {
    eyebrow: "出典付き参考リンク", title: "ペットケア知識ライブラリ", intro: "動物とケア項目から、信頼できる外部資料の入口を探せます。PetNidoは独自の短い要約と出典リンクのみを掲載し、外部記事を転載しません。", pet: "動物", topic: "ケア項目", all: "すべて", result: "件", source: "出典を開く", checked: "リンク確認日", empty: "両方の条件に一致する資料はまだありません。", disclaimerTitle: "一般情報としてご利用ください", disclaimer: "これらのリンクは、個々の動物を診察する獣医師の診断・治療・助言に代わるものではありません。病気、けが、中毒の疑い、呼吸困難など緊急時は、直ちに地域の動物病院または救急診療へ連絡してください。",
  },
} as const;

const petLabels: Record<KnowledgePetType, Record<Lang, string>> = {
  ALL: { en: "All animals", zh: "全部宠物", ja: "すべての動物" },
  DOG: { en: "Dogs", zh: "狗", ja: "犬" }, CAT: { en: "Cats", zh: "猫", ja: "猫" },
  RABBIT: { en: "Rabbits", zh: "兔子", ja: "うさぎ" }, GUINEA_PIG: { en: "Guinea pigs", zh: "荷兰猪", ja: "モルモット" },
  BIRD: { en: "Birds", zh: "鸟", ja: "鳥" },
};

const topicLabels: Record<KnowledgeTopic, Record<Lang, string>> = {
  BASIC_CARE: { en: "Daily care", zh: "日常照护", ja: "日常ケア" }, NUTRITION: { en: "Food & water", zh: "饮食饮水", ja: "食事と水" },
  ENVIRONMENT: { en: "Environment", zh: "生活环境", ja: "住環境" }, GROOMING: { en: "Grooming", zh: "清洁护理", ja: "グルーミング" },
  HEALTH: { en: "Health observation", zh: "健康观察", ja: "健康観察" }, EMERGENCY: { en: "Emergency preparation", zh: "紧急情况准备", ja: "緊急時の備え" },
};

export function KnowledgeLibrary({ language }: { language?: Lang } = {}) {
  const lang = usePageLanguage(language);
  const text = copy[lang];
  const [petType, setPetType] = useState<KnowledgePetType>("ALL");
  const [topic, setTopic] = useState<KnowledgeTopic | "ALL">("ALL");
  const resources = useMemo(() => filterCareKnowledge({ petType, topic }), [petType, topic]);

  return (
    <main className="bg-[#fffdf9] text-[#302a33]">
      <div className="site-shell py-12 md:py-18">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#8a5d34]">{text.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,5rem)] font-bold leading-none tracking-[-.055em] text-[#392847]">{text.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#706a78] md:text-lg">{text.intro}</p>
        </div>

        <section className="mt-10 grid gap-4 rounded-[24px] border border-[#ded6e1] bg-white p-5 sm:grid-cols-2 md:p-7" aria-label="Knowledge filters">
          <label className="text-sm font-bold text-[#392847]">{text.pet}<select value={petType} onChange={(event) => setPetType(event.target.value as KnowledgePetType)} className="mt-2 block h-12 w-full rounded-xl border border-[#d7cddd] bg-white px-3 text-sm font-medium">{knowledgePetTypes.map((value) => <option key={value} value={value}>{petLabels[value][lang]}</option>)}</select></label>
          <label className="text-sm font-bold text-[#392847]">{text.topic}<select value={topic} onChange={(event) => setTopic(event.target.value as KnowledgeTopic | "ALL")} className="mt-2 block h-12 w-full rounded-xl border border-[#d7cddd] bg-white px-3 text-sm font-medium"><option value="ALL">{text.all}</option>{knowledgeTopics.map((value) => <option key={value} value={value}>{topicLabels[value][lang]}</option>)}</select></label>
        </section>

        <div className="mt-8 flex items-center gap-2 text-sm font-bold text-[var(--primary)]"><BookOpen size={18} />{resources.length} {text.result}</div>
        {resources.length ? <section className="mt-4 grid gap-5 md:grid-cols-2">{resources.map((resource) => <article key={resource.id} className="flex flex-col rounded-[22px] border border-[#ded6e1] bg-white p-6"><div className="flex flex-wrap gap-2">{resource.petTypes.map((value) => <span key={value} className="rounded-full bg-[#eef4e7] px-2.5 py-1 text-[11px] font-bold text-[#4f673d]">{petLabels[value][lang]}</span>)}{resource.topics.map((value) => <span key={value} className="rounded-full bg-[#f2edf4] px-2.5 py-1 text-[11px] font-bold text-[var(--primary)]">{topicLabels[value][lang]}</span>)}</div><h2 className="mt-5 text-xl font-bold text-[#392847]">{resource.title[lang]}</h2><p className="mt-3 flex-1 text-sm leading-7 text-[#706a78]">{resource.summary[lang]}</p><div className="mt-6 border-t border-[#ece6ee] pt-4"><p className="text-xs text-[#817a85]">{resource.sourceName} · {text.checked}: {resource.sourceCheckedOn}</p><a href={resource.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">{text.source}<ExternalLink size={15} /></a></div></article>)}</section> : <p className="mt-4 rounded-2xl border border-dashed border-[#d7cddd] p-8 text-center text-sm text-[#706a78]">{text.empty}</p>}

        <aside className="mt-10 rounded-[22px] border border-amber-200 bg-amber-50 p-6"><div className="flex items-center gap-2 font-bold text-amber-950"><ShieldAlert size={20} />{text.disclaimerTitle}</div><p className="mt-3 text-sm leading-7 text-amber-900">{text.disclaimer}</p></aside>
      </div>
    </main>
  );
}
