"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bird,
  Cat,
  Clock3,
  Dog,
  HeartHandshake,
  MapPin,
  PawPrint,
  Rabbit,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";

const copy = {
  en: {
    eyebrow: "Care continues, even when you are away",
    title: "Wherever life takes you and your pet, local pet lovers help each other.",
    intro: "Post when you need care, or offer your time as a sitter—connect with nearby people who genuinely understand pets.",
    post: "Post a care need",
    heroPost: "Post your need",
    earn: "Earn money as a sitter",
    learn: "See how care works",
    dualTitle: "One account. Two ways to belong.",
    dualText:
      "Find a sitter when you need help. Offer care when you have time. Reuse a saved need or service later—just update the dates and details.",
    needTitle: "Post your first care need in minutes",
    needEyebrow: "Post a need",
    needText: "Find the right person to care for your pet when you need a hand.",
    howNeed: "How to post a need",
    needSteps: ["Choose a care type", "Add your pet and task", "Set your budget", "Receive proposals and choose the best fit"],
    needsTitle: "See what pets nearby need",
    needsText:
      "Realistic examples show how different animals and routines can be described.",
    compare: "Compare all care types",
    sitterTitle: "Meet sitters with different experience",
    sitterText:
      "Not every sitter cares for every animal. Profiles make specialties visible before you talk.",
    howService: "How to publish a service",
    finalTitle: "Need help today—or ready to help a neighbor?",
    finalText:
      "Use the same PetNido account on either side of the community.",
    browseNeeds: "Browse needs",
    findSitter: "Find a sitter",
  },
  zh: {
    eyebrow: "即使你不在，照护也不会中断",
    title: "无论生活带你和宠物去到哪里，都能和当地的爱宠人互相帮助。",
    intro: "需要照护时发布需求，有空时成为 sitter，和附近真正懂宠物的人建立连接。",
    post: "发布照护需求",
    heroPost: "发布你的需求",
    earn: "成为 sitter 赚取收入",
    learn: "了解照护如何进行",
    dualTitle: "一个账号，两种角色。",
    dualText:
      "需要时寻找 sitter，有空时提供照护。过去发布的需求或服务可以再次使用，只需更新日期和细节。",
    needTitle: "几分钟发布第一条照护需求",
    needEyebrow: "发布需求",
    needText: "找到合适的人，在你需要时帮助你照顾好宠物。",
    howNeed: "如何发布需求",
    needSteps: ["选择照护类型", "设置宠物和任务", "设置预算", "收到提案，选择最合适的人"],
    needsTitle: "看看附近的宠物需要什么",
    needsText: "通过真实示例了解不同动物、不同作息应该如何描述。",
    compare: "比较三种照护方式",
    sitterTitle: "认识不同专长的 sitter",
    sitterText: "并非每位 sitter 都照护所有动物，个人页面会在沟通前清楚展示专长。",
    howService: "如何发布服务",
    finalTitle: "今天需要帮助，还是刚好有空帮助邻居？",
    finalText: "同一个 PetNido 账号，可以在社区的两端自由切换。",
    browseNeeds: "浏览需求",
    findSitter: "寻找 sitter",
  },
  ja: {
    eyebrow: "離れている間も、いつものお世話を",
    title: "暮らしがあなたとペットをどこへ連れていっても、地域のペット好き同士で助け合えます。",
    intro: "ケアが必要なときは依頼を投稿し、時間があるときはシッターとして、近くのペットを理解する人とつながれます。",
    post: "お世話の依頼を投稿",
    heroPost: "依頼を投稿",
    earn: "シッターとして収入を得る",
    learn: "お世話の流れを見る",
    dualTitle: "ひとつのアカウント、ふたつの役割。",
    dualText:
      "必要なときはシッターを探し、時間があるときはお世話を提供。過去の依頼やサービスは、日付と内容を更新して再利用できます。",
    needTitle: "数分で最初の依頼を投稿",
    needEyebrow: "依頼を投稿",
    needText: "助けが必要なとき、ペットを安心して任せられる人を見つけましょう。",
    howNeed: "依頼の投稿方法",
    needSteps: ["ケアの種類を選ぶ", "ペットと依頼内容を設定", "予算を設定", "提案を受け取り、最適な人を選ぶ"],
    needsTitle: "近くのペットが必要としていること",
    needsText: "動物や生活リズムに合わせた依頼の書き方を、具体例で紹介します。",
    compare: "3つのケアを比較",
    sitterTitle: "さまざまな得意分野を持つシッター",
    sitterText: "対応できる動物や経験を、相談前にプロフィールで確認できます。",
    howService: "サービスの公開方法",
    finalTitle: "今日は助けが必要？それとも近所を助けたい？",
    finalText: "同じ PetNido アカウントで、どちらの役割も始められます。",
    browseNeeds: "依頼を見る",
    findSitter: "シッターを探す",
  },
} as const;

