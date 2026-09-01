import ProfileHeader from "./ProfileHeader";
import type { ServiceProfileApi, ProfileApi } from "@/domain/service/api.types";
type Props = { serviceProfile: ServiceProfileApi; profile: ProfileApi };
export default function ServiceProfile({ serviceProfile }: Props) {
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
        onEditBaseInfo={() =>
          document
            .getElementById("provider")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      />
    </div>
  );
}
