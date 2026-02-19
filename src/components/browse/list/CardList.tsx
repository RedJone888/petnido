import prisma from "@/lib/prisma";
import NeedCard from "@/app/public/browse/needs/NeedCard";
import SitterCard from "@/components/browse/sitters/SitterCard";

export default async function CardList({
  type,
}: {
  type: "needs" | "sitters";
}) {
  const items =
    type === "needs"
      ? await prisma.need.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [
          {
            id: "s1",
            name: "兔兔姐姐",
            avatar:
              "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=150&q=80",
            city: "Osaka",
            rating: 4.9,
            reviewCount: 32,
            petTypes: ["RABBIT", "CAT"],
            serviceTypes: ["HOME_VISIT", "DAYCARE"],
            description: "多年兔子照护经验，可上门喂食、清理、陪玩。",
            priceRange: "¥1500 - ¥3000 / 天",
          },
          {
            id: "s2",
            name: "宠物博士",
            avatar:
              "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
            city: "Kyoto",
            rating: 4.7,
            reviewCount: 20,
            petTypes: ["DOG", "CAT"],
            serviceTypes: ["DOG_WALK", "OVERNIGHT"],
            description: "热爱动物，有兽医助理背景，专业可靠。",
            priceRange: "¥2000 - ¥4500 / 天",
          },
          {
            id: "s3",
            name: "Nara 宅家达人",
            avatar:
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            city: "Nara",
            rating: 5.0,
            reviewCount: 12,
            petTypes: ["RABBIT", "BIRD"],
            serviceTypes: ["BOARDING"],
            description: "提供家庭寄养环境，安静、安全、干净。",
            priceRange: "¥1200 - ¥2500 / 天",
          },
        ];
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) =>
        type === "needs" ? (
          <div>111</div>
        ) : (
          // <NeedCard key={item.id} need={item} />
          <SitterCard key={item.id} sitter={item} />
        ),
      )}
    </div>
  );
}
