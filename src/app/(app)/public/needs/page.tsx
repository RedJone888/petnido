"use client";
import {
  DateFilterPopover,
  PetFilterPopover,
  PriceFilterPopover,
} from "../_components/filter/FilterPopovers";
import PageHeader from "../_components/PageHeader";
import { FilterBar } from "../_components/filter/FilterBar";
import Needs from "./_components/Needs";
// import { listBrowseNeeds } from "@/lib/need";

export default function NeedsBrowsePage() {
  return (
    <div className="flex flex-col h-full bg-neutral-50">
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
            title="やさしいお世話の依頼を探す"
            description="条件に合う依頼を検索できます。大切なペットのお世話を手伝い、思いやりのある飼い主さんと出会いましょう。"
          />
          <Needs />
        </div>
      </div>
    </div>
  );
}
