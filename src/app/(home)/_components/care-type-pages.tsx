"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Home,
  House,
  KeyRound,
  PawPrint,
  ShieldCheck,
  Sparkles,
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
  icon: typeof Home;
  tone: string;
};

const common = {
  en: {
    eyebrow: "",
    hubTitle: "What type of service fits you and your pet right now?",
    hubText: "Consider your travel plans, your pet's individual needs, and the help you are looking for. Then choose the type that suits you both.",
    recurring: "Three common ways to arrange care",
    fallback: "The third option",
    fallbackText: "When the need is not boarding or a regular home routine, describe it as one clear, specific pet-related service.",
    bestFor: "Best for",
    consider: "Consider first",
    other: "Compare another care type",
    owner: "When you need help",
    examples: "Typical requests",
    prepare: "Agree on this before care starts",
    sitter: "When you want to provide this care",
    trust: "Help the owner feel at ease",
    need: "Post this kind of need",
    offer: "Offer this kind of care",
    read: "See when it fits",
  },
  zh: {
    eyebrow: "",
    hubTitle: "什么类型的服务适合你和宠物当下的情况？",
    hubText: "考虑你的出行安排、宠物的特性，以及你需要的帮助。选择适合你们的类型。",
    recurring: "三种常见的照护方式",
    fallback: "第三种",
    fallbackText: "当需求不属于寄养或固定上门日常时，把它描述成一项清楚、具体的宠物相关服务。",
    bestFor: "更适合这些情况",
    consider: "选择前先考虑",
    other: "也可以比较其他方式",
    owner: "当你需要帮助时",
    examples: "这类需求通常长这样",
    prepare: "开始前，双方要确认",
    sitter: "当你想提供这项服务时",
    trust: "让宠物主人更安心",
    need: "发布这类需求",
    offer: "提供这类服务",
    read: "看看是否适合",
  },
  ja: {
    eyebrow: "",
    hubTitle: "今のあなたとペットに合うサービスはどれですか？",
    hubText: "外出の予定、ペットの性格や特徴、必要としているサポートを考え、ふたりに合うタイプを選びましょう。",
    recurring: "3つのケア方法",
    fallback: "3つ目",
    fallbackText: "預かりや定期訪問ではない場合は、具体的なペット関連サービスとして依頼できます。",
    bestFor: "向いている場面",
    consider: "先に考えること",
    other: "ほかの方法と比較",
    owner: "助けが必要なとき",
    examples: "よくある依頼",
    prepare: "開始前に確認すること",
    sitter: "このケアを提供するとき",
    trust: "飼い主に安心してもらう",
    need: "この依頼を投稿",
    offer: "このケアを提供",
    read: "向いているか確認",
  },
} as const;

const hubScenarios: Record<CareMode, Copy> = {
  "home-visits": {
    en: "When your trip is short or life is especially busy, and your pet feels happiest in its familiar environment, someone can visit your home to handle its usual feeding, water, cleaning, walks, and check-ins.",
    zh: "当你只是短途出行，或者最近比较忙，而你的宠物更喜欢待在熟悉的环境里，可以请人上门完成平时的喂食、换水、清洁、散步和状态确认。",
    ja: "短い外出や忙しい時期に、ペットが慣れた環境で過ごすことを好むなら、訪問する人に食事、水、掃除、散歩、様子の確認といった日常ケアを任せられます。",
  },
  boarding: {
    en: "When you will be away for longer and your pet cannot be left without company for extended periods, it can temporarily stay in a sitter's home. This provides a steadier daily rhythm, more interaction, and continuous company and observation through the day and night.",
    zh: "当你出行时间较长，宠物无法长时间没有人陪伴时，可以让它暂时住进 sitter 的家。相比每天短暂上门，寄养能提供更稳定的生活节奏、更多互动，以及白天和夜间更连续的陪伴、照看和状态观察。",
    ja: "外出が長く、ペットが長時間ひとりで過ごせない場合は、シッター宅で一時的に預かってもらえます。短時間の訪問よりも安定した生活リズムと交流があり、昼夜を通して継続的な付き添いと見守りを受けられます。",
  },
  custom: {
    en: "If you do not need an ongoing care routine and only need help with one task—trimming nails, taking your pet to the vet, moving or installing pet equipment, or cleaning its living area when you are tired—you can post a one-off custom need.",
    zh: "如果你不需要日常照顾，只是需要有人帮宠物剪指甲、送宠物就医、搬运或安装宠物设备，或者只是累了，想找人打扫宠物生活区域的卫生，都可以发布一个一次性的自定义需求。",
    ja: "日常的なケアではなく、爪切り、動物病院への付き添い、ペット設備の運搬や設置、疲れているときの生活スペースの掃除など、一つの作業だけを頼みたい場合は、単発のカスタム依頼を投稿できます。",
  },
};

