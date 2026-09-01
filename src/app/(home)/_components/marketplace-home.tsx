"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bird,
  Check,
  HandHelping,
  HeartHandshake,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";
import { messages } from "@/i18n/messages";
import cn from "@/lib/cn";
import { trpc } from "@/utils/trpc";
import {
  NeedCard,
  NeedCardSkeleton,
  type MarketplaceNeedItem,
} from "@/app/(flow)/needs/_components/need-card";

const copy = {
  en: {
    eyebrow: "Care continues, even when you are away",
    title: "Keep their routine happy. Care you can count on, right next door.",
    intro:
      "Whether you're traveling, working late, or just need a hand, post your custom pet care needs anytime. Love animals? Become a local sitter, share your care, and earn on your schedule.",
    post: "Post a care request",
    postService: "Publish a care service",
    heroPost: "Post your need",
    earn: "Earn as a sitter",
    trustProfile: "Clear sitter profiles",
    trustTalk: "Talk before deciding",
    communityTitle: "Two Roles, One Account · Fast Reposting",
    featureRoles: "Flexible roles: Request care or offer it—all from one account.",
    featureReuse: "One-click reuse: Start from a past post and edit only what changed.",
    browseRequestsTitle: "Browse Care Requests",
    browseRequestsDesc: "Check out pets around you that need care and see where you can lend a hand.",
    browseServicesTitle: "Browse Care Services",
    browseServicesDesc: "Explore the care and sitting services offered by pet lovers in your area.",
    needTitle: "Post your first pet care request in minutes",
    needEyebrow: "Post a need",
    needText: "Find the right person to care for your pet when you need a hand.",
    howNeed: "How to post a need",
    needSteps: [
      "Choose a care type",
      "Add your pet and care details",
      "Set your budget",
      "Review applications and choose the right sitter",
    ],
    needsTitle: "See what pets nearby need",
    needsText:
      "Browse active care requests recently posted by pet owners in the community.",
    needsError:
      "Care requests are temporarily unavailable. Please try again shortly.",
    compare: "Compare all care types",
    sitterTitle: "See what sitters nearby offer",
    sitterText:
      "Browse pet care services and sitting plans offered by neighbors in the community.",
    browseServices: "Browse Care Services",
    howService: "How to publish a service",
    serviceDevBadge: "In Development",
    finalTitle: "Need help today—or ready to help a neighbor?",
    finalText: "Use the same PetNido account on either side of the community.",
    browseNeeds: "Browse Care Requests",
    findSitter: "Find a sitter",
  },
  zh: {
    eyebrow: "即使你不在，照护也不会中断",
    title: "每一个需要托付的日常，都有懂宠物的身边人用心守护。",
    intro:
      "无论是外出旅行、忙碌加班还是日常需要帮手，随时发布专属的宠物照护需求；有空时也能成为宠物照护人，用爱心陪伴附近的毛孩子并赚取收益。",
    post: "发布照护需求",
    postService: "发布照护服务",
    heroPost: "立即发布需求",
    earn: "成为宠物照护人，开启接单",
    trustProfile: "详尽的个人专长与照护档案",
    trustTalk: "需求先沟通，双方合意再确认",
    communityTitle: "一个账号，两种角色 · 历史发布一键复用",
    featureRoles:
      "自由切换：需要帮忙时发布照护需求，有空时成为宠物照护人提供服务，无需注册其他账号。",
    featureReuse:
      "一键复用：以过往的需求或服务为模板，只需修改有变化的内容，即可再次发布。",
    browseRequestsTitle: "浏览照护需求",
    browseRequestsDesc: "浏览附近宠物主人发布的照护需求，发现可以帮上忙的机会。",
    browseServicesTitle: "浏览照护服务",
    browseServicesDesc: "浏览附近爱宠人士提供的宠物照护服务，找到适合的选择。",
    needTitle: "几分钟内发布第一条宠物照护需求",
    needEyebrow: "发布需求",
    needText: "需要帮忙时，为宠物找到合适的照护人。",
    howNeed: "如何发布需求",
    needSteps: [
      "选择照护类型",
      "添加宠物并填写照护内容",
      "设置预算",
      "查看响应，选择合适的照护人",
    ],
    needsTitle: "看看附近的宠物需要什么",
    needsText: "浏览宠物主人最近在社区发布的真实照护需求。",
    needsError: "暂时无法加载照护需求，请稍后再试。",
    compare: "比较三种照护方式",
    sitterTitle: "看看身边的照护人提供什么",
    sitterText: "浏览爱宠人士最近在社区提供的精选照护服务。",
    browseServices: "浏览照护服务",
    howService: "如何发布服务",
    serviceDevBadge: "功能开发中",
    finalTitle: "今天需要帮助，还是刚好有空帮助邻居？",
    finalText: "同一个 PetNido 账号，可以在社区的两端自由切换。",
    browseNeeds: "浏览照护需求",
    findSitter: "寻找宠物照护人",
  },
  ja: {
    eyebrow: "離れている間も、いつものお世話を",
    title: "大切なペットの「いつもの暮らし」を、ご近所のペット好き同士で支え合う。",
    intro:
      "旅行や出張、急な予定や日常のお世話まで、いつでも気軽にケアを依頼。時間に余裕があるときはシッターとして、近所のペットを見守りながら収入を得られます。",
    post: "お世話の依頼を投稿",
    postService: "お世話サービスを出品",
    heroPost: "依頼を投稿",
    earn: "シッターとして収入を得る",
    trustProfile: "得意分野と経験がわかる詳細プロフィール",
    trustTalk: "相談から始まる、安心のお世話体験",
    communityTitle: "依頼もシッターも、ひとつのアカウントで。再投稿もかんたん",
    featureRoles: "自由に切り替え：依頼もシッターも、ひとつのアカウントで。",
    featureReuse: "かんたん複製：過去の投稿をもとに、変更点だけ編集して再投稿。",
    browseRequestsTitle: "お世話の依頼を見る",
    browseRequestsDesc:
      "近くで募集中のお世話依頼を見て、力になれそうなものを探してみましょう。",
    browseServicesTitle: "お世話のサービスを探す",
    browseServicesDesc:
      "近所のペット好きが提供するサービスから、ぴったりのお世話を見つけましょう。",
    needTitle: "数分で最初のお世話依頼を投稿",
    needEyebrow: "依頼を投稿",
    needText: "助けが必要なとき、ペットを安心して任せられる人を見つけましょう。",
    howNeed: "依頼の投稿方法",
    needSteps: [
      "お世話の種類を選ぶ",
      "ペットと依頼内容を登録",
      "予算を設定",
      "応募を確認し、ぴったりの人を選ぶ",
    ],
    needsTitle: "近くのペットが必要としていること",
    needsText:
      "ペットオーナーがコミュニティに最近投稿した、公開中のお世話依頼です。",
    needsError:
      "お世話依頼を一時的に読み込めません。しばらくしてからもう一度お試しください。",
    compare: "3つのお世話方法を比べる",
    sitterTitle: "近くのシッターができること",
    sitterText:
      "ペットシッターがコミュニティで提供している、安心のお世話サービスです。",
    browseServices: "お世話サービスを見る",
    howService: "サービスの公開方法",
    serviceDevBadge: "機能開発中",
    finalTitle: "今日は助けが必要？それとも近所を助けたい？",
    finalText: "同じ PetNido アカウントで、どちらの役割も始められます。",
    browseNeeds: "お世話の依頼を見る",
    findSitter: "シッターを探す",
  },
} as const;

