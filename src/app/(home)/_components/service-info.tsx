"use client";
import { useLanguage } from "@/components/providers/language-provider";
import cn from "@/lib/cn";
import Link from "next/link";
import { MoveRight } from "lucide-react";
export function ServiceInfo({
  service,
  className = "",
}: {
  service: {
    title: string;
    text: string;
    icon: any;
    tone: string;
  };
  className: string;
}) {
  const { t } = useLanguage();
  return (
    <article
      className={cn(
        "bg-surface-container-low border-outline-variant/30 p-8 rounded-2xl border hover:shadow-md transition-all group hover:scale-105 flex flex-col",
        className,
      )}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform service-tone-${service.tone}`}
      >
        <service.icon size={24} />
      </div>
      <h3 className="text-headline-md mb-4">{service.title}</h3>
      <p className="text-on-surface-variant mb-6">{service.text}</p>
      <Link
        href="/public/sitters"
        className="mt-auto flex items-center text-primary font-bold gap-2 cursor-pointer group-hover:gap-3 transition-all"
      >
        {t.home.serviceBento.link}
        <MoveRight size={18} className="group-hover:scale-110" />
      </Link>
    </article>
  );
}
