import { Button } from "@/components/ui/Button";
import CreateNeedButton from "@/components/home/CreateNeedButton";
import ValueSection from "@/components/home/ValueSection";
import StepSection from "@/components/home/StepSection";

export default function HomePage() {
  return (
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
            <CreateNeedButton />

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
      <ValueSection />
      <StepSection />
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
