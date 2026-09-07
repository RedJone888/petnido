"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bird, Cat, Dog, FileText, Rabbit, Sparkles, X } from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";

const copy = {
  en: {
    text: "Neighbor-powered care for dogs, cats, rabbits, guinea pigs, birds and the routines that make each one unique.",
    explore: "Explore",
    guides: "Guides & Terms",
    need: "Browse Care Requests",
    sitter: "Browse Care Services",
    knowledge: "Care Tips",
    care: "Care Types",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    rights: "All rights reserved.",
  },
  zh: {
    text: "由邻里共同提供的宠物照护，服务猫狗，也服务兔子、荷兰猪、鸟和每一种独特的生活习惯。",
    explore: "探索发现",
    guides: "指南与条款",
    need: "浏览照护需求",
    sitter: "浏览照护服务",
    knowledge: "照护小知识",
    care: "三种照护方式",
    privacy: "隐私政策",
    terms: "用户协议",
    rights: "保留所有权利。",
  },
  ja: {
    text: "犬、猫、うさぎ、モルモット、鳥、それぞれの習慣に寄り添う、地域で支えるペットケア。",
    explore: "探す",
    guides: "ガイド・規約",
    need: "お世話の依頼を見る",
    sitter: "お世話サービスを見る",
    knowledge: "ケアの豆知識",
    care: "3つのケア形式",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    rights: "All rights reserved.",
  },
} as const;

const legalNoticeCopy = {
  en: {
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Service",
    badge: "In Preparation",
    desc: "Our platform policies and terms are currently being drafted and refined to ensure full protection and clarity for all community members. Stay tuned!",
    button: "Got it",
  },
  zh: {
    privacyTitle: "隐私政策",
    termsTitle: "用户协议与服务条款",
    badge: "尚在编写中",
    desc: "平台相关政策与服务条款正在细致完善与编写中，以全面保障社区双方权益，敬请期待！",
    button: "我知道了",
  },
  ja: {
    privacyTitle: "プライバシーポリシー",
    termsTitle: "利用規約",
    badge: "現在作成中",
    desc: "コミュニティの皆様に安心してご利用いただけるよう、現在ポリシーおよび利用規約を策定中です。公開まで今しばらくお待ちください。",
    button: "わかりました",
  },
} as const;

export default function FooterHome() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const legalText = legalNoticeCopy[lang];
  const publicPrefix = `/${lang}`;
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms" | null>(null);

  return (
    <footer className="border-t border-[#ded6e1] bg-[#302537] text-white">
      <div className="site-shell py-6 sm:py-7 md:py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Info (Left Columns 1-5) */}
          <div className="lg:col-span-5 max-w-sm">
            <div className="flex items-center gap-3.5">
              <Link href={publicPrefix} className="inline-flex items-center gap-2.5">
                <Image
                  src="/favicon.svg"
                  alt=""
                  width={34}
                  height={34}
                  className="h-8.5 w-8.5 rounded-lg bg-white p-1"
                />
                <span className="text-2xl font-bold tracking-tight text-white">PetNido</span>
              </Link>
              <div className="flex items-center gap-2 text-white/35 pl-2 border-l border-white/15">
                <Dog size={17} />
                <Cat size={17} />
                <Rabbit size={17} />
                <Bird size={17} />
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/65">
              {text.text}
            </p>

            <p className="mt-3.5 text-xs text-white/40">
              © 2026 PetNido. {text.rights}
            </p>
          </div>

          {/* Explore Column (Columns 7-9) */}
          <div className="lg:col-span-3 lg:col-start-7">
            <FooterGroup
              title={text.explore}
              links={[
                { label: text.need, href: `${publicPrefix}/needs` },
                { label: `${text.sitter} · ${lang === "ja" ? "開発中" : lang === "zh" ? "开发中" : "In development"}`,  href: `${publicPrefix}/services` },
                { label: `${text.knowledge} · ${lang === "ja" ? "開発中" : lang === "zh" ? "开发中" : "In development"}`,  href: `${publicPrefix}/knowledge` },
              ]}
            />
          </div>

          {/* Guides & Terms Column (Columns 10-12) */}
          <div className="lg:col-span-3 lg:col-start-10">
            <FooterGroup
              title={text.guides}
              links={[
                { label: text.care, href: `${publicPrefix}/care-types` },
                {
                  label: text.privacy,
                  onClick: () => setLegalModalType("privacy"),
                },
                {
                  label: text.terms,
                  onClick: () => setLegalModalType("terms"),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* In-Progress Drafting Notice Modal */}
      {legalModalType && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200 text-[#2f2933]"
          onClick={() => setLegalModalType(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLegalModalType(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[var(--primary)] mb-4 shadow-2xs">
              <FileText size={26} />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4ebdf] px-3 py-0.5 text-xs font-bold tracking-wider text-[var(--primary)] uppercase mb-2">
              <Sparkles size={13} />
              <span>{legalText.badge}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#392847]">
              {legalModalType === "privacy"
                ? legalText.privacyTitle
                : legalText.termsTitle}
            </h3>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#665e6d]">
              {legalText.desc}
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="w-full sm:w-auto min-w-[140px] rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] transition cursor-pointer"
              >
                {legalText.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href?: string; onClick?: () => void }[];
}) {
  return (
    <div>
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/90">
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-2 sm:gap-2.5">
        {links.map((item) =>
          item.onClick ? (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="text-left text-xs sm:text-[13px] text-white/60 transition hover:text-white cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <Link
              key={item.label}
              href={item.href || "#"}
              className="text-xs sm:text-[13px] text-white/60 transition hover:text-white"
            >
              {item.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
