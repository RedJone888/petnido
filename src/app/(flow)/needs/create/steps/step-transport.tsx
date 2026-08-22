"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { ChoiceRow } from "../guided-need-flow-shared";

export function StepTransport({
  transport,
  onTransportChange,
  splitDirection,
  onSplitDirectionChange,
}: {
  transport: string;
  onTransportChange: (value: string) => void;
  splitDirection: "owner-dropoff" | "sitter-dropoff";
  onSplitDirectionChange: (value: "owner-dropoff" | "sitter-dropoff") => void;
}) {
  const { t, lang } = useLanguage();
  const copy = t.core.needPublishingEnvironment;
  const optionCopy = {
    en: {
      owner: "I’ll handle both trips",
      sitter: "The sitter will handle both trips",
      ownerDropoff: "I’ll drop off · sitter returns",
      sitterDropoff: "Sitter picks up · I’ll collect",
      taxi: "Pet taxi for both trips",
      discuss: "Decide later",
    },
    zh: {
      owner: "我负责往返接送",
      sitter: "寄养家庭负责往返接送",
      ownerDropoff: "开始时我送去 · 结束后寄养家庭送回",
      sitterDropoff: "开始时寄养家庭来接 · 结束后我接回",
      taxi: "往返都使用宠物专车",
      discuss: "稍后讨论",
    },
    ja: {
      owner: "往復とも自分で対応",
      sitter: "往復とも預かり家庭が対応",
      ownerDropoff: "行きは自分で届ける · 帰りは預かり家庭が送る",
      sitterDropoff: "行きは預かり家庭が迎える · 帰りは自分で迎える",
      taxi: "往復ともペットタクシーを利用",
      discuss: "後で相談",
    },
  }[lang];
  const options = [
    { id: "owner", label: optionCopy.owner },
    { id: "sitter", label: optionCopy.sitter },
    {
      id: "owner-dropoff",
      label: optionCopy.ownerDropoff,
      splitDirection: "owner-dropoff" as const,
    },
    {
      id: "sitter-dropoff",
      label: optionCopy.sitterDropoff,
      splitDirection: "sitter-dropoff" as const,
    },
    { id: "taxi", label: optionCopy.taxi },
    { id: "discuss", label: optionCopy.discuss },
  ];
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5d34]">
          {copy.transportTitle}
        </h3>
        <div className="flex flex-wrap gap-2">
          {options.map((item) => (
            <ChoiceRow
              key={item.id}
              label={item.label}
              fitContent
              active={
                item.splitDirection
                  ? transport === "split" &&
                    splitDirection === item.splitDirection
                  : transport === item.id
              }
              onClick={() => {
                if (item.splitDirection) {
                  onSplitDirectionChange(item.splitDirection);
                  onTransportChange("split");
                  return;
                }
                onTransportChange(item.id);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// Compatibility export
export const TransportScreen = StepTransport;
export const GuidedNeedTransportStep = StepTransport;
