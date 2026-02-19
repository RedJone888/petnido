// src/app/sitter/[id]/page.tsx

import Link from "next/link";

export default function SitterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // -------- MOCK DATA --------
  const mockSitter = {
    id,
    name: "兔兔姐姐",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    city: "Osaka",
    bio: "我养兔多年，有丰富的照护经验。\n可以提供上门喂食、陪玩、清理厕所、健康观察等服务。\n也接受小型宠物的家庭寄养。",
    rating: 4.9,
    reviewCount: 32,
    serviceTypes: ["HOME_VISIT", "DAYCARE", "BOARDING"],
    petTypes: ["RABBIT", "CAT"],
    minPrice: 1500,
    maxPrice: 3500,
    availableFrom: "2025-01-20",
    availableTo: "2025-06-30",
    photos: [
      "https://images.unsplash.com/photo-1544531585-9a3cce2112b7?auto=format&fit=crop&w=300&q=80",
      "https://images.unsplash.com/photo-1612810806563-4f0a1b8db922?auto=format&fit=crop&w=300&q=80",
    ],
  };

  const translateService: Record<string, string> = {
    HOME_VISIT: "上门照护",
    OVERNIGHT: "过夜照看",
    DAYCARE: "日托",
    DOG_WALK: "遛狗",
    BOARDING: "寄养",
  };

  const translatePet: Record<string, string> = {
    DOG: "狗",
    CAT: "猫",
    RABBIT: "兔",
    BIRD: "鸟",
    OTHER: "其他",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10">
        <img
          src={mockSitter.avatar}
          alt="avatar"
          className="w-28 h-28 rounded-full object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold">{mockSitter.name}</h1>
          <p className="text-gray-600">{mockSitter.city}</p>
          <p className="text-yellow-600 font-semibold mt-1">
            ⭐ {mockSitter.rating}（{mockSitter.reviewCount} 条评价）
          </p>
        </div>
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {mockSitter.photos.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt=""
            className="rounded-lg object-cover h-56 w-full"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* LEFT: Info */}
        <div className="md:col-span-2 space-y-8">
          {/* Bio */}
          <section>
            <h2 className="text-xl font-semibold mb-3">自我介绍</h2>
            <p className="whitespace-pre-line text-gray-700 leading-relaxed">
              {mockSitter.bio}
            </p>
          </section>

          {/* Services */}
          <section>
            <h2 className="text-xl font-semibold mb-3">提供的服务</h2>
            <div className="flex flex-wrap gap-2">
              {mockSitter.serviceTypes.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {translateService[t]}
                </span>
              ))}
            </div>
          </section>

          {/* Pet Types */}
          <section>
            <h2 className="text-xl font-semibold mb-3">可照顾的宠物</h2>
            <div className="flex flex-wrap gap-2">
              {mockSitter.petTypes.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {translatePet[t]}
                </span>
              ))}
            </div>
          </section>

          {/* Price */}
          <section>
            <h2 className="text-xl font-semibold mb-3">价格</h2>
            <p className="text-purple-600 font-semibold">
              ¥{mockSitter.minPrice} - ¥{mockSitter.maxPrice} / 天
            </p>
          </section>

          {/* Availability */}
          <section>
            <h2 className="text-xl font-semibold mb-3">可服务日期</h2>
            <p className="text-gray-700">
              {mockSitter.availableFrom} → {mockSitter.availableTo}
            </p>
          </section>

          {/* CTA */}
          <div className="flex gap-4 mt-8">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg">
              发起照顾需求
            </button>

            <Link
              href={`/dashboard/messages?chat=${mockSitter.id}`}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50"
            >
              发消息
            </Link>
          </div>
        </div>

        {/* RIGHT: Sticky contact card (optional) */}
        <aside className="border rounded-lg p-5 h-fit shadow-sm sticky top-20">
          <h2 className="text-xl font-semibold mb-3">联系照顾者</h2>
          <p className="text-gray-700 mb-4">
            你可以与 {mockSitter.name} 沟通细节，确认是否有空。
          </p>

          <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg mb-3">
            发消息
          </button>

          <button className="w-full px-6 py-3 border rounded-lg hover:bg-gray-50">
            发起照顾需求
          </button>

          <Link
            href="/browse/sitters"
            className="block mt-4 text-purple-600 hover:underline text-center"
          >
            ← 返回所有照顾者
          </Link>
        </aside>
      </div>
    </div>
  );
}
