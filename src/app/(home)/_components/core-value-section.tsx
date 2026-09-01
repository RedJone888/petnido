"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { AppImage } from "@/components/ui/app-image";
import { Power, RefreshCw, Users } from "lucide-react";

const valueImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtE117gHNSc4vaqcVTz94U1itkvucJaAUoha0F0G_rQGib3NyOTr8w0LhnVBN5jr6H7kxiP3D6pbmioh_jqnzf_7zdTSXetilFq6KxyB4Rs7j-B5xxoZ2gZyVHwrkt4auW4dzT-tzLMjad8rg19jgR278jF1RpWhMNKuIiu--0NAHtIz1U9pb0wkGJuRy1a0wzX5hZejblGzPCJN3H4weKsMs-cJaBUHJ638aYuWjB3Y9RX3rJ37gEI2wVNmYk8JHZOz257lw2-9U",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD9YQOC60pdx-Ib0Zaf18_at8RH0JFffQfnuEkt377N17PyrTPPN2kQNsqpwkl_EVpRdmZi0VsmU41dRcLTVnwlV7219w_OndldB_eqEW_DvMQ_BtcKfG2CNDtEkZykgXMWXoYhfVlxDBaCRTkzHB83SGJGSB0IUGUhHucmCfTRy3XdbP0Q8YipyC8JDRE3YfmBxWgDdZPvCbNApkv7qT6vDiZ4BdoxXyOG-4gxTjB6BF0exFQA2jY9sub7FIFlirIw8IoryyKM6kI",
];

const valueIcons = [Users, RefreshCw, Power] as const;

export function CoreValueSection() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex w-full max-w-container-max-width flex-col items-center gap-10 px-margin-mobile md:flex-row md:gap-16 md:px-margin-desktop">
      <div className="hidden grid-cols-2 gap-4 md:grid md:w-1/2">
        {valueImages.map((image, index) => (
          <AppImage
            key={image}
            src={image}
            alt={index === 0 ? "Person caring for a small pet" : "Cat receiving care"}
            className={`h-64 w-full rounded-[20px] border border-outline-variant object-cover shadow-[0_22px_55px_-38px_rgba(42,29,50,0.5)] ${
              index === 0 ? "mt-8" : ""
            }`}
          />
        ))}
      </div>

      <div className="w-full md:w-1/2">
        <span className="text-label-md font-bold uppercase tracking-widest text-primary">
          {t.home.coreValue.label}
        </span>
        <h2 className="mb-4 mt-2 text-headline-lg-mobile text-on-surface md:text-headline-lg">
          {t.home.coreValue.title}
        </h2>
        <p className="mb-7 text-body-md text-on-surface-variant md:mb-8 md:text-body-lg">
          {t.home.coreValue.text}
        </p>

        <div className="border-t border-outline-variant">
          {t.home.coreValue.cards.map((card, index) => {
            const Icon = valueIcons[index];
            return (
              <article
                key={card.title}
                className="flex gap-4 border-b border-outline-variant py-5 md:py-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-fixed text-primary">
                  <Icon size={21} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 font-bold text-on-surface">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {card.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
