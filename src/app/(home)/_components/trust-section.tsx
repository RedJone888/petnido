"use client";
import { useLanguage } from "@/components/providers/language-provider";
import { Heart, MessageCircle, ShieldCheck } from "lucide-react";
const trustImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtE117gHNSc4vaqcVTz94U1itkvucJaAUoha0F0G_rQGib3NyOTr8w0LhnVBN5jr6H7kxiP3D6pbmioh_jqnzf_7zdTSXetilFq6KxyB4Rs7j-B5xxoZ2gZyVHwrkt4auW4dzT-tzLMjad8rg19jgR278jF1RpWhMNKuIiu--0NAHtIz1U9pb0wkGJuRy1a0wzX5hZejblGzPCJN3H4weKsMs-cJaBUHJ638aYuWjB3Y9RX3rJ37gEI2wVNmYk8JHZOz257lw2-9U",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD9YQOC60pdx-Ib0Zaf18_at8RH0JFffQfnuEkt377N17PyrTPPN2kQNsqpwkl_EVpRdmZi0VsmU41dRcLTVnwlV7219w_OndldB_eqEW_DvMQ_BtcKfG2CNDtEkZykgXMWXoYhfVlxDBaCRTkzHB83SGJGSB0IUGUhHucmCfTRy3XdbP0Q8YipyC8JDRE3YfmBxWgDdZPvCbNApkv7qT6vDiZ4BdoxXyOG-4gxTjB6BF0exFQA2jY9sub7FIFlirIw8IoryyKM6kI",
];
const icons = [ShieldCheck, Heart, MessageCircle] as const;
export function TrustSection() {
  const { t } = useLanguage();
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
      <div className="flex flex-col items-center gap-16 md:flex-row">
        <div className="grid gap-4 md:w-1/2 grid-cols-2">
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
          <h2 className="text-headline-lg mb-6">{t.home.trust.title}</h2>
          <p className="text-body-lg text-on-surface-variant mb-8">
            {t.home.trust.text}
          </p>
          <ul className="space-y-4">
            {icons.map((Icon, index) => {
              const label = t.home.trust.badge[index];
              return (
                <li key={label} className="flex items-center gap-3">
                  <Icon className="text-primary" size={22} />
                  <span className="text-label-md">{label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