const hubScenarioHighlights: Record<CareMode, Record<Lang, string[]>> = {
  "home-visits": {
    en: ["your trip is short or life is especially busy", "feels happiest in its familiar environment", "visit your home to handle its usual"],
    zh: ["短途出行", "最近比较忙", "更喜欢待在熟悉的环境里", "请人上门完成平时的"],
    ja: ["短い外出や忙しい時期", "慣れた環境で過ごすことを好む", "日常ケアを任せられます"],
  },
  boarding: {
    en: ["away for longer", "cannot be left without company for extended periods", "continuous company and observation"],
    zh: ["出行时间较长", "无法长时间没有人陪伴", "更稳定的生活节奏、更多互动", "更连续的陪伴、照看和状态观察"],
    ja: ["外出が長く", "長時間ひとりで過ごせない", "安定した生活リズムと交流", "継続的な付き添いと見守り"],
  },
  custom: {
    en: ["do not need an ongoing care routine", "trimming nails", "taking your pet to the vet", "moving or installing pet equipment", "one-off custom need"],
    zh: ["不需要日常照顾", "帮宠物剪指甲", "送宠物就医", "搬运或安装宠物设备", "打扫宠物生活区域的卫生", "一次性的自定义需求"],
    ja: ["日常的なケアではなく", "爪切り", "動物病院への付き添い", "ペット設備の運搬や設置", "単発のカスタム依頼"],
  },
};

