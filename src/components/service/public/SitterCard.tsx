export default function SitterCard({ sitter }: { sitter: any }) {
  return (
    <div className="border border-card-border bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex gap-3 items-center">
        <img
          src={sitter.avatar}
          alt={sitter.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-lg">{sitter.name}</p>
          <p className="text-sm text-gray-500">📍 {sitter.city}</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-yellow-600 font-semibold">
          ⭐ {sitter.rating}（{sitter.reviewCount}条评价）
        </p>
        <p className="text-sm text-gray-600 mt-1">
          対応ペット：{sitter.petTypes.join(", ")}
        </p>
        <p className="text-sm text-gray-600">
          服务：{sitter.serviceTypes.join(", ")}
        </p>
      </div>

      <p className="mt-3 text-gray-700 line-clamp-2">{sitter.description}</p>

      <p className="mt-3 text-primary-hover font-semibold">
        {sitter.priceRange}
      </p>

      <button
        // href={`/sitter/${sitter.id}`}
        className="text-primary-hover mt-3 inline-block hover:underline"
      >
        詳しく見る →
      </button>
    </div>
  );
}
