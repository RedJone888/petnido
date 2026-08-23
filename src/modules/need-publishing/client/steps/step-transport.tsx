"use client";

import { useNeedPublishingMessages } from "@/modules/need-publishing/client";
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
  const needMessages = useNeedPublishingMessages();
  const copy = needMessages.needPublishingEnvironment;
  const optionCopy = needMessages.needPublishingClient.transport;
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
