"use client";
import { Bike, HouseHeart, Lightbulb } from "lucide-react";
import { ServiceInfo } from "./service-info";
import { useLanguage } from "@/components/providers/language-provider";
const servicesIcon = [
  { icon: Bike, tone: "primary" },
  {
    icon: HouseHeart,
    tone: "secondary",
  },
  {
    icon: Lightbulb,
    tone: "tertiary",
  },
];
export function ServiceBento() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <h2 className="text-headline-lg mb-16 text-center">
        {t.home.serviceBento.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {servicesIcon.map((iconItem, index) => {
          const textItem = t.home.serviceBento.cards[index];
          const combinedService = { ...textItem, ...iconItem };
          return (
            <ServiceInfo
              service={combinedService}
              key={combinedService.title}
              className={index === 1 ? "bg-primary/5 border-primary/10" : ""}
            ></ServiceInfo>
          );
        })}
      </div>
    </div>
  );
}
