"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Bird, Cat, Dog, Rabbit } from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";

const copy = {
  en: {
    text: "Neighbor-powered care for dogs, cats, rabbits, guinea pigs, birds and the routines that make each one unique.",
    explore: "Explore",
    learn: "Learn",
    account: "Your account",
    need: "Browse needs",
    sitter: "Find sitters",
    care: "Care types",
    how: "How care works",
    postNeed: "How to post a need",
    postService: "How to publish a service",
    knowledge: "Care knowledge",
    dashboard: "Dashboard",
    publish: "Post a need",
    rights: "All rights reserved.",
  },
  zh: {
    text: "由邻里共同提供的宠物照护，服务猫狗，也服务兔子、荷兰猪、鸟和每一种独特的生活习惯。",
    explore: "探索",
    learn: "了解",
    account: "你的账号",
    need: "浏览需求",
    sitter: "寻找 sitter",
    care: "三种照护方式",
    how: "照护如何进行",
    postNeed: "如何发布需求",
    postService: "如何发布服务",
    knowledge: "照护知识",
    dashboard: "个人中心",
    publish: "发布需求",
    rights: "保留所有权利。",
  },
  ja: {
    text: "犬、猫、うさぎ、モルモット、鳥、それぞれの習慣に寄り添う、地域で支えるペットケア。",
    explore: "探す",
    learn: "知る",
    account: "アカウント",
    need: "依頼を見る",
    sitter: "シッターを探す",
    care: "3つのケア形式",
    how: "お世話の流れ",
    postNeed: "依頼の投稿方法",
    postService: "サービスの公開方法",
    knowledge: "ケア知識",
    dashboard: "マイページ",
    publish: "依頼を投稿",
    rights: "All rights reserved.",
  },
} as const;

export default function FooterHome() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const pathname = usePathname();
  const routeLanguage = pathname.match(/^\/(en|zh|ja)(?=\/|$)/)?.[1];
  const publicPrefix = routeLanguage ? `/${routeLanguage}` : "";

  return (
    <footer className="border-t border-[#ded6e1] bg-[#302537] text-white">
      <div className="site-shell py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/favicon.svg" alt="" width={40} height={40} className="h-10 w-10 rounded-xl bg-white p-1" />
              <span className="text-[1.7rem] font-bold tracking-[0.015em] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed]">PetNido</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/66">{text.text}</p>
            <div className="mt-6 flex items-center gap-3 text-white/38">
              <Dog size={20} /><Cat size={20} /><Rabbit size={20} /><Bird size={20} />
            </div>
            <Link href="/needs/create" className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[var(--primary)]">
              {text.publish}<ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-9 sm:grid-cols-3">
            <FooterGroup title={text.explore} links={[
              [text.need, "/needs"],
              [text.sitter, "/providers"],
              [text.care, `${publicPrefix}/care-types`],
            ]} />
            <FooterGroup title={text.learn} links={[
              [text.how, `${publicPrefix}/how-it-works`],
              [text.postNeed, `${publicPrefix}/how-it-works/needs`],
              [text.postService, `${publicPrefix}/how-it-works/services`],
              [text.knowledge, `${publicPrefix}/knowledge`],
            ]} />
            <FooterGroup title={text.account} links={[
              [text.dashboard, "/dashboard"],
              [text.publish, "/needs/create"],
              ["Safety & support", "#"],
            ]} />
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/12 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PetNido. {text.rights}</p>
          <div className="flex gap-5"><Link href="#">Privacy</Link><Link href="#">Terms</Link></div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">
        {links.map(([label, href]) => <Link key={`${label}-${href}`} href={href} className="text-sm text-white/62 transition hover:text-white">{label}</Link>)}
      </div>
    </div>
  );
}
