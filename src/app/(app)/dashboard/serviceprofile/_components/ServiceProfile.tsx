import { useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ServiceCard from "./ServiceCard";
import ConfusedDog from "/public/images/ConfusedDog.svg";
import type { ServiceProfileApi, ProfileApi } from "@/domain/service/api.types";
type Props = { serviceProfile: ServiceProfileApi; profile: ProfileApi };
export default function ServiceProfile({ serviceProfile }: Props) {
  const router = useRouter();
  const {
    rating,
    reviewCount,
    introduction,
    monthsExperience,
    baseAreaRaw,
    baseCurrency,
    baseLat,
    baseLon,
    defaultLocation,
    isAccepting,
    services,
  } = serviceProfile;

  return (
    <div className="mx-auto space-y-1 h-full flex flex-col px-6 py-8">
      <ProfileHeader
        isSitter={isAccepting}
        profileInfo={{
          rating,
          reviewCount,
          introduction,
          monthsExperience,
          baseAreaRaw:
            defaultLocation?.regionLabel ?? defaultLocation?.label ?? baseAreaRaw,
          baseLat: defaultLocation ? Number(defaultLocation.lat) : baseLat,
          baseLon: defaultLocation ? Number(defaultLocation.lon) : baseLon,
          baseCurrency,
        }}
        onEditBaseInfo={() => router.push("/dashboard/settings#provider")}
      />
      <div className="overflow-y-auto flex-1 w-full p-4 bg-[#f6f7fb] shadow-inner rounded-xl">
        {services.length === 0 ? (
          <div className="w-full h-full pt-8 px-10">
            <ConfusedDog className="mx-auto w-60 h-60 scale-130 pointer-events-none" />
            <div className="pt-6 px-4 border-t border-dashed border-slate-300 flex flex-col items-center text-center">
              <p className="text-sm text-slate-400">
                まだ提供しているサービスがありません 🐾
              </p>
              <p className="text-[10px] mt-1 text-slate-400">
                お世話内容を登録すると、依頼を受けられます。
                「新しいサービスを追加する」から始めてみましょう。
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSitter={isAccepting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
