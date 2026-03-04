import {
  DateFilterPopover,
  PetFilterPopover,
  ExperienceFilterPopover,
  PriceFilterPopover,
} from "@/components/browse/filter/FilterPopovers";
import PageHeader from "@/components/browse/list/PageHeader";
import CardList from "@/components/browse/list/CardList";
import CardListSkeleton from "@/components/browse/list/CardListSkeleton";
import { Suspense } from "react";
import { FilterBar } from "@/components/browse/filter/FilterBar";

export default function BrowseSittersPage() {
  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* 这里假设 Navbar 高度大约 64px，sticky 时可以调 top 值 */}
      <div className="sticky top-0 z-40 backdrop-blur-sm">
        <FilterBar>
          <DateFilterPopover />
          <PetFilterPopover />
          {/* 報酬 */}
          {/* <button className="px-4 py-2 border rounded-full bg-white shadow-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <span>💰</span>
            報酬の有無
          </button> */}
          <PriceFilterPopover />
        </FilterBar>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto p-4">
          <PageHeader
            title="やさしいペットシッターさんを探す"
            description="条件に合うシッターさんを検索できます。大切な家族を安心して任せられる、思いやりのあるシッターと出会いましょう。"
          />
          <Suspense fallback={<CardListSkeleton />}>
            <CardList type="sitters" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
