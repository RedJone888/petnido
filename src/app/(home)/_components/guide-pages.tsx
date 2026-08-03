"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Home,
  House,
  MessageCircle,
  PawPrint,
  RefreshCw,
  Search,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";

type Lang = "en" | "zh" | "ja";

const labels = {
  en: {
    hubTitle: "How pet care comes together on PetNido",
    hubText: "Understand the care structure first, then follow the path that matches what you want to do today.",
    ownerTitle: "I need care for a pet",
    ownerText: "Choose a care type, describe the animal and routine, then publish for nearby sitters.",
    sitterTitle: "I want to provide care",
    sitterText: "Build a sitter profile, publish the care you can offer and respond to nearby needs.",
    compareTitle: "Compare the three care types",
    compareText: "See when home visits, boarding and custom care work best—and where each has limits.",
    needTitle: "How to post a care need",
    needText: "A useful post gives sitters enough structure to decide whether they are a good fit.",
    serviceTitle: "How to publish a sitter service",
    serviceText: "Turn your real experience, home setup and availability into a clear service pet owners can understand.",
    chooseFirst: "Start by choosing a care type",
    compare: "Compare all three before choosing",
    reuseTitle: "Your next post can start from this one",
    reuseText: "A completed need or service stays reusable. Update the dates, location, price or routine instead of starting over.",
    postNeed: "Start posting a need",
    postService: "Start publishing a service",
    careTitle: "Home visits, boarding or custom care?",
    careText: "There is no universally best type. The right structure depends on the animal, the environment and the routine.",
    bestFor: "Works well when",
    advantages: "Advantages",
    consider: "Things to consider",
    examples: "Example requests",
    needSteps: [
      ["Choose the structure", "Pick home visits, boarding or custom care. You can compare them before committing."],
      ["Introduce every animal", "Add species, age, temperament, health notes and how the animals live together."],
      ["Build the routine", "Add dates, visit times, feeding, cleaning, walks, medication and small details that matter."],
      ["Set expectations", "Add location, budget, handover notes and what a successful care visit looks like."],
      ["Preview and publish", "Review the sitter-facing version, then publish or save it for later."],
    ],
    serviceSteps: [
      ["Create your sitter profile", "Share relevant experience, the animals you understand and how you communicate."],
      ["Choose what you can truly offer", "Select home visits, boarding or custom care based on your skills and setup."],
      ["Define boundaries", "Set service area, animal types, home conditions, availability and tasks you do not accept."],
      ["Explain the experience", "Describe what owners and pets can expect before, during and after each care."],
      ["Publish, pause and reuse", "Open the service when available, pause it when busy, or update it for a new season or location."],
    ],
  },
  zh: {
    hubTitle: "在 PetNido，宠物照护是如何串联起来的",
    hubText: "先了解照护结构，再选择今天最符合你目标的路径。",
    ownerTitle: "我需要为宠物寻找照护",
    ownerText: "选择照护类型，介绍宠物与日常习惯，再发布给附近合适的 sitter。",
    sitterTitle: "我想提供宠物照护",
    sitterText: "完善 sitter 资料，发布自己能提供的服务，也可以回应附近的需求。",
    compareTitle: "比较三种照护方式",
    compareText: "了解上门、寄养、自定义分别适合什么情况，以及各自需要注意的限制。",
    needTitle: "如何发布照护需求",
    needText: "一条好的需求，会用足够清晰的结构帮助 sitter 判断双方是否适合。",
    serviceTitle: "如何发布 sitter 服务",
    serviceText: "把真实经验、家庭环境和可用时间，整理成宠物主人容易理解的服务。",
    chooseFirst: "先选择照护类型",
    compare: "选择前先比较三种方式",
    reuseTitle: "下一次发布，可以从这一次开始",
    reuseText: "已完成的需求或服务仍可复用。更新日期、地点、价格或日常习惯即可，无需重新填写。",
    postNeed: "开始发布需求",
    postService: "开始发布服务",
    careTitle: "上门、寄养，还是自定义照护？",
    careText: "没有绝对最好的类型。正确的结构取决于动物、环境和日常习惯。",
    bestFor: "适合这些情况",
    advantages: "优点",
    consider: "需要考虑",
    examples: "需求示例",
    needSteps: [
      ["选择结构", "从上门、寄养、自定义中选择，也可以先比较再决定。"],
      ["介绍每一只动物", "填写品种、年龄、性格、健康信息，以及多只宠物如何相处。"],
      ["建立日常照护", "添加日期、上门时间、喂食、清洁、散步、用药与关键小习惯。"],
      ["说明彼此期待", "补充地点、预算、交接方式，以及什么样的结果才算完成照护。"],
      ["预览并发布", "先查看 sitter 会看到的版本，再发布或保存以后使用。"],
    ],
    serviceSteps: [
      ["完善 sitter 资料", "展示相关经验、熟悉的动物类型，以及你的沟通方式。"],
      ["只选择真正能提供的服务", "根据经验和家庭环境，选择上门、寄养或自定义照护。"],
      ["明确边界", "设置服务范围、宠物类型、家庭条件、可用时间，以及不接受的任务。"],
      ["解释服务体验", "清楚说明服务前、服务中和服务后，主人与宠物可以期待什么。"],
      ["发布、暂停与复用", "有空时开放，忙碌时暂停；搬家或换季后更新原服务继续使用。"],
    ],
  },
  ja: {
    hubTitle: "PetNidoでペットケアがつながる仕組み",
    hubText: "まずケアの形式を理解し、今日の目的に合うルートを選びましょう。",
    ownerTitle: "ペットのお世話を頼みたい",
    ownerText: "ケア形式を選び、ペットと習慣を紹介して、近くのシッターに公開します。",
    sitterTitle: "ペットのお世話を提供したい",
    sitterText: "プロフィールを整え、提供できるケアを公開し、近くの依頼にも応募できます。",
    compareTitle: "3つのケア形式を比較",
    compareText: "訪問、預かり、カスタムケアの向いている場面と注意点を確認します。",
    needTitle: "お世話の依頼を投稿する方法",
    needText: "わかりやすい依頼は、シッターが相性を判断できる十分な情報を持っています。",
    serviceTitle: "シッターサービスを公開する方法",
    serviceText: "経験、住環境、空き時間を、飼い主に伝わるサービスとして整理します。",
    chooseFirst: "最初にケア形式を選ぶ",
    compare: "選ぶ前に3つを比較",
    reuseTitle: "次回は今回の投稿から始められます",
    reuseText: "完了した依頼やサービスも再利用可能。日付、場所、価格、習慣を更新するだけです。",
    postNeed: "依頼を作成",
    postService: "サービスを作成",
    careTitle: "訪問、預かり、カスタムケア？",
    careText: "すべてに最適な形式はありません。動物、環境、習慣によって選びましょう。",
    bestFor: "向いている場面",
    advantages: "メリット",
    consider: "注意すること",
    examples: "依頼の例",
    needSteps: [
      ["形式を選ぶ", "訪問、預かり、カスタムから選択。比較してから決めることもできます。"],
      ["すべての動物を紹介", "種類、年齢、性格、健康情報、多頭飼いの関係を追加します。"],
      ["習慣を組み立てる", "日付、時間、食事、清掃、散歩、投薬、大切な習慣を追加します。"],
      ["期待をそろえる", "場所、予算、引き継ぎ、完了のイメージを共有します。"],
      ["確認して公開", "シッター向け表示を確認し、公開または保存します。"],
    ],
    serviceSteps: [
      ["プロフィールを作る", "経験、得意な動物、コミュニケーション方法を紹介します。"],
      ["提供できるケアを選ぶ", "経験と環境に合わせて訪問、預かり、カスタムを選択します。"],
      ["境界を決める", "範囲、動物、住環境、空き時間、対応しない作業を設定します。"],
      ["体験を説明", "ケアの前・中・後に何が期待できるかを説明します。"],
      ["公開・停止・再利用", "空いている時に公開し、忙しい時は停止。季節や引越し後も更新して使えます。"],
    ],
  },
} as const;

