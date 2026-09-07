"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { PiHouseLine, PiWarehouse, PiSparkle } from "react-icons/pi";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  ListChecks,
  PawPrint,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

import { usePageLanguage } from "@/components/providers/language-provider";

type Lang = "en" | "zh" | "ja";
export type CareMode = "home-visits" | "boarding" | "custom";
type Copy = Record<Lang, string>;

type CareScene = {
  title: Copy;
  text: Copy;
  image: string;
};

type Mode = {
  title: Copy;
  short: Copy;
  intro: Copy;
  hero: string;
  scenes: CareScene[];
  fit: Copy[];
  notFit: Copy[];
  prepare: Copy;
  sitterIntro: Copy;
  sitterFit: Copy;
  sitterThink: Copy;
  sitterTrust: Copy;
  icon: IconType;
  tone: string;
};

const common = {
  en: {
    breadcrumbHome: "Home",
    breadcrumbCareTypes: "Care Types",
    hubEyebrow: "Care Type Navigator",
    hubTitle: "Three Ways to Care for Your Pet",
    hubSub: "Choose between home visits, boarding, or custom assistance depending on your trip duration, pet personality, and daily routine.",
    need: "Post a Need",
    offer: "Offer Care",
    learn: "Explore Details",
    compare: "Compare All Types",
    otherBadge: "Explore Options",
    otherHeading: "Need a different kind of care?",
    otherSub: "Compare all three care types to find the best match for your pet and schedule.",
    viewHub: "Compare All Care Types",
    scenarioLabel: "Example Scenarios",
    keyPoints: "Key Considerations",
  },
  zh: {
    breadcrumbHome: "首页",
    breadcrumbCareTypes: "照护方式",
    hubEyebrow: "照护方式导航",
    hubTitle: "三种贴合实际的宠物照护方式",
    hubSub: "根据出行天数、宠物性格与生活习惯，选择上门喂养、家庭寄宿或个性化定制协助。",
    need: "发布此类需求",
    offer: "提供此类服务",
    learn: "查看详细说明",
    compare: "对比三种方式",
    otherBadge: "更多选择",
    otherHeading: "不符合当前情况？探索其他照护方式",
    otherSub: "根据出行天数与宠物性格，比较全部三种照护方式，找到最合适托付方案。",
    viewHub: "返回对比总览",
    scenarioLabel: "常见适用场景",
    keyPoints: "核心关注点",
  },
  ja: {
    breadcrumbHome: "ホーム",
    breadcrumbCareTypes: "ケア方法",
    hubEyebrow: "ケア方法ナビ",
    hubTitle: "状況に合わせて選べる3つのお世話スタイル",
    hubSub: "留守の期間、ペットの性格、日常のリズムに合わせて、訪問給餌・家庭預かり・カスタム依頼から選べます。",
    need: "この依頼を投稿",
    offer: "このサービスを提供",
    learn: "詳細を見る",
    compare: "3つの方法を比較",
    otherBadge: "他の選択肢",
    otherHeading: "状況に合いませんか？他のケア方法を見る",
    otherSub: "お出かけの日数やペットの性格に合わせて、最適な方法を比較検討できます。",
    viewHub: "すべてのケア方法を比較",
    scenarioLabel: "代表的な利用シーン",
    keyPoints: "主な検討ポイント",
  },
} as const;

/* =========================================================================
   1. HOME-VISITS DATA & COPIES (ORIGINAL & UNTOUCHED STANDARD)
   ========================================================================= */

const homeVisitIntroCopy = {
  en: {
    pageTitle: "Home Feeding & Visits",
    pageSubtitle:
      "The pet stays in its familiar home while a sitter visits at agreed times to continue its feeding, cleaning, walking, and daily routine.",
    sectionBadge: "Overview & Scenarios",
    sectionTitle: "When does it fit, and what are typical scenarios?",
    sectionSub:
      "Assess your travel schedule, pet temperament, and supplies to decide if home visits fit best.",
    fitTitle: "Best Suited for These Situations",
    fitItems: [
      { label: "Short trips", desc: "Brief travel or busy workdays without the stress of relocating your pet." },
      { label: "Less stress", desc: "Pets that feel anxious around new spaces, odors, or unfamiliar animals." },
      { label: "Fixed setups", desc: "Habitats, bird cages, and heavy supplies that are difficult to move." },
    ],
    fitQuote: "💡 Staying in a familiar environment minimizes anxiety and preserves healthy habits.",
    scenesTitle: "Typical Care Scenarios",
  },
  zh: {
    pageTitle: "上门喂养与照护",
    pageSubtitle:
      "宠物留在熟悉的家中，照护人按约定时间上门，延续原有的喂食、清洁、散步与作息习惯。",
    sectionBadge: "适用场景与日常",
    sectionTitle: "适合哪些情况？典型的上门场景有哪些？",
    sectionSub:
      "结合出行安排、宠物性格与生活设施，判断上门照护是否最适合当下情况。",
    fitTitle: "特别适合以下情况",
    fitItems: [
      { label: "短期外出", desc: "短途出行或日常繁忙，无需折腾宠物更换居所与环境。" },
      { label: "减少应激", desc: "宠物对陌生空间、气味或其他动物敏感，在熟悉家中更安心。" },
      { label: "用品难搬", desc: "猫爬架、鸟笼、大型水族箱等生活用具固定且不便搬动。" },
    ],
    fitQuote: "💡 留在熟悉的环境中生活，能最大程度降低分离焦虑与水土不服风险。",
    scenesTitle: "日常上门照护场景",
  },
  ja: {
    pageTitle: "訪問給餌・お世話",
    pageSubtitle:
      "ペットは住み慣れた自宅で過ごし、シッターが指定時間にお伺いして給餌、給水、トイレ掃除、スキンシップなどの日常ケアを行います。",
    sectionBadge: "概要と利用シーン",
    sectionTitle: "向いている場面とよくあるお世話シーン",
    sectionSub:
      "外出予定、ペットの性格、生活環境に合わせて最適なケア方法を判断しましょう。",
    fitTitle: "こんな場面に最適です",
    fitItems: [
      { label: "短い外出", desc: "短期間の旅行や急な仕事でも、環境を変えずにケアを継続できます。" },
      { label: "ストレス軽減", desc: "新しい環境や匂い、他の動物が苦手なペットも自宅なら安心です。" },
      { label: "設備の移動が困難", desc: "大型ケージや鳥かご、固定用品の移動や設置が大変な場合に最適です。" },
    ],
    fitQuote: "💡 慣れた自宅で過ごすことで、ペットの安心感と生活リズムを守ります。",
    scenesTitle: "よくあるお世話のシーン",
  },
} as const;

const homeVisitExampleCopy = {
  en: {
    sectionBadge: "Request Blueprint",
    title: "A Clear Blueprint for Home-Visit Requests",
    intro:
      "It doesn't need to be complicated. Clearly structuring schedule, pets, prioritized tasks, and a transparent budget helps sitters assess and accept with confidence.",
    requestTemplateLabel: "Standard Request Template",
    exampleBadge: "Example Request",
    requestTitle: "Home visits | Setagaya, Tokyo | 2 rabbits",
    dateSpan: "Sep 5 – Sep 20, 2026",
    dateLabel: "Service Dates",
    takeawaysTitle: "Why is this a great request?",
    annotationPrefix: "Tip",
    scheduleHeading: "Schedule & Cadence",
    freqLabel: "Frequency",
    freqVal: "Every 2 days",
    dailyLabel: "Per Service Day",
    dailyVal: "1 visit",
    timeLabel: "Preferred Time",
    timeVal: "18:00–20:00 (Evening)",
    totalVisitsLabel: "Total Visits",
    totalVisitsVal: "8 visits total",
    petsHeading: "Pet Profiles",
    pets: [
      {
        name: "Snowball",
        tag: "Netherland Dwarf",
        meta: "3 yrs · Male (Neutered) · 1.05 kg",
        notes: "Gentle and friendly, loves forehead strokes. Uses the right-side feeder and hay rack.",
        image: "/images/care-guides/example-rabbit-snowball.jpg",
      },
      {
        name: "Caramel",
        tag: "Holland Lop",
        meta: "2 yrs · Female (Neutered) · 1.40 kg",
        notes: "Curious and agile. Double-check that both pen safety latches are fastened before leaving.",
        image: "/images/care-guides/example-rabbit-caramel.jpg",
      },
    ],
    tasksHeading: "Care Tasks Table",
    tableHeaderTarget: "Target",
    tasks: [
      {
        title: "Check room temp, humidity & health",
        priority: "MUST",
        desc: "Check thermometer, water level & droppings; report any anomalies immediately.",
      },
      {
        title: "Refresh Timothy hay, pellets & water",
        priority: "MUST",
        desc: "Top up hay rack, add measured pellet portions, and replace drinking water.",
      },
      {
        title: "Clean litter box, trays & play area",
        priority: "MUST",
        desc: "Empty waste, change absorbent pads, refresh pine pellets & return tools.",
      },
      {
        title: "Supervised pen exercise & companionship",
        priority: "NICE",
        desc: "If time permits after essentials, allow 15 mins of supervised pen playtime.",
      },
      {
        title: "Lock confirmation & visit report",
        priority: "MUST",
        desc: "Verify pen latches and front door lock twice; send photos, video & summary.",
      },
    ],
    additionalNotesLabel: "Additional Care Notes",
    additionalNotes:
      "Key handover via smart lockbox by the door. Shoe covers and hand sanitizer are in the entryway; Timothy hay and pellets are on the 2nd shelf of the cabinet; please dispose of litter waste in the hallway bin upon departure.",
    budgetLabel: "Budget Structure",
    budgetFormula: "Care fee ¥5,000 + Travel allowance ¥800 = ¥5,800 / visit",
    budgetCalculation: "8 visits × ¥5,800",
    budgetTotal: "Total Budget: ¥46,400",
    mustBadge: "MUST",
    niceBadge: "OPTIONAL",
    takeaways: [
      {
        title: "Clear Visit Cadence & Time Window",
        desc: "Specifying \"Every 2 days\" and \"18:00–20:00 arrival\" lets sitters quickly assess their schedule and route without tedious back-and-forth messages.",
      },
      {
        title: "Key Pet Habits & Safety Reminders",
        desc: "Beyond breed and age, it details feeder habits and pen double-latch safety reminders, eliminating care risks upfront.",
      },
      {
        title: "Prioritized Tasks & Concrete Steps",
        desc: "Breaks down feeding, cleaning, checks, and playtime with clear MUST vs. OPTIONAL priorities, setting exact expectations.",
      },
      {
        title: "Transparent Rates & Itemized Breakdown",
        desc: "Itemizing base care fees and travel allowances per visit with an upfront total calculation gives sitters immediate financial clarity.",
      },
    ],
    ctaText: "Explore full interactive request preview",
  },
  zh: {
    sectionBadge: "需求发布范例",
    title: "一条清晰规范的上门照护需求范本",
    intro:
      "不需要长篇大论，把时间日程、宠物档案、任务表格和透明预算说清楚即可。",
    requestTemplateLabel: "规范范本：上门照护需求模板",
    exampleBadge: "示例需求",
    requestTitle: "上门照护｜东京都世田谷区｜2只兔子",
    dateSpan: "2026年9月5日 – 9月20日",
    dateLabel: "服务日期",
    takeawaysTitle: "为什么这是一条好的需求？",
    annotationPrefix: "发布技巧",
    scheduleHeading: "日程与频次",
    freqLabel: "上门频次",
    freqVal: "每 2 天 1 次",
    dailyLabel: "单日频次",
    dailyVal: "当天上门 1 次",
    timeLabel: "希望时间",
    timeVal: "18:00–20:00 到达",
    totalVisitsLabel: "总计上门",
    totalVisitsVal: "共 8 次上门",
    petsHeading: "照护对象档案",
    pets: [
      {
        name: "雪球 (Snowball)",
        tag: "侏儒兔",
        meta: "3岁 · 公 (已绝育) · 1.05 kg",
        notes: "性格温顺亲人，喜欢被轻抚额头。使用右侧食盆与草架。",
        image: "/images/care-guides/example-rabbit-snowball.jpg",
      },
      {
        name: "焦糖 (Caramel)",
        tag: "垂耳兔",
        meta: "2岁 · 母 (已绝育) · 1.40 kg",
        notes: "好奇心强且行动敏捷。离开前请务必确认围栏双重安全锁已扣好。",
        image: "/images/care-guides/example-rabbit-caramel.jpg",
      },
    ],
    tasksHeading: "照护任务清单",
    tableHeaderTarget: "对象",
    tasks: [
      {
        title: "检查室温湿度、精神状态与排便",
        priority: "MUST",
        desc: "确认温湿度计读数、饮水量与便便形态，发现软便或异常立即反馈。",
      },
      {
        title: "补充提摩西一割牧草、定量兔粮与纯净水",
        priority: "MUST",
        desc: "补满草架，添加定量专用兔粮，并倒掉旧水彻底更换新鲜饮用水。",
      },
      {
        title: "清理兔厕所、托盘与围栏活动区",
        priority: "MUST",
        desc: "倒掉废弃垫料，更换吸水尿垫，添加消臭木粒，并将工具物归原位。",
      },
      {
        title: "围栏内放风活动与看护互动",
        priority: "NICE",
        desc: "在完成基础喂养清洁后，如时间充裕可在围栏内陪伴放风互动 15 分钟。",
      },
      {
        title: "双重锁门确认与照护报告发送",
        priority: "MUST",
        desc: "二次检查围栏锁与防盗门锁闭状态；拍照、录制短视频并发送今日小结。",
      },
    ],
    additionalNotesLabel: "补充照护备注",
    additionalNotes:
      "门口配有智能密码钥匙盒交付钥匙；玄关备有鞋套与免洗消毒凝胶；提摩西草和粮在储物柜第2层；垃圾请在离开时投入走廊专用垃圾桶。",
    budgetLabel: "预算构成",
    budgetFormula: "照护报酬 ¥5,000 + 交通补贴 ¥800 = 单次 ¥5,800",
    budgetCalculation: "共 8 次 × ¥5,800",
    budgetTotal: "总预算：¥46,400",
    mustBadge: "必须",
    niceBadge: "尽量",
    takeaways: [
      {
        title: "上门频次与到达时间明确",
        desc: "写清“每2天1次”和“18:00–20:00到达”，照护人能一眼判断自己的排期与交通路线，无需反复私信沟通。",
      },
      {
        title: "性格、习惯与安全细节完备",
        desc: "不仅写明品种年龄，还详细注明食盆位置、围栏双锁等安全要点，提前排除入户照护风险。",
      },
      {
        title: "任务优先级与具体步骤清晰",
        desc: "将喂食、清洁、观察、放风拆解为“必须”与“尽量”，让照护人清楚当天的作业顺序与核心期待。",
      },
      {
        title: "费用构成清晰，报酬与补贴透明拆分",
        desc: "将基础照护费与交通补贴清晰拆分，写明单次与总计费用，让服务者一眼看清收益，大幅提升接单意愿与信任度。",
      },
    ],
    ctaText: "查看完整可交互的需求范例",
  },
  ja: {
    sectionBadge: "依頼サンプル",
    title: "わかりやすい訪問ケア依頼の標準モデル",
    intro:
      "長文は不要です。日程、ペット情報、優先タスク表、明確な予算を整理することで、シッターもスムーズに引き受けられます。",
    requestTemplateLabel: "標準テンプレート：訪問ケア依頼",
    exampleBadge: "依頼サンプル",
    requestTitle: "訪問ケア｜東京都世田谷区｜うさぎ2匹",
    dateSpan: "2026年9月5日 – 9月20日",
    dateLabel: "サービス日程",
    takeawaysTitle: "なぜこれが良い依頼なのか？",
    annotationPrefix: "ポイント",
    scheduleHeading: "日程と頻度",
    freqLabel: "訪問頻度",
    freqVal: "2日ごとに1回",
    dailyLabel: "当日の回数",
    dailyVal: "当日1回訪問",
    timeLabel: "希望時間",
    timeVal: "18:00–20:00 到着",
    totalVisitsLabel: "合計訪問数",
    totalVisitsVal: "全8回",
    petsHeading: "ペットプロフィール",
    pets: [
      {
        name: "スノーボール (Snowball)",
        tag: "ネザーランドドワーフ",
        meta: "3歳 · オス (去勢済) · 1.05 kg",
        notes: "穏やかで人懐っこく、額を撫でられるのが好きです。右側の食器とチモシーフィーダーを使用。",
        image: "/images/care-guides/example-rabbit-snowball.jpg",
      },
      {
        name: "キャラメル (Caramel)",
        tag: "ホーランドロップ",
        meta: "2歳 · メス (避妊済) · 1.40 kg",
        notes: "好奇心旺盛で活発。退室前にサークルの二重ロックが掛かっているか必ずご確認ください。",
        image: "/images/care-guides/example-rabbit-caramel.jpg",
      },
    ],
    tasksHeading: "お世話タスク表",
    tableHeaderTarget: "対象",
    tasks: [
      {
        title: "温湿度・健康状態・排便チェック",
        priority: "MUST",
        desc: "温湿度計、飲水量、糞の形状を確認。軟便や異常があればすぐにメッセージで報告。",
      },
      {
        title: "チモシー牧草・ペレット・給水補充",
        priority: "MUST",
        desc: "チモシーを満杯にし、計量したペレットを与え、給水器の水を新鮮な水に全量交換。",
      },
      {
        title: "トイレ・トレイ・サークル内清掃",
        priority: "MUST",
        desc: "汚れたシートを廃棄し、吸水シーツと消臭ウッドペレットをセット、用具を定位置に戻す。",
      },
      {
        title: "サークル内での部屋んぽ・見守り",
        priority: "NICE",
        desc: "基本のお世話完了後、時間に余裕があればサークル内で15分間見守り・スキンシップ。",
      },
      {
        title: "二重施錠確認と完了報告の送信",
        priority: "MUST",
        desc: "サークル扉と玄関鍵の施錠を二重確認。写真・動画とともに本日のレポートを送信。",
      },
    ],
    additionalNotesLabel: "補足情報",
    additionalNotes:
      "玄関ドア横のスマートキーボックスにて鍵受け渡し。玄関に使い捨てスリッパと手指消毒剤を用意。チモシーとフードは収納棚2段目。ゴミは退室時に指定ダストボックスへ。",
    budgetLabel: "予算設定",
    budgetFormula: "ケア報酬 ¥5,000 + 交通費 ¥800 = 1回 ¥5,800",
    budgetCalculation: "全8回 × ¥5,800",
    budgetTotal: "全8回 合計予算：¥46,400",
    mustBadge: "必須",
    niceBadge: "任意",
    takeaways: [
      {
        title: "訪問頻度と到着時間帯が明確",
        desc: "「2日ごとに1回」「18:00〜20:00到着」を明記することで、シッターが自身のスケジュールや移動ルートを即座に判断できます。",
      },
      {
        title: "性格・習性と安全対策を具体的に記載",
        desc: "年齢や品種だけでなく、食器の配置やサークルの二重ロックなど安全管理の要点を記載し、不安要素を事前に解消。",
      },
      {
        title: "タスクの優先度と実施要点が明確",
        desc: "給餌、清掃、見守りなどを細分化し、【必須】と【任意】を分けることで、当日の作業手順と期待値が明確に伝わります。",
      },
      {
        title: "明朗な予算構成と報酬・交通費の内訳",
        desc: "1回あたりの基本ケア報酬と交通費を明確に分け、合計金額を明示することで、シッターが納得してスムーズに応募できます。",
      },
    ],
    ctaText: "インタラクティブな依頼完成例を見る",
  },
} as const;

