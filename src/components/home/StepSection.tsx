function StepCard({ number, title, text }: any) {
  return (
    <div className="p-8 rounded-2xl bg-card border border-card-border shadow-sm hover:shadow-md transition">
      <div className="text-3xl text-primary-hover">{number}</div>
      <h3 className="text-xl font-semibold mt-4 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}
export default function StepSection() {
  return (
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
  );
}