const modes: Record<CareMode, Mode> = {
  "home-visits": {
    title: { en: "Home feeding & visits", zh: "上门喂养与照护", ja: "訪問での食事・ケア" },
    short: { en: "The pet keeps living in its familiar home", zh: "宠物继续住在熟悉的家里", ja: "慣れた自宅でケアを受ける" },
    intro: {
      en: "A sitter visits at agreed times and continues the pet's normal feeding, cleaning, walking and everyday routine.",
      zh: "sitter 按约定时间来到宠物家中，延续原有的喂食、清洁、散步和生活习惯。",
      ja: "決めた時間にシッターが訪問し、食事、掃除、散歩などいつもの習慣を続けます。",
    },
    hero: "/images/care-guides/care-type-home-feeding-v3.webp",
    scenes: [
      {
        title: { en: "Care for a rabbit in its own habitat", zh: "上门照看兔子的生活区", ja: "うさぎの飼育環境を訪問ケア" },
        text: { en: "Check the rabbit, refresh hay and water, and spot-clean its familiar setup.", zh: "在熟悉的笼舍里检查状态、补充干草和饮水，并按约定局部清洁生活区。", ja: "慣れた環境で様子を見て、牧草と水を補充し、必要な範囲を掃除します。" },
        image: "/images/care-guides/stock-home-rabbit.jpg",
      },
      {
        title: { en: "Walk a dog nearby", zh: "按熟悉路线上门遛狗", ja: "いつもの道を散歩" },
        text: { en: "Keep the dog's usual route, pace and toilet routine.", zh: "继续宠物熟悉的路线、节奏和排泄习惯，减少主人短期外出带来的变化。", ja: "慣れたコースとペースで散歩を続けます。" },
        image: "/images/care-guides/stock-home-dog-walking.jpg",
      },
      {
        title: { en: "Feed a cat at home", zh: "按原有习惯上门喂猫", ja: "自宅で猫の食事" },
        text: { en: "Follow the right portion, feeding place and water routine.", zh: "按约定分量和时间喂食、换水，让猫继续使用熟悉的食具和空间。", ja: "決めた量と時間で食事と水を用意します。" },
        image: "/images/care-guides/stock-home-cat-feeding.jpg",
      },
    ],
    fit: [
      { en: "You are away for a short trip", zh: "只是短期外出，不想让宠物换环境", ja: "短期間の外出" },
      { en: "The pet is nervous in new places", zh: "宠物害怕陌生气味、环境或其他动物", ja: "新しい環境が苦手" },
      { en: "Its habitat and supplies are hard to move", zh: "兔笼、鸟笼和固定用品不方便搬动", ja: "飼育環境を動かしにくい" },
    ],
    notFit: [
      { en: "The pet cannot safely be alone between visits", zh: "宠物无法在两次上门之间安全独处", ja: "訪問の間に留守番できない" },
      { en: "It needs continuous medical observation", zh: "需要持续医疗观察或专业治疗", ja: "継続的な医療観察が必要" },
    ],
    prepare: {
      en: "Agree on visit windows, feeding amounts, access and key handover, emergency contacts and how updates will be sent. Put private and valuable items away before home access begins.",
      zh: "确认上门时间、喂食分量、钥匙与入户方式、紧急联系人和消息频率；入户前也请收好贵重物品与私人用品。",
      ja: "訪問時間、食事量、鍵、緊急連絡先、報告方法を確認し、貴重品は片づけます。",
    },
    sitterIntro: { en: "Home visits suit people with reliable timekeeping, real animal experience and no need to host pets at home.", zh: "适合时间观念强、有真实照护经验，也愿意在邻里间移动的人；不需要在自己家准备寄养空间。", ja: "時間を守り、動物経験があり、自宅で預からず地域を移動できる人に向いています。" },
    sitterFit: { en: "Only accept animals, travel distances and visit windows you can handle calmly.", zh: "只接受自己熟悉的动物、能稳定到达的距离和真正能保证的时间段。", ja: "無理なく対応できる動物、距離、時間だけを選びます。" },
    sitterThink: { en: "Home access and key handover require precise communication and trustworthy boundaries.", zh: "入户与钥匙交接需要更高信任；到达、离开和异常情况都要准确沟通。", ja: "入室と鍵の管理には正確な連絡と信頼が必要です。" },
    sitterTrust: { en: "Share experience in advance and send clear, timely photos and updates during each visit.", zh: "提前说明经验；每次上门后及时发送真实照片、完成事项和异常状态。", ja: "経験を伝え、訪問ごとに写真と状況を報告します。" },
    icon: Home,
    tone: "bg-[#e7f0dd]",
  },
  boarding: {
    title: { en: "Family boarding", zh: "家庭寄养", ja: "家庭預かり" },
    short: { en: "The pet temporarily lives in the sitter's home", zh: "宠物暂时住进 sitter 的家", ja: "シッターの家で一時的に過ごす" },
    intro: {
      en: "Boarding provides a temporary home with more continuous company and observation through the day and night.",
      zh: "宠物进入一个有人持续陪伴的临时家庭，白天和夜间都能得到更连续的照看与状态观察。",
      ja: "日中も夜も人がいる一時的な家で、継続的な付き添いと観察を受けます。",
    },
    hero: "/images/care-guides/care-type-family-boarding-v3.webp",
    scenes: [
      {
        title: { en: "Board guinea pigs by household group", zh: "按原家庭关系寄养荷兰猪", ja: "元の組み合わせごとにモルモットを預かる" },
        text: { en: "Keep bonded pets together, separate unfamiliar guests, and prepare clean food, water and hiding areas for each group.", zh: "原本合笼的伙伴可以同住；互不熟悉的客人要分区，并为每组分别准备干草、饮水和躲藏处。", ja: "一緒に暮らす仲間は同じ区画にし、面識のない子は分けて、食事、水、隠れ場所を用意します。" },
        image: "/images/care-guides/stock-boarding-guinea-pig.jpg",
      },
      {
        title: { en: "Care for several boarded kittens", zh: "在安全房间照看多只小猫", ja: "安全な部屋で複数の子猫を預かる" },
        text: { en: "A kitten-safe room supports play, rest and closer observation.", zh: "准备封闭安全的房间、休息区和猫抓设施，在陪伴中持续观察状态。", ja: "安全な部屋で遊び、休息、様子の確認を行います。" },
        image: "/images/care-guides/stock-boarding-cats.jpg",
      },
      {
        title: { en: "Stay close to a senior dog", zh: "陪伴需要更多观察的老年犬", ja: "シニア犬のそばで見守る" },
        text: { en: "A calm home makes appetite, energy and behaviour changes easier to notice.", zh: "安静的临时家庭能减少独处，也更容易发现食欲、精神和行为变化。", ja: "静かな家で食欲や行動の変化に気づきやすくします。" },
        image: "/images/care-guides/stock-boarding-senior-dog.jpg",
      },
    ],
    fit: [
      { en: "You will be away longer", zh: "离开时间较长，一两次上门不足以陪伴", ja: "長期間家を空ける" },
      { en: "The pet cannot stay alone for long", zh: "宠物不适合长时间独处", ja: "長い留守番が難しい" },
      { en: "You want closer day-and-night observation", zh: "希望白天、夜间都有人持续观察状态", ja: "日中と夜の継続観察が必要" },
    ],
    notFit: [
      { en: "The pet is highly stressed by a new home", zh: "宠物对陌生空间和气味极度紧张", ja: "新しい家で強いストレスを感じる" },
      { en: "The household cannot safely separate animals", zh: "寄养家庭无法为不同宠物安全分区", ja: "動物を安全に分けられない" },
    ],
    prepare: {
      en: "Confirm resident pets, children, smoking, sleeping areas, safe separation, maximum guest count, food and medicine, drop-off and pick-up, and emergency veterinary decisions.",
      zh: "确认原住宠物、儿童、吸烟、睡眠区域、安全隔离、最多接收数量、食物药物、接送安排和紧急就医决定。",
      ja: "先住動物、子ども、喫煙、分離方法、受入数、食事、送迎、緊急時の受診を確認します。",
    },
    sitterIntro: { en: "Good boarding starts with a safe home, suitable space, species experience and enough time to be present.", zh: "提供家庭寄养，需要安全合适的空间、同类宠物经验、明确的接收上限，以及真正充足的在家时间。", ja: "安全な家、十分なスペース、同種の経験、在宅時間が必要です。" },
    sitterFit: { en: "Describe the home honestly, including resident animals, children, outdoor access and separation areas.", zh: "如实介绍原住宠物、家庭成员、户外通道、睡眠区和可以使用的隔离空间。", ja: "先住動物、家族、屋外動線、分離スペースを正直に伝えます。" },
    sitterThink: { en: "Set capacity from space, temperament and real workload—not the number of empty beds or cages.", zh: "根据空间、宠物性格和实际精力设定上限，而不是只看还有几个空笼子。", ja: "空き設備だけでなく、広さ、性格、対応力で上限を決めます。" },
    sitterTrust: { en: "Show the home before the stay and agree on routines, emergency contacts and veterinary decisions.", zh: "寄养前展示真实家庭环境，详细询问习惯，并确认紧急联系人和就医方式。", ja: "事前に家を見せ、習慣、緊急連絡先、受診判断を確認します。" },
    icon: House,
    tone: "bg-[#e6edf2]",
  },
  custom: {
    title: { en: "Other custom pet services", zh: "其他宠物相关自定义服务", ja: "その他のペット向けカスタムサービス" },
    short: { en: "Get help with one clearly scoped pet-related task", zh: "围绕真实生活，解决一件具体的宠物相关事项", ja: "範囲の明確なペット関連作業を頼む" },
    intro: {
      en: "Use this when you do not need a full visit routine or boarding stay—just a safe, lawful and clearly described result.",
      zh: "不需要完整的上门日常，也不需要寄养，只需要完成一件安全、合法、范围明确的宠物相关任务。",
      ja: "訪問ケアや預かりではなく、安全で合法、範囲の明確な作業を頼む方法です。",
    },
    hero: "/images/care-guides/care-type-custom-help-v3.webp",
    scenes: [
      {
        title: { en: "Ask for help trimming nails", zh: "请有经验的人帮宠物剪指甲", ja: "経験者に爪切りを頼む" },
        text: { en: "Ask someone experienced to complete or demonstrate one routine care task.", zh: "自己没有把握时，可以找熟悉这种动物的人完成或示范一次日常护理。", ja: "経験のある人に一度のケアを依頼します。" },
        image: "/images/care-guides/stock-custom-nail-grooming.jpg",
      },
      {
        title: { en: "Set up and test pet equipment", zh: "安装并测试宠物生活设备", ja: "ペット設備を設置・確認する" },
        text: { en: "Ask for help positioning and testing a feeder, camera or habitat before relying on it.", zh: "自动喂食器、摄像头或笼舍安装后，要现场测试供电、出粮和固定是否可靠。", ja: "給餌器、カメラ、飼育設備を設置し、電源や動作、固定を確認します。" },
        image: "/images/care-guides/stock-custom-pet-feeder.jpg",
      },
      {
        title: { en: "Help with a veterinary trip", zh: "协助送宠物去医院", ja: "動物病院への移動を手伝う" },
        text: { en: "Get help carrying the carrier and accompanying the pet to the clinic.", zh: "需要多一双手时，可以请人帮忙携带航空箱、陪同前往医院并安全返回。", ja: "キャリーを運び、病院まで同行してもらいます。" },
        image: "/images/care-guides/stock-custom-vet.jpg",
      },
    ],
    fit: [
      { en: "You need one result, not ongoing care", zh: "只需要完成一次任务，不需要持续照护", ja: "継続ケアではなく一つの結果が必要" },
      { en: "The task is specific and easy to describe", zh: "任务范围、时间和预期结果都能说清楚", ja: "作業範囲と結果を説明できる" },
      { en: "You need a skill or an extra pair of hands", zh: "自己缺少经验，或临时需要多一双手", ja: "経験やもう一人の手が必要" },
    ],
    notFit: [
      { en: "The request involves diagnosis or treatment", zh: "涉及诊断、治疗或必须持证完成的事项", ja: "診断や治療が必要" },
      { en: "The goal or risks cannot be clearly scoped", zh: "无法说清结果、风险或责任边界", ja: "目的やリスクを明確にできない" },
    ],
    prepare: {
      en: "Describe the animal, exact result, location, timing, tools, access, photos or measurements and known risks. Diagnosis and treatment still belong with qualified professionals.",
      zh: "写清宠物类型、预期结果、地点、时间、工具、进入方式、照片或尺寸和已知风险；诊断与治疗仍必须交给有资质的专业人员。",
      ja: "動物、結果、場所、時間、道具、写真や寸法、リスクを明確にします。診断と治療は専門家に任せます。",
    },
    sitterIntro: { en: "Custom tasks suit people with one useful skill, clear boundaries and time for occasional, well-scoped work.", zh: "适合有一项真正能帮上忙的能力、能清楚说明边界，也愿意偶尔完成具体任务的人。", ja: "役立つスキルと明確な境界があり、単発作業に対応できる人に向いています。" },
    sitterFit: { en: "State exactly what you can do, which animals you know and what tools you can bring.", zh: "明确说明能做什么、熟悉哪些动物、会使用或携带哪些工具。", ja: "できること、得意な動物、道具を明確にします。" },
    sitterThink: { en: "Ask for photos, measurements and handling details before accepting equipment or transport tasks.", zh: "涉及设备、运输或陌生动物时，接单前主动索要照片、尺寸和操作细节。", ja: "設備や送迎では、写真、寸法、扱い方を事前に確認します。" },
    sitterTrust: { en: "Confirm the plan in writing, explain safety limits early and send a clear completion update.", zh: "用消息确认执行方案，提前说明安全边界，完成后发送清晰的结果与状态。", ja: "手順を文章で確認し、安全上の限界と完了結果を伝えます。" },
    icon: Sparkles,
    tone: "bg-[#f3eadb]",
  },
};