const homeVisitRoleCopy = {
  en: {
    needEyebrow: "For Pet Owners",
    needTitle: "Posting a Home Visit? Follow These 3 Steps",
    needSub: "Assess pet and home readiness, structure clear tasks and budget, and coordinate secure key handover.",
    steps: [
      {
        title: "Assess Fit & Home Readiness",
        points: [
          { label: "Trip & Solitude", text: "Confirm trip duration and ensure your pet can comfortably and safely stay alone between visits." },
          { label: "Home Readiness", text: "Verify climate controls, check pet cameras, and stow away personal valuables beforehand." },
        ],
      },
      {
        title: "Structure Tasks & Schedule",
        points: [
          { label: "Profiles & Tasks", text: "Detail pet habits, safety reminders, and break down clear MUST vs. OPTIONAL tasks." },
          { label: "Schedule & Budget", text: "Specify exact visit windows, general location, and transparent pricing for quick sitter assessment." },
        ],
      },
      {
        title: "Coordinate Handover & Safety",
        points: [
          { label: "Access & Logistics", text: "Coordinate lockbox or key handover and clarify supply storage and trash disposal routes." },
          { label: "Updates & Emergency", text: "Agree on photo/video visit check-in formats and prepare local emergency contacts and emergency vet info." },
        ],
      },
    ],
    offerEyebrow: "For Care Providers",
    offerTitle: "Offering Home Visits? Uphold These 3 Standards",
    offerSub: "Define your travel radius and species limits, demonstrate authentic experience, and follow transparent in-home safety practices.",
    offerSteps: [
      {
        title: "Define Scope & Special Skills",
        points: [
          { label: "Area & Pet Types", text: "Set your service radius and travel distance, and state clearly which pet species you handle (cats, rabbits, birds, etc.)." },
          { label: "Skills & Limits", text: "State whether you can give medication, groom, or assist with vet emergencies; never accept needs beyond your comfort zone." },
        ],
      },
      {
        title: "Showcase Experience & Reliability",
        points: [
          { label: "Background & Photos", text: "Detail your pet-owning background and hands-on care experience, sharing authentic care photos to build trust." },
          { label: "Safety & Stress Awareness", text: "Demonstrate your familiarity with anti-escape checks and stress prevention, conveying professionalism and reliability." },
        ],
      },
      {
        title: "Handover, Cameras & Updates",
        points: [
          { label: "Access & Cameras", text: "Confirm your comfort with lockbox/key handover, indoor pet cameras, and home privacy boundaries." },
          { label: "Updates & Emergencies", text: "Clarify photo/video update timings for every visit, and communicate promptly if an unexpected situation arises." },
        ],
      },
    ],
  },
  zh: {
    needEyebrow: "主人发布篇",
    needTitle: "想发布上门照护？提前做好这三步准备",
    needSub: "评估宠物与居家适合度，梳理任务日程与透明预算，约定好钥匙与安全交接。",
    steps: [
      {
        title: "评估适合度与居家准备",
        points: [
          { label: "行程与独处", text: "确认离开天数，判断宠物能否在两次上门之间安全独处。" },
          { label: "环境与设备", text: "提前调试空调温湿度、检查监控，并收好贵重与私人用品。" },
        ],
      },
      {
        title: "结构化梳理任务与日程",
        points: [
          { label: "档案与习惯", text: "注明宠物性格、避坑细节，明确必须完成与尽量完成的任务。" },
          { label: "时间与预算", text: "写清期望到达时间段、大致街区及透明的单次预算与交通补贴。" },
        ],
      },
      {
        title: "约定安全交接与应急方案",
        points: [
          { label: "钥匙与动线", text: "约定密码盒或钥匙交付，说明用品存放位置及垃圾处理动线。" },
          { label: "汇报与就医", text: "确认每次上门图文/视频打卡形式，留好紧急联系人与就近就医预案。" },
        ],
      },
    ],
    offerEyebrow: "服务者篇",
    offerTitle: "想提供上门服务？严格遵守这三项准则",
    offerSub: "明确接单范围与能力边界，展示真实经验与安全意识，恪守入户安全与透明汇报。",
    offerSteps: [
      {
        title: "明确服务范围与接单底线",
        points: [
          { label: "范围与物种", text: "设定常驻区域与合理交通距离，写明擅长照护的物种（猫、兔、鸟等）。" },
          { label: "技能与边界", text: "注明是否可喂药、特殊护理；严禁接下超出自身掌控范围的高危需求。" },
        ],
      },
      {
        title: "展示真实经验与安全意识",
        points: [
          { label: "履历与照片", text: "详述养宠年限与实际照护经验，上传真实生活与照护环境照片建立信任。" },
          { label: "防逃逸与应激", text: "展现开关门防逃逸、防应激轻柔接触等专业操作意识，让主人安心托付。" },
        ],
      },
      {
        title: "规范入户交接与及时反馈",
        points: [
          { label: "钥匙与监控", text: "严格配合钥匙交接规范，尊重主人家庭监控与隐私边界。" },
          { label: "打卡与应急", text: "每次上门按时发送照片/视频与总结，遇宠物身体异常第一时间通报。" },
        ],
      },
    ],
  },
  ja: {
    needEyebrow: "飼い主向けガイド",
    needTitle: "訪問ケアを依頼する前の3つの準備",
    needSub: "ペットと自宅の適性を確認し、タスクと予算を整理し、鍵と緊急連絡の体制を整えましょう。",
    steps: [
      {
        title: "適性と自宅環境の確認",
        points: [
          { label: "留守期間と適性", text: "訪問と訪問の間を安全に留守番できる性格か確認します。" },
          { label: "室温と見守り", text: "エアコンの温度設定、見守りカメラの動作、貴重品の保管を確認。" },
        ],
      },
      {
        title: "お世話タスクと日程の整理",
        points: [
          { label: "性格と注意事項", text: "ペットの習性や癖を共有し、【必須】と【任意】のタスクを明確化。" },
          { label: "時間帯と予算", text: "希望の訪問時間帯、大まかな地域、交通費を含む明確な予算を提示。" },
        ],
      },
      {
        title: "鍵の受け渡しと緊急時対応の合意",
        points: [
          { label: "鍵と備品動線", text: "キーボックス等の鍵受け渡し、フードやゴミ捨ての場所を事前共有。" },
          { label: "報告と動物病院", text: "写真・動画での報告頻度、緊急連絡先、かかりつけ医の情報を共有。" },
        ],
      },
    ],
    offerEyebrow: "シッター向けガイド",
    offerTitle: "訪問ケアを提供する際の3つの必須基準",
    offerSub: "対応エリアと対象動物を明確にし、安心できる実績を示し、入室マナーと迅速な報告を守りましょう。",
    offerSteps: [
      {
        title: "対応範囲と引き受け基準の明確化",
        points: [
          { label: "エリアと動物種", text: "無理のない移動範囲を設定し、得意な動物種（猫、うさぎ、小鳥等）を明記。" },
          { label: "投薬スキルと境界", text: "投薬や特別なケアの可否を明記し、経験のない高リスクな依頼は避ける。" },
        ],
      },
      {
        title: "安心できる飼育経験と安全意識の提示",
        points: [
          { label: "飼育歴と写真", text: "実際の飼育歴やケア経験を詳しく記載し、安心感のある写真を登録。" },
          { label: "脱走・ストレス対策", text: "玄関の脱走防止やストレスを与えない丁寧な接し方を熟知していることを提示。" },
        ],
      },
      {
        title: "入室マナーの徹底と確実な報告",
        points: [
          { label: "鍵管理とプライバシー", text: "鍵の受け渡し手順を厳守し、ご自宅のカメラやプライバシーに配慮。" },
          { label: "写真報告と緊急対応", text: "訪問ごとに写真・動画で状況を報告し、異変時は速やかに連絡。" },
        ],
      },
    ],
  },
} as const;

/* =========================================================================
   2. BOARDING DATA & COPIES
   ========================================================================= */

const boardingIntroCopy = {
  en: {
    pageTitle: "Family Boarding & Host Care",
    pageSubtitle:
      "The pet stays in a host family's home with dedicated observation, regular walks, and around-the-clock companionship.",
    sectionBadge: "Overview & Scenarios",
    sectionTitle: "When does it fit, and what are typical scenarios?",
    sectionSub:
      "Assess your travel duration, pet temperament, and separation needs to decide if boarding fits best.",
    fitTitle: "Best Suited for These Situations",
    fitItems: [
      { label: "Longer trips", desc: "Extended travel where once-daily visits are not enough companionship." },
      { label: "Needs presence", desc: "Pets that experience separation anxiety and need continuous day and night presence." },
      { label: "Regular exercise", desc: "Dogs needing structured twice-daily leashed walks and indoor playtime." },
    ],
    fitQuote: "💡 Continuous companionship in a loving home keeps social pets happy and secure.",
    scenesTitle: "Typical Boarding Care Scenarios",
  },
  zh: {
    pageTitle: "宠物寄养与托管",
    pageSubtitle:
      "宠物入住寄宿家庭，由专人提供全天候生活陪伴、规律散步与起居照护，适合较长假期的深度托付。",
    sectionBadge: "适用场景与日常",
    sectionTitle: "适合哪些情况？典型的寄宿场景有哪些？",
    sectionSub:
      "结合出行天数、宠物性格与环境适应力，判断宠物寄养是否最适合当下情况。",
    fitTitle: "特别适合以下情况",
    fitItems: [
      { label: "长期外出", desc: "出差或长假期间，单纯每日上门无法提供足够陪伴与连续看护。" },
      { label: "无法独处", desc: "容易产生分离焦虑、或需要昼夜专人持续观察起居的犬猫宠物。" },
      { label: "规律运动", desc: "需要每日早晚规律户外排便与充分散步运动的中小型犬。" },
    ],
    fitQuote: "💡 全天候家庭式温情陪伴，让爱宠在主人外出期间也能安心享受家的温暖。",
    scenesTitle: "日常寄宿照护场景",
  },
  ja: {
    pageTitle: "家庭預かり・お泊まり",
    pageSubtitle:
      "ペットがシッター宅で過ごし、日中から夜間まで見守り、散歩や日常のお世話を継続します。",
    sectionBadge: "概要と利用シーン",
    sectionTitle: "向いている場面とよくある預かりシーン",
    sectionSub:
      "留守の期間、ペットの性格、環境適応力を踏まえて、家庭預かりが最適か判断しましょう。",
    fitTitle: "こんな場面に最適です",
    fitItems: [
      { label: "長期の留守", desc: "長期出張や旅行など、1日1回の訪問では十分な見守りが難しい場合。" },
      { label: "留守番が苦手", desc: "分離不安があり、常に人がそばにいる安心感を必要とする犬猫。" },
      { label: "朝晩の散歩が必要", desc: "1日2回の屋外散歩や運動が欠かせないワンちゃん。" },
    ],
    fitQuote: "💡 24時間人がいる家庭環境で、寂しさを感じさせず安心してお留守番できます。",
    scenesTitle: "よくある預かりシーン",
  },
} as const;

