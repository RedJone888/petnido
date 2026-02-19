import {
  DateFilterPopover,
  PetFilterPopover,
  ExperienceFilterPopover,
  PriceFilterPopover,
} from "@/components/browse/filter/FilterPopovers";
import { FilterSection, ListSection } from "@/components/browse/BrowseSection";
import PageHeader from "@/components/browse/list/PageHeader";
import CardList from "@/components/browse/list/CardList";
import CardListSkeleton from "@/components/browse/list/CardListSkeleton";
import { Suspense } from "react";

export default function BrowseSittersPage() {
  return (
    <div className="h-full bg-neutral-50">
      {/* 这里假设 Navbar 高度大约 64px，sticky 时可以调 top 值 */}
      <FilterSection>
        <DateFilterPopover />
        <PetFilterPopover />
        <ExperienceFilterPopover />
        <PriceFilterPopover />
      </FilterSection>
      <ListSection>
        <PageHeader
          title="やさしいペットシッターさんを探す"
          description="条件に合うシッターさんを検索できます。大切な家族を安心して任せられる、思いやりのあるシッターと出会いましょう。"
        />
        <Suspense fallback={<CardListSkeleton />}>
          <CardList type="sitters" />
        </Suspense>
      </ListSection>
    </div>
  );
}
