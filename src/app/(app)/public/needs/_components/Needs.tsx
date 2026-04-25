import { Suspense, useEffect, useState } from "react";
import { useNeed } from "@/hooks/useNeed";
import CardList from "../../_components/CardList";
import CardListSkeleton from "../../_components/CardListSkeleton";

import NeedCard from "./NeedCard";
export default function Needs() {
  const { getAllNeeds, setPagination } = useNeed();
  // listBrowseNeeds()
  const needs = getAllNeeds.data;
  // 在页面组件中
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("位置情報取得失敗", error),
        { enableHighAccuracy: true },
      );
    }
  }, []);
  if (getAllNeeds.isLoading) {
    return <CardListSkeleton />;
  }
  if (!needs || needs?.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        条件に合う依頼が見つかりませんでした。
      </div>
    );
  }
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {needs.map((need) => (
        <NeedCard key={need.id} need={need} userLocation={userLocation} />
      ))}
    </div>
  );
}
