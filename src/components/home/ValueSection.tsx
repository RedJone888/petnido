function ValueCard({ icon, title, text }: any) {
  return (
    <div className="p-8 border border-card-border rounded-2xl bg-card shadow-sm hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}
export default function ValueSection() {
  return (
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
  );
}