const boardingExampleCopy = {
  en: {
    sectionBadge: "Request Blueprint",
    title: "A Clear Blueprint for Pet Boarding Requests",
    intro:
      "Structuring stay duration, potty/walking habits, supplies checklist, and transparent nightly rates gives host families peace of mind.",
    requestTemplateLabel: "Standard Boarding Template",
    exampleBadge: "Example Request",
    requestTitle: "Dog boarding | Shibuya, Tokyo | 1 Shiba Inu",
    dateSpan: "Oct 1 – Oct 7, 2026 (6 nights)",
    dateLabel: "Stay Dates",
    takeawaysTitle: "Why is this a great boarding request?",
    annotationPrefix: "Tip",
    scheduleHeading: "Schedule & Duration",
    freqLabel: "Duration",
    freqVal: "6 nights, 7 days",
    dailyLabel: "Daily Walks",
    dailyVal: "2 walks / day (30m)",
    timeLabel: "Transport",
    timeVal: "Owner drop-off & pick-up",
    totalVisitsLabel: "Total Nights",
    totalVisitsVal: "6 nights stay",
    petsHeading: "Boarded Pet Profile",
    pets: [
      {
        name: "Mochi",
        tag: "Shiba Inu",
        meta: "4 yrs · Male (Neutered) · 9.8 kg",
        notes: "Gentle, independent, outdoor-potty trained, no barking. Comes with sealed kibble, dual-clip harness, and familiar bed.",
        image: "/images/care-guides/stock-boarding-senior-dog.jpg",
      },
    ],
    tasksHeading: "Boarding Care Tasks",
    tableHeaderTarget: "Target",
    tasks: [
      {
        title: "Timed feeding & fresh water twice daily",
        priority: "MUST" as const,
        desc: "Feed 120g kibble at 8:00 and 19:00 with owner-provided bowl; replenish clean filtered water.",
      },
      {
        title: "Twice-daily outdoor leashed walks for potty",
        priority: "MUST" as const,
        desc: "30-min walk in morning & evening with dual-clip harness; collect waste responsibly.",
      },
      {
        title: "Daily coat brushing & wellness observation",
        priority: "MUST" as const,
        desc: "Brush loose coat each evening; check energy, appetite, and stool consistency.",
      },
      {
        title: "Indoor puzzle toy interaction & play",
        priority: "NICE" as const,
        desc: "If relaxed, offer 15 mins of puzzle feeder play to ease separation anxiety.",
      },
      {
        title: "Daily photo/video check-in & summary",
        priority: "MUST" as const,
        desc: "Send daily morning & evening HD videos of meals, walks, and rest to the platform chat.",
      },
    ],
    additionalNotesLabel: "Additional Boarding Notes",
    additionalNotes:
      "We provide a full sealed bag of original food, treats, carrier, dog bed, and vaccination copies. In case of emergency, contact us immediately and visit Shibuya Animal Medical Center.",
    budgetLabel: "Budget Structure",
    budgetFormula: "Boarding fee ¥6,500/night × 6 nights = ¥39,000 + Holiday allowance ¥3,000",
    budgetCalculation: "6 nights stay",
    budgetTotal: "Total Budget: ¥42,000",
    mustBadge: "MUST",
    niceBadge: "OPTIONAL",
    takeaways: [
      {
        title: "Clear Stay Duration & Drop-off Logistics",
        desc: "Specifying 6 nights and owner drop-off allows host families to lock in room scheduling without guesswork.",
      },
      {
        title: "Potty Habits & Complete Supplies Included",
        desc: "Highlighting outdoor potty needs and packing original food and familiar bedding minimizes boarding adaptation stress.",
      },
      {
        title: "Structured Daily Walks & Transparent Tasks",
        desc: "Detailing two daily walks, timed meals, and video reporting sets clear expectations for both sides.",
      },
      {
        title: "Itemized Nightly Rates & Vet Protocol",
        desc: "Cleanly listing per-night rates and pre-designating emergency vet contacts ensures comprehensive safety.",
      },
    ],
    annotationTargets: ["Schedule", "Pet Profile", "Care Tasks", "Budget"],
    ctaText: "Explore full interactive request preview",
  },
  zh: {
    sectionBadge: "需求发布范例",
    title: "一条清晰规范的家庭寄宿需求范本",
    intro:
      "不需要长篇大论，把寄宿日程、排便习惯、自备口粮用品与透明预算说清楚即可。",
    requestTemplateLabel: "规范范本：家庭寄宿需求模板",
    exampleBadge: "示例需求",
    requestTitle: "家庭寄宿｜东京都涩谷区｜1只柴犬",
    dateSpan: "2026年10月1日 – 10月7日 (6晚)",
    dateLabel: "寄宿日程",
    takeawaysTitle: "为什么这是一条好的寄宿需求？",
    annotationPrefix: "发布技巧",
    scheduleHeading: "日程与时长",
    freqLabel: "寄宿时长",
    freqVal: "6 晚 7 天",
    dailyLabel: "散步频次",
    dailyVal: "早晚各 1 次 (30分)",
    timeLabel: "接送方式",
    timeVal: "主人自送自取",
    totalVisitsLabel: "总计晚数",
    totalVisitsVal: "共 6 晚家庭寄宿",
    petsHeading: "寄宿宠物档案",
    pets: [
      {
        name: "旺财 (Mochi)",
        tag: "柴犬",
        meta: "4岁 · 公 (已绝育) · 9.8 kg",
        notes: "性格温顺独立，在外定点排便不乱叫。自带整袋原粮、专用胸背带及惯用睡垫。",
        image: "/images/care-guides/stock-boarding-senior-dog.jpg",
      },
    ],
    tasksHeading: "寄宿照护清单",
    tableHeaderTarget: "对象",
    tasks: [
      {
        title: "早晚按时定量喂食与更换纯净水",
        priority: "MUST" as const,
        desc: "早8点/晚7点各喂一次专用狗粮120g，使用自带食盆；倒掉旧水换上新鲜饮用水。",
      },
      {
        title: "早晚两次户外牵绳散步排便",
        priority: "MUST" as const,
        desc: "每次30分钟，严格佩戴双扣胸背带防挣脱，随手清理粪便保持卫生。",
      },
      {
        title: "室内梳毛与精神状态检查",
        priority: "MUST" as const,
        desc: "每日傍晚梳理浮毛，观察食欲、精神状态与排便形态是否正常。",
      },
      {
        title: "室内益智漏食玩具互动",
        priority: "NICE" as const,
        desc: "在宠物状态放松时，可使用自带漏食球互动15分钟，缓解换环境的微弱焦虑。",
      },
      {
        title: "每日照片视频打卡与状态汇报",
        priority: "MUST" as const,
        desc: "每日早晚发送进食、散步及休息视频至平台聊天室，同步今日生活状态。",
      },
    ],
    additionalNotesLabel: "补充寄宿备注",
    additionalNotes:
      "自带整袋未开封狗粮、常用零食、航空箱、睡垫及疫苗本复印件；如遇紧急身体不适请第一时间联系并送往指定宠物医院（涩谷动物医疗中心）。",
    budgetLabel: "预算构成",
    budgetFormula: "寄宿费 ¥6,500/晚 × 6晚 = ¥39,000 + 假日服务津贴 ¥3,000",
    budgetCalculation: "共 6 晚寄宿",
    budgetTotal: "总预算：¥42,000",
    mustBadge: "必须",
    niceBadge: "尽量",
    takeaways: [
      {
        title: "寄宿日程与接送动线清晰",
        desc: "明确6晚7天与主人自行接送，寄宿家庭能提前锁定房间与照护排期，无需反复私信推拉。",
      },
      {
        title: "排便习惯与自备清单完备",
        desc: "注明必须户外排便、自带全套原粮睡垫与胸背带，最大限度降低新环境适应期的应激风险。",
      },
      {
        title: "散步频次与任务边界明确",
        desc: "将一日两走、定量喂养与视频汇报拆解清楚，双方对日常看护细节达成高度共识。",
      },
      {
        title: "按晚透明核算与急诊医院前置",
        desc: "清晰罗列每晚单价与总预算，并提前约定定点急诊医院，保障双方权益与宠物安全。",
      },
    ],
    annotationTargets: ["日程与时长", "宠物档案", "照护清单", "预算构成"],
    ctaText: "查看完整可交互的需求范例",
  },
  ja: {
    sectionBadge: "依頼サンプル",
    title: "わかりやすい家庭預かり依頼の標準モデル",
    intro:
      "宿泊日数、散歩や排泄の習慣、持参フード、明確な宿泊予算を整理することで、預かり先も安心して引き受けられます。",
    requestTemplateLabel: "標準テンプレート：家庭預かり依頼",
    exampleBadge: "依頼サンプル",
    requestTitle: "家庭預かり｜東京都渋谷区｜柴犬1匹",
    dateSpan: "2026年10月1日 – 10月7日 (6泊)",
    dateLabel: "預かり日程",
    takeawaysTitle: "なぜこれが良い預かり依頼なのか？",
    annotationPrefix: "ポイント",
    scheduleHeading: "日程と宿泊数",
    freqLabel: "宿泊日数",
    freqVal: "6泊7日",
    dailyLabel: "散歩頻度",
    dailyVal: "朝晩各1回 (30分)",
    timeLabel: "送迎方法",
    timeVal: "飼い主による送迎",
    totalVisitsLabel: "合計宿泊数",
    totalVisitsVal: "計 6 泊",
    petsHeading: "預かりペット情報",
    pets: [
      {
        name: "モッチ (Mochi)",
        tag: "柴犬",
        meta: "4歳 · オス (去勢済) · 9.8 kg",
        notes: "温厚で独立心があり、屋外排泄の習慣あり。未開封フード、専用ハーネス、愛用ベッドを持参。",
        image: "/images/care-guides/stock-boarding-senior-dog.jpg",
      },
    ],
    tasksHeading: "預かりケアタスク",
    tableHeaderTarget: "対象",
    tasks: [
      {
        title: "朝晩の定時定量給餌と新鮮な水交換",
        priority: "MUST" as const,
        desc: "朝8時/夜19時に持参フード120gを給餌。持参食器を使用し、新鮮な飲用水に交換。",
      },
      {
        title: "朝晩2回の屋外リード散歩・排泄",
        priority: "MUST" as const,
        desc: "1回30分の散歩。すっぽ抜け防止のため必ずダブルリード・ハーネスを装着し糞を回収。",
      },
      {
        title: "毎日のブラッシングと健康観察",
        priority: "MUST" as const,
        desc: "夕方に抜け毛をブラッシングし、食欲・元気・便の硬さを確認。",
      },
      {
        title: "知育トイを使った室内スキンシップ",
        priority: "NICE" as const,
        desc: "落ち着いている場合、持参の知育ボールで15分ほど遊び、環境変化の不安を軽減。",
      },
      {
        title: "朝晩の写真・動画報告の送信",
        priority: "MUST" as const,
        desc: "食事や散歩、睡眠中の様子を朝晩チャットにて動画と写真でレポート。",
      },
    ],
    additionalNotesLabel: "補足メモ",
    additionalNotes:
      "未開封フード、おやつ、キャリー、ベッド、ワクチン証明書のコピーを持参します。万が一の体調不良時は即時連絡の上、指定の「渋谷動物医療センター」へ受診をお願いします。",
    budgetLabel: "予算設定",
    budgetFormula: "宿泊費 ¥6,500/泊 × 6泊 = ¥39,000 + 連休手当 ¥3,000",
    budgetCalculation: "全6泊",
    budgetTotal: "合計予算：¥42,000",
    mustBadge: "必須",
    niceBadge: "任意",
    takeaways: [
      {
        title: "宿泊日数と送迎動線が明確",
        desc: "「6泊7日」「飼い主が直接送迎」を明記することで、受入側が空き部屋やスケジュールを即座に判断できます。",
      },
      {
        title: "排泄習慣と持参品リストが網羅的",
        desc: "屋外排泄であることや、食べ慣れたフード・ベッドを持参することを明記し、適応ストレスを最小化。",
      },
      {
        title: "散歩回数とタスクの境界が明確",
        desc: "1日2回の散歩、給餌時間、動画報告のタイミングを細分化し、日常のお世話水準を合意。",
      },
      {
        title: "明確な宿泊単価と緊急時対応が前置",
        desc: "1泊あたりの費用と合計予算を明示し、かかりつけ救急病院を前もって指定して安全を確保。",
      },
    ],
    annotationTargets: ["日程と宿泊数", "ペット情報", "タスク一覧", "予算構成"],
    ctaText: "インタラクティブな依頼完成例を見る",
  },
} as const;

const boardingRoleCopy = {
  en: {
    needEyebrow: "For Pet Owners",
    needTitle: "Posting a Boarding Request? Follow These 3 Steps",
    needSub: "Assess temperament and vaccines, pack familiar supplies, and confirm drop-off and emergency protocols.",
    steps: [
      {
        title: "Assess Temperament & Vaccines",
        points: [
          { label: "Social Comfort", text: "Ensure your pet is comfortable in new environments and has no aggressive tendencies." },
          { label: "Vaccines & Deworming", text: "Verify core vaccinations, rabies, and flea/tick prevention are completely up to date." },
        ],
      },
      {
        title: "Pack Familiar Supplies & Habits",
        points: [
          { label: "Original Diet & Bedding", text: "Provide a full bag of original kibble, familiar bedding, and favorite scent toys." },
          { label: "Routine & Safety Gear", text: "Include detailed feeding amounts, walking schedules, and secure escape-proof harnesses." },
        ],
      },
      {
        title: "Confirm Transport & Emergency Protocols",
        points: [
          { label: "Drop-off & Pick-up", text: "Agree on exact handover timing, travel logistics, and check-in procedures." },
          { label: "Emergency Vet Authorization", text: "Provide emergency contacts and pre-designate a 24/7 veterinary clinic nearby." },
        ],
      },
    ],
    offerEyebrow: "For Care Providers",
    offerTitle: "Offering Boarding Care? Uphold These 3 Standards",
    offerSub: "Inspect home safety, set realistic capacity limits, and strictly follow leashing and daily reporting standards.",
    offerSteps: [
      {
        title: "Verify Home Safety & Separation Areas",
        points: [
          { label: "Fencing & Double Doors", text: "Ensure secure window mesh, balcony safety, and double-door entry protection." },
          { label: "Multi-Pet Isolation", text: "Maintain a dedicated quiet separation room for unfamiliar guest pets." },
        ],
      },
      {
        title: "Set Capacity Limits Based on Real Energy",
        points: [
          { label: "Space & Temperament", text: "Never overcrowd; limit guests according to physical space and pet compatibility." },
          { label: "Time Presence", text: "Ensure an adult is present for sufficient daytime and nighttime companionship." },
        ],
      },
      {
        title: "Strict Leashing & Daily Video Updates",
        points: [
          { label: "Double-Leash Walks", text: "Always walk guest dogs on secure dual-clip harnesses; never unleash outdoors." },
          { label: "Morning & Evening Reports", text: "Send daily HD videos of eating, outdoor walks, and resting to the owner." },
        ],
      },
    ],
  },
  zh: {
    needEyebrow: "主人发布篇",
    needTitle: "想发布家庭寄宿？提前做好这三步准备",
    needSub: "评估社交性格与免疫状态，备齐惯用口粮与气味用品，约定好接送与急诊预案。",
    steps: [
      {
        title: "评估社交力与疫苗驱虫",
        points: [
          { label: "环境与性格", text: "确认宠物不惧陌生环境，对人友善且无伤人或攻击同类的倾向。" },
          { label: "疫苗与体外驱虫", text: "核对狂犬及核心疫苗在有效期内，按时完成体内外驱虫并备好凭证。" },
        ],
      },
      {
        title: "备齐生活用品与习惯说明",
        points: [
          { label: "原粮与气味睡垫", text: "自带足量未开封原装粮，带上带有熟悉气味的睡垫和安抚玩具以防应激。" },
          { label: "散步装备与习惯", text: "配备双扣防挣脱胸背带，注明喂食克数、如厕习惯与日常作息细节。" },
        ],
      },
      {
        title: "约定接送时间与应急预案",
        points: [
          { label: "接送与交接", text: "约定入户交接时间与送迎方式，现场核对宠物精神状态与随身物品清单。" },
          { label: "急诊定点医院", text: "提供紧急联系人电话，并提前指定突发身体不适时的就近定点急诊医院。" },
        ],
      },
    ],
    offerEyebrow: "服务者篇",
    offerTitle: "想提供寄宿服务？严格遵守这三项准则",
    offerSub: "核验寄宿环境与防逃逸设施，根据真实精力设定接收上限，严格遵守散步牵引与每日汇报。",
    offerSteps: [
      {
        title: "核验寄宿环境与防逃逸隔离",
        points: [
          { label: "封窗与双层门禁", text: "确保阳台封窗牢固、入户具备双层门禁，杜绝任何开门逃逸风险。" },
          { label: "独立物理隔离区", text: "多宠家庭必须具备独立的物理隔离房间，保障不同宠物之间的安全距离。" },
        ],
      },
      {
        title: "根据真实精力设定接收上限",
        points: [
          { label: "空间与性格匹配", text: "严禁超负荷接单，根据房屋面积、宠物兼容度与自身精力合理设定上限。" },
          { label: "充足陪伴时间", text: "确保寄宿期间有成年人居家陪伴，不让寄宿宠物长时间处于无看护状态。" },
        ],
      },
      {
        title: "严格遵守散步牵引与每日汇报",
        points: [
          { label: "户外全程双扣牵引", text: "带犬散步必须全程佩戴安全双扣胸背带，严禁在未封闭户外区域解开牵引绳。" },
          { label: "早晚高清视频打卡", text: "每日早晚按时发送进食、散步及睡眠的高清视频，让主人实时掌握安心动态。" },
        ],
      },
    ],
  },
  ja: {
    needEyebrow: "飼い主向けガイド",
    needTitle: "家庭預かりを依頼する前の3つの準備",
    needSub: "ペットの性格とワクチン状況を確認し、慣れたフードを用意し、送迎と緊急時の対応を取り決めましょう。",
    steps: [
      {
        title: "社交性とワクチン接種の確認",
        points: [
          { label: "性格と適応力", text: "新しい環境でも落ち着いて過ごせ、他の人や動物に攻撃性がないか確認。" },
          { label: "ワクチン・駆虫", text: "狂犬病・混合ワクチンの接種証明と、定期的なノミ・ダニ駆虫を確認。" },
        ],
      },
      {
        title: "慣れた日用品と習慣メモの準備",
        points: [
          { label: "普段のフードとベッド", text: "食べ慣れたフード、匂いのついた愛用ベッド、おもちゃを用意し環境ストレスを軽減。" },
          { label: "散歩用品と給餌量", text: "すっぽ抜け防止のハーネスを用意し、1回の給餌量や散歩時間を詳しく共有。" },
        ],
      },
      {
        title: "送迎時間と緊急時対応の合意",
        points: [
          { label: "送迎と受け渡し", text: "チェックイン・アウトの時間を決定し、ペットの状態と持参品を確認。" },
          { label: "緊急連絡先と動物病院", text: "万が一の体調不良時に備え、緊急連絡先とかかりつけ動物病院を指定。" },
        ],
      },
    ],
    offerEyebrow: "シッター向けガイド",
    offerTitle: "家庭預かりを提供する際の3つの必須基準",
    offerSub: "脱走防止の安全確認を行い、無理のない受け入れ上限を設定し、二重リードと毎日の報告を徹底しましょう。",
    offerSteps: [
      {
        title: "安全な飼育環境と隔離スペースの確保",
        points: [
          { label: "脱走防止対策", text: "ベランダのネット、玄関の二重ゲートを確認し、脱走の隙を完全に排除。" },
          { label: "個別隔離部屋", text: "相性の合わない動物同士を安全に分けられる静かな個室を用意。" },
        ],
      },
      {
        title: "キャパシティを超えない受入上限の設定",
        points: [
          { label: "広さと性格の考慮", text: "過剰な頭数を受け入れず、部屋の広さと自身の時間に合わせて上限を設定。" },
          { label: "十分な在宅見守り", text: "長時間の留守番を避け、大人が責任を持って見守れる体制を維持。" },
        ],
      },
      {
        title: "散歩時の安全確保と毎日の動画報告",
        points: [
          { label: "二重リードの徹底", text: "屋外での散歩は必ずダブルリード・ハーネスを使用し、ノーリードは絶対禁止。" },
          { label: "朝晩の動画レポート", text: "食事、散歩、睡眠の様子を朝晩動画で撮影し、飼い主へタイムリーに送信。" },
        ],
      },
    ],
  },
} as const;

/* =========================================================================
   3. CUSTOM CARE DATA & COPIES
   ========================================================================= */

const customIntroCopy = {
  en: {
    pageTitle: "Custom Care & Specific Needs",
    pageSubtitle:
      "Clear, task-based help for unique pet tasks: veterinary escorts, nail trimming, hygiene assistance, or equipment setup.",
    sectionBadge: "Overview & Scenarios",
    sectionTitle: "When does it fit, and what are typical scenarios?",
    sectionSub:
      "When you do not need full-day boarding or daily feeding routines, but need a specific, clearly scoped task completed safely.",
    fitTitle: "Best Suited for These Situations",
    fitItems: [
      { label: "Vet visits", desc: "Busy owners or lack of transport needing an experienced helper for clinic escort and holding." },
      { label: "Special tasks", desc: "Single tasks like nail trimming, ear cleaning, brushing, or medication assistance." },
      { label: "Setup & clean", desc: "Moving heavy cages, assembling automatic feeders/cat trees, or deep sanitizing enclosures." },
    ],
    fitQuote: "💡 Clear task boundaries and transparent communication make single assignments stress-free.",
    scenesTitle: "Typical Custom Task Scenarios",
  },
  zh: {
    pageTitle: "定制与个性化需求",
    pageSubtitle:
      "针对具体事项的单次协助：陪同就医、剪指甲、清洁洗护或宠物生活设备安装调试，界限清晰更安心。",
    sectionBadge: "适用场景与日常",
    sectionTitle: "适合哪些情况？典型的定制场景有哪些？",
    sectionSub:
      "不需要全天寄宿或日常循环喂养，只需安全、合规地完成一件范围明确的宠物具体任务。",
    fitTitle: "特别适合以下情况",
    fitItems: [
      { label: "陪同就医协助", desc: "主人因公外出或无车出行，需要专人协助将宠物送医候诊并记录医嘱。" },
      { label: "特定护理技能", desc: "剪指甲、滴耳药、梳理打结毛发等主人难以独自操作的专项护理。" },
      { label: "设备组装清洁", desc: "组装大型猫爬架、调试自动喂食器，或对宠物生活围栏进行彻底消毒清洁。" },
    ],
    fitQuote: "💡 事项边界清晰、流程透明，为个性化照护需求提供最贴心的单次协作。",
    scenesTitle: "日常定制照护场景",
  },
  ja: {
    pageTitle: "カスタムケア・単発依頼",
    pageSubtitle:
      "動物病院への付き添い、爪切り、ケア補助、ペット設備の設置など、単発の明確な作業を依頼できます。",
    sectionBadge: "概要と利用シーン",
    sectionTitle: "向いている場面とよくあるカスタムシーン",
    sectionSub:
      "定期的な訪問や宿泊ではなく、具体的で明確な単発作業を安全に任せたい場合に最適です。",
    fitTitle: "こんな場面に最適です",
    fitItems: [
      { label: "通院・受診の付き添い", desc: "仕事で手が離せない時や送迎手段がない時に、通院や診察補助を依頼。" },
      { label: "専門ケア作業", desc: "爪切り、耳掃除、毛玉取りなど一人では難しいピンポイントのお手入れ。" },
      { label: "設備の設置・清掃", desc: "大型キャットタワーの設置、自動給餌器の設定、ケージの徹底丸洗い。" },
    ],
    fitQuote: "💡 明確な作業範囲と事前合意により、単発の困りごとをスムーズに解決します。",
    scenesTitle: "よくあるカスタムシーン",
  },
} as const;