const careTypes = [
  {
    id: "home-visits",
    title: { en: "Home visits", zh: "上门照护", ja: "訪問ケア" },
    subtitle: { en: "Care in the pet’s familiar home", zh: "让宠物留在熟悉的家中", ja: "慣れた自宅でのお世話" },
    image: "/images/home/care-home-visit-doodle.png",
    best: {
      en: ["Animals stressed by travel", "Cats, rabbits, guinea pigs and birds with fixed habitats", "Feeding, cleaning, walks or medication at set times"],
      zh: ["不适合搬动或外出会紧张的宠物", "有固定生活环境的猫、兔子、荷兰猪和鸟", "需要按时喂食、清洁、散步或用药"],
      ja: ["移動が苦手な動物", "環境が固定された猫、うさぎ、モルモット、鳥", "決まった時間の食事、清掃、散歩、投薬"],
    },
    pros: { en: ["Routine stays familiar", "Good for multi-pet homes"], zh: ["环境与作息变化较小", "适合多宠物家庭"], ja: ["環境と習慣を保ちやすい", "多頭飼いに向いている"] },
    limits: { en: ["Pet is alone between visits", "Key handover and home access need trust"], zh: ["两次上门之间宠物会独处", "钥匙交接与入户需要充分信任"], ja: ["訪問の間は留守になる", "鍵と入室方法の信頼が必要"] },
    examples: { en: "Two daily rabbit visits; budgie food and water; cat medication.", zh: "每天两次照顾兔子；为鸟换水添粮；按时给猫喂药。", ja: "1日2回のうさぎ訪問、鳥の水と食事、猫の投薬。" },
    icon: Home,
  },
  {
    id: "boarding",
    title: { en: "Boarding", zh: "家庭寄养", ja: "預かりケア" },
    subtitle: { en: "The pet stays at the sitter’s home", zh: "宠物住在 sitter 家中", ja: "シッター宅で過ごすケア" },
    image: "/images/home/care-boarding-doodle.png",
    best: {
      en: ["Social animals comfortable in a new home", "Overnight or continuous supervision", "Owners who prefer a staffed environment"],
      zh: ["能适应新环境、喜欢陪伴的宠物", "需要过夜或连续看护", "主人希望宠物身边持续有人"],
      ja: ["新しい家に慣れやすい動物", "宿泊や継続した見守り", "常に人がいる環境を希望する場合"],
    },
    pros: { en: ["More continuous company", "Useful for longer trips"], zh: ["获得更持续的陪伴", "适合较长时间外出"], ja: ["継続した見守り", "長めの旅行に便利"] },
    limits: { en: ["New environment can be stressful", "Home, pets and safety setup must be compatible"], zh: ["陌生环境可能带来压力", "需确认住宅、原住宠物与安全条件"], ja: ["環境変化のストレス", "住環境や先住動物との相性確認が必要"] },
    examples: { en: "A dog stays for a weekend; a guinea pig boards with its own habitat.", zh: "狗狗周末寄养；荷兰猪带着自己的生活箱寄养。", ja: "犬の週末預かり、飼育セットごとのモルモット預かり。" },
    icon: House,
  },
  {
    id: "custom",
    title: { en: "Custom care", zh: "自定义照护", ja: "カスタムケア" },
    subtitle: { en: "For routines that do not fit a standard template", zh: "适合无法套用标准结构的照护", ja: "定型に収まらないお世話" },
    image: "/images/home/care-custom-doodle.png",
    best: {
      en: ["Bird routines, habitat cleaning or transport", "Senior pets and multi-step instructions", "One-off help with clear scope"],
      zh: ["鸟类作息、笼舍清洁或接送", "老年宠物与多步骤照护", "范围明确的一次性帮助"],
      ja: ["鳥の習慣、ケージ清掃、送迎", "シニア動物や複数手順", "範囲が明確な単発の手伝い"],
    },
    pros: { en: ["Flexible for unusual animals", "Can mirror a precise routine"], zh: ["适合异宠与少见需求", "可以完全按照特定作息设置"], ja: ["珍しい動物にも柔軟", "細かな習慣を再現できる"] },
    limits: { en: ["Scope must be very clear", "May require specialist experience"], zh: ["必须清楚界定任务范围", "可能需要专业经验"], ja: ["作業範囲を明確にする必要", "専門経験が必要な場合がある"] },
    examples: { en: "Cockatiel routine; aquarium check; vet transport; habitat deep clean.", zh: "玄凤鹦鹉照护；水族箱检查；宠物医院接送；生活区深度清洁。", ja: "オカメインコの習慣、水槽確認、通院送迎、飼育環境の清掃。" },
    icon: Sparkles,
  },
];

