"use client";
import cn from "@/lib/cn";
import { useState } from "react";
const ownerFlows = [
  {
    marker: "A",
    title: "On-Demand Matching",
    tone: "primary",
    steps: [
      {
        title: "Post Your Need",
        desc: "Detail your pet's routine and specific requirements.",
      },
      {
        title: "Sitter applies",
        desc: "Review applications from interested neighborhood sitters.",
      },
      {
        title: "Chat & Match",
        desc: "Discuss experience and verify if they meet your expectations.",
      },
      {
        title: "Peace of Mind",
        desc: "Confirm the booking and receive photo updates during the stay.",
      },
    ],
  },
  {
    marker: "B",
    title: "Direct Discovery",
    tone: "secondary",
    steps: [
      {
        title: "Browse Sitters",
        desc: "Explore verified professionals in your immediate area.",
      },
      {
        title: "Filter by Skills",
        desc: "Search by pet type, medication experience, or availability.",
      },
      {
        title: "Direct Contact",
        desc: "Message sitters directly to check availability and rapport.",
      },
      {
        title: "Confirm",
        desc: "Lock in your booking with our integrated payment system.",
      },
    ],
  },
];

const sitterFlows = [
  {
    marker: "A",
    title: "Build Your Presence",
    tone: "secondary",
    steps: [
      {
        title: "Create Profile",
        desc: "Highlight your experience and passion for animals.",
      },
      {
        title: "Set Services",
        desc: "Define your rates, service areas, and pet preferences.",
      },
      {
        title: "Owner Contacts",
        desc: "Receive direct booking inquiries through the platform.",
      },
      {
        title: "Confirm",
        desc: "Finalize details and start your new community bond.",
      },
    ],
  },
  {
    marker: "B",
    title: "Proactive Booking",
    tone: "primary",
    steps: [
      {
        title: "Browse Needs",
        desc: "Find active pet care requests in your neighborhood.",
      },
      {
        title: "One-tap Apply",
        desc: "Express interest in specific jobs that fit your schedule.",
      },
      {
        title: "Chat",
        desc: "Connect with owners to answer questions and align details.",
      },
      {
        title: "Confirm",
        desc: "Secure the job and build your reputation on PetNido.",
      },
    ],
  },
];
export function SimpleJourney() {
  const [flowType, setFlowType] = useState<"owner" | "sitter">("owner");
  const flows = flowType === "owner" ? ownerFlows : sitterFlows;
  return (
    <div className="w-full max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop text-center">
      <h2 className="text-headline-lg mb-4">Simple, safe connections.</h2>
      <div className="mb-16 inline-flex rounded-full bg-surface-container p-1">
        <button
          className={`px-8 py-2.5 rounded-full font-bold transition-all ${flowType === "owner" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`}
          onClick={() => setFlowType("owner")}
        >
          For Pet Owners
        </button>
        <button
          className={`px-8 py-2.5 rounded-full font-bold transition-all ${flowType === "sitter" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`}
          onClick={() => setFlowType("sitter")}
        >
          For Local Sitters
        </button>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {flows.map((flow) => (
          <article
            key={flow.title}
            className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border border-white shadow-sm text-left flex flex-col"
          >
            <div className="mb-8 flex items-center gap-3">
              <span
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold journey-icon-${flow.tone}`}
              >
                {flow.marker}
              </span>
              <h3 className={`text-headline-md journey-title-${flow.tone}`}>
                {flow.title}
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
              {flow.steps.map((step, index) => (
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