export function CareTypesHub({ language }: { language?: Lang } = {}) {
  const lang = usePageLanguage(language);
  const t = common[lang];
  const hubOrder: CareMode[] = ["home-visits", "boarding", "custom"];

  return (
    <main className="bg-[#fffdf9] text-[#302a33]">
      <div className="site-shell py-12 md:py-16">
        <div className="max-w-3xl">
          <h1 className="text-[clamp(2.15rem,4vw,3.8rem)] font-bold leading-[1.08] tracking-[-.045em] text-[#392847]">{t.hubTitle}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#706a78] md:text-lg">{t.hubText}</p>
        </div>

        <section aria-label={t.recurring} className="mt-12 space-y-8 md:mt-14 md:space-y-10">
          {hubOrder.map((modeKey, index) => (
            <CareTypeStory key={modeKey} modeKey={modeKey} lang={lang} routeLanguage={language} reverse={index % 2 === 1} />
          ))}
        </section>
      </div>
    </main>
  );
}

function CareTypeStory({ modeKey, lang, routeLanguage, reverse }: { modeKey: CareMode; lang: Lang; routeLanguage?: Lang; reverse: boolean }) {
  const mode = modes[modeKey];

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#ded6e1] bg-white shadow-[0_18px_55px_rgba(57,40,71,.06)]">
      <div className={`grid lg:items-stretch ${reverse ? "lg:grid-cols-[1.2fr_.8fr]" : "lg:grid-cols-[.8fr_1.2fr]"}`}>
        <div className={`relative aspect-square min-h-[220px] lg:aspect-auto lg:min-h-[420px] ${reverse ? "lg:order-2" : ""}`}>
          <Image src={mode.hero} alt={`${mode.title[lang]} — ${mode.short[lang]}`} fill sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center p-7 md:p-10 lg:p-11">
          <h2 className="text-3xl font-bold tracking-[-.04em] text-[#392847] md:text-4xl">{mode.title[lang]}</h2>
          <p className="mt-3 text-base font-semibold text-[var(--primary)]">{mode.short[lang]}</p>
          <p className="mt-5 text-sm leading-7 text-[#706a78] md:text-base md:leading-8">
            <HighlightedScenario modeKey={modeKey} lang={lang} />
          </p>
          <RoleActions modeKey={modeKey} lang={lang} routeLanguage={routeLanguage} className="mt-7" showArrow={false} />
        </div>
      </div>
    </article>
  );
}