const customExampleCopy = {
  en: {
    sectionBadge: "Request Blueprint",
    title: "A Clear Blueprint for Custom Care Requests",
    intro:
      "Clearly scoping the single assignment, pet temperament, required handling steps, and itemized fee vs. expense reimbursements makes custom tasks seamless.",
    requestTemplateLabel: "Standard Custom Template",
    exampleBadge: "Example Request",
    requestTitle: "Custom Care | Shinjuku, Tokyo | Vet Escort & Health Check",
    dateSpan: "Sep 12, 2026 (Sat) 13:30–16:30",
    dateLabel: "Appointment Time",
    takeawaysTitle: "Why is this a great custom request?",
    annotationPrefix: "Tip",
    scheduleHeading: "Timing & Route",
    freqLabel: "Task Nature",
    freqVal: "1-off clinic escort",
    dailyLabel: "Duration",
    dailyVal: "Approx. 3 hours",
    timeLabel: "Transport",
    timeVal: "Pet taxi round-trip",
    totalVisitsLabel: "Route",
    totalVisitsVal: "Shinjuku home ➜ Vet clinic",
    petsHeading: "Pet Profile",
    pets: [
      {
        name: "Mimi",
        tag: "British Shorthair",
        meta: "5 yrs · Female (Neutered) · 4.2 kg",
        notes: "Timid and sensitive at vet clinics. Needs her familiar blanket inside the carrier and gentle, soothing voice during transit.",
        image: "/images/care-guides/stock-custom-vet.jpg",
      },
    ],
    tasksHeading: "Custom Task Steps",
    tableHeaderTarget: "Target",
    tasks: [
      {
        title: "Arrive on time & safely load cat into carrier",
        priority: "MUST" as const,
        desc: "Arrive at 13:30 sharp; wrap Mimi in her familiar blanket and gently secure her in the carrier.",
      },
      {
        title: "Escort to clinic & assist vet holding",
        priority: "MUST" as const,
        desc: "Check in at reception, wait calmly, and assist the vet gently during blood test & ultrasound holding.",
      },
      {
        title: "Record vet notes, test results & receipts",
        priority: "MUST" as const,
        desc: "Photograph medical notes and receipts; call owner immediately to confirm prescribed medications.",
      },
      {
        title: "Safely return home & observe recovery",
        priority: "MUST" as const,
        desc: "Escort cat home safely, refresh her water bowl, and observe for 20 minutes before leaving.",
      },
      {
        title: "Hand over receipts & send final report",
        priority: "MUST" as const,
        desc: "Upload all itemized clinic receipts and vet instructions into the platform order summary.",
      },
    ],
    additionalNotesLabel: "Additional Notes",
    additionalNotes:
      "Owner is away on business. Medical fees and taxi receipts will be reimbursed 100% upon invoice presentation. Carrier and medical records are on the entryway console.",
    budgetLabel: "Budget Structure",
    budgetFormula: "Custom task service fee ¥8,000 + Transit/waiting allowance ¥2,000",
    budgetCalculation: "1-off custom task",
    budgetTotal: "Total Budget: ¥10,000 (Clinic fees reimbursed separately)",
    mustBadge: "MUST",
    niceBadge: "OPTIONAL",
    takeaways: [
      {
        title: "Exact Window & Route Outlined",
        desc: "Specifying 13:30 arrival and the exact round-trip clinic route lets providers calculate time and logistics accurately.",
      },
      {
        title: "Temperament & Calming Tips Stated",
        desc: "Noting the cat's timidity and blanket calming method prevents stress, scratches, or panic during handling.",
      },
      {
        title: "Concrete Clinic Steps & Holding Scope",
        desc: "Itemizing check-in, gentle holding assistance, and recording vet notes clearly defines the helper's responsibilities.",
      },
      {
        title: "Clear Base Pay vs. Direct Expense Reimbursement",
        desc: "Cleanly separating the labor compensation from direct taxi and clinic expense reimbursement eliminates payment ambiguity.",
      },
    ],
    annotationTargets: ["Timing & Route", "Pet Profile", "Custom Tasks", "Budget"],
    ctaText: "Explore full interactive request preview",
  },
  zh: {
    sectionBadge: "需求发布范例",
    title: "一条清晰规范的定制需求范本",
    intro:
      "不需要长篇大论，把具体事项、猫咪性格、协作步骤与报酬报销规则说清楚即可。",
    requestTemplateLabel: "规范范本：定制照护需求模板",
    exampleBadge: "示例需求",
    requestTitle: "定制协助｜东京都新宿区｜陪同猫咪就医体检",
    dateSpan: "2026年9月12日 (周六) 13:30–16:30",
    dateLabel: "预约时间",
    takeawaysTitle: "为什么这是一条好的定制需求？",
    annotationPrefix: "发布技巧",
    scheduleHeading: "时间与路线",
    freqLabel: "服务性质",
    freqVal: "单次陪同就医",
    dailyLabel: "预计耗时",
    dailyVal: "约 3 小时",
    timeLabel: "交通方式",
    timeVal: "宠物出租车往返",
    totalVisitsLabel: "服务路线",
    totalVisitsVal: "新宿住所 ➜ 动物医院",
    petsHeading: "照护对象档案",
    pets: [
      {
        name: "咪咪 (Mimi)",
        tag: "英国短毛猫",
        meta: "5岁 · 母 (已绝育) · 4.2 kg",
        notes: "胆小怕生，去医院易紧张。需在航空箱内放置熟悉的毛毯，途中轻声安抚。",
        image: "/images/care-guides/stock-custom-vet.jpg",
      },
    ],
    tasksHeading: "专项协助清单",
    tableHeaderTarget: "对象",
    tasks: [
      {
        title: "准时到达住所并轻柔协助入箱",
        priority: "MUST" as const,
        desc: "13:30准时到达，使用自带安抚毛毯轻柔将猫放入航空箱，确认拉链扣好。",
      },
      {
        title: "全程陪同乘车与医院就诊保定",
        priority: "MUST" as const,
        desc: "协助挂号、排队候诊，配合医生轻柔进行基础血检与B超保定检查。",
      },
      {
        title: "记录医嘱、检查结果并垫付药费",
        priority: "MUST" as const,
        desc: "拍照留存检查单与发票，与主人实时电话沟通用药方案并先行垫付。",
      },
      {
        title: "安全护送返家并安顿休息",
        priority: "MUST" as const,
        desc: "护送猫咪安全返回家中，换上新鲜饮用水并静置观察20分钟后离开。",
      },
      {
        title: "费用票据交接与服务小结",
        priority: "MUST" as const,
        desc: "整理全部诊疗收据发票及医嘱文字总结，拍照上传至平台订单完成交接。",
      },
    ],
    additionalNotesLabel: "补充照护备注",
    additionalNotes:
      "主人因出差无法亲自前往，诊疗费与出租车费凭发票实报实销；航空箱与病历本已放置在玄关柜台。",
    budgetLabel: "预算构成",
    budgetFormula: "单次服务工时费 ¥8,000 + 交通/待机补贴 ¥2,000 = ¥10,000",
    budgetCalculation: "单次定制任务",
    budgetTotal: "总预算：¥10,000 (医院诊疗费凭票实报实销)",
    mustBadge: "必须",
    niceBadge: "尽量",
    takeaways: [
      {
        title: "时间窗口与往返动线明确",
        desc: "明确13:30到达与往返医院路线，服务者能准确预估所需时间与交通安排。",
      },
      {
        title: "性格特质与安抚要点前置",
        desc: "提前注明猫咪怕生及需要毛毯安抚，避免服务过程中发生应激抓咬与安全隐患。",
      },
      {
        title: "就诊步骤与协作责任清晰",
        desc: "详列挂号、保定、记录医嘱等具体协作环节，专业责任界限分明。",
      },
      {
        title: "工时报酬与垫付费区分清楚",
        desc: "清楚区分服务工时报酬与实际医疗交通实报实销费用，保障双方账目清晰透明。",
      },
    ],
    annotationTargets: ["时间路线", "猫咪档案", "协助清单", "报酬说明"],
    ctaText: "查看完整可交互的需求范例",
  },
  ja: {
    sectionBadge: "依頼サンプル",
    title: "わかりやすいカスタム依頼の標準モデル",
    intro:
      "作業内容、猫の性格、当日の手順、実費精算ルールを明確に整理することで、スムーズに作業が進みます。",
    requestTemplateLabel: "標準テンプレート：カスタム依頼",
    exampleBadge: "依頼サンプル",
    requestTitle: "カスタム依頼｜東京都新宿区｜猫の通院・健康診断付き添い",
    dateSpan: "2026年9月12日 (土) 13:30–16:30",
    dateLabel: "予約日時",
    takeawaysTitle: "なぜこれが良いカスタム依頼なのか？",
    annotationPrefix: "ポイント",
    scheduleHeading: "時間とルート",
    freqLabel: "作業区分",
    freqVal: "単発通院付き添い",
    dailyLabel: "予定時間",
    dailyVal: "約3時間",
    timeLabel: "移動手段",
    timeVal: "ペットタクシー往復",
    totalVisitsLabel: "移動経路",
    totalVisitsVal: "新宿自宅 ➜ 動物病院",
    petsHeading: "ペット情報",
    pets: [
      {
        name: "ミミ (Mimi)",
        tag: "ブリティッシュショートヘア",
        meta: "5歳 · メス (避妊済) · 4.2 kg",
        notes: "怖がりで病院では緊張しやすい性格。キャリー内に愛用ブランケットを敷き、優しく声掛けをお願いします。",
        image: "/images/care-guides/stock-custom-vet.jpg",
      },
    ],
    tasksHeading: "作業手順リスト",
    tableHeaderTarget: "対象",
    tasks: [
      {
        title: "定時到着とキャリーへの丁寧な誘導",
        priority: "MUST" as const,
        desc: "13:30に自宅到着。愛用ブランケットで包み、無理なくキャリーへ入れて施錠確認。",
      },
      {
        title: "タクシー移動と診察時の保定補助",
        priority: "MUST" as const,
        desc: "受付と順番待ちを代行。診察時は獣医師の指示に従い優しく保定を補助。",
      },
      {
        title: "医師の指示メモ・領収書受取と立替",
        priority: "MUST" as const,
        desc: "検査結果と処方指示を撮影。処方内容を電話で飼い主へ確認の上、診療費を立替。",
      },
      {
        title: "安全な帰宅と自宅での様子見",
        priority: "MUST" as const,
        desc: "自宅へ安全に送り届け、新鮮な水を用意。20分ほど様子を確認してから退室。",
      },
      {
        title: "領収書・明細の引き渡しと完了報告",
        priority: "MUST" as const,
        desc: "すべての領収書を撮影・引き渡し、医師からの申し送り事項をまとめてチャット送信。",
      },
    ],
    additionalNotesLabel: "補足メモ",
    additionalNotes:
      "出張中のため本人が同行できません。診療費とタクシー代は領収書原本に基づき全額実費精算いたします。キャリーと診察券は玄関に用意してあります。",
    budgetLabel: "予算設定",
    budgetFormula: "作業報酬 ¥8,000 + 交通・待機手当 ¥2,000 = ¥10,000",
    budgetCalculation: "単発作業",
    budgetTotal: "合計予算：¥10,000 (診療費は別途実費精算)",
    mustBadge: "必須",
    niceBadge: "任意",
    takeaways: [
      {
        title: "集合時間と通院ルートが明確",
        desc: "「13:30到着」「病院との往復」が明記され、作業者が所要時間と移動手段を正確に見積もることができます。",
      },
      {
        title: "性格と落ち着かせ方が前置",
        desc: "怖がりな性格とブランケットでの落ち着かせ方を事前に共有し、作業中のパニックや怪我を防止。",
      },
      {
        title: "診察手順と保定の役割分担が明確",
        desc: "受付、保定補助、医師の指示記録など、当日の具体的な作業範囲が過不足なく整理されています。",
      },
      {
        title: "作業報酬と実費精算が明確に分離",
        desc: "作業報酬と、タクシー代・診療費の実費立替を明確に区別し、金銭トラブルを未然に防ぎます。",
      },
    ],
    annotationTargets: ["時間とルート", "ペット情報", "作業リスト", "予算構成"],
    ctaText: "インタラクティブな依頼完成例を見る",
  },
} as const;

const customRoleCopy = {
  en: {
    needEyebrow: "For Pet Owners",
    needTitle: "Posting Custom Care? Follow These 3 Steps",
    needSub: "Define the single task and expected duration, prepare all required tools, and clarify expense reimbursements.",
    steps: [
      {
        title: "Scope the Single Task & Timeline",
        points: [
          { label: "Task Definition", text: "Describe the specific assignment (e.g., clinic escort, nail trim, habitat setup) and expected duration." },
          { label: "Arrival & Location", text: "Specify the exact meeting time, service address, and transit route involved." },
        ],
      },
      {
        title: "Prepare Specialized Supplies & Records",
        points: [
          { label: "Carriers & Records", text: "Place the pet carrier, medical records, medication, or assembly tools in an accessible spot." },
          { label: "Calming Essentials", text: "Provide familiar blankets or treats to keep the pet comfortable during the task." },
        ],
      },
      {
        title: "Agree on Expense Reimbursement & Comms",
        points: [
          { label: "Third-party Expenses", text: "Clarify direct reimbursements for clinic invoices or taxi fares upon receipt presentation." },
          { label: "Real-time Phone Contact", text: "Stay reachable by phone throughout the task for immediate doctor consultations." },
        ],
      },
    ],
    offerEyebrow: "For Care Providers",
    offerTitle: "Offering Custom Care? Uphold These 3 Standards",
    offerSub: "Assess your specialized skills, follow gentle handling standards, and maintain transparent logs and receipts.",
    offerSteps: [
      {
        title: "Assess Skill Match & Safety Boundaries",
        points: [
          { label: "Hands-on Experience", text: "Only accept tasks where you have genuine experience (e.g. gentle cat holding, nail trimming)." },
          { label: "Safety Limits", text: "Never attempt invasive veterinary medical procedures; stay strictly within legal safety bounds." },
        ],
      },
      {
        title: "Follow Gentle Handling & Stress Prevention",
        points: [
          { label: "Timid Pet Handling", text: "Use towels and calming voices; never use brute force on anxious or frightened pets." },
          { label: "Escape Prevention", text: "Double-check carrier latches and leashes at every transit transition point." },
        ],
      },
      {
        title: "Transparent Logging & Receipt Handover",
        points: [
          { label: "Photo & Video Updates", text: "Document each key step (arrival, clinic waiting, return) with live photos and updates." },
          { label: "Full Receipt Handover", text: "Preserve all physical receipts and clinic summaries, handing them over cleanly upon completion." },
        ],
      },
    ],
  },
  zh: {
    needEyebrow: "主人发布篇",
    needTitle: "想发布定制照护？提前做好这三步准备",
    needSub: "明确单次任务与预估耗时，备齐专用工具与资料，清晰界定费用报销与突发沟通。",
    steps: [
      {
        title: "明确具体任务与时间节点",
        points: [
          { label: "需求边界与耗时", text: "清晰说明单次任务内容（如陪同就医、剪指甲、设备组装）及预计所需耗时。" },
          { label: "到达时间与地点", text: "写清期望到达时间段、服务地点以及是否涉及中间交通往返。" },
        ],
      },
      {
        title: "提前备好专属工具与资料",
        points: [
          { label: "航空箱与病历本", text: "就医需求请提前备好航空箱、疫苗本、既往病历，放置在显眼易取位置。" },
          { label: "安抚用品与防护", text: "备好熟悉的安抚毛毯、常用零食或防护工具，协助降低操作过程中的应激。" },
        ],
      },
      {
        title: "约定垫付规则与实时沟通",
        points: [
          { label: "实报实销约定", text: "涉及第三方的实际费用（如医院诊疗费、出租车费）明确凭发票实报实销流程。" },
          { label: "电话保持畅通", text: "服务期间保持电话通畅，以便就医过程中医生询问病史或用药方案时即时确认。" },
        ],
      },
    ],
    offerEyebrow: "服务者篇",
    offerTitle: "想提供定制服务？严格遵守这三项准则",
    offerSub: "评估自身专业技能与安全边界，遵循轻柔保定与安全操作，全程透明记录并交接票据。",
    offerSteps: [
      {
        title: "评估技能匹配度与安全边界",
        points: [
          { label: "专业经验匹配", text: "仅接下自身具备实际操作经验的任务（如熟练保定、剪指甲、设备调试），不盲目接单。" },
          { label: "严守医疗底线", text: "严禁接下单方要求进行注射、输液等侵入性处方医疗操作，必须在医院由兽医执行。" },
        ],
      },
      {
        title: "遵循防应激与安全操作规范",
        points: [
          { label: "轻柔保定与防护", text: "对胆小怕生宠物采取毛巾包裹或轻柔安抚，严禁粗暴强行拉扯引发咬伤抓伤。" },
          { label: "全流程防逃逸", text: "外出途中必须反复确认航空箱卡扣与拉链锁闭状态，中途严禁随意开箱。" },
        ],
      },
      {
        title: "全程透明记录与票据交接",
        points: [
          { label: "实时图文同步", text: "到达、候诊、就医完成及送达后，关键节点拍照或短视频向主人同步最新进展。" },
          { label: "票据完整交接", text: "妥善保存全部正规诊疗发票、收据及医嘱处方单，在服务结束后拍照上传并交还。" },
        ],
      },
    ],
  },
  ja: {
    needEyebrow: "飼い主向けガイド",
    needTitle: "カスタムケアを依頼する前の3つの準備",
    needSub: "作業内容と所要時間を明確にし、必要な道具を用意し、実費精算と連絡方法を合意しましょう。",
    steps: [
      {
        title: "作業内容とタイムラインの明確化",
        points: [
          { label: "作業範囲と所要時間", text: "通院付き添い、爪切り、設備組立など具体的な作業内容と予定時間を明記。" },
          { label: "集合時間と移動経路", text: "希望の集合時間、作業場所、移動を伴う場合のルートを共有。" },
        ],
      },
      {
        title: "必要な用具と書類の事前準備",
        points: [
          { label: "キャリーと診察券", text: "通院の場合はキャリー、ワクチン証明書、診察券を分かりやすい場所に用意。" },
          { label: "落ち着かせるアイテム", text: "愛用のブランケットやおやつを用意し、移動中の不安を和らげる工夫を。" },
        ],
      },
      {
        title: "実費精算ルールと連絡体制の確認",
        points: [
          { label: "立替・実費精算", text: "診療費やタクシー代など実費が発生する場合、領収書による精算方法を事前合意。" },
          { label: "電話連絡の確保", text: "獣医師からの処置確認や投薬相談に対応できるよう、作業中は電話がつながる状態に。" },
        ],
      },
    ],
    offerEyebrow: "シッター向けガイド",
    offerTitle: "カスタム作業を引き受ける際の3つの基準",
    offerSub: "自身のスキルと安全境界を確認し、丁寧な保定と作業を行い、領収書と記録の引き渡しを徹底しましょう。",
    offerSteps: [
      {
        title: "スキル適性と安全範囲の確認",
        points: [
          { label: "実務経験のある作業のみ", text: "保定や爪切りなど、実際に経験があり安全に対応できる作業のみを引き受ける。" },
          { label: "医療行為の禁止", text: "注射や点滴などの侵襲的な医療行為は引き受けず、必ず動物病院の獣医師に任せる。" },
        ],
      },
      {
        title: "ストレス軽減と安全な取り扱い",
        points: [
          { label: "優しい保定", text: "タオルを活用し、無理な力を使わずに優しく声掛けしながら作業を行う。" },
          { label: "脱走防止の徹底", text: "移動中はキャリーのロックを二重確認し、途中で不用意に開けない。" },
        ],
      },
      {
        title: "進捗の可視化と領収書の引き渡し",
        points: [
          { label: "節目ごとの写真報告", text: "到着、受診中、帰宅時など主要なタイミングで写真と状況を飼い主へ報告。" },
          { label: "領収書の保管・精算", text: "診療費や交通費の領収書を大切に保管し、作業完了時に写真共有の上で引き渡す。" },
        ],
      },
    ],
  },
} as const;