const needs = [
  {
    title: "Buddy needs a morning walk",
    pet: "Golden Retriever · 4 years",
    meta: "Minato · 45 min",
    price: "¥2,800",
    type: "Home visit",
    icon: Dog,
  },
  {
    title: "Luna needs feeding & quiet company",
    pet: "Tabby cat · 7 years",
    meta: "Setagaya · 1 visit",
    price: "¥2,500",
    type: "Home visit",
    icon: Cat,
  },
  {
    title: "Mugi’s hay, water & pen refresh",
    pet: "Rabbit · 2 years",
    meta: "Meguro · Evening",
    price: "¥3,200",
    type: "Custom care",
    icon: Rabbit,
  },
];

const careTypes = [
  {
    slug: "home-visits",
    title: { en: "Home feeding & visits", zh: "上门喂养与照护", ja: "訪問での食事・ケア" },
    label: { en: "A sitter visits to handle feeding, fresh water, walks, cleaning, and everyday check-ins.", zh: "由 sitter 上门完成喂食、换水、散步、清洁和日常状态确认。", ja: "シッターが訪問し、食事、水、散歩、掃除、日々の様子を確認します。" },
    tags: { en: ["Short trips", "Familiar environment"], zh: ["短途出行", "熟悉的环境"], ja: ["短い外出", "慣れた環境"] },
    image: "/images/care-guides/care-type-home-feeding-v3.webp",
  },
  {
    slug: "boarding",
    title: { en: "Family boarding", zh: "家庭寄养", ja: "家庭預かり" },
    label: { en: "Your pet stays in a sitter's home, keeps a steady routine, and receives care throughout the day and night.", zh: "宠物暂住 sitter 家，在稳定的家庭环境中延续作息，并获得白天和夜间的照看。", ja: "シッター宅でいつもの生活リズムを保ちながら、昼夜を通して見守りを受けます。" },
    tags: { en: ["Longer trips", "Cannot stay alone"], zh: ["较长出行", "不宜独处"], ja: ["長い外出", "留守番が難しい"] },
    image: "/images/care-guides/care-type-family-boarding-v3.webp",
  },
  {
    slug: "custom",
    title: { en: "Custom pet help", zh: "宠物相关自定义服务", ja: "ペット向けカスタムサービス" },
    label: { en: "Ask for help with nail trimming, vet transport, pet-area cleaning, or equipment setup.", zh: "可请人协助剪指甲、送医、清洁宠物生活区域，或搬运安装设备。", ja: "爪切り、通院の付き添い、生活スペースの掃除、設備の運搬や設置を頼めます。" },
    tags: { en: ["One-off need", "Define it your way"], zh: ["一次性需求", "按需自定义"], ja: ["単発の依頼", "内容を自由に設定"] },
    image: "/images/care-guides/care-type-custom-help-v3.webp",
  },
];

const sitters = [
  {
    name: "Aiko M.",
    role: "Walks & small-dog care",
    experience: "48 completed cares",
    tags: ["Dogs", "Walks", "Home visits"],
    image: "/images/home/sitter-dog-doodle.png",
  },
  {
    name: "Mina K.",
    role: "Small animals & birds",
    experience: "31 completed cares",
    tags: ["Rabbits", "Guinea pigs", "Birds"],
    image: "/images/home/care-home-visit-doodle.png",
  },
  {
    name: "Yui S.",
    role: "Tailored routines",
    experience: "Medication support",
    tags: ["Birds", "Senior pets", "Custom"],
    image: "/images/home/care-custom-doodle.png",
  },
];