function HighlightedScenario({ modeKey, lang }: { modeKey: CareMode; lang: Lang }) {
  const text = hubScenarios[modeKey][lang];
  const highlights = hubScenarioHighlights[modeKey][lang];
  const pattern = new RegExp(`(${highlights.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

  return text.split(pattern).map((part, index) =>
    highlights.includes(part) ? (
      <strong key={`${part}-${index}`} className="rounded-md bg-[#f0e8f4] px-1.5 py-0.5 font-bold text-[var(--primary)] box-decoration-clone">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function DecisionSummary({ mode, lang, compact = false, showIcons = true }: { mode: Mode; lang: Lang; compact?: boolean; showIcons?: boolean }) {
  const t = common[lang];
  return (
    <div className={`mt-6 grid gap-4 ${compact ? "sm:grid-cols-2" : ""}`}>
      <div className="rounded-2xl bg-[#f3f7ee] p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#49633f]">{showIcons && <CheckCircle2 size={16} />}{t.bestFor}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4f5850]">
          {mode.fit.map((item) => <li key={item[lang]} className="flex gap-2"><span aria-hidden="true">•</span><span>{item[lang]}</span></li>)}
        </ul>
      </div>
      <div className="rounded-2xl bg-[#faf1e7] p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#8a5d34]">{showIcons && <CircleAlert size={16} />}{t.consider}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#66594e]">
          {mode.notFit.map((item) => <li key={item[lang]} className="flex gap-2"><span aria-hidden="true">•</span><span>{item[lang]}</span></li>)}
        </ul>
      </div>
    </div>
  );
}

function RoleActions({ modeKey, lang, routeLanguage, className = "", showArrow = true }: { modeKey: CareMode; lang: Lang; routeLanguage?: Lang; className?: string; showArrow?: boolean }) {
  const t = common[lang];
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link href={`${routeLanguage ? `/${routeLanguage}` : ""}/care-types/${modeKey}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white">{t.read}{showArrow && <ArrowRight size={15} />}</Link>
      <Link href="/needs/create" className="inline-flex h-11 items-center rounded-xl border border-[#c7b9cd] bg-white px-5 text-sm font-bold text-[var(--primary)]">{t.need}</Link>
      <Link href="/dashboard/serviceprofile/services/new" className="inline-flex h-11 items-center rounded-xl border border-[#c7b9cd] bg-white px-5 text-sm font-bold text-[var(--primary)]">{t.offer}</Link>
    </div>
  );
}