const comingSoonCopy = {
  en: {
    title: "Care Services in Development",
    desc: "Direct sitter service browsing and online booking features are currently in development. You can post a care need in the meantime!",
    button: "Got it",
  },
  zh: {
    title: "照护服务功能开发中",
    desc: "宠物照护人服务发布与在线预约功能正在火热开发中，敬请期待！当前您可以直接发布照护需求。",
    button: "我知道了",
  },
  ja: {
    title: "サービス機能は開発中です",
    desc: "シッターサービスの公開およびオンライン予約機能は現在開発中です。お急ぎの際はお世話依頼をご投稿ください。",
    button: "わかりました",
  },
} as const;

const careTypes = [
  {
    slug: "home-visits",
    title: { en: "Home visits", zh: "上门照护", ja: "訪問ケア" },
    label: {
      en: "A sitter visits to handle feeding, fresh water, walks, cleaning, and everyday check-ins.",
      zh: "由宠物照护人上门完成喂食、换水、散步、清洁和查看宠物状态。",
      ja: "シッターが自宅を訪れ、給餌、水替え、散歩、掃除、日常の見守りを行います。",
    },
    tags: {
      en: ["Short trips", "Familiar environment"],
      zh: ["短途出行", "熟悉环境"],
      ja: ["短期の外出", "慣れた環境"],
    },
    image: "/images/care-guides/care-type-home-feeding-v3.webp",
  },
  {
    slug: "boarding",
    title: { en: "Pet boarding", zh: "家庭寄养", ja: "ペット預かり" },
    label: {
      en: "Your pet stays in a sitter's home and receives care throughout the day and night.",
      zh: "宠物住在服务者家中，获得全天候的照料与陪伴。",
      ja: "シッター宅で過ごし、昼夜を通した見守りを受けます。",
    },
    tags: {
      en: ["Longer trips", "Day & night care"],
      zh: ["较长行程", "全天照护"],
      ja: ["長期の外出", "24時間ケア"],
    },
    image: "/images/care-guides/care-type-family-boarding-v3.webp",
  },
  {
    slug: "custom",
    title: { en: "Custom care", zh: "自定义照护", ja: "カスタムケア" },
    label: {
      en: "Ask for help with one-off needs such as transport, medication, grooming, cleaning, or setup.",
      zh: "为接送、用药、美容、清洁或设备调试等一次性需求寻求帮助。",
      ja: "通院や送迎、投薬、ブラッシング、掃除など、単発の依頼に対応。",
    },
    tags: {
      en: ["One-off needs", "Flexible plan"],
      zh: ["一次性需求", "灵活安排"],
      ja: ["単発の依頼", "柔軟なプラン"],
    },
    image: "/images/care-guides/care-type-custom-help-v3.webp",
  },
];