/* =========================================================================
   4. SHARED MODES CONFIGURATION
   ========================================================================= */

const modes: Record<CareMode, Mode> = {
  "home-visits": {
    title: { en: "Home visits", zh: "上门照护", ja: "訪問ケア" },
    short: { en: "Care for pets in their familiar home", zh: "留在熟悉的家中，按时上门陪伴照料", ja: "住み慣れた自宅で、いつものお世話を" },
    intro: {
      en: "Best when your pet stays calmer at home and does not need continuous overnight supervision.",
      zh: "最适合留在原本环境更安心、不需要24小时连续看护的宠物。照护人按约定时间上门完成喂食、清洁与陪伴。",
      ja: "自宅が一番落ち着くペットに最適です。指定の時間にお伺いし、給餌や清掃、スキンシップを行います。",
    },
    hero: "/images/care-guides/care-type-home-feeding-v3.webp",
    scenes: [
      {
        title: { en: "Feed and play with cats", zh: "为独自在家的猫咪喂食与陪玩", ja: "留守番中の猫にごはんと遊びを" },
        text: { en: "Refresh food and water, scoop the litter box, and spend calm play or cuddle time with indoor cats.", zh: "更换新鲜粮水、彻底清理猫砂盆，并根据猫咪性格进行温和陪伴或逗猫互动。", ja: "フードと水の交換、トイレ掃除を行い、猫のペースに合わせて優しく触れ合います。" },
        image: "/images/care-guides/stock-home-cat-feeding.jpg",
      },
      {
        title: { en: "Walk and check in on dogs", zh: "上门带狗狗散步与补充体力", ja: "犬の散歩とごはんのサポート" },
        text: { en: "Take dogs out for outdoor relief and a relaxed walk, then wipe paws and check food upon returning.", zh: "按习惯带狗狗出门散步排便、擦拭爪子，并补充食物、饮水与观察精神状态。", ja: "いつものコースを散歩し、足を拭いてごはんの用意。お留守番の様子を確認します。" },
        image: "/images/care-guides/stock-home-dog-walking.jpg",
      },
      {
        title: { en: "Clean and feed small animals", zh: "清洁异宠与小动物生活区", ja: "小動物・エキゾチックのケージケア" },
        text: { en: "Replenish hay and water, refresh absorbent bedding, and check environment temperature for rabbits or small pets.", zh: "为兔子或小动物添加新鲜牧草、清洗水嘴，更换托盘垫料并核验温湿度。", ja: "牧草や水の補充、トレイシートの交換を行い、室温や健康状態を細かくチェック。" },
        image: "/images/care-guides/stock-home-rabbit.jpg",
      },
    ],
    fit: [
      { en: "The pet is territorial and dislikes travel", zh: "宠物领地意识强，抗拒换环境", ja: "環境の変化が苦手な子" },
      { en: "You need simple feeding, walking, or cleanups", zh: "需求主要是日常喂养、遛狗或清洁托盘", ja: "ごはん・散歩・清掃が中心" },
      { en: "Your trip is short or schedule is regular", zh: "外出时间较短，两次上门之间能安全独处", ja: "短期間のお留守番" },
    ],
    notFit: [
      { en: "Puppies or pets needing around-the-clock monitoring", zh: "幼犬或需要昼夜不间断监护的重病宠物", ja: "24時間の見守りが必要な場合" },
      { en: "Severe separation panic or destructiveness", zh: "有严重分离焦虑、会破坏门窗或逃逸的宠物", ja: "重度の分離不安がある場合" },
    ],
    prepare: {
      en: "Confirm access, supplies, keys, and emergency vet choices before booking.",
      zh: "提前准备好钥匙交付、用品存放位置、每日任务重点与急诊医院信息。",
      ja: "鍵の受け渡し、用品の場所、重要タスク、緊急病院を事前に確認。",
    },
    sitterIntro: { en: "Home visits suit people with reliable timekeeping, real animal experience and no need to host pets at home.", zh: "适合时间观念强、有真实照护经验，也愿意在邻里间移动的人；不需要在自己家准备寄养空间。", ja: "時間を守り、動物経験があり、自宅で預からず地域を移動できる人に向いています。" },
    sitterFit: { en: "Only accept animals, travel distances and visit windows you can handle calmly.", zh: "只接受自己熟悉的动物、能稳定到达的距离和真正能保证的时间段。", ja: "無理なく対応できる動物、距離、時間だけを選びます。" },
    sitterThink: { en: "Home access and key handover require precise communication and trustworthy boundaries.", zh: "入户与钥匙交接需要更高信任；到达、离开和异常情况都要准确沟通。", ja: "入室と鍵の管理には正確な連絡と信頼が必要です。" },
    sitterTrust: { en: "Share experience in advance and send clear, timely photos and updates during each visit.", zh: "提前说明经验；每次上门后及时发送真实照片、完成事项和异常状态。", ja: "経験を伝え、訪問ごとに写真と状況を報告します。" },
    icon: PiHouseLine,
    tone: "bg-[#f4edf7]",
  },
  boarding: {
    title: { en: "Pet Boarding", zh: "寄宿托管", ja: "家庭預かり" },
    short: { en: "Warm, family-style care in a host home", zh: "入住寄宿家庭，专人全天候陪伴与起居照护", ja: "シッター宅での温かい家庭的お世話" },
    intro: {
      en: "Ideal for pets that thrive with continuous human companionship and structured daily exercise.",
      zh: "适合不能长时间独自在家、容易产生分离焦虑，或需要专人连续全天陪伴起居的宠物。",
      ja: "長時間の留守番が苦手で、常に人のぬくもりや継続的な見守りが必要なペットに最適です。",
    },
    hero: "/images/care-guides/care-type-family-boarding-v3.webp",
    scenes: [
      {
        title: { en: "Stay close to a senior dog", zh: "陪伴需要更多观察的老年犬", ja: "シニア犬のそばで見守る" },
        text: { en: "A calm home makes appetite, energy and behaviour changes easier to notice.", zh: "安静的寄宿家庭能减少孤单，也更容易察觉食欲、精神和日常行为变化。", ja: "静かな家庭環境で食欲や体調の変化に素早く気づき、丁寧にお世話します。" },
        image: "/images/care-guides/stock-boarding-senior-dog.jpg",
      },
      {
        title: { en: "Safe care for friendly small pets", zh: "在独立隔离区照顾小型宠物", ja: "小動物の安全な個室管理" },
        text: { en: "Keep familiar friends together, isolate safely from other animals, and maintain clean hay, water and rest areas.", zh: "为小动物提供安静的独立房间，远离其他宠物干扰，准备充足牧草、饮水与休息空间。", ja: "他のペットと接触しない静かな個室で、慣れたケージと牧草を用意し安心を確保。" },
        image: "/images/care-guides/stock-boarding-guinea-pig.jpg",
      },
      {
        title: { en: "Attentive care for social pets", zh: "在安全房间内细心照料多只猫咪", ja: "安全な個室で猫を預かる" },
        text: { en: "A dedicated room with enrichment, climbing trees, and gentle observation keeps friendly cats secure.", zh: "具备封窗与双层门禁的专用房间，配备猫爬架与舒适休息区，在陪伴中持续观察状态。", ja: "脱走防止が整った専用個室で、キャットタワーとおもちゃを用意し丁寧に見守ります。" },
        image: "/images/care-guides/stock-boarding-cats.jpg",
      },
    ],
    fit: [
      { en: "You will be away longer", zh: "离开天数较长，单纯上门无法满足陪伴", ja: "長期の留守番になる場合" },
      { en: "The pet cannot stay alone for long", zh: "宠物容易产生分离焦虑，不适合长时间独处", ja: "留守番が苦手で寂しがりな子" },
      { en: "You want closer day-and-night observation", zh: "希望白天与夜晚都有专人持续观察与照料", ja: "昼夜を通じた見守りが必要な場合" },
    ],
    notFit: [
      { en: "The pet is highly stressed by a new home", zh: "到陌生环境极度紧张绝食、有严重应激反应", ja: "環境変化で拒食や強いストレスを起こす子" },
      { en: "Unvaccinated or aggressive towards others", zh: "未完成核心疫苗驱虫，或有伤人伤宠倾向", ja: "ワクチン未接種、攻撃性がある場合" },
    ],
    prepare: {
      en: "Confirm resident pets, sleeping spaces, safe isolation, drop-off timing, and emergency veterinary clinics.",
      zh: "确认寄宿家庭原住宠物、隔离空间、饮食习惯、接送时间以及定点就近医院。",
      ja: "先住動物の有無、個室環境、フード持参、送迎時間、緊急病院を事前確認。",
    },
    sitterIntro: { en: "Good boarding requires a safe home, secure barriers, and enough time to be present.", zh: "优质寄宿需要安全合规的环境、防逃逸设施与真正充裕的在家人力。", ja: "安全な住環境、脱走防止対策、十分な在宅見守り時間が不可欠です。" },
    sitterFit: { en: "Describe your home truthfully, including resident pets and separation areas.", zh: "如实描述原住宠物、家庭成员与可用的物理隔离区域。", ja: "先住ペットや個室の状況を正確に情報開示。" },
    sitterThink: { en: "Set capacity based on space and real energy, not just spare rooms.", zh: "根据房屋空间与自身照料精力设定上限，杜绝过度超收。", ja: "無理のない頭数制限を守り、丁寧にお世話。" },
    sitterTrust: { en: "Provide clean photos before stay, and send daily video reports without delay.", zh: "提前展示真实家庭环境，寄宿期间按时发送早晚高清视频与小结。", ja: "家庭環境を事前に公開し、毎日の動画報告を徹底。" },
    icon: PiWarehouse,
    tone: "bg-[#e6edf2]",
  },
  custom: {
    title: { en: "Custom care", zh: "定制照护", ja: "カスタムケア" },
    short: { en: "Get help with one clearly scoped pet task", zh: "单次事项协助：陪同就医、剪指甲、清洁或设备调试", ja: "通院付き添いや爪切りなど単発の作業依頼" },
    intro: {
      en: "Use this when you do not need full-day boarding or ongoing visit routines—just a safe, clearly scoped task completed.",
      zh: "不需要全天寄宿或日常循环喂养，只需安全、合规地完成一件范围明确的宠物具体事项。",
      ja: "毎日の継続ケアや宿泊ではなく、具体的で明確な単発作業を安全に頼みたい場合に最適です。",
    },
    hero: "/images/care-guides/care-type-custom-help-v3.webp",
    scenes: [
      {
        title: { en: "Veterinary clinic escort and handling", zh: "陪同猫咪与宠物就医候诊", ja: "動物病院への通院・受診付き添い" },
        text: { en: "Safely transport the pet in a carrier, assist with gentle holding, and accurately record veterinary notes.", zh: "使用航空箱安全护送，配合医生轻柔保定检查，并实时记录医嘱与诊疗票据。", ja: "キャリーで安全に移送し、診察時の保定を補助。医師の指示や明細を正確に記録。" },
        image: "/images/care-guides/stock-custom-vet.jpg",
      },
      {
        title: { en: "Help trimming nails & hygiene care", zh: "请有经验的人协助剪指甲与护理", ja: "爪切り・部分お手入れの補助" },
        text: { en: "Have an experienced helper complete or assist with challenging routine grooming tasks at home.", zh: "自己无法独自操作时，请熟悉手法的服务者上门协助完成剪指甲、耳道清洁等专项护理。", ja: "一人では難しい爪切りや耳掃除などを、経験者が自宅で丁寧にサポートします。" },
        image: "/images/care-guides/stock-custom-nail-grooming.jpg",
      },
      {
        title: { en: "Set up and sanitize pet equipment", zh: "安装调试生活设备与深度消毒", ja: "ペット設備の組立・徹底洗浄" },
        text: { en: "Assemble cat trees, test automatic feeders, or perform deep cleaning of enclosures and litter areas.", zh: "协助组装重型猫爬架、调试自动喂食器，或对宠物围栏活动区域进行深度消臭与消毒。", ja: "大型キャットタワーの設置、自動給餌器の設定、ケージ周辺の徹底除菌清掃を実施。" },
        image: "/images/care-guides/stock-custom-pet-feeder.jpg",
      },
    ],
    fit: [
      { en: "You need help with a specific clinic or hygiene task", zh: "需要专人协助完成单次就医、剪指甲或设备安装", ja: "通院付き添いや爪切りなど単発作業" },
      { en: "You are busy or lack transport for vet visits", zh: "主人因公外出或无车出行，需要协助送医", ja: "仕事で手が離せない、送迎手段がない" },
      { en: "The task has clear scope and predefined time", zh: "事项范围明确、耗时可预估且责任边界清晰", ja: "所要時間や作業内容が明確な場合" },
    ],
    notFit: [
      { en: "Daily recurring feeding or continuous care", zh: "需要连续多日按时喂食铲屎等日常起居照护", ja: "連日の継続的なお世話が必要な場合" },
      { en: "Invasive medical procedures outside hospital", zh: "输液、注射处方药等侵入性医疗治疗（须在医院由兽医操作）", ja: "病院外での侵襲的医療行為（注射等）" },
    ],
    prepare: {
      en: "Agree on the exact task scope, equipment required, transportation route, and receipt reimbursement rules.",
      zh: "提前约定具体需求范围、所需工具、交通路线以及第三方费用实报实销规则。",
      ja: "作業内容、必要用具、移動ルート、実費精算ルールを事前合意。",
    },
    sitterIntro: { en: "Custom care requires verified handling skills, gentle patience, and clear expense tracking.", zh: "定制服务需要过硬的专业操作技能、防应激耐心以及透明的票据管理。", ja: "確かな作業スキル、丁寧な扱い、明瞭な領収書管理が求められます。" },
    sitterFit: { en: "Accept only tasks where you have genuine hands-on experience and comfort.", zh: "仅接下自身具备实际操作经验且能确保安全的任务。", ja: "安全に対応できる得意な作業のみを引き受ける。" },
    sitterThink: { en: "Never perform invasive medical procedures; stay strictly within legal safety boundaries.", zh: "严守安全与合规底线，严禁在无资质情况下进行处方医疗操作。", ja: "医療行為の禁止など、安全と法令を厳守。" },
    sitterTrust: { en: "Document key milestones with photos, and hand over all itemized receipts cleanly.", zh: "关键节点实时拍照同步，并在结束后完整交接全部诊疗与交通发票。", ja: "要所で写真報告を行い、領収書を正確に引き渡し。" },
    icon: PiSparkle,
    tone: "bg-[#fdf4e8]",
  },
};

/* =========================================================================
   5. TOP-LEVEL CARE TYPE DETAIL COMPONENT
   ========================================================================= */

