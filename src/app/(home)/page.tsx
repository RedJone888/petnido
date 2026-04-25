import { Button } from "@/components/ui/button";
import {
  CreateNeedButton,
  CreateServiceButton,
} from "@/components/shared/buttons";
import { Card } from "./_components/cards";
import Link from "next/link";
import { auth } from "@/lib/auth";
// const valueCard = [
//   {
//     icon: "🐾",
//     title: "家族のように大切に",
//     content:
//       "ペットは“ただのお世話”ではなく、大切な家族。心を込めて向き合えるシッターだけを。",
//   },
//   {
//     icon: "💬",
//     title: "安心できるコミュニケーション",
//     content:
//       "依頼前にチャットで相談できるから、初めてでも安心してお願いできます。",
//   },
//   {
//     icon: "🌿",
//     title: "やさしくつながる仕組み",
//     content:
//       "ペット好き同士がお互いを支え合う、思いやりに満ちたコミュニティです。",
//   },
// ];
const valueCard = [
  {
    icon: "🐾",
    title: "家族と同じ、深い愛情を",
    content:
      "“ただのお世話”ではなく、家族の一員として向き合う。愛情あふれるシッターとの出会いを提供します。",
  },
  {
    icon: "💬",
    title: "顔が見える、安心の対話",
    content:
      "事前チャットで気になることを相談。お互いの信頼を深めてから、納得して依頼ができます。",
  },
  {
    icon: "🌿",
    title: "支え合うコミュニティ",
    content:
      "ペット好き同士が助け合う、思いやりの輪。地域のつながりが、ペットの幸せを守ります。",
  },
];
const ownerSteps = [
  {
    icon: "①",
    title: "ニーズを投稿",
    content: "お世話の内容や期間、予算を投稿します。",
  },
  {
    icon: "②",
    title: "シッターと相談",
    content: "応募があったシッターとチャットで打ち合わせ。",
  },
  {
    icon: "③",
    title: "依頼確定",
    content: "安心してペットを任せて、お出かけへ。",
  },
];

const sitterSteps = [
  {
    icon: "①",
    title: "サービスを登録",
    content: "対応可能なペット種類や得意なお世話をアピール。",
  },
  {
    icon: "②",
    title: "依頼を探す",
    content: "募集中のニーズを見て、自分に合うものに応募。",
  },
  {
    icon: "③",
    title: "お世話スタート",
    content: "新しいペットとの出会いと、感謝の報酬を。",
  },
];
export default async function HomePage() {
  const session = await auth();
  return (
    <div className="w-full">
      {/* ---------------- Hero Section ---------------- */}
      <section className="bg-linear-to-br from-purple-50 to-blue-50 py-16 md:py-36">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-800">
            ペットがつなぐ、
            <br className="md:hidden" />
            やさしい助け合い。
          </h1>

          <p className="text-gray-600 mt-6 text-base md:text-xl leading-relaxed">
            大切な家族を預けたい人も、
            <br className="md:hidden" />
            空いた時間で支えたい人も。
          </p>

          {/* 响应式按钮组：手机端上下堆叠，电脑端并排 */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-10">
            <CreateNeedButton initialSession={session} />
            <CreateServiceButton initialSession={session} />
            {/* <Button
              href="/public/browse/sitters"
              variant="outlineDark"
              className="px-8 py-3 rounded-full w-[80%] md:w-auto text-lg"
            >
              シッターを探す
            </Button> */}
          </div>
        </div>
      </section>
      {/* ---------------- 核心价值 ---------------- */}
      {/* <Section title="PetNido が大切にしていること" cardList={valueCard} /> */}
      {/* <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            PetNido が大切にしていること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {valueCard.map((card) => (
              <Card
                key={card.title}
                icon={card.icon}
                title={card.title}
                content={card.content}
              />
            ))}
          </div>
        </div>
      </section> */}
      <section className="py-20 bg-liner-to-b from-transparent to-gray-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              PetNido が大切にしていること
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {valueCard.map((card) => (
              <Card
                key={card.title}
                icon={card.icon}
                title={card.title}
                content={card.content}
              />
            ))}
          </div>
        </div>
      </section>
      {/* ---------------- 双向流程版块 ---------------- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">
            使い方は、かんたん
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            {/* 宠物主视角 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center">
              <h3 className="text-2xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                🐾 お世話を依頼する
              </h3>
              <div className="space-y-6">
                {ownerSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-orange-400 font-bold">
                      {step.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-gray-600 text-sm">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                href="/public/sitters"
                className="w-full mt-8 lg:w-[80%]"
                variant="outlineLight"
              >
                シッターを探す
              </Button>
            </div>

            {/* Sitter 视角 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center">
              <h3 className="text-2xl font-bold text-blue-600 mb-6 flex items-center gap-2">
                🏠 シッターとして活動する
              </h3>
              <div className="space-y-6">
                {sitterSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-blue-400 font-bold">{step.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{step.title}</h4>
                      <p className="text-gray-600 text-sm">{step.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                href="/public/needs"
                className="w-full mt-8 lg:w-[80%]"
                variant="outlineLight"
              >
                依頼を探す
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 预览展示 (数据需动态抓取) ---------------- */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">募集中のお世話依頼</h2>
            <Link href="/public/needs" className="text-primary hover:underline">
              もっと見る →
            </Link>
          </div>
          {/* 这里放置你的需求展示卡片组件，记得做 grid-cols-1 md:grid-cols-3 适配 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock Card */}
            <div className="p-4 border rounded-xl">大阪市：うさぎの給餌...</div>
            <div className="p-4 border rounded-xl">
              吹田市：猫のトイレ掃除...
            </div>
            <div className="p-4 border rounded-xl">堺市：犬のお散歩...</div>
          </div>
        </div>
      </section>
      {/* ---------------- 预览展示 (数据需动态抓取) ---------------- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold">サービスを提供するシッターさんたち</h2>
            <Link href="/public/needs" className="text-primary hover:underline">
              もっと見る →
            </Link>
          </div>
          {/* 这里放置你的需求展示卡片组件，记得做 grid-cols-1 md:grid-cols-3 适配 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mock Card */}
            <div className="p-4 border rounded-xl">大阪市：うさぎの給餌...</div>
            <div className="p-4 border rounded-xl">
              吹田市：猫のトイレ掃除...
            </div>
            <div className="p-4 border rounded-xl">堺市：犬のお散歩...</div>
          </div>
        </div>
      </section>
      {/* ---------------- Community Message ---------------- */}
      <section
        id="thought"
        className="max-w-4xl mx-auto px-4 py-20 text-center mb-20"
      >
        <h2 className="text-3xl font-bold mb-6">PetNido の思い</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
          “ペットの幸せは、飼い主さんの安心から”。{"\n"}
          忙しい時も、遠くに行く時も、ペットが安心して過ごせる場所がある。
          {"\n"}
          誰かのやさしさが、あなたとペットをそっと支えます。
        </p>
      </section>
    </div>
  );
}