function ServiceCardSkeletonItem({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#d6c7b5] bg-white/95 p-0 shadow-xs",
        className,
      )}
    >
      <div>
        {/* Compact 16:10 Image Placeholder */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e2d2c1] animate-pulse">
          <div className="absolute left-2.5 top-2.5 h-3.5 w-12 rounded-full bg-[#caa891]/85" />
          <div className="absolute right-2.5 top-2.5 h-3.5 w-9 rounded-full bg-[#caa891]/85" />
        </div>

        {/* Card Body Skeleton */}
        <div className="p-3 space-y-2 animate-pulse">
          {/* Title Placeholder */}
          <div className="space-y-1">
            <div className="h-3 w-4/5 rounded bg-[#c5b19d]" />
            <div className="h-2.5 w-3/5 rounded bg-[#decbb9]" />
          </div>

          {/* Sitter Snapshot Placeholder */}
          <div className="flex items-center justify-between gap-2 border-b border-[#ebdccd] pb-2 pt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-6 w-6 rounded-full bg-[#caa891] shrink-0" />
              <div className="h-2.5 w-12 rounded bg-[#decbb9]" />
            </div>
            <div className="h-2.5 w-10 rounded bg-[#c5b19d]" />
          </div>

          {/* Tags Placeholder */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            <div className="h-3.5 w-9 rounded-full bg-[#e3d3c1]" />
            <div className="h-3.5 w-11 rounded-full bg-[#e3d3c1]" />
          </div>
        </div>
      </div>

      {/* Card Bottom Button Skeleton */}
      <div className="px-3 pb-3 pt-0 animate-pulse">
        <div className="h-6 w-full rounded-lg bg-[#e3d3c1]" />
      </div>
    </div>
  );
}

