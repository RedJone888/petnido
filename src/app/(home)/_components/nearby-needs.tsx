"use client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";
import cn from "@/lib/cn";
const needs = [
  {
    title: "Golden Retriever needs walking",
    alt: "A happy Golden Retriever sitting in a sunlit suburban park, looking alert and friendly. The environment is green and lush, reflecting a warm neighborhood atmosphere with soft afternoon lighting.",
    tag: "Dog Walking",
    price: "¥2,800/visit",
    distance: "0.8 km away",
    text: '"Buddy needs a 30-min walk while I am at work. He loves playing fetch!"',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4MTJmAs75oMkwqWF-ddn32vQdUs4SlSvtm_4P7selpQofsfK024dA30gmPad9Wir0VE73kXxWInjRlEzDTZSNV5393i8WOKxJPO0RcrCyjRuw16QHAXyKHUTS8VTf_o0gr5Yf5XWE1YPoTBvqvgfxyhO7IXSHqJJtfvaYqk7RMJLw_8f0mEvyQZ2-XykmqgwhGHP3Pahwjj_GPY8NWjszq5gmQy_BvYj9IKsVfA1mDq1R0ARF9kcn4obSRTju6DpqLnI36jvAL1o",
  },

  {
    title: "Rabbit cage cleaning",
    alt: "",
    tag: "Specialized Care",
    price: "¥3,500/visit",
    distance: "1.9 km away",
    text: '"Rabbit hutch cleaning and feeding needed while we are away for the weekend."',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAdcfGJgEqatWsJTiwDrA4e-1MvcZBqj6sJocD9KT_v9U36x9uhkY8XgPay46HiAdgB7GlznG4-UP7Ca86dPvF_Sro-ie4PYtfollRh3DNkLmADPfCN7cHWbbI5O22r2l3u_2SnPYx4tjfb0vdTLoB8ErtJmUkg3Qe2MeWI-LpHg5qepSycMa8Cpd-3BCYrCc0HxYJLxjzVvJpCSLs1A6FCINFl0Vvse0WULBaaoeFqIlk0qVguTtRjA6v6RTPkDPtnPMewMuRQXyY",
  },
  {
    title: "Luna needs feeding & cuddles",
    alt: "",
    tag: "Sitter Visit",
    price: "¥2,500/visit",
    distance: "1.3 km away",
    text: '"Afternoon feeding and some cuddle time for Luna. She is very shy."',
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_5OSfQR4t4WuiDRALmEoPazl03VwQbBwokNouMClyqTscVmRFLfMaa9Am5PckxISbpZE7jYmxidrAp7HelTqhC_t7HPZoUSWbEWJ7A87jIgvAwp_gPjjYV2ufdTrdsr9l2XPIqm17TYIT0as5_6AUFDs4H4tsIVVtJiy705TPJ1O_vUhSvqnEfUwj0dQ8Lg87houXCSL4Wo5g2PeBIF4ljdUm4lAGAvRbmVciHP2LhcK48uf6gauvElQAcABwJ6ywcgxVQdYyfzk",
  },
];
export function NearbyNeeds() {
  const { t } = useLanguage();
  return (
    <section className="w-full max-w-container-max-width mx-auto md:px-margin-desktop">
      <div className="px-margin-mobile md:px-0">
        <SectionHeader
          title={t.home.nearbyNeeds.title}
          text={t.home.nearbyNeeds.text}
          href="/public/needs"
          label={t.home.nearbyNeeds.more}
        />
      </div>

      <div className="flex snap-x no-scrollbar gap-4 overflow-x-auto px-margin-mobile pb-4 md:grid md:gap-6 md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {needs.map((need, index) => (
          <article
            key={need.title}
            className={cn(
              "cursor-pointer overflow-hidden border border-outline-variant bg-white transition-colors hover:border-primary/30",
              "min-w-[280px] rounded-[18px]",
              "md:min-w-0",
              index === 0 ? "" : "snap-start",
            )}
          >
            <div className="relative h-40 overflow-hidden md:h-36">
              <AppImage
                src={need.image}
                alt={need.alt}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 md:top-4 md:left-4 bg-primary-fixed/85 text-on-primary-fixed-variant px-2 md:px-3 py-1 rounded-lg text-xs font-bold">
                {need.tag}
              </span>
            </div>
            <div className="p-4 text-on-surface-variant md:p-6">
              <div className="flex justify-between gap-4 items-start mb-2">
                <h3 className="font-bold line-clamp-1">{need.title}</h3>
                <span className="font-bold text-primary">{need.price}</span>
              </div>
              <div className="mb-3 md:mb-4 flex items-center text-on-surface-variant gap-1 md:gap-2 text-sm">
                <MapPin size={16} />
                <span>東京都 港区 ({need.distance})</span>
              </div>
              <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 md:text-body-md">
                {need.text}
              </p>
              <Button
                href="/public/needs"
                variant="outline"
                className="home-button h-11 w-full rounded-[10px] border-outline-variant bg-transparent shadow-none hover:border-primary hover:bg-primary-fixed hover:text-primary"
              >
                {t.home.nearbyNeeds.detail}
              </Button>

              {/* <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                <span className="font-bold text-primary">{need.price}</span>
                <Button href="/public/needs" variant="link">
                  {t.home.nearbyNeeds.detail}
                  <MoveRight size={16} />
                </Button>
              </div> */}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
