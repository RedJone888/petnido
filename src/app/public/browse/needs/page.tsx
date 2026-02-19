"use client";

import {
  DateFilterPopover,
  PetFilterPopover,
  PriceFilterPopover,
} from "@/components/browse/filter/FilterPopovers";

import { Suspense, useEffect, useState } from "react";
import { FilterSection, ListSection } from "@/components/browse/BrowseSection";
import PageHeader from "@/components/browse/list/PageHeader";
import CardList from "@/components/browse/list/CardList";
import CardListSkeleton from "@/components/browse/list/CardListSkeleton";
import { useNeed } from "@/hooks/useNeed";
import NeedCard from "@/app/public/browse/needs/NeedCard";
import { FilterBar } from "@/components/browse/filter/FilterBar";

export default function BrowseNeedsPage() {
  const { getAllNeeds, setPagination } = useNeed();
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

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="sticky top-0 z-40 backdrop-blur-sm">
        <FilterBar>
          <DateFilterPopover />
          <PetFilterPopover />
          {/* 報酬 */}
          <button className="px-4 py-2 border rounded-full bg-white shadow-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <span>💰</span>
            報酬の有無
          </button>
          <PriceFilterPopover />
        </FilterBar>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <PageHeader
            title="やさしいお世話の依頼を探す"
            description="条件に合う依頼を検索できます。大切なペットのお世話を手伝い、思いやりのある飼い主さんと出会いましょう。"
          />
          {getAllNeeds.isLoading ? (
            <CardListSkeleton />
          ) : !needs || needs?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              条件に合う依頼が見つかりませんでした。
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {needs.map((need) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  userLocation={userLocation}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
