"use client";
import cn from "@/lib/cn";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
const ownerFlows = [
  {
    marker: "A",
    tone: "primary",
  },
  {
    marker: "B",
    tone: "secondary",
  },
];

const sitterFlows = [
  {
    marker: "A",
    tone: "secondary",
  },
  {
    marker: "B",
    tone: "primary",
  },
];
export function SimpleJourney() {
  const [flowType, setFlowType] = useState<"owner" | "sitter">("owner");
  const flows = flowType === "owner" ? ownerFlows : sitterFlows;
  const { t } = useLanguage();
  const flowsText =
    flowType === "owner"
      ? t.home.journey.ownerFlowsText
      : t.home.journey.sitterFlowsText;
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
      <h2 className="text-headline-lg mb-4">{t.home.journey.title}</h2>
      <div className="mb-16 inline-flex rounded-full bg-surface-container p-1">
        <button
          className={`px-8 py-2.5 rounded-full font-bold transition-all ${flowType === "owner" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`}
          onClick={() => setFlowType("owner")}
        >
          {t.home.journey.owner}
        </button>
        <button
          className={`px-8 py-2.5 rounded-full font-bold transition-all ${flowType === "sitter" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`}
          onClick={() => setFlowType("sitter")}
        >
          {t.home.journey.sitter}
        </button>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {flows.map((flow, index) => (
          <article
            key={flowsText[index].title}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border border-white shadow-sm text-left flex flex-col"
          >
            <div className="mb-8 flex items-center gap-3">
              <span
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold journey-icon-${flow.tone}`}
              >
                {flow.marker}
              </span>
              <h3 className={`text-headline-md journey-title-${flow.tone}`}>
                {flowsText[index].title}
              </h3>
            </div>
            <div
              className={cn(
                "relative space-y-8",
                "before:content-[''] before:absolute before:left-6 before:top-0 before:bottom-0 before:w-0.5",
                flow.tone === "primary"
                  ? "before:bg-primary/10"
                  : "before:bg-secondary/10",
              )}
            >
              {flowsText[index].steps.map((step, index) => (
                <div key={step.title} className="relative flex gap-6">
                  <div
                    className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-bold z-10 border-4 border-background journey-tone-${flow.tone}`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="mb-1 font-bold">{step.title}</h4>
                    <p className="text-sm text-on-surface-variant">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