export function CareTypeDetail({ modeKey, language }: { modeKey: CareMode; language?: Lang }) {
  const lang = usePageLanguage(language);
  const routePrefix = `/${lang}`;
  const t = common[lang];
  const mode = modes[modeKey];
  const Icon = mode.icon;
  const alternatives = (Object.keys(modes) as CareMode[]).filter((key) => key !== modeKey);

  return (
    <main className="text-[#302a33]">
      {modeKey === "home-visits" ? (
        <>
          {/* Section 00: Overview & Hero */}
          <HomeVisitPageHero mode={mode} lang={lang} Icon={Icon} routePrefix={routePrefix} t={t} />

          {/* Section 01: Overview & Scenes */}
          <HomeVisitIntroSummary mode={mode} lang={lang} />

          {/* Section 02: Real Request Example & Breakdown */}
          <HomeVisitRequestExample lang={lang} routePrefix={routePrefix} />

          {/* Section 03: Owner Guide */}
          <HomeVisitRoleSection variant="need" mode={mode} lang={lang} routePrefix={routePrefix} />

          {/* Section 04: Sitter Standard */}
          <HomeVisitRoleSection variant="offer" mode={mode} lang={lang} routePrefix={routePrefix} />

          {/* Section 05: Explore other care types card banner */}
          <CareTypeAlternativesSection alternatives={alternatives} lang={lang} routePrefix={routePrefix} t={t} />
        </>
      ) : modeKey === "boarding" ? (
        <>
          {/* Section 00: Overview & Hero */}
          <BoardingPageHero mode={mode} lang={lang} Icon={Icon} routePrefix={routePrefix} t={t} />

          {/* Section 01: Overview & Scenes */}
          <BoardingIntroSummary mode={mode} lang={lang} />

          {/* Section 02: Real Request Example & Breakdown */}
          <BoardingRequestExample lang={lang} routePrefix={routePrefix} />

          {/* Section 03: Owner Guide */}
          <BoardingRoleSection variant="need" mode={mode} lang={lang} routePrefix={routePrefix} />

          {/* Section 04: Sitter Standard */}
          <BoardingRoleSection variant="offer" mode={mode} lang={lang} routePrefix={routePrefix} />

          {/* Section 05: Explore other care types card banner */}
          <CareTypeAlternativesSection alternatives={alternatives} lang={lang} routePrefix={routePrefix} t={t} />
        </>
      ) : (
        <>
          {/* Section 00: Overview & Hero */}
          <CustomPageHero mode={mode} lang={lang} Icon={Icon} routePrefix={routePrefix} t={t} />

          {/* Section 01: Overview & Scenes */}
          <CustomIntroSummary mode={mode} lang={lang} />

          {/* Section 02: Real Request Example & Breakdown */}
          <CustomRequestExample lang={lang} routePrefix={routePrefix} />

          {/* Section 03: Owner Guide */}
          <CustomRoleSection variant="need" mode={mode} lang={lang} routePrefix={routePrefix} />

          {/* Section 04: Sitter Standard */}
          <CustomRoleSection variant="offer" mode={mode} lang={lang} routePrefix={routePrefix} />

          {/* Section 05: Explore other care types card banner */}
          <CareTypeAlternativesSection alternatives={alternatives} lang={lang} routePrefix={routePrefix} t={t} />
        </>
      )}
    </main>
  );
}

/* =========================================================================
   6. HOME-VISITS SPECIFIC COMPONENTS (STANDARDS REFERENCE)
   ========================================================================= */