export function MarketplaceHome() {
  const { lang, t } = useLanguage();
  const text = copy[lang];
  const router = useRouter();
  const publicPrefix = `/${lang}`;

  const isCJK = lang === "zh" || lang === "ja";
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const marketplaceCopy = messages[lang].core.marketplace;
  const featuredNeeds = trpc.marketplaceNeed.list.useQuery(
    { limit: 5 },
    {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  );

  const startNeed = () => router.push("/needs/create");

  return (
    <div className="bg-[#fffdf9] text-[#2f2933]">
      {/* Hero Section */}
      <section className="site-shell py-6 md:py-8">
        <div className="relative flex flex-col overflow-hidden rounded-[28px] bg-[#f6efe7] border border-[#ece3d6] shadow-xs md:block md:min-h-[580px] lg:min-h-[610px]">
          {/* Seamless Image Container with edge fade mask */}
          <div className="relative h-[270px] w-full shrink-0 overflow-hidden sm:h-[310px] md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[54%] lg:w-[52%] [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)] md:[mask-image:linear-gradient(to_right,transparent_0%,black_22%,black_100%)]">
            <Image
              src="/images/home/petnido-hero-doodle.png"
              alt="A pet sitter caring for a Shiba Inu and tabby cat in a bright home, surrounded by hand-drawn care doodles"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover object-[78%_center] md:object-[72%_center] lg:object-[76%_center]"
            />
          </div>

          {/* Left Column: Text & Buttons Content */}
          <div className="relative z-10 flex w-full flex-col justify-center px-6 py-7 sm:px-10 sm:py-9 md:min-h-[580px] md:w-[52%] lg:min-h-[610px] lg:w-[50%] md:px-10 md:py-12 lg:px-14">
            <h1
              className={cn(
                "w-full text-[#392847]",
                isCJK
                  ? "font-bold text-2xl sm:text-4xl md:text-[2.5rem] lg:text-[3.1rem] leading-[1.38] sm:leading-[1.3] tracking-tight"
                  : "font-bold text-3xl sm:text-5xl md:text-[3rem] lg:text-[3.65rem] leading-[1.2] sm:leading-[1.15] tracking-[-0.02em]",
              )}
            >
              {text.title}
            </h1>
            <p className="mt-3.5 sm:mt-4 md:mt-6 w-full text-base leading-7 text-[#655d69] md:text-lg md:leading-8">
              {text.intro}
            </p>
            <div className="mt-6 sm:mt-7 md:mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startNeed}
                className="inline-flex h-13 sm:h-14 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-7 text-sm font-bold text-white shadow-[0_16px_34px_-20px_rgba(93,58,134,.8)] transition hover:bg-[var(--primary-hover)] cursor-pointer"
              >
                {text.heroPost}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => setComingSoonOpen(true)}
                className="inline-flex h-13 sm:h-14 items-center justify-center gap-2 rounded-xl border border-[#b8a9c2] bg-white/80 px-7 text-sm font-bold text-[var(--primary)] backdrop-blur-xs shadow-2xs transition hover:border-[var(--primary)] hover:bg-white cursor-pointer"
              >
                {text.earn}
              </button>
            </div>
            <div className="mt-8 hidden flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#655d69] md:flex">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--primary)]" />
                {text.trustProfile}
              </span>
              <span className="inline-flex items-center gap-2">
                <HeartHandshake size={16} className="text-[var(--primary)]" />
                {text.trustTalk}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section: Compact, Slim Dual-Role & Fast Gateway Section */}
      <section className="site-shell py-6 md:py-8">
        <div className="grid gap-6 rounded-2xl md:rounded-[24px] border border-[#c9dfa7] bg-[#dcebc3] p-5 sm:p-6 md:p-7 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-8 shadow-xs">
          {/* Left Block: Compact Highlights */}
          <div className="flex flex-col justify-center space-y-3">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#223116]">
              {text.communityTitle}
            </h2>
            <ul className="mt-1 space-y-2 text-xs sm:text-sm text-[#3b4e28]">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2d4218] text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>{text.featureRoles}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2d4218] text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>{text.featureReuse}</span>
              </li>
            </ul>
          </div>

          {/* Right Block: Two Compact Gateway Cards */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Card 1: Browse Care Requests */}
            <Link
              href={`${publicPrefix}/needs`}
              className="group flex h-full flex-col justify-between rounded-xl md:rounded-2xl border border-white/75 bg-white/70 backdrop-blur-xs p-4.5 sm:p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:bg-white hover:border-white hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#253915] shadow-2xs">
                      <MessageCircleQuestion size={18} />
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#202d15] truncate transition">
                      {text.browseRequestsTitle}
                    </h3>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#4a6136] group-hover:bg-[#253915] group-hover:text-white transition">
                    <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-[#4a5f37] leading-relaxed">
                  {text.browseRequestsDesc}
                </p>
              </div>
            </Link>

            {/* Card 2: Browse Care Services */}
            <Link
              href={`${publicPrefix}/services`}
              className="group flex h-full flex-col justify-between rounded-xl md:rounded-2xl border border-white/75 bg-white/70 backdrop-blur-xs p-4.5 sm:p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:bg-white hover:border-white hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#253915] shadow-2xs">
                      <HandHelping size={18} />
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#202d15] truncate transition">
                      {text.browseServicesTitle}
                    </h3>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#4a6136] group-hover:bg-[#253915] group-hover:text-white transition">
                    <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-[#4a5f37] leading-relaxed">
                  {text.browseServicesDesc}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Need Creation Steps Section */}
      <section className="site-shell py-6 md:py-8">
        <div className="mx-auto grid max-w-[1040px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-[72px]">
          <div>
            <h2 className="w-full text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-[#392847]">
              {text.needTitle}
            </h2>
            <p className="mt-4 text-base sm:text-lg font-medium leading-relaxed text-[#625a67]">
              {text.needText}
            </p>
            <ol className="mt-8 space-y-4">
              {text.needSteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[32px_1fr] items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9ddf0] text-xs font-bold text-[var(--primary)]">{index + 1}</span>
                  <p className="font-bold leading-6 text-[#392847]">{step}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={startNeed}
              className="mt-9 inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              {text.post}
              <ArrowRight size={17} />
            </button>
          </div>

          <div>
            <div className="rounded-[28px] bg-[#eee9f6] p-5 sm:p-6 md:p-7">
              <div className="grid gap-4">
                {careTypes.map((care) => (
                  <article
                    key={care.slug}
                    className="grid grid-cols-[104px_1fr] items-center gap-5 rounded-[18px] bg-white p-3.5 shadow-[0_10px_30px_-26px_rgba(57,40,71,.45)] sm:grid-cols-[118px_1fr]"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[13px]">
                      <Image
                        src={care.image}
                        alt={care.title[lang]}
                        fill
                        sizes="118px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 pr-2">
                      <h3 className="text-base font-bold leading-5 text-[#392847] md:text-lg">
                        {care.title[lang]}
                      </h3>
                      <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#706a78]">
                        {care.label[lang]}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {care.tags[lang].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#f2edf5] px-2.5 py-1 text-[11px] font-bold text-[#66516f]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href={`${publicPrefix}/care-types`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
              >
                {text.compare}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Needs Section */}
      <section className="bg-[#f4f0f6] py-10 md:py-14">
        <div className="site-shell">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-[#392847]">
                {text.needsTitle}
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#706a78]">
                {text.needsText}
              </p>
            </div>
            <Link
              href={`${publicPrefix}/needs`}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
            >
              <span>{text.browseNeeds}</span>
              <ArrowRight size={17} />
            </Link>
          </div>

          {featuredNeeds.isLoading ? (
            <div
              className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              aria-label={marketplaceCopy.searchingNeeds}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <NeedCardSkeleton key={index} />
              ))}
            </div>
          ) : featuredNeeds.error ? (
            <p
              role="alert"
              className="mt-10 rounded-2xl bg-white p-6 text-center text-sm font-bold text-[#706a78]"
            >
              {text.needsError}
            </p>
          ) : featuredNeeds.data?.items.length ? (
            <div
              className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              aria-label={marketplaceCopy.requestResults}
            >
              {featuredNeeds.data.items.slice(0, 5).map((need, index) => (
                <NeedCard
                  key={need.publicId}
                  need={need as MarketplaceNeedItem}
                  lang={lang}
                  prefix={publicPrefix}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-2xl bg-white p-6 text-center text-sm font-bold text-[#706a78]">
              {marketplaceCopy.noNeeds}
            </p>
          )}
        </div>
      </section>

      {/* Services Showcase Section with 5 Clear Skeletons & Wireframe Notice Overlay */}
      <section className="bg-[#efe7dc] py-10 md:py-14">
        <div className="site-shell">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-[#392847]">
                {text.sitterTitle}
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#706a78]">
                {text.sitterText}
              </p>
            </div>
            <Link
              href={`${publicPrefix}/services`}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]"
            >
              <span>{text.browseServices}</span>
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Container with 5 Clear Skeletons & Wireframe Notice Overlay */}
          <div className="relative mt-8">
            {/* 1. Five Clear Skeleton Frame Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 opacity-85 select-none pointer-events-none">
              <ServiceCardSkeletonItem />
              <ServiceCardSkeletonItem />
              <ServiceCardSkeletonItem />
              <ServiceCardSkeletonItem />
              <ServiceCardSkeletonItem className="col-span-2 sm:col-span-1" />
            </div>

            {/* 2. Outlined Wireframe In-Development Notice Box */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-5 rounded-2xl bg-[#efe7dc]/35 backdrop-blur-[1px]">
              <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-[#9c846f] bg-[#fffdfa]/95 p-5 sm:p-6 text-center shadow-md backdrop-blur-md">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider text-[var(--primary)] uppercase mb-1.5">
                  <Sparkles size={15} />
                  <span>{text.serviceDevBadge}</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#392847]">
                  {comingSoonCopy[lang].title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-[13px] text-[#706a78] leading-relaxed max-w-sm mx-auto">
                  {comingSoonCopy[lang].desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="site-shell py-6 md:py-8">
        <div className="relative overflow-hidden rounded-[24px] bg-[var(--primary)] px-6 py-10 sm:px-10 sm:py-12 md:px-12 md:py-14 text-white shadow-xs">
          <div className="relative z-10 w-full">
            <h2
              className={cn(
                "w-full font-bold text-white leading-snug",
                isCJK
                  ? "text-xl sm:text-2xl md:text-3xl tracking-tight"
                  : "text-2xl sm:text-3xl md:text-4xl tracking-tight",
              )}
            >
              {text.finalTitle}
            </h2>
            <p className="mt-2.5 sm:mt-3 w-full text-sm sm:text-base text-white/80 leading-relaxed">
              {text.finalText}
            </p>
            <div className="mt-6 sm:mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startNeed}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[var(--primary)] shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                <span>{text.post}</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setComingSoonOpen(true)}
                className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-xs transition hover:bg-white/20 hover:border-white/60 cursor-pointer"
              >
                <span>{text.postService}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <Bird
            className="pointer-events-none absolute -bottom-10 right-3 h-52 w-52 rotate-[-8deg] text-white/5 md:right-12 md:h-64 md:w-64"
            strokeWidth={1.2}
          />
        </div>
      </section>

      {/* Coming Soon Modal for Sitter Service Publishing (from Hero, Banner, or other triggers) */}
      {comingSoonOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setComingSoonOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setComingSoonOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[var(--primary)] mb-4 shadow-2xs">
              <Sparkles size={28} />
            </div>

            <h3 className="text-xl font-bold text-[#2f2933]">
              {comingSoonCopy[lang].title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-[#655d69]">
              {comingSoonCopy[lang].desc}
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setComingSoonOpen(false)}
                className="w-full sm:w-auto min-w-[140px] rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--primary-hover)] transition cursor-pointer"
              >
                {comingSoonCopy[lang].button}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