export function MarketplaceHome() {
  const { lang } = useLanguage();
  const text = copy[lang];
  const router = useRouter();

  const startNeed = () => router.push("/needs/create");

  return (
    <div className="bg-[#fffdf9] text-[#2f2933]">
      <section className="site-shell py-5 md:py-8">
        <div className="relative min-h-[620px] overflow-hidden rounded-[28px] bg-[#eee7f5] md:min-h-[610px]">
          <Image
            src="/images/home/petnido-hero-doodle.png"
            alt="A pet sitter caring for a Shiba Inu and tabby cat in a bright home, surrounded by hand-drawn care doodles"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1480px"
            className="object-cover object-[64%_center] md:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf3] via-[#fffaf3]/92 to-transparent md:via-[#fffaf3]/76 md:to-transparent" />
          <div className="relative z-10 flex min-h-[620px] max-w-[760px] flex-col justify-center px-6 py-14 sm:px-10 md:min-h-[610px] md:px-16 md:py-12 lg:px-20">
            <h1 className="max-w-[720px] text-[clamp(3rem,5.9vw,5.7rem)] font-bold leading-[.9] tracking-[-.035em] text-[#392847] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed]">
              {text.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#655d69] md:text-lg md:leading-8">
              {text.intro}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startNeed}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#5d3a86] px-7 text-sm font-bold text-white shadow-[0_16px_34px_-20px_rgba(93,58,134,.8)] transition hover:bg-[#4b2e6d]"
              >
                {text.heroPost}
                <ArrowRight size={18} />
              </button>
              <Link
                href="/how-it-works/services"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-[#b8a9c2] bg-white/75 px-7 text-sm font-bold text-[#5d3a86] backdrop-blur transition hover:bg-white"
              >
                {text.earn}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#655d69]">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#5d3a86]" />Clear sitter profiles</span>
              <span className="inline-flex items-center gap-2"><HeartHandshake size={16} className="text-[#5d3a86]" />Talk before deciding</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell py-7 md:py-10">
        <div className="grid overflow-hidden rounded-[24px] bg-[#dff0c3] md:grid-cols-[1.15fr_.85fr]">
          <div className="px-6 py-9 sm:px-10 md:px-14 md:py-12">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#576c37]">PetNido community</span>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[#27331d] md:text-5xl">{text.dualTitle}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4d5a42] md:text-base">{text.dualText}</p>
          </div>
          <div className="grid border-t border-[#bdd49c] sm:grid-cols-2 md:border-l md:border-t-0">
            <Link href="/public/sitters" className="group flex min-h-36 flex-col justify-between border-b border-[#bdd49c] p-6 transition hover:bg-white/25 sm:border-b-0 sm:border-r md:min-h-0">
              <PawPrint className="text-[#5d3a86]" />
              <span className="mt-8 flex items-center justify-between font-bold">{text.findSitter}<ArrowRight className="transition group-hover:translate-x-1" size={19} /></span>
            </Link>
            <Link href="/public/needs" className="group flex min-h-36 flex-col justify-between p-6 transition hover:bg-white/25 md:min-h-0">
              <RefreshCw className="text-[#8a5d34]" />
              <span className="mt-8 flex items-center justify-between font-bold">{text.browseNeeds}<ArrowRight className="transition group-hover:translate-x-1" size={19} /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="site-shell py-16 md:py-24">
        <div className="mx-auto grid max-w-[1040px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-[72px]">
          <div>
            <h2 className="max-w-lg text-[clamp(2.8rem,5vw,4.1rem)] font-bold leading-[.92] tracking-[-.035em] text-[#392847] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed]">{text.needTitle}</h2>
            <p className="mt-5 max-w-sm text-lg font-medium leading-8 text-[#625a67]">{text.needText}</p>
            <ol className="mt-8 space-y-4">
              {text.needSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[32px_1fr] items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9ddf0] text-xs font-bold text-[#5d3a86]">{index + 1}</span>
                  <p className="font-bold leading-6 text-[#392847]">{step}</p>
                </li>
              ))}
            </ol>
            <button onClick={startNeed} className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl bg-[#5d3a86] px-6 text-sm font-bold text-white transition hover:bg-[#4b2e6d]">{text.post}<ArrowRight size={17} /></button>
          </div>

          <div>
            <div className="rounded-[28px] bg-[#eee9f6] p-5 sm:p-6 md:p-7">
              <div className="grid gap-4">
                {careTypes.map((care) => (
                  <article key={care.slug} className="grid grid-cols-[104px_1fr] items-center gap-5 rounded-[18px] bg-white p-3.5 shadow-[0_10px_30px_-26px_rgba(57,40,71,.45)] sm:grid-cols-[118px_1fr]">
                    <div className="relative aspect-square overflow-hidden rounded-[13px]">
                      <Image src={care.image} alt={care.title[lang]} fill sizes="118px" className="object-cover" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <h3 className="text-base font-bold leading-5 text-[#392847] md:text-lg">{care.title[lang]}</h3>
                      <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#706a78]">{care.label[lang]}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {care.tags[lang].map((tag) => (
                          <span key={tag} className="rounded-full bg-[#f2edf5] px-2.5 py-1 text-[11px] font-bold text-[#66516f]">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Link href="/care-types" className="inline-flex items-center gap-2 text-sm font-bold text-[#5d3a86] transition hover:text-[#4b2e6d]">
                {text.compare}<ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f0f6] py-16 md:py-24">
        <div className="site-shell">
          <div className="mx-auto max-w-[1040px]">
            <h2 className="max-w-[820px] text-[clamp(2.6rem,4.2vw,3.5rem)] font-bold leading-[.94] tracking-[-.035em] text-[#392847] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed]">{text.needsTitle}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#706a78]">{text.needsText}</p>
          </div>

          <div className="needs-marquee mx-auto mt-10 max-w-[1120px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="needs-marquee-track flex w-max">
              {[false, true].map((duplicate) => (
                <div key={duplicate ? "duplicate" : "primary"} aria-hidden={duplicate || undefined} className="flex shrink-0 gap-4 pr-4">
                  {needs.map((need) => {
                    const Icon = need.icon;
                    return (
                      <Link key={`${need.title}-${duplicate}`} tabIndex={duplicate ? -1 : undefined} href="/public/needs" className="group w-[300px] shrink-0 rounded-[18px] border border-[#ded6e1] bg-white p-5 transition hover:border-[#bda9c9] hover:shadow-[0_18px_45px_-34px_rgba(49,38,58,.55)] sm:w-[340px]">
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#eee7f3] text-[#5d3a86]"><Icon size={21} /></span>
                          <span className="rounded-full bg-[#f4f0f6] px-3 py-1.5 text-[11px] font-bold text-[#66566f]">{need.type}</span>
                        </div>
                        <h3 className="mt-5 line-clamp-2 text-base font-bold leading-6 text-[#392847]">{need.title}</h3>
                        <p className="mt-2 text-sm text-[#706a78]">{need.pet}</p>
                        <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#ece6ee] pt-4">
                          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#817a85]"><MapPin size={14} />{need.meta}</p>
                          <span className="shrink-0 font-bold text-[#5d3a86]">{need.price}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-9 flex justify-center">
            <button onClick={startNeed} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#5d3a86] px-6 text-sm font-bold text-white transition hover:bg-[#4b2e6d]">
              {text.heroPost}<ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#efe7dc] py-16 md:py-24">
        <div className="site-shell">
          <SectionHeading eyebrow="People who care" title={text.sitterTitle} text={text.sitterText} action="/how-it-works/services" actionLabel={text.howService} />
          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            {sitters.map((sitter) => (
              <Link key={sitter.name} href="/public/sitters" className="group overflow-hidden rounded-[20px] border border-[#ddcfc1] bg-[#fffdf9]">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={sitter.image} alt={`${sitter.name}, ${sitter.role}`} fill sizes="(max-width:1024px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" />
                  <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5d3a86]"><BadgeCheck size={19} /></span>
                </div>
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="text-lg font-bold">{sitter.name}</h3><p className="mt-1 text-sm text-[#706a78]">{sitter.role}</p></div>
                    <span className="rounded-full bg-[#e7f0d9] px-2.5 py-1 text-[11px] font-bold text-[#526638]">Available</span>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#817a85]"><Clock3 size={14} />{sitter.experience}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">{sitter.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f0ebf2] px-2.5 py-1 text-[11px] font-bold text-[#66566f]">{tag}</span>)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell py-16 md:py-24">
        <div className="relative overflow-hidden rounded-[26px] bg-[#5d3a86] px-6 py-14 text-white sm:px-10 md:px-16 md:py-20">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-[-0.04em] md:text-5xl">{text.finalTitle}</h2>
            <p className="mt-4 text-base text-white/72 md:text-lg">{text.finalText}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={startNeed} className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#5d3a86]">{text.post}<ArrowRight size={17} /></button>
              <Link href="/how-it-works/services" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/35 px-6 text-sm font-bold">{text.howService}</Link>
            </div>
          </div>
          <Bird className="absolute -bottom-10 right-3 h-56 w-56 rotate-[-8deg] text-white/5 md:right-16 md:h-72 md:w-72" strokeWidth={1.2} />
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5d34]">{eyebrow}</span>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.04em] md:text-5xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#706a78] md:text-base">{text}</p>
      </div>
      {action && actionLabel && <Link href={action} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#5d3a86]">{actionLabel}<ArrowRight size={17} /></Link>}
    </div>
  );
}