function HomeVisitPageHero({ mode, lang, Icon, routePrefix, t }: { mode: Mode; lang: Lang; Icon: IconType; routePrefix: string; t: (typeof common)[Lang] }) {
  const intro = homeVisitIntroCopy[lang];

  return (
    <section className="w-full bg-[#fffdf9] pt-6 pb-6 md:pt-8 md:pb-8">
      <div className="site-shell">
        {/* Breadcrumb Path */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[#706a78]">
          <Link
            href="/"
            className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
          >
            {t.breadcrumbHome}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
          <Link
            href={`${routePrefix}/care-types`}
            className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
          >
            {t.breadcrumbCareTypes}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
          <span className="font-bold text-[#392847]" aria-current="page">
            {mode.title[lang]}
          </span>
        </nav>

        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a5d34]">
          PetNido care guide
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[var(--primary)] ${mode.tone}`}>
            <Icon size={24} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#392847] sm:text-3xl md:text-[2.35rem] md:leading-tight">
            {intro.pageTitle}
          </h1>
        </div>

        <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-[#625968]">
          {intro.pageSubtitle}
        </p>
      </div>
    </section>
  );
}

function HomeVisitIntroSummary({ mode, lang }: { mode: Mode; lang: Lang }) {
  const intro = homeVisitIntroCopy[lang];

  return (
    <section className="w-full bg-[#fffdf9] pt-2 pb-12 md:pb-16 border-t border-[#ded6e1]/80" aria-labelledby="home-visit-section-01-title">
      <div className="site-shell">
        {/* Section 01 Header */}
        <div className="w-full pt-4 sm:pt-6">
          <h2 id="home-visit-section-01-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
            {intro.sectionTitle}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#706a78]">
            {intro.sectionSub}
          </p>
        </div>

        {/* Two-Column Sub-grid: Left (~36% Suitability checklist), Right (~64% 3 Scenes) */}
        <div className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_1.92fr] lg:items-stretch lg:gap-8">
          {/* Left Column: Best Suited for These Situations */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e2edd7] text-[#3d5a2a]">
                <CheckCircle2 size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#2d401f]">
                {intro.fitTitle}
              </h3>
            </div>

            <div className="mt-3 flex flex-1 flex-col justify-between rounded-2xl border border-[#d6e6c4] bg-[#f4f8ee] p-4 sm:p-5 shadow-2xs">
              <ul className="space-y-3 sm:space-y-3.5">
                {intro.fitItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a633b]" />
                    <span>
                      <strong className="font-bold text-[#2d401f]">{item.label}{lang === "en" ? ": " : "："}</strong>
                      <span className="text-[#506242]">{item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-[#d8e8c6] pt-3 text-xs font-medium leading-relaxed text-[#506242]">
                {intro.fitQuote}
              </div>
            </div>
          </div>

          {/* Right Column: Typical Home Care Scenarios */}
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)]">
                <PawPrint size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#392847]">
                {intro.scenesTitle}
              </h3>
            </div>
            <div className="mt-3 grid gap-3.5 sm:grid-cols-3 flex-1">
              {mode.scenes.map((scene) => (
                <article
                  key={scene.title[lang]}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs transition hover:border-[#bfaec8] hover:shadow-xs"
                >
                  <div className="relative aspect-[16/8] w-full overflow-hidden">
                    <Image
                      src={scene.image}
                      alt={scene.title[lang]}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold leading-snug text-[#392847]">
                        {scene.title[lang]}
                      </h4>
                      <p className="mt-1.5 text-xs text-[#706a78] leading-relaxed line-clamp-3">
                        {scene.text[lang]}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeVisitRequestExample({ lang, routePrefix }: { lang: Lang; routePrefix: string }) {
  const copy = homeVisitExampleCopy[lang];
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);
  const pinLabel = lang === "zh" ? "批注" : lang === "ja" ? "注記" : "Note";

  return (
    <section
      className="w-full bg-[#f6eff9] py-12 md:py-16"
      aria-labelledby="home-visit-example-title"
    >
      <div className="site-shell">
        <div className="w-full">
          <h2 id="home-visit-example-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
            {copy.title}
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#706a78]">
            {copy.intro}
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.42fr_.58fr] lg:items-stretch lg:gap-8">
          <div className="flex flex-col">
            <article className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs">
              <div className="border-b border-[#ede5ef] bg-[#fdfcff] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#392847]">
                      {copy.requestTitle}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{copy.exampleBadge}</span>
                    </span>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`${routePrefix}/care-types/home-visits/example`}
                      className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                    >
                      <span>{copy.ctaText}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6 text-xs sm:text-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:gap-6 lg:items-stretch">
                  <div
                    onMouseEnter={() => setActiveAnnotation(0)}
                    onMouseLeave={() => setActiveAnnotation(null)}
                    className={`flex flex-col justify-between space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                      activeAnnotation === 0
                        ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                        : "hover:bg-[#faf7fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5d34]">
                        <Calendar size={13} />
                        <span>{copy.scheduleHeading}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                          activeAnnotation === 0
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[#ede5f1] text-[var(--primary)]"
                        }`}
                      >
                        💬 {pinLabel} 1
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between rounded-xl border border-[#ede5ef] bg-white p-3 divide-y divide-[#f0e9f2] text-xs">
                      <div className="flex items-center justify-between py-1.5 first:pt-0">
                        <span className="font-medium text-[#7a7281]">{copy.dateLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.dateSpan}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.freqLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.freqVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.dailyLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.dailyVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.timeLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.timeVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 last:pb-0">
                        <span className="font-semibold text-[var(--primary)]">{copy.totalVisitsLabel}</span>
                        <span className="font-extrabold text-[var(--primary)]">{copy.totalVisitsVal}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onMouseEnter={() => setActiveAnnotation(1)}
                    onMouseLeave={() => setActiveAnnotation(null)}
                    className={`flex flex-col justify-between space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                      activeAnnotation === 1
                        ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                        : "hover:bg-[#faf7fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5d34]">
                        <PawPrint size={13} />
                        <span>{copy.petsHeading}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                          activeAnnotation === 1
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[#ede5f1] text-[var(--primary)]"
                        }`}
                      >
                        💬 {pinLabel} 2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 flex-1">
                      {copy.pets.map((pet) => (
                        <div
                          key={pet.name}
                          className="flex items-center gap-3 rounded-xl border border-[#f0eaf2] bg-white p-2.5 shadow-2xs"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white shadow-2xs">
                            <Image
                              src={pet.image}
                              alt={pet.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="text-xs sm:text-[13px] font-bold text-[#392847] truncate">{pet.name}</p>
                              <span className="rounded bg-[#ede6f2] px-1.5 py-0.5 text-[10px] font-bold text-[#633a75] shrink-0">{pet.tag}</span>
                            </div>
                            <p className="text-[11px] font-medium text-[#706a78]">{pet.meta}</p>
                            <p className="text-[11.5px] leading-relaxed text-[#514956]">{pet.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  onMouseEnter={() => setActiveAnnotation(2)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                  className={`space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                    activeAnnotation === 2
                      ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                      : "hover:bg-[#faf7fb]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#392847]">
                      <ListChecks size={13} className="text-[var(--primary)]" />
                      <span>{copy.tasksHeading}</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                        activeAnnotation === 2
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[#ede5f1] text-[var(--primary)]"
                      }`}
                    >
                      💬 {pinLabel} 3
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#ede6f0] bg-white">
                    <table className="w-full table-auto border-collapse text-left text-xs">
                      <thead className="border-b border-[#ede6f0] bg-[#faf6fa] text-[#706a78]">
                        <tr>
                          <th className="w-16 whitespace-nowrap px-3 py-2 text-center font-bold">{copy.tableHeaderTarget}</th>
                          <th className="px-3.5 py-2 font-bold">{copy.tasksHeading}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2ecf4]">
                        {copy.tasks.map((task, idx) => {
                          const isMust = task.priority === "MUST";
                          return (
                            <tr key={task.title} className="transition hover:bg-[#faf7fb]">
                              <td className="px-3 py-2.5 align-middle text-center border-r border-[#f2ecf4] bg-[#fdfbfd]/50">
                                <div className="flex justify-center -space-x-1.5">
                                  {copy.pets.map((pet) => (
                                    <span
                                      key={pet.name}
                                      title={pet.name}
                                      className="relative inline-block h-5 w-5 overflow-hidden rounded-full border border-white bg-[#ece5f0] shadow-2xs"
                                    >
                                      <Image
                                        src={pet.image}
                                        alt={pet.name}
                                        fill
                                        sizes="20px"
                                        className="object-cover"
                                      />
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5 align-middle">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="font-mono font-bold text-[#8a5d34] shrink-0">
                                  #{idx + 1}
                                  </span>
                                  <strong className="font-bold text-[#392847] shrink-0">
                                    {task.title}
                                  </strong>
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                      isMust
                                        ? "bg-[#e2edd7] text-[#2d4d1e]"
                                        : "bg-[#ede5f1] text-[#633a75]"
                                    }`}
                                  >
                                    {isMust ? copy.mustBadge : copy.niceBadge}
                                  </span>
                                  <span className="text-[#625968] [overflow-wrap:anywhere]">
                                    {task.desc}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-[#ebe2ee] bg-[#f7f4f9] p-3 text-xs leading-relaxed text-[#554e5b]">
                    <strong className="font-bold text-[#392847]">💡 {copy.additionalNotesLabel}：</strong>
                    <span>{copy.additionalNotes}</span>
                  </div>
                </div>

                <div
                  onMouseEnter={() => setActiveAnnotation(3)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                  className={`space-y-2 rounded-2xl p-2.5 transition-all duration-200 ${
                    activeAnnotation === 3
                      ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                      : "hover:bg-[#faf7fb]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3d5a2a]">
                      <WalletCards size={13} />
                      <span>{copy.budgetLabel}</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                        activeAnnotation === 3
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[#ede5f1] text-[var(--primary)]"
                      }`}
                    >
                      💬 {pinLabel} 4
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-[#dce8ce] bg-[#f4f8ee] p-3.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <div>
                      <p className="text-[#506242]">
                        <span className="font-semibold">{copy.budgetFormula}</span>
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="block text-[11px] font-semibold text-[#617a52]">{copy.budgetCalculation}</span>
                      <strong className="text-sm sm:text-base font-bold text-[#2d401f]">{copy.budgetTotal}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="flex flex-col">
            <aside className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs">
              <div className="border-b border-[#ede5ef] bg-[#fdfcff] p-4 sm:p-5">
                <div className="flex h-9 sm:h-10 items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)] shadow-2xs">
                      <Sparkles size={13} />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold tracking-tight text-[#392847]">
                      {copy.takeawaysTitle}
                    </h4>
                  </div>
                  <span className="rounded-full bg-[#f4eef7] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)] shrink-0">
                    {lang === "zh" ? "悬停联动定位" : lang === "ja" ? "ホバーで該当箇所と連動" : "Hover to inspect"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-6">
                {copy.takeaways.map((item, idx) => {
                  const isHovered = activeAnnotation === idx;
                  const targetNames = [
                    lang === "zh" ? "日程与频次" : lang === "ja" ? "日程と頻度" : "Schedule",
                    lang === "zh" ? "照护档案" : lang === "ja" ? "ペット情報" : "Pet Profiles",
                    lang === "zh" ? "任务清单" : lang === "ja" ? "タスク一覧" : "Care Tasks",
                    lang === "zh" ? "预算构成" : lang === "ja" ? "予算構成" : "Budget",
                  ];
                  const targetName = targetNames[idx];
                  return (
                    <div
                      key={item.title}
                      onMouseEnter={() => setActiveAnnotation(idx)}
                      onMouseLeave={() => setActiveAnnotation(null)}
                      className={`relative cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                        isHovered
                          ? "border-[var(--primary)] bg-[#fcf9fd] shadow-md -translate-x-1.5 ring-2 ring-[var(--primary)]/20"
                          : "border-[#f0e8f4] bg-[#faf8fb] hover:border-[#ded0e4] hover:bg-white"
                      }`}
                    >
                      <span
                        className={`hidden lg:block absolute -left-2 top-4.5 h-0 w-0 border-y-[6px] border-y-transparent border-r-[8px] transition-colors ${
                          isHovered ? "border-r-[var(--primary)]" : "border-r-[#e4dbe8]"
                        }`}
                      />

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white transition ${
                              isHovered ? "bg-[var(--primary)] scale-110 shadow-2xs" : "bg-[var(--primary)]/80"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h5 className="text-xs sm:text-[13px] font-bold text-[#392847] leading-snug truncate">
                            {item.title}
                          </h5>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                            isHovered
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[#ede5f1] text-[var(--primary)]"
                          }`}
                        >
                          {targetName}
                        </span>
                      </div>

                      <p className="mt-1.5 pl-7 text-xs text-[#706a78] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeVisitRoleSection({
  variant,
  mode,
  lang,
  routePrefix,
}: {
  variant: "need" | "offer";
  mode: Mode;
  lang: Lang;
  routePrefix: string;
}) {
  const copy = homeVisitRoleCopy[lang];
  const isNeed = variant === "need";
  const eyebrow = isNeed ? copy.needEyebrow : copy.offerEyebrow;
  const title = isNeed ? copy.needTitle : copy.offerTitle;
  const sub = isNeed ? copy.needSub : copy.offerSub;
  const cards = isNeed ? copy.steps : copy.offerSteps;

  return (
    <section
      className="w-full bg-[#fffdf9] py-12 md:py-16"
      aria-labelledby={`home-visit-${variant}-title`}
    >
      <div className="site-shell">
        <div className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
              <h2 id={`home-visit-${variant}-title`} className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
                {title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#706a78]">
                {sub}
              </p>
            </div>

            <div className="shrink-0">
              {isNeed ? (
                <Link
                  href="/needs/create"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                >
                  <span>{lang === "zh" ? "发布此类需求" : lang === "ja" ? "この依頼を投稿" : "Post this kind of need"}</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <ServiceComingSoonButton
                  lang={lang}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                >
                  {lang === "zh" ? "提供此类服务" : lang === "ja" ? "このサービスを提供" : "Offer this kind of care"}
                </ServiceComingSoonButton>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card, idx) => (
            <RoleGuidanceCard key={card.title} card={card} index={idx} isNeed={isNeed} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   7. BOARDING SPECIFIC COMPONENTS (MATCHING HOME-VISITS STRUCTURE)
   ========================================================================= */

function BoardingPageHero({ mode, lang, Icon, routePrefix, t }: { mode: Mode; lang: Lang; Icon: IconType; routePrefix: string; t: (typeof common)[Lang] }) {
  const intro = boardingIntroCopy[lang];

  return (
    <section className="w-full bg-[#fffdf9] pt-6 pb-6 md:pt-8 md:pb-8">
      <div className="site-shell">
        {/* Breadcrumb Path */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[#706a78]">
          <Link
            href="/"
            className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
          >
            {t.breadcrumbHome}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
          <Link
            href={`${routePrefix}/care-types`}
            className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
          >
            {t.breadcrumbCareTypes}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
          <span className="font-bold text-[#392847]" aria-current="page">
            {mode.title[lang]}
          </span>
        </nav>

        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a5d34]">
          PetNido care guide
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[var(--primary)] ${mode.tone}`}>
            <Icon size={24} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#392847] sm:text-3xl md:text-[2.35rem] md:leading-tight">
            {intro.pageTitle}
          </h1>
        </div>

        <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-[#625968]">
          {intro.pageSubtitle}
        </p>
      </div>
    </section>
  );
}

function BoardingIntroSummary({ mode, lang }: { mode: Mode; lang: Lang }) {
  const intro = boardingIntroCopy[lang];

  return (
    <section className="w-full bg-[#fffdf9] pt-2 pb-12 md:pb-16 border-t border-[#ded6e1]/80" aria-labelledby="boarding-section-01-title">
      <div className="site-shell">
        <div className="w-full pt-4 sm:pt-6">
          <h2 id="boarding-section-01-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
            {intro.sectionTitle}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#706a78]">
            {intro.sectionSub}
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_1.92fr] lg:items-stretch lg:gap-8">
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e2edd7] text-[#3d5a2a]">
                <CheckCircle2 size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#2d401f]">
                {intro.fitTitle}
              </h3>
            </div>

            <div className="mt-3 flex flex-1 flex-col justify-between rounded-2xl border border-[#d6e6c4] bg-[#f4f8ee] p-4 sm:p-5 shadow-2xs">
              <ul className="space-y-3 sm:space-y-3.5">
                {intro.fitItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a633b]" />
                    <span>
                      <strong className="font-bold text-[#2d401f]">{item.label}{lang === "en" ? ": " : "："}</strong>
                      <span className="text-[#506242]">{item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-[#d8e8c6] pt-3 text-xs font-medium leading-relaxed text-[#506242]">
                {intro.fitQuote}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)]">
                <PawPrint size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#392847]">
                {intro.scenesTitle}
              </h3>
            </div>
            <div className="mt-3 grid gap-3.5 sm:grid-cols-3 flex-1">
              {mode.scenes.map((scene) => (
                <article
                  key={scene.title[lang]}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs transition hover:border-[#bfaec8] hover:shadow-xs"
                >
                  <div className="relative aspect-[16/8] w-full overflow-hidden">
                    <Image
                      src={scene.image}
                      alt={scene.title[lang]}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold leading-snug text-[#392847]">
                        {scene.title[lang]}
                      </h4>
                      <p className="mt-1.5 text-xs text-[#706a78] leading-relaxed line-clamp-3">
                        {scene.text[lang]}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BoardingRequestExample({ lang, routePrefix }: { lang: Lang; routePrefix: string }) {
  const copy = boardingExampleCopy[lang];
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);
  const pinLabel = lang === "zh" ? "批注" : lang === "ja" ? "注記" : "Note";

  return (
    <section
      className="w-full bg-[#f6eff9] py-12 md:py-16"
      aria-labelledby="boarding-example-title"
    >
      <div className="site-shell">
        <div className="w-full">
          <h2 id="boarding-example-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
            {copy.title}
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#706a78]">
            {copy.intro}
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.42fr_.58fr] lg:items-stretch lg:gap-8">
          <div className="flex flex-col">
            <article className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs">
              <div className="border-b border-[#ede5ef] bg-[#fdfcff] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#392847]">
                      {copy.requestTitle}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{copy.exampleBadge}</span>
                    </span>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`${routePrefix}/care-types/home-visits/example`}
                      className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                    >
                      <span>{copy.ctaText}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6 text-xs sm:text-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:gap-6 lg:items-stretch">
                  <div
                    onMouseEnter={() => setActiveAnnotation(0)}
                    onMouseLeave={() => setActiveAnnotation(null)}
                    className={`flex flex-col justify-between space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                      activeAnnotation === 0
                        ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                        : "hover:bg-[#faf7fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5d34]">
                        <Calendar size={13} />
                        <span>{copy.scheduleHeading}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                          activeAnnotation === 0
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[#ede5f1] text-[var(--primary)]"
                        }`}
                      >
                        💬 {pinLabel} 1
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between rounded-xl border border-[#ede5ef] bg-white p-3 divide-y divide-[#f0e9f2] text-xs">
                      <div className="flex items-center justify-between py-1.5 first:pt-0">
                        <span className="font-medium text-[#7a7281]">{copy.dateLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.dateSpan}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.freqLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.freqVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.dailyLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.dailyVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.timeLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.timeVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 last:pb-0">
                        <span className="font-semibold text-[var(--primary)]">{copy.totalVisitsLabel}</span>
                        <span className="font-extrabold text-[var(--primary)]">{copy.totalVisitsVal}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onMouseEnter={() => setActiveAnnotation(1)}
                    onMouseLeave={() => setActiveAnnotation(null)}
                    className={`flex flex-col justify-between space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                      activeAnnotation === 1
                        ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                        : "hover:bg-[#faf7fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5d34]">
                        <PawPrint size={13} />
                        <span>{copy.petsHeading}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                          activeAnnotation === 1
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[#ede5f1] text-[var(--primary)]"
                        }`}
                      >
                        💬 {pinLabel} 2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 flex-1">
                      {copy.pets.map((pet) => (
                        <div
                          key={pet.name}
                          className="flex items-center gap-3 rounded-xl border border-[#f0eaf2] bg-white p-2.5 shadow-2xs"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white shadow-2xs">
                            <Image
                              src={pet.image}
                              alt={pet.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="text-xs sm:text-[13px] font-bold text-[#392847] truncate">{pet.name}</p>
                              <span className="rounded bg-[#ede6f2] px-1.5 py-0.5 text-[10px] font-bold text-[#633a75] shrink-0">{pet.tag}</span>
                            </div>
                            <p className="text-[11px] font-medium text-[#706a78]">{pet.meta}</p>
                            <p className="text-[11.5px] leading-relaxed text-[#514956]">{pet.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  onMouseEnter={() => setActiveAnnotation(2)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                  className={`space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                    activeAnnotation === 2
                      ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                      : "hover:bg-[#faf7fb]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#392847]">
                      <ListChecks size={13} className="text-[var(--primary)]" />
                      <span>{copy.tasksHeading}</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                        activeAnnotation === 2
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[#ede5f1] text-[var(--primary)]"
                      }`}
                    >
                      💬 {pinLabel} 3
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#ede6f0] bg-white">
                    <table className="w-full table-auto border-collapse text-left text-xs">
                      <thead className="border-b border-[#ede6f0] bg-[#faf6fa] text-[#706a78]">
                        <tr>
                          <th className="w-16 whitespace-nowrap px-3 py-2 text-center font-bold">{copy.tableHeaderTarget}</th>
                          <th className="px-3.5 py-2 font-bold">{copy.tasksHeading}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2ecf4]">
                        {copy.tasks.map((task, idx) => {
                          const isMust = task.priority === "MUST";
                          return (
                            <tr key={task.title} className="transition hover:bg-[#faf7fb]">
                              <td className="px-3 py-2.5 align-middle text-center border-r border-[#f2ecf4] bg-[#fdfbfd]/50">
                                <div className="flex justify-center -space-x-1.5">
                                  {copy.pets.map((pet) => (
                                    <span
                                      key={pet.name}
                                      title={pet.name}
                                      className="relative inline-block h-5 w-5 overflow-hidden rounded-full border border-white bg-[#ece5f0] shadow-2xs"
                                    >
                                      <Image
                                        src={pet.image}
                                        alt={pet.name}
                                        fill
                                        sizes="20px"
                                        className="object-cover"
                                      />
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5 align-middle">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="font-mono font-bold text-[#8a5d34] shrink-0">
                                  #{idx + 1}
                                  </span>
                                  <strong className="font-bold text-[#392847] shrink-0">
                                    {task.title}
                                  </strong>
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                      isMust
                                        ? "bg-[#e2edd7] text-[#2d4d1e]"
                                        : "bg-[#ede5f1] text-[#633a75]"
                                    }`}
                                  >
                                    {isMust ? copy.mustBadge : copy.niceBadge}
                                  </span>
                                  <span className="text-[#625968] [overflow-wrap:anywhere]">
                                    {task.desc}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-[#ebe2ee] bg-[#f7f4f9] p-3 text-xs leading-relaxed text-[#554e5b]">
                    <strong className="font-bold text-[#392847]">💡 {copy.additionalNotesLabel}：</strong>
                    <span>{copy.additionalNotes}</span>
                  </div>
                </div>

                <div
                  onMouseEnter={() => setActiveAnnotation(3)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                  className={`space-y-2 rounded-2xl p-2.5 transition-all duration-200 ${
                    activeAnnotation === 3
                      ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                      : "hover:bg-[#faf7fb]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3d5a2a]">
                      <WalletCards size={13} />
                      <span>{copy.budgetLabel}</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                        activeAnnotation === 3
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[#ede5f1] text-[var(--primary)]"
                      }`}
                    >
                      💬 {pinLabel} 4
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-[#dce8ce] bg-[#f4f8ee] p-3.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <div>
                      <p className="text-[#506242]">
                        <span className="font-semibold">{copy.budgetFormula}</span>
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="block text-[11px] font-semibold text-[#617a52]">{copy.budgetCalculation}</span>
                      <strong className="text-sm sm:text-base font-bold text-[#2d401f]">{copy.budgetTotal}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="flex flex-col">
            <aside className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs">
              <div className="border-b border-[#ede5ef] bg-[#fdfcff] p-4 sm:p-5">
                <div className="flex h-9 sm:h-10 items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)] shadow-2xs">
                      <Sparkles size={13} />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold tracking-tight text-[#392847]">
                      {copy.takeawaysTitle}
                    </h4>
                  </div>
                  <span className="rounded-full bg-[#f4eef7] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)] shrink-0">
                    {lang === "zh" ? "悬停联动定位" : lang === "ja" ? "ホバーで該当箇所と連動" : "Hover to inspect"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-6">
                {copy.takeaways.map((item, idx) => {
                  const isHovered = activeAnnotation === idx;
                  const targetName = copy.annotationTargets[idx] || "";
                  return (
                    <div
                      key={item.title}
                      onMouseEnter={() => setActiveAnnotation(idx)}
                      onMouseLeave={() => setActiveAnnotation(null)}
                      className={`relative cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                        isHovered
                          ? "border-[var(--primary)] bg-[#fcf9fd] shadow-md -translate-x-1.5 ring-2 ring-[var(--primary)]/20"
                          : "border-[#f0e8f4] bg-[#faf8fb] hover:border-[#ded0e4] hover:bg-white"
                      }`}
                    >
                      <span
                        className={`hidden lg:block absolute -left-2 top-4.5 h-0 w-0 border-y-[6px] border-y-transparent border-r-[8px] transition-colors ${
                          isHovered ? "border-r-[var(--primary)]" : "border-r-[#e4dbe8]"
                        }`}
                      />

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white transition ${
                              isHovered ? "bg-[var(--primary)] scale-110 shadow-2xs" : "bg-[var(--primary)]/80"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h5 className="text-xs sm:text-[13px] font-bold text-[#392847] leading-snug truncate">
                            {item.title}
                          </h5>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                            isHovered
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[#ede5f1] text-[var(--primary)]"
                          }`}
                        >
                          {targetName}
                        </span>
                      </div>

                      <p className="mt-1.5 pl-7 text-xs text-[#706a78] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function BoardingRoleSection({
  variant,
  mode,
  lang,
  routePrefix,
}: {
  variant: "need" | "offer";
  mode: Mode;
  lang: Lang;
  routePrefix: string;
}) {
  const copy = boardingRoleCopy[lang];
  const isNeed = variant === "need";
  const eyebrow = isNeed ? copy.needEyebrow : copy.offerEyebrow;
  const title = isNeed ? copy.needTitle : copy.offerTitle;
  const sub = isNeed ? copy.needSub : copy.offerSub;
  const cards = isNeed ? copy.steps : copy.offerSteps;

  return (
    <section
      className="w-full bg-[#fffdf9] py-12 md:py-16"
      aria-labelledby={`boarding-${variant}-title`}
    >
      <div className="site-shell">
        <div className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
              <h2 id={`boarding-${variant}-title`} className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
                {title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#706a78]">
                {sub}
              </p>
            </div>

            <div className="shrink-0">
              {isNeed ? (
                <Link
                  href="/needs/create"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                >
                  <span>{lang === "zh" ? "发布此类需求" : lang === "ja" ? "この依頼を投稿" : "Post this kind of need"}</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <ServiceComingSoonButton
                  lang={lang}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                >
                  {lang === "zh" ? "提供此类服务" : lang === "ja" ? "このサービスを提供" : "Offer this kind of care"}
                </ServiceComingSoonButton>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card, idx) => (
            <RoleGuidanceCard key={card.title} card={card} index={idx} isNeed={isNeed} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   8. CUSTOM CARE SPECIFIC COMPONENTS (MATCHING HOME-VISITS STRUCTURE)
   ========================================================================= */

function CustomPageHero({ mode, lang, Icon, routePrefix, t }: { mode: Mode; lang: Lang; Icon: IconType; routePrefix: string; t: (typeof common)[Lang] }) {
  const intro = customIntroCopy[lang];

  return (
    <section className="w-full bg-[#fffdf9] pt-6 pb-6 md:pt-8 md:pb-8">
      <div className="site-shell">
        {/* Breadcrumb Path */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[#706a78]">
          <Link
            href="/"
            className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
          >
            {t.breadcrumbHome}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
          <Link
            href={`${routePrefix}/care-types`}
            className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
          >
            {t.breadcrumbCareTypes}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
          <span className="font-bold text-[#392847]" aria-current="page">
            {mode.title[lang]}
          </span>
        </nav>

        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8a5d34]">
          PetNido care guide
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[var(--primary)] ${mode.tone}`}>
            <Icon size={24} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#392847] sm:text-3xl md:text-[2.35rem] md:leading-tight">
            {intro.pageTitle}
          </h1>
        </div>

        <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-[#625968]">
          {intro.pageSubtitle}
        </p>
      </div>
    </section>
  );
}

function CustomIntroSummary({ mode, lang }: { mode: Mode; lang: Lang }) {
  const intro = customIntroCopy[lang];

  return (
    <section className="w-full bg-[#fffdf9] pt-2 pb-12 md:pb-16 border-t border-[#ded6e1]/80" aria-labelledby="custom-section-01-title">
      <div className="site-shell">
        <div className="w-full pt-4 sm:pt-6">
          <h2 id="custom-section-01-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
            {intro.sectionTitle}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#706a78]">
            {intro.sectionSub}
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_1.92fr] lg:items-stretch lg:gap-8">
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#e2edd7] text-[#3d5a2a]">
                <CheckCircle2 size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#2d401f]">
                {intro.fitTitle}
              </h3>
            </div>

            <div className="mt-3 flex flex-1 flex-col justify-between rounded-2xl border border-[#d6e6c4] bg-[#f4f8ee] p-4 sm:p-5 shadow-2xs">
              <ul className="space-y-3 sm:space-y-3.5">
                {intro.fitItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a633b]" />
                    <span>
                      <strong className="font-bold text-[#2d401f]">{item.label}{lang === "en" ? ": " : "："}</strong>
                      <span className="text-[#506242]">{item.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-[#d8e8c6] pt-3 text-xs font-medium leading-relaxed text-[#506242]">
                {intro.fitQuote}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)]">
                <PawPrint size={14} />
              </span>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-[#392847]">
                {intro.scenesTitle}
              </h3>
            </div>
            <div className="mt-3 grid gap-3.5 sm:grid-cols-3 flex-1">
              {mode.scenes.map((scene) => (
                <article
                  key={scene.title[lang]}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs transition hover:border-[#bfaec8] hover:shadow-xs"
                >
                  <div className="relative aspect-[16/8] w-full overflow-hidden">
                    <Image
                      src={scene.image}
                      alt={scene.title[lang]}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold leading-snug text-[#392847]">
                        {scene.title[lang]}
                      </h4>
                      <p className="mt-1.5 text-xs text-[#706a78] leading-relaxed line-clamp-3">
                        {scene.text[lang]}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomRequestExample({ lang, routePrefix }: { lang: Lang; routePrefix: string }) {
  const copy = customExampleCopy[lang];
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);
  const pinLabel = lang === "zh" ? "批注" : lang === "ja" ? "注記" : "Note";

  return (
    <section
      className="w-full bg-[#f6eff9] py-12 md:py-16"
      aria-labelledby="custom-example-title"
    >
      <div className="site-shell">
        <div className="w-full">
          <h2 id="custom-example-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
            {copy.title}
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#706a78]">
            {copy.intro}
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.42fr_.58fr] lg:items-stretch lg:gap-8">
          <div className="flex flex-col">
            <article className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs">
              <div className="border-b border-[#ede5ef] bg-[#fdfcff] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#392847]">
                      {copy.requestTitle}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{copy.exampleBadge}</span>
                    </span>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={`${routePrefix}/care-types/home-visits/example`}
                      className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                    >
                      <span>{copy.ctaText}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6 text-xs sm:text-sm">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:gap-6 lg:items-stretch">
                  <div
                    onMouseEnter={() => setActiveAnnotation(0)}
                    onMouseLeave={() => setActiveAnnotation(null)}
                    className={`flex flex-col justify-between space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                      activeAnnotation === 0
                        ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                        : "hover:bg-[#faf7fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5d34]">
                        <Calendar size={13} />
                        <span>{copy.scheduleHeading}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                          activeAnnotation === 0
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[#ede5f1] text-[var(--primary)]"
                        }`}
                      >
                        💬 {pinLabel} 1
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between rounded-xl border border-[#ede5ef] bg-white p-3 divide-y divide-[#f0e9f2] text-xs">
                      <div className="flex items-center justify-between py-1.5 first:pt-0">
                        <span className="font-medium text-[#7a7281]">{copy.dateLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.dateSpan}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.freqLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.freqVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.dailyLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.dailyVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="font-medium text-[#7a7281]">{copy.timeLabel}</span>
                        <span className="font-bold text-[#392847]">{copy.timeVal}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 last:pb-0">
                        <span className="font-semibold text-[var(--primary)]">{copy.totalVisitsLabel}</span>
                        <span className="font-extrabold text-[var(--primary)]">{copy.totalVisitsVal}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onMouseEnter={() => setActiveAnnotation(1)}
                    onMouseLeave={() => setActiveAnnotation(null)}
                    className={`flex flex-col justify-between space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                      activeAnnotation === 1
                        ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                        : "hover:bg-[#faf7fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8a5d34]">
                        <PawPrint size={13} />
                        <span>{copy.petsHeading}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                          activeAnnotation === 1
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[#ede5f1] text-[var(--primary)]"
                        }`}
                      >
                        💬 {pinLabel} 2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 flex-1">
                      {copy.pets.map((pet) => (
                        <div
                          key={pet.name}
                          className="flex items-center gap-3 rounded-xl border border-[#f0eaf2] bg-white p-2.5 shadow-2xs"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white shadow-2xs">
                            <Image
                              src={pet.image}
                              alt={pet.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="text-xs sm:text-[13px] font-bold text-[#392847] truncate">{pet.name}</p>
                              <span className="rounded bg-[#ede6f2] px-1.5 py-0.5 text-[10px] font-bold text-[#633a75] shrink-0">{pet.tag}</span>
                            </div>
                            <p className="text-[11px] font-medium text-[#706a78]">{pet.meta}</p>
                            <p className="text-[11.5px] leading-relaxed text-[#514956]">{pet.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  onMouseEnter={() => setActiveAnnotation(2)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                  className={`space-y-2.5 rounded-2xl p-2.5 transition-all duration-200 ${
                    activeAnnotation === 2
                      ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                      : "hover:bg-[#faf7fb]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#392847]">
                      <ListChecks size={13} className="text-[var(--primary)]" />
                      <span>{copy.tasksHeading}</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                        activeAnnotation === 2
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[#ede5f1] text-[var(--primary)]"
                      }`}
                    >
                      💬 {pinLabel} 3
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#ede6f0] bg-white">
                    <table className="w-full table-auto border-collapse text-left text-xs">
                      <thead className="border-b border-[#ede6f0] bg-[#faf6fa] text-[#706a78]">
                        <tr>
                          <th className="w-16 whitespace-nowrap px-3 py-2 text-center font-bold">{copy.tableHeaderTarget}</th>
                          <th className="px-3.5 py-2 font-bold">{copy.tasksHeading}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2ecf4]">
                        {copy.tasks.map((task, idx) => {
                          const isMust = task.priority === "MUST";
                          return (
                            <tr key={task.title} className="transition hover:bg-[#faf7fb]">
                              <td className="px-3 py-2.5 align-middle text-center border-r border-[#f2ecf4] bg-[#fdfbfd]/50">
                                <div className="flex justify-center -space-x-1.5">
                                  {copy.pets.map((pet) => (
                                    <span
                                      key={pet.name}
                                      title={pet.name}
                                      className="relative inline-block h-5 w-5 overflow-hidden rounded-full border border-white bg-[#ece5f0] shadow-2xs"
                                    >
                                      <Image
                                        src={pet.image}
                                        alt={pet.name}
                                        fill
                                        sizes="20px"
                                        className="object-cover"
                                      />
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3.5 py-2.5 align-middle">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="font-mono font-bold text-[#8a5d34] shrink-0">
                                  #{idx + 1}
                                  </span>
                                  <strong className="font-bold text-[#392847] shrink-0">
                                    {task.title}
                                  </strong>
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                                      isMust
                                        ? "bg-[#e2edd7] text-[#2d4d1e]"
                                        : "bg-[#ede5f1] text-[#633a75]"
                                    }`}
                                  >
                                    {isMust ? copy.mustBadge : copy.niceBadge}
                                  </span>
                                  <span className="text-[#625968] [overflow-wrap:anywhere]">
                                    {task.desc}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-[#ebe2ee] bg-[#f7f4f9] p-3 text-xs leading-relaxed text-[#554e5b]">
                    <strong className="font-bold text-[#392847]">💡 {copy.additionalNotesLabel}：</strong>
                    <span>{copy.additionalNotes}</span>
                  </div>
                </div>

                <div
                  onMouseEnter={() => setActiveAnnotation(3)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                  className={`space-y-2 rounded-2xl p-2.5 transition-all duration-200 ${
                    activeAnnotation === 3
                      ? "bg-[#f8f2fb] ring-2 ring-[var(--primary)]/40 shadow-xs"
                      : "hover:bg-[#faf7fb]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3d5a2a]">
                      <WalletCards size={13} />
                      <span>{copy.budgetLabel}</span>
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition shadow-2xs ${
                        activeAnnotation === 3
                          ? "bg-[var(--primary)] text-white"
                          : "bg-[#ede5f1] text-[var(--primary)]"
                      }`}
                    >
                      💬 {pinLabel} 4
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-[#dce8ce] bg-[#f4f8ee] p-3.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <div>
                      <p className="text-[#506242]">
                        <span className="font-semibold">{copy.budgetFormula}</span>
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="block text-[11px] font-semibold text-[#617a52]">{copy.budgetCalculation}</span>
                      <strong className="text-sm sm:text-base font-bold text-[#2d401f]">{copy.budgetTotal}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="flex flex-col">
            <aside className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs">
              <div className="border-b border-[#ede5ef] bg-[#fdfcff] p-4 sm:p-5">
                <div className="flex h-9 sm:h-10 items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-fixed)] text-[var(--primary)] shadow-2xs">
                      <Sparkles size={13} />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold tracking-tight text-[#392847]">
                      {copy.takeawaysTitle}
                    </h4>
                  </div>
                  <span className="rounded-full bg-[#f4eef7] px-2.5 py-1 text-[10px] font-semibold text-[var(--primary)] shrink-0">
                    {lang === "zh" ? "悬停联动定位" : lang === "ja" ? "ホバーで該当箇所と連動" : "Hover to inspect"}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-6">
                {copy.takeaways.map((item, idx) => {
                  const isHovered = activeAnnotation === idx;
                  const targetName = copy.annotationTargets[idx] || "";
                  return (
                    <div
                      key={item.title}
                      onMouseEnter={() => setActiveAnnotation(idx)}
                      onMouseLeave={() => setActiveAnnotation(null)}
                      className={`relative cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                        isHovered
                          ? "border-[var(--primary)] bg-[#fcf9fd] shadow-md -translate-x-1.5 ring-2 ring-[var(--primary)]/20"
                          : "border-[#f0e8f4] bg-[#faf8fb] hover:border-[#ded0e4] hover:bg-white"
                      }`}
                    >
                      <span
                        className={`hidden lg:block absolute -left-2 top-4.5 h-0 w-0 border-y-[6px] border-y-transparent border-r-[8px] transition-colors ${
                          isHovered ? "border-r-[var(--primary)]" : "border-r-[#e4dbe8]"
                        }`}
                      />

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white transition ${
                              isHovered ? "bg-[var(--primary)] scale-110 shadow-2xs" : "bg-[var(--primary)]/80"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h5 className="text-xs sm:text-[13px] font-bold text-[#392847] leading-snug truncate">
                            {item.title}
                          </h5>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                            isHovered
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[#ede5f1] text-[var(--primary)]"
                          }`}
                        >
                          {targetName}
                        </span>
                      </div>

                      <p className="mt-1.5 pl-7 text-xs text-[#706a78] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomRoleSection({
  variant,
  mode,
  lang,
  routePrefix,
}: {
  variant: "need" | "offer";
  mode: Mode;
  lang: Lang;
  routePrefix: string;
}) {
  const copy = customRoleCopy[lang];
  const isNeed = variant === "need";
  const eyebrow = isNeed ? copy.needEyebrow : copy.offerEyebrow;
  const title = isNeed ? copy.needTitle : copy.offerTitle;
  const sub = isNeed ? copy.needSub : copy.offerSub;
  const cards = isNeed ? copy.steps : copy.offerSteps;

  return (
    <section
      className="w-full bg-[#fffdf9] py-12 md:py-16"
      aria-labelledby={`custom-${variant}-title`}
    >
      <div className="site-shell">
        <div className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
              <h2 id={`custom-${variant}-title`} className="text-xl sm:text-2xl font-bold tracking-tight text-[#392847] md:text-[1.75rem] md:leading-tight">
                {title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#706a78]">
                {sub}
              </p>
            </div>

            <div className="shrink-0">
              {isNeed ? (
                <Link
                  href="/needs/create"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                >
                  <span>{lang === "zh" ? "发布此类需求" : lang === "ja" ? "この依頼を投稿" : "Post this kind of need"}</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <ServiceComingSoonButton
                  lang={lang}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                >
                  {lang === "zh" ? "提供此类服务" : lang === "ja" ? "このサービスを提供" : "Offer this kind of care"}
                </ServiceComingSoonButton>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card, idx) => (
            <RoleGuidanceCard key={card.title} card={card} index={idx} isNeed={isNeed} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   9. SHARED REUSABLE SUBCOMPONENTS
   ========================================================================= */

function CareTypeAlternativesSection({
  alternatives,
  lang,
  routePrefix,
  t,
}: {
  alternatives: CareMode[];
  lang: Lang;
  routePrefix: string;
  t: (typeof common)[Lang];
}) {
  return (
    <section aria-label={t.otherHeading} className="w-full bg-white pb-14 md:pb-20 pt-4">
      <div className="site-shell">
        <div className="rounded-[24px] border border-[#e8dcee] bg-[#f8f2fb] p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#392847]">
                {t.otherHeading}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#706a78]">
                {t.otherSub}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {alternatives.map((key) => {
                const AltIcon = modes[key].icon;
                return (
                  <Link
                    key={key}
                    href={`${routePrefix}/care-types/${key}`}
                    className="inline-flex items-center gap-2.5 rounded-2xl border border-[#d8cbdc] bg-white px-5 py-3.5 text-sm font-bold text-[var(--primary)] shadow-2xs transition hover:border-[var(--primary)] hover:bg-[#faf7fb] active:scale-[0.99]"
                  >
                    <AltIcon size={18} className="text-[#8a5d34]" />
                    <span>{modes[key].title[lang]}</span>
                    <ArrowRight size={15} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleGuidanceCard({
  card,
  index = 0,
  isNeed = true,
}: {
  card: {
    title: string;
    points?: readonly { label: string; text: string }[];
    items?: readonly string[];
    text?: string;
  };
  index?: number;
  isNeed?: boolean;
}) {
  const iconConfigs = isNeed
    ? [
        { icon: ShieldCheck, accent: "bg-[#eef6e8] text-[#345c22] border border-[#d8eacb]" },
        { icon: ListChecks, accent: "bg-[#fbf2e3] text-[#8a572c] border border-[#fae2c1]" },
        { icon: KeyRound, accent: "bg-[#f3edf6] text-[var(--primary)] border border-[#e5d8ea]" },
      ]
    : [
        { icon: PawPrint, accent: "bg-[#f3edf6] text-[var(--primary)] border border-[#e5d8ea]" },
        { icon: Sparkles, accent: "bg-[#fbf2e3] text-[#8a572c] border border-[#fae2c1]" },
        { icon: CheckCircle2, accent: "bg-[#eef6e8] text-[#345c22] border border-[#d8eacb]" },
      ];

  const config = iconConfigs[index % iconConfigs.length];
  const Icon = config.icon;

  return (
    <article className="group flex flex-col justify-between rounded-[22px] border border-[#e2d8e5] bg-white p-5 sm:p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-[#c5b5cf] hover:shadow-md">
      <div>
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs ${config.accent}`}>
            <Icon size={18} />
          </span>
          <h3 className="text-base sm:text-[1.05rem] font-bold tracking-tight text-[#392847] leading-snug">
            {card.title}
          </h3>
        </div>

        {card.points ? (
          <div className="mt-4 space-y-2.5">
            {card.points.map((pt) => (
              <div
                key={pt.label}
                className="rounded-xl border border-[#f0e9f3] bg-[#faf8fb] p-3 transition group-hover:bg-[#fdfcff] group-hover:border-[#e9dff0]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                  <strong className="text-xs sm:text-[12.5px] font-bold text-[#392847]">
                    {pt.label}
                  </strong>
                </div>
                <p className="mt-1 pl-3 text-xs leading-relaxed text-[#655d6e]">
                  {pt.text}
                </p>
              </div>
            ))}
          </div>
        ) : card.items ? (
          <ul className="mt-4 space-y-2 rounded-xl border border-[#f0e9f3] bg-[#faf8fb] p-3.5 text-xs leading-relaxed text-[#655d6e]">
            {card.items.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#527046]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-[#f0e9f3] bg-[#faf8fb] p-3.5 text-xs leading-relaxed text-[#655d6e]">{card.text}</p>
        )}
      </div>
    </article>
  );
}

function ServiceComingSoonButton({
  lang,
  className,
  children,
}: {
  lang: Lang;
  className: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const copy = {
    en: {
      title: "Services · In development",
      desc: "Service publishing, applications, and chat are not available in this development preview. You can try the request form.",
      close: "Understood",
    },
    zh: {
      title: "服务功能开发中",
      desc: "服务发布、应聘和聊天尚未开放。当前可以体验需求表单，无法安排实际照护。",
      close: "知道了",
    },
    ja: {
      title: "サービス提供機能は開発中",
      desc: "サービス出品・応募・チャットは未対応です。依頼フォームを体験できますが、実際のお世話の手配はできません。",
      close: "閉じる",
    },
  }[lang];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children} · {lang === "ja" ? "開発中" : lang === "zh" ? "开发中" : "In development"}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coming-soon-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-[#ede5ef] bg-white p-6 sm:p-8 text-[#302a33] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-fixed)] text-[var(--primary)]">
                <Sparkles size={24} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[#706a78] hover:bg-[#faf7fb] hover:text-[#392847]"
              >
                <X size={18} />
              </button>
            </div>

            <h3 id="coming-soon-title" className="mt-4 text-xl font-bold tracking-tight text-[#392847]">
              {copy.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#706a78]">
              {copy.desc}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-bold text-white shadow-2xs hover:opacity-95 active:scale-[0.99]"
              >
                {copy.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* =========================================================================
   10. CARE TYPES HUB / COMPARISON
   ========================================================================= */

const hubScenarios: Record<CareMode, Copy> = {
  "home-visits": {
    en: "Best for short trips, independent cats, or pets that get stressed in new places.",
    zh: "最适合短期离开、猫咪独自留守、或对陌生环境极度敏感的宠物。",
    ja: "短期の留守、環境変化が苦手な猫や小動物に最適です。",
  },
  boarding: {
    en: "Best for longer trips, social dogs, or pets needing continuous daytime and nighttime presence.",
    zh: "最适合长假出行、需要规律散步的狗狗、或无法独自在家的宠物。",
    ja: "長期の留守、散歩が必要な犬、常に人の見守りが必要なペットに最適です。",
  },
  custom: {
    en: "Best for single tasks: clinic transport, nail clipping, or setting up equipment.",
    zh: "最适合单次事项协助：陪同就医、协助剪指甲、大扫除或安装宠物设备。",
    ja: "通院付き添い、爪切り、設備の組み立てなど、単発の明確な作業に最適です。",
  },
};

const hubScenarioHighlights: Record<CareMode, Record<Lang, string[]>> = {
  "home-visits": {
    en: ["Short trips", "Cats and small pets", "Less relocation stress", "Keep home routine"],
    zh: ["短期出差旅行", "猫咪与小动物", "不换环境少应激", "维持原本作息"],
    ja: ["短期の留守", "猫や小動物", "環境変化のストレス軽減", "いつもの生活リズム"],
  },
  boarding: {
    en: ["Longer trips", "Dogs needing walks", "Separation anxiety", "Day and night presence"],
    zh: ["长期出差休假", "需要散步的狗狗", "容易分离焦虑", "昼夜持续陪伴"],
    ja: ["長期の旅行・出張", "散歩が必要な犬", "お留守番が苦手", "24時間の見守り"],
  },
  custom: {
    en: ["Vet escort and checkups", "Nail trimming", "Transporting equipment", "Single specific task"],
    zh: ["陪同就医体检", "帮宠物剪指甲", "组装生活设备", "单次明确任务"],
    ja: ["通院・受診の付き添い", "爪切り・お手入れ", "設備の設置・運搬", "単発の明確な作業"],
  },
};

export function CareTypesHub({ language }: { language?: Lang } = {}) {
  const lang = usePageLanguage(language);
  const routePrefix = `/${lang}`;
  const t = common[lang];
  const modeKeys = Object.keys(modes) as CareMode[];

  return (
    <main className="bg-[#fffdf9] text-[#302a33]">
      <section className="site-shell pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="w-full">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-[#706a78]">
            <Link
              href="/"
              className="font-medium text-[#706a78] transition hover:text-[var(--primary)]"
            >
              {t.breadcrumbHome}
            </Link>
            <ChevronRight size={12} className="shrink-0 text-[#b5aab9]" />
            <span className="font-bold text-[#392847]" aria-current="page">
              {t.breadcrumbCareTypes}
            </span>
          </nav>

          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8a5d34]">{t.hubEyebrow}</p>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#392847]">{t.hubTitle}</h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#706a78]">{t.hubSub}</p>
        </div>

        <div className="mt-8 md:mt-10 grid gap-5 md:grid-cols-3 lg:gap-6">
          {modeKeys.map((key) => {
            const mode = modes[key];
            const Icon = mode.icon;
            return (
              <article
                key={key}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ded6e1] bg-white shadow-2xs transition hover:border-[#bfaec8] hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#faf7fb]">
                    <Image
                      src={mode.hero}
                      alt={mode.title[lang]}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 text-[var(--primary)]">
                      <Icon size={16} className="text-[#8a5d34]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a5d34]">
                        {mode.title[lang]}
                      </span>
                    </div>

                    <h2 className="mt-2 text-lg sm:text-xl font-bold text-[#392847]">{mode.short[lang]}</h2>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#706a78]">{mode.intro[lang]}</p>

                    <div className="mt-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a5d34]">{t.scenarioLabel}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {hubScenarioHighlights[key][lang].map((tag) => (
                          <span key={tag} className="rounded-md bg-[#faf7fb] border border-[#ede5ef] px-2 py-0.5 text-[11px] font-medium text-[#706a78]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 sm:p-5 sm:pt-0">
                  <Link
                    href={`${routePrefix}/care-types/${key}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-2.5 text-xs sm:text-sm font-bold text-white shadow-2xs transition hover:opacity-95 active:scale-[0.99]"
                  >
                    <span>{t.learn}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