export function HowItWorksHub() {
  const { lang } = useLanguage();
  const text = labels[lang];
  return (
    <GuideFrame eyebrow="PetNido guide" title={text.hubTitle} text={text.hubText}>
      <div className="grid gap-5 md:grid-cols-3">
        <PathCard icon={UserRoundSearch} title={text.ownerTitle} text={text.ownerText} href="/how-it-works/needs" image="/images/home/need-rabbit-care-doodle.png" />
        <PathCard icon={PawPrint} title={text.sitterTitle} text={text.sitterText} href="/how-it-works/services" image="/images/home/sitter-dog-doodle.png" />
        <PathCard icon={Search} title={text.compareTitle} text={text.compareText} href="/care-types" image="/images/home/care-home-visit-doodle.png" />
      </div>
      <FlowStrip lang={lang} />
    </GuideFrame>
  );
}

export function PostingGuide({ kind }: { kind: "needs" | "services" }) {
  const { lang } = useLanguage();
  const text = labels[lang];
  const isNeed = kind === "needs";
  const steps = isNeed ? text.needSteps : text.serviceSteps;
  return (
    <GuideFrame eyebrow={isNeed ? "For pet owners" : "For sitters"} title={isNeed ? text.needTitle : text.serviceTitle} text={isNeed ? text.needText : text.serviceText}>
      <section className="rounded-[24px] bg-[#f2edf4] p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><span className="text-xs font-bold uppercase tracking-[.14em] text-[#8a5d34]">Step 01</span><h2 className="mt-2 text-2xl font-bold">{text.chooseFirst}</h2></div>
          <Link href="/care-types" className="inline-flex items-center gap-2 text-sm font-bold text-[#5d3a86]">{text.compare}<ArrowRight size={16} /></Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {careTypes.map((care) => {
            const Icon = care.icon;
            return <Link key={care.id} href={`/care-types/${care.id}`} className="group rounded-[18px] border border-[#ddd3e1] bg-white p-5"><Icon className="text-[#5d3a86]" size={22} /><h3 className="mt-5 font-bold">{care.title[lang]}</h3><p className="mt-1 text-sm text-[#706a78]">{care.subtitle[lang]}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#5d3a86]">Details <ChevronRight size={14} /></span></Link>;
          })}
        </div>
      </section>
      <section className="py-14 md:py-20">
        <div className="grid gap-0 border-y border-[#ded6e1]">
          {steps.map(([title, description], index) => (
            <article key={title} className="grid gap-3 border-b border-[#ded6e1] py-6 last:border-b-0 md:grid-cols-[110px_1fr_1.5fr] md:items-start md:py-8">
              <span className="text-xs font-bold text-[#8a5d34]">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm leading-6 text-[#706a78]">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="grid overflow-hidden rounded-[24px] bg-[#dff0c3] md:grid-cols-[1fr_auto] md:items-center">
        <div className="p-7 md:p-10"><RefreshCw className="text-[#5d3a86]" /><h2 className="mt-5 text-2xl font-bold text-[#27331d]">{text.reuseTitle}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#526045]">{text.reuseText}</p></div>
        <Link href={isNeed ? "/needs/create" : "/dashboard/serviceprofile/services/new"} className="m-7 mt-0 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#5d3a86] px-6 text-sm font-bold text-white md:m-10 md:ml-0">{isNeed ? text.postNeed : text.postService}<ArrowRight size={16} /></Link>
      </section>
    </GuideFrame>
  );
}

export function CareTypesGuide() {
  const { lang } = useLanguage();
  const text = labels[lang];
  return (
    <GuideFrame eyebrow="Choose the right structure" title={text.careTitle} text={text.careText}>
      <nav className="sticky top-16 z-20 -mx-5 mb-10 overflow-x-auto border-y border-[#ded6e1] bg-[#fffdf9]/95 px-5 backdrop-blur md:-mx-10 md:px-10">
        <div className="mx-auto flex min-w-max max-w-[1400px]">
          {careTypes.map((care) => <Link key={care.id} href={`#${care.id}`} className="px-5 py-4 text-sm font-bold text-[#5d3a86]">{care.title[lang]}</Link>)}
        </div>
      </nav>
      <div className="space-y-10">
        {careTypes.map((care, index) => {
          const Icon = care.icon;
          return (
            <section id={care.id} key={care.id} className="scroll-mt-36 overflow-hidden rounded-[24px] border border-[#ded6e1] bg-white">
              <div className={`grid lg:grid-cols-2 ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="relative min-h-[330px] lg:min-h-[560px]">
                  <Image src={care.image} alt={`${care.title[lang]} example`} fill priority={index === 0} sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
                </div>
                <div className="p-6 md:p-10 lg:p-12">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eee7f3] text-[#5d3a86]"><Icon size={22} /></span>
                  <h2 className="mt-5 text-3xl font-bold tracking-[-.035em]">{care.title[lang]}</h2>
                  <p className="mt-2 text-sm text-[#706a78]">{care.subtitle[lang]}</p>
                  <GuideList icon={Check} title={text.bestFor} items={care.best[lang]} tone="green" />
                  <GuideList icon={Check} title={text.advantages} items={care.pros[lang]} tone="purple" />
                  <GuideList icon={CircleAlert} title={text.consider} items={care.limits[lang]} tone="sand" />
                  <div className="mt-7 rounded-xl bg-[#f5f1f6] p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#8a5d34]">{text.examples}</p><p className="mt-2 text-sm leading-6 text-[#625a67]">{care.examples[lang]}</p></div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href="/needs/create" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#5d3a86] px-5 text-sm font-bold text-white">{text.postNeed}<ArrowRight size={15} /></Link>
                    <Link href="/how-it-works/services" className="inline-flex h-11 items-center rounded-xl border border-[#bfaec8] px-5 text-sm font-bold text-[#5d3a86]">{text.postService}</Link>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </GuideFrame>
  );
}

function GuideFrame({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <main className="bg-[#fffdf9] text-[#302a33]">
      <section className="site-shell pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="mb-10 max-w-4xl md:mb-14">
          <span className="text-xs font-bold uppercase tracking-[.16em] text-[#8a5d34]">{eyebrow}</span>
          <h1 className="mt-4 text-[clamp(2.5rem,5vw,5.2rem)] font-bold leading-[1] tracking-[-.055em] text-[#392847]">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#706a78] md:text-lg">{text}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

function PathCard({ icon: Icon, title, text, href, image }: { icon: typeof PawPrint; title: string; text: string; href: string; image: string }) {
  return (
    <Link href={href} className="group overflow-hidden rounded-[22px] border border-[#ded6e1] bg-white">
      <div className="relative aspect-[16/9] overflow-hidden"><Image src={image} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /></div>
      <div className="p-6"><Icon className="text-[#5d3a86]" /><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#706a78]">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#5d3a86]">Explore <ArrowRight size={16} /></span></div>
    </Link>
  );
}

function FlowStrip({ lang }: { lang: Lang }) {
  const items = {
    en: [["Choose", "Compare care types"], ["Describe", "Share the real routine"], ["Connect", "Talk before deciding"], ["Reuse", "Update dates next time"]],
    zh: [["选择", "比较照护类型"], ["描述", "说明真实日常"], ["连接", "决定前先沟通"], ["复用", "下次只更新日期"]],
    ja: [["選ぶ", "ケア形式を比較"], ["伝える", "実際の習慣を共有"], ["つながる", "決める前に相談"], ["再利用", "次回は日付を更新"]],
  }[lang];
  const icons = [Search, ClipboardList, MessageCircle, RefreshCw];
  return <div className="mt-10 grid rounded-[22px] bg-[#f2edf4] p-5 sm:grid-cols-2 md:grid-cols-4 md:p-8">{items.map(([title, text], index) => { const Icon = icons[index]; return <div key={title} className="flex gap-3 border-b border-[#ddd3e1] py-5 last:border-0 sm:odd:border-r sm:odd:pr-5 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"><Icon className="shrink-0 text-[#5d3a86]" size={20} /><div><p className="font-bold">{title}</p><p className="mt-1 text-xs text-[#706a78]">{text}</p></div></div>; })}</div>;
}

function GuideList({ icon: Icon, title, items, tone }: { icon: typeof Check; title: string; items: readonly string[]; tone: "green" | "purple" | "sand" }) {
  const colors = { green: "text-[#51703c]", purple: "text-[#5d3a86]", sand: "text-[#9a6538]" };
  return <div className="mt-7"><h3 className="text-xs font-bold uppercase tracking-[.12em] text-[#817a85]">{title}</h3><ul className="mt-3 space-y-2.5">{items.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-[#625a67]"><Icon size={17} className={`mt-1 shrink-0 ${colors[tone]}`} />{item}</li>)}</ul></div>;
}
