"use client";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import cn from "@/lib/cn";
import {
  ChevronDown,
  HandHeart,
  House,
  HouseHeart,
  ListPlus,
  MoveRight,
  Search,
} from "lucide-react";

type Step = {
  title: string;
  desc: string;
};

type Role = {
  title: string;
  intro: string;
  ways: string[];
  action: string;
  steps: Step[];
};

const servicesTone = [
  { icon: House, tone: "primary" },
  { icon: HouseHeart, tone: "secondary" },
  { icon: ListPlus, tone: "tertiary" },
] as const;

const rolesTone = [
  { icon: Search, tone: "primary" },
  { icon: HandHeart, tone: "secondary" },
] as const;

export function ServiceJourney() {
  const { t } = useLanguage();
  const [activeRole, setActiveRole] = useState(0);

  return (
    <div className="mx-auto w-full max-w-container-max-width px-margin-mobile md:px-margin-desktop">
      <div className="mb-14 md:mb-24">
        <SectionHeader
          label={t.home.serviceBento.label}
          title={t.home.serviceBento.title}
          text={t.home.serviceBento.text}
        />
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {servicesTone.map((iconItem, index) => {
            const textItem = t.home.serviceBento.cards[index];
            const combinedService = { ...textItem, ...iconItem };
            return (
              <ServiceCard
                service={combinedService}
                key={combinedService.title}
                moreText={t.home.serviceBento.link}
              />
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader
          label={t.home.journeys.label}
          title={t.home.journeys.title}
          text={t.home.journeys.text}
        />
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          {rolesTone.map((roleTone, index) => {
            const role = { ...t.home.journeys.roles[index], ...roleTone };
            return (
              <RoleCard
                key={role.title}
                role={role}
                roleIndex={index}
                isOpen={activeRole === index}
                onOpen={() => setActiveRole(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mb-6 md:mb-8 md:text-center">
      <span className="text-label-md font-bold uppercase tracking-widest text-primary md:hidden">
        {label}
      </span>
      <div className="mt-2 md:mt-0">
        <h2 className="mb-3 text-headline-lg-mobile text-on-surface md:mb-4 md:text-headline-lg">
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-base text-on-surface-variant">
          {text}
        </p>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  className = "",
  moreText,
}: {
  service: {
    title: string;
    text: string;
    includes: string;
    icon: typeof House;
    tone: string;
  };
  className?: string;
  moreText: string;
}) {
  const ServiceIcon = service.icon;

  return (
    <article
      className={cn(
        "group flex flex-col rounded-[20px] border border-outline-variant bg-surface-container-lowest p-6 transition-colors",
        "md:p-8 md:hover:border-primary/30",
        className,
      )}
    >
      <div className="mb-4 flex flex-row items-center gap-4 md:flex-col md:items-start md:gap-7">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-[10px] md:h-12 md:w-12",
            `service-tone-${service.tone}`,
          )}
        >
          <ServiceIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-headline-md-mobile md:text-headline-md">
          {service.title}
        </h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-on-surface-variant md:text-body-md">
        {service.text}
      </p>
      <p className="mb-5 border-t border-outline-variant pt-4 text-xs font-medium leading-relaxed text-on-surface-variant md:mb-6">
        {service.includes}
      </p>
      <button
        type="button"
        className="mt-auto inline-flex items-center justify-end gap-2 pr-2 font-bold text-primary transition-colors hover:text-primary/75 md:justify-start md:pr-0"
      >
        {moreText}
        <MoveRight size={18} aria-hidden="true" />
      </button>
    </article>
  );
}

function RoleCard({
  role,
  roleIndex,
  isOpen,
  onOpen,
}: {
  role: Role & { tone: string; icon: typeof Search };
  roleIndex: number;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const RoleIcon = role.icon;

  return (
    <article
      className={cn(
        "rounded-[20px] border border-outline-variant bg-surface-container-lowest p-5 md:p-8",
      )}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onOpen}
        className="flex w-full items-center gap-3 text-left md:hidden"
      >
        <RoleIconBox tone={role.tone}>
          <RoleIcon className="h-6 w-6" aria-hidden="true" />
        </RoleIconBox>
        <h3 className={`flex-1 text-headline-md-mobile journey-title-${role.tone}`}>
          {role.title}
        </h3>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div className="hidden items-center gap-3 md:flex">
        <RoleIconBox tone={role.tone}>
          <RoleIcon className="h-6 w-6" aria-hidden="true" />
        </RoleIconBox>
        <h3 className={`text-headline-md journey-title-${role.tone}`}>
          {role.title}
        </h3>
      </div>

      <div className={cn("pt-5 md:block md:pt-6", !isOpen && "hidden")}>
        <p className="mb-4 text-sm leading-relaxed text-on-surface-variant md:text-base">
          {role.intro}
        </p>

        <p className="mb-5 text-xs font-bold uppercase tracking-[0.12em] text-primary/75">
          {role.ways.join(" · ")}
        </p>

        <div className="mb-7 border-t border-outline-variant">
          {role.steps.map((step, index) => (
            <div
              key={step.title}
              className="flex gap-4 border-b border-outline-variant py-4"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  `journey-index-0-${role.tone}`,
                )}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant={roleIndex === 0 ? "primary" : "secondary"}
          className={cn(
            "home-button mx-auto h-12 w-full rounded-[11px] shadow-none hover:scale-100 hover:shadow-none active:scale-[0.98] sm:w-auto",
            `journey-btn-0-${role.tone}`,
          )}
        >
          {role.action}
        </Button>
      </div>
    </article>
  );
}

function RoleIconBox({
  tone,
  children,
}: {
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        `journey-icon-${tone}`,
      )}
    >
      {children}
    </div>
  );
}