export function CareTypeDetail({ modeKey, language }: { modeKey: CareMode; language?: Lang }) {
  const lang = usePageLanguage(language);
  const routePrefix = language ? `/${language}` : "";
  const t = common[lang];
  const mode = modes[modeKey];
  const Icon = mode.icon;
  const alternatives = (Object.keys(modes) as CareMode[]).filter((key) => key !== modeKey);

  return (
    <main className="bg-[#fffdf9] text-[#302a33]">
      <div className="site-shell pt-6 md:pt-8">
        <nav aria-label={t.other} className="flex flex-col gap-3 border-y border-[#ded6e1] py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-bold uppercase tracking-[.13em] text-[#8a5d34]">{t.other}</span>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((key) => (
              <Link key={key} href={`${routePrefix}/care-types/${key}`} className="inline-flex items-center gap-2 rounded-full border border-[#d8cbdc] bg-white px-4 py-2 text-sm font-bold text-[var(--primary)]">{modes[key].title[lang]}<ArrowRight size={14} /></Link>
            ))}
          </div>
        </nav>

        <section className="grid gap-8 py-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-18">
          <div>
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--primary)] ${mode.tone}`}><Icon size={24} /></span>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#8a5d34]">PetNido care guide</p>
            <h1 className="mt-4 text-[clamp(3rem,6vw,5.8rem)] font-bold leading-[.92] tracking-[-.06em] text-[#392847]">{mode.title[lang]}</h1>
            <p className="mt-5 text-xl font-semibold text-[var(--primary)]">{mode.short[lang]}</p>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#706a78]">{mode.intro[lang]}</p>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] md:min-h-[540px]">
            <Image src={mode.hero} alt={mode.scenes[0].title[lang]} fill priority sizes="(max-width:1024px) 100vw, 58vw" className="object-cover" />
          </div>
        </section>

        <section className="border-t border-[#ded6e1] py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-[#8a5d34]">{t.owner}</p>
              <h2 className="mt-4 max-w-sm text-4xl font-bold leading-tight tracking-[-.045em] text-[#392847]">{lang === "zh" ? "先判断，这种方式是否真的适合" : lang === "ja" ? "本当に合う方法か確認" : "First, decide if this really fits"}</h2>
            </div>
            <DecisionSummary mode={mode} lang={lang} compact />
          </div>
        </section>

        <section className="pb-14 md:pb-20">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#8a5d34]">{t.examples}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {mode.scenes.map((scene) => (
              <article key={scene.title[lang]} className="overflow-hidden rounded-[22px] border border-[#ded6e1] bg-white">
                <div className="relative aspect-[3/2]"><Image src={scene.image} alt={scene.title[lang]} fill sizes="(max-width:1024px) 100vw, 33vw" className="object-cover" /></div>
                <div className="p-6"><h3 className="text-lg font-bold text-[#392847]">{scene.title[lang]}</h3><p className="mt-3 text-sm leading-7 text-[#706a78]">{scene.text[lang]}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className={`overflow-hidden rounded-[28px] ${mode.tone}`}>
          <div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:p-12">
            <div>
              <div className="flex items-center gap-2 text-[#8a5d34]"><ShieldCheck size={20} /><p className="text-xs font-bold uppercase tracking-[.12em]">{t.prepare}</p></div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-.04em] text-[#392847]">{lang === "zh" ? "把这些细节说清楚，再开始" : lang === "ja" ? "詳細を確認してから始める" : "Agree on the details before care starts"}</h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#625a67]">{mode.prepare[lang]}</p>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/75 p-6">
              <p className="text-sm font-bold text-[#392847]">{lang === "zh" ? "这种方式适合你吗？" : lang === "ja" ? "この方法に決めますか？" : "Does this care type fit?"}</p>
              <div className="mt-5 grid gap-3">
                <Link href="/needs/create" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-white">{t.need}<ArrowRight size={16} /></Link>
                <Link href={`${routePrefix}/care-types`} className="inline-flex h-12 items-center justify-center rounded-xl border border-[#c7b9cd] bg-white px-6 text-sm font-bold text-[var(--primary)]">{lang === "zh" ? "再比较三种方式" : lang === "ja" ? "3つの方法を比較" : "Compare all three"}</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#392847] text-white"><KeyRound size={19} /></span><p className="text-xs font-bold uppercase tracking-[.15em] text-[#8a5d34]">{t.sitter}</p></div>
            <h2 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-[-.045em] text-[#392847]">{mode.sitterIntro[lang]}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <StoryPanel title={lang === "zh" ? "你需要具备" : lang === "ja" ? "必要な条件" : "What you need"} text={mode.sitterFit[lang]} />
              <StoryPanel title={lang === "zh" ? "接单前想清楚" : lang === "ja" ? "受ける前に" : "Before accepting"} text={mode.sitterThink[lang]} />
              <StoryPanel title={t.trust} text={mode.sitterTrust[lang]} />
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/dashboard/serviceprofile/services/new" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-white">{t.offer}<ArrowRight size={16} /></Link>
              <Link href={`${routePrefix}/how-it-works/services`} className="inline-flex h-12 items-center rounded-xl border border-[#bfaec8] px-6 text-sm font-bold text-[var(--primary)]">{lang === "zh" ? "了解如何发布服务" : lang === "ja" ? "サービス公開の流れ" : "How to publish a service"}</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StoryPanel({ title, text }: { title: string; text: string }) {
  return <article className="rounded-[20px] border border-[#ded6e1] bg-white p-6"><div className="flex items-center gap-2 text-[var(--primary)]"><PawPrint size={17} /><h3 className="text-lg font-bold text-[#392847]">{title}</h3></div><p className="mt-3 text-sm leading-7 text-[#706a78]">{text}</p></article>;
}
