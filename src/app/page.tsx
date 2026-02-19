import ClientLayout from "./ClientLayout";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <ClientLayout>
      <div className="w-full">
        {/* ---------------- Hero Section ---------------- */}
        <section className="bg-linear-to-br from-purple-50 to-blue-50 py-24">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-800 whitespace-pre-line">
              大切な家族だからこそ。{"\n"}
              安心して任せられる“つながり”を。
            </h1>

            <p className="text-gray-600 mt-6 text-lg leading-relaxed whitespace-pre-line">
              旅行や出張の時も、{"\n"}
              あなたのペットが“いつものように”安心して過ごせるように。{"\n"}
              思いやりのあるシッターと、やさしくつながる場所です。
            </p>

            <div className="flex justify-center gap-6 mt-10">
              <Button
                href="/dashboard/needs/new"
                variant="primary"
                className="px-8 py-3 rounded-full"
              >
                お世話を依頼する
              </Button>

              <Button
                href="/public/browse/sitters"
                variant="outlineDark"
                className="px-8 py-3 rounded-full"
              >
                シッターを探す
              </Button>
            </div>
          </div>
        </section>

        {/* ---------------- Value Section ---------------- */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            PetNido が大切にしていること
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <ValueCard
              title="家族のように大切に"
              text="ペットは“ただのお世話”ではなく、大切な家族。心を込めて向き合えるシッターだけを。"
              icon="🐾"
            />
            <ValueCard
              title="安心できるコミュニケーション"
              text="依頼前にチャットで相談できるから、初めてでも安心してお願いできます。"
              icon="💬"
            />
            <ValueCard
              title="やさしくつながる仕組み"
              text="ペット好き同士がお互いを支え合う、思いやりに満ちたコミュニティです。"
              icon="🌿"
            />
          </div>
        </section>

        {/* ---------------- How It Works ---------------- */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              使い方は、かんたん３ステップ
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <StepCard
                number="①"
                title="会員登録"
                text="ペットの情報や希望日程を入力します。"
              />
              <StepCard
                number="②"
                title="投稿する / シッターを探す"
                text="ニーズを投稿したり、ぴったりのシッターを探せます。"
              />
              <StepCard
                number="③"
                title="マッチングしてお出かけへ"
                text="チャットで相談→依頼確定。大切な家族を安心して任せられます。"
              />
            </div>
          </div>
        </section>

        {/* ---------------- Community Message ---------------- */}
        <section className="max-w-4xl mx-auto px-4 py-20 text-center mb-20">
          <h2 className="text-3xl font-bold mb-6">PetNido の思い</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
            “ペットの幸せは、飼い主さんの安心から”。{"\n"}
            忙しい時も、遠くに行く時も、ペットが安心して過ごせる場所がある。
            {"\n"}
            誰かのやさしさが、あなたとペットをそっと支えます。
          </p>
        </section>
      </div>
    </ClientLayout>
  );
}

/* -------- Small Components -------- */

function ValueCard({ icon, title, text }: any) {
  return (
    <div className="p-8 border border-card-border rounded-2xl bg-card shadow-sm hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

function StepCard({ number, title, text }: any) {
  return (
    <div className="p-8 rounded-2xl bg-card border border-card-border shadow-sm hover:shadow-md transition">
      <div className="text-3xl text-primary-hover">{number}</div>
      <h3 className="text-xl font-semibold mt-4 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}
