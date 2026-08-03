"use client";
import { useLanguage } from "@/components/providers/language-provider";
import {
  ShieldCheck,
  // Heart,
  HouseHeart,
  // MessageCircle,
  MessageCircleHeart,
} from "lucide-react";
const trustImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtE117gHNSc4vaqcVTz94U1itkvucJaAUoha0F0G_rQGib3NyOTr8w0LhnVBN5jr6H7kxiP3D6pbmioh_jqnzf_7zdTSXetilFq6KxyB4Rs7j-B5xxoZ2gZyVHwrkt4auW4dzT-tzLMjad8rg19jgR278jF1RpWhMNKuIiu--0NAHtIz1U9pb0wkGJuRy1a0wzX5hZejblGzPCJN3H4weKsMs-cJaBUHJ638aYuWjB3Y9RX3rJ37gEI2wVNmYk8JHZOz257lw2-9U",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD9YQOC60pdx-Ib0Zaf18_at8RH0JFffQfnuEkt377N17PyrTPPN2kQNsqpwkl_EVpRdmZi0VsmU41dRcLTVnwlV7219w_OndldB_eqEW_DvMQ_BtcKfG2CNDtEkZykgXMWXoYhfVlxDBaCRTkzHB83SGJGSB0IUGUhHucmCfTRy3XdbP0Q8YipyC8JDRE3YfmBxWgDdZPvCbNApkv7qT6vDiZ4BdoxXyOG-4gxTjB6BF0exFQA2jY9sub7FIFlirIw8IoryyKM6kI",
];
const serviceIcons = [ShieldCheck, HouseHeart, MessageCircleHeart] as const;
export function TrustSection() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile flex flex-row items-center gap-16 md:px-margin-desktop">
      <div className="hidden md:grid md:gap-4 md:w-1/2 md:grid-cols-2">
        {trustImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt={index === 0 ? "Person with small pet" : "Cat interaction"}
            className={`h-64 w-full rounded-3xl object-cover shadow-md ${
              index === 0 ? "mt-8" : ""
            }`}
          />
        ))}
      </div>
      <div className="md:w-1/2">
        <span className="md:hidden text-label-md font-bold uppercase tracking-widest text-primary">
          {t.home.trust.label}
        </span>
        <h2 className="mt-2 mb-6 text-headline-lg-mobile text-on-surface md:mt-0 md:text-headline-lg">
          {t.home.trust.title}
        </h2>
        <div className="md:hidden rounded-3xl overflow-hidden shadow-lg h-48 mb-6">
          <img
            alt="Community trust"
            className="w-full h-full object-cover"
            src={trustImages[0]}
          />
        </div>
        <p className="text-body-md mb-6 text-on-surface-variant md:text-body-lg md:mb-8">
          {t.home.trust.text}
        </p>
        <ul className="space-y-3 md:space-y-4">
          {serviceIcons.map((Icon, index) => {
            const label = t.home.trust.badge[index];
            return (
              <li key={label} className="flex items-center gap-2 md:gap-4">
                <Icon className="shrink-0 text-primary w-5 h-5 md:w-6 md:h-6" />
                <span className="text-label-md text-on-surface-variant">
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
