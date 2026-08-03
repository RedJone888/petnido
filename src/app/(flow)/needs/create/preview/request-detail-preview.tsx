"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import type { IconType } from "react-icons";
import {
  PiArrowLeft,
  PiBookOpen,
  PiBowlFood,
  PiBroom,
  PiCalendarCheck,
  PiCalendarBlank,
  PiCaretLeft,
  PiCaretRight,
  PiCaretDown,
  PiCaretUp,
  PiCar,
  PiCheckCircle,
  PiCheck,
  PiClock,
  PiCurrencyCircleDollar,
  PiDrop,
  PiEye,
  PiGenderIntersex,
  PiGameController,
  PiHouseLine,
  PiInfo,
  PiListChecks,
  PiMapPin,
  PiPackage,
  PiPawPrint,
  PiPill,
  PiQuestion,
  PiShieldCheck,
  PiScales,
  PiSparkle,
  PiSuitcase,
  PiTag,
  PiUserCircle,
  PiWarning,
} from "react-icons/pi";

import cn from "@/lib/cn";
import {
  NEED_PREVIEW_STORAGE_KEY,
  type NeedPreviewSnapshot,
  type PreviewCareType,
  type PreviewPet,
  type PreviewRoutine,
  type PreviewTask,
} from "./types";

const modeMeta = {
  visit: {
    eyebrow: "Home visits",
    icon: PiHouseLine,
  },
  boarding: {
    eyebrow: "Pet boarding",
    icon: PiSuitcase,
  },
  custom: {
    eyebrow: "Custom care",
    icon: PiSparkle,
  },
};

export function RequestDetailPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const careType = previewCareType(searchParams.get("careType"));
  const [request, setRequest] = useState<NeedPreviewSnapshot | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(NEED_PREVIEW_STORAGE_KEY);
      if (!stored) {
        setRequest(buildDemoPreview(careType));
        setMissing(false);
        return;
      }
      const parsed = JSON.parse(stored) as NeedPreviewSnapshot;
      if (parsed.version !== 1) {
        setRequest(buildDemoPreview(careType));
        setMissing(false);
        return;
      }
      setRequest(parsed);
      setMissing(false);
    } catch {
      setRequest(buildDemoPreview(careType));
      setMissing(false);
    }
  }, [careType]);

  const returnToEdit = () => router.replace("/needs/create?restore=preview");

  if (!request && !missing) return <div className="min-h-dvh bg-[#fbfaf8]" />;
  if (!request) return <MissingPreview onBack={returnToEdit} />;

  return <RequestDetailView request={request} preview onBack={returnToEdit} />;
}

export function RequestDetailView({
  request,
  preview = false,
  onBack,
}: {
  request: NeedPreviewSnapshot;
  preview?: boolean;
  onBack?: () => void;
}) {
  const meta = modeMeta[request.careType];
  const ModeIcon = meta.icon;

  return (
    <div className="min-h-dvh bg-[#fbfaf8] text-[#302a34]">
      {preview && onBack && <PreviewBar onBack={onBack} />}
      <main className="site-shell pb-24 pt-7 lg:pt-7">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_clamp(360px,29.3vw,435px)] lg:gap-[clamp(48px,8.2vw,122px)]">
          <div className="min-w-0">
            <header>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#4c6b4f] transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d6aa7] focus-visible:ring-offset-2"
                >
                  <PiArrowLeft size={18} />
                  Back to requests
                </button>
              )}
              <h1 className="text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-[38px]">
                {request.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#eee7f3] px-3 py-1.5 text-xs font-bold text-[#5d3a86]">
                  <ModeIcon size={16} />
                  {meta.eyebrow}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f0fdf4] px-3 py-1.5 text-xs font-bold text-[#3e8168]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3e8168]" />
                  Open to offers
                </span>
              </div>

              <PreviewPublisher />

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="flex items-start gap-2 text-sm font-bold leading-6 text-[#706a78]">
                  <PiMapPin
                    className="mt-0.5 shrink-0 text-[#6f45a0]"
                    size={18}
                  />
                  <span>{request.area}</span>
                </p>
                <span aria-hidden="true" className="text-sm text-[#817a85]">
                  •
                </span>
                <p className="flex items-start gap-2 text-sm font-bold leading-6 text-[#706a78]">
                  <PiCalendarBlank
                    className="mt-0.5 shrink-0 text-[#6f45a0]"
                    size={18}
                  />
                  <span>{request.dates.label}</span>
                </p>
                <span aria-hidden="true" className="text-sm text-[#817a85]">
                  •
                </span>
                <p className="flex items-start gap-2 text-sm font-bold leading-6 text-[#706a78]">
                  <ModeIcon
                    className="mt-0.5 shrink-0 text-[#6f45a0]"
                    size={18}
                  />
                  <span>{meta.eyebrow}</span>
                </p>
              </div>
            </header>

            <RequestStory request={request} />

            {request.careType !== "visit" && <FactsBar request={request} />}
            {request.careType !== "visit" && <PetGroups pets={request.pets} />}

            {request.careType === "boarding" && request.boarding && (
              <BoardingDetails request={request} />
            )}
            {request.careType === "visit" && request.visit && (
              <VisitDetails request={request} />
            )}
            {request.careType === "custom" && request.custom && (
              <CustomDetails request={request} />
            )}

            {request.careType !== "visit" &&
              (request.additionalCareNotes || request.dates.notes) && (
                <PageSection title="Additional notes" icon={PiQuestion}>
                  <div className="space-y-3 text-sm leading-7 text-[#625a67]">
                    {request.dates.notes && <Note text={request.dates.notes} />}
                    {request.additionalCareNotes && (
                      <Note text={request.additionalCareNotes} />
                    )}
                  </div>
                </PageSection>
              )}
          </div>

          <PriceSidebar request={request} preview={preview} />
        </div>
      </main>
    </div>
  );
}

function PreviewPublisher() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[16px] border border-[#e5dfe7] bg-white px-3.5 py-3 sm:px-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee7f3] text-[#6f45a0]">
          <PiUserCircle size={28} />
        </span>
        <div>
          <p className="text-sm font-bold text-[#302a34]">You</p>
          <p className="mt-0.5 text-xs text-[#817a85]">Request owner</p>
        </div>
      </div>
      <span className="hidden h-8 w-px bg-[#e6e0e7] sm:block" />
      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#3e8168]">
        <PiShieldCheck size={17} />
        Profile owner
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#817a85]">
        <PiListChecks size={16} />
        Preview mode
      </span>
    </div>
  );
}

function PreviewBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[#dfd7e3] bg-white/95 backdrop-blur-xl">
      <div className="site-shell flex min-h-16 items-center justify-between gap-4 py-2.5 sm:min-h-20 sm:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-2.5 border-r border-[#e6e0e7] pr-3 sm:pr-4">
            <Image src="/favicon.svg" alt="PetNido" width={30} height={30} />
            <span className="hidden text-lg font-bold tracking-[0.015em] text-[#5d3a86] [font-family:'PT_Sans_Narrow','Avenir_Next_Condensed','Arial_Narrow',sans-serif] [font-stretch:condensed] sm:inline">
              PetNido
            </span>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eee7f3] text-[#5d3a86]">
            <PiEye size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#4c3a55]">
              Preview as sitter
            </p>
            <p className="hidden text-xs text-[#817a85] md:block">
              This is how your request will appear after publishing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] border border-[#cfc4d5] bg-white px-3.5 text-sm font-bold text-[#5d3a86] transition hover:border-[#a98fba] hover:bg-[#f7f2fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d6aa7] focus-visible:ring-offset-2"
        >
          <PiArrowLeft size={17} />
          <span>Back to edit</span>
        </button>
      </div>
    </div>
  );
}

function RequestStory({ request }: { request: NeedPreviewSnapshot }) {
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const storyRef = useRef<HTMLParagraphElement>(null);
  const story = buildRequestStory(request);
  useEffect(() => {
    const element = storyRef.current;
    if (!element || expanded) return;
    const updateOverflow = () =>
      setHasMore(element.scrollHeight > element.clientHeight + 1);
    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(updateOverflow);
    observer?.observe(element);
    return () => {
      window.removeEventListener("resize", updateOverflow);
      observer?.disconnect();
    };
  }, [expanded, story]);

  return (
    <section className="mt-6">
      <header className="mb-3 flex items-center gap-3">
        <PiBookOpen className="text-[#6f45a0]" size={22} />
        <h2 className="text-xl font-bold tracking-[-0.02em]">The story</h2>
      </header>
      <div className="rounded-[16px] border border-[#e2dbe5] bg-white px-5 py-4 sm:px-6">
        <p
          ref={storyRef}
          className={cn(
            "max-w-[960px] text-[15px] leading-7 text-[#625a67]",
            !expanded && "max-h-[84px] overflow-hidden",
          )}
        >
          {story}
        </p>
      </div>
      {hasMore && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#5d3a86] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d6aa7] focus-visible:ring-offset-2"
        >
          {expanded ? <PiCaretUp /> : <PiCaretDown />}
          {expanded ? "Show less" : "See more"}
        </button>
      )}
    </section>
  );
}

function FactsBar({ request }: { request: NeedPreviewSnapshot }) {
  const schedule =
    request.careType === "boarding"
      ? `${request.dates.totalNights || "—"} nights`
      : request.careType === "visit"
        ? `${request.visit?.totalVisits || "—"} visits`
        : `${request.dates.totalDays || "—"} days`;
  const facts = [
    {
      icon: PiClock,
      value: schedule,
      label: request.careType === "boarding" ? "Total nights" : "Duration",
    },
    {
      icon: PiCurrencyCircleDollar,
      value: request.pricing.priceLabel,
      label: request.careType === "boarding" ? "Price per night" : "Budget",
    },
  ];
  return (
    <dl className="mt-6 grid border-y border-[#e6e0e7] sm:grid-cols-2">
      {facts.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="flex min-w-0 gap-3 border-b border-[#eee9ef] px-1 py-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:px-4 xl:first:pl-1 xl:last:border-r-0"
        >
          <Icon className="mt-0.5 shrink-0 text-[#6f45a0]" size={19} />
          <div className="min-w-0">
            <dd className="text-sm font-bold leading-5">{value}</dd>
            <dt className="mt-1 text-xs text-[#817a85]">{label}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}

function PetGroups({
  pets,
  className,
}: {
  pets: PreviewPet[];
  className?: string;
}) {
  const groups = groupPets(pets);
  return (
    <PageSection
      title="Pet profiles"
      icon={PiPawPrint}
      className={className}
      badge={`${groups.length} pet ${groups.length === 1 ? "group" : "groups"}`}
    >
      <div className="flex flex-wrap items-stretch gap-3">
        {groups.flatMap((group) =>
          group.members.map((pet) => (
            <article
              key={pet.id}
              className="flex min-w-[min(100%,300px)] flex-1 gap-4 rounded-[16px] border border-[#e2dbe5] bg-white p-3.5"
            >
              <div className="flex w-16 shrink-0 flex-col items-center">
                <PreviewPetAvatar pet={pet} />
                <p
                  title={pet.label}
                  className="mt-2 w-full truncate text-center text-sm font-bold text-[#302a34]"
                >
                  {pet.label}
                </p>
              </div>
              <div className="min-w-0 flex-1 self-center">
                <div className="flex flex-wrap gap-2">
                  {previewPetInfoItems(pet).map(({ key, value, icon: Icon }) => (
                    <span
                      key={key}
                      title={value}
                      className="inline-flex w-fit max-w-full items-center gap-2 whitespace-nowrap rounded-full bg-[#f8f5f8] px-2.5 py-1.5 text-xs font-semibold text-[#514956]"
                    >
                      <Icon className="shrink-0 text-[#76559a]" size={15} />
                      <span>{value}</span>
                    </span>
                  ))}
                </div>
                {pet.notes && (
                  <p className="mt-2 text-xs leading-5 text-[#706a78]">
                    <span className="font-bold text-[#8a5d34]">Note:</span>{" "}
                    {pet.notes}
                  </p>
                )}
              </div>
            </article>
          )),
        )}
      </div>
    </PageSection>
  );
}

function PreviewPetAvatar({ pet }: { pet: PreviewPet }) {
  return (
    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#fff8e8] shadow-[0_6px_12px_-8px_rgba(70,50,40,0.5)]">
      {pet.photo ? (
        <Image
          src={pet.photo}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="block h-full w-full bg-[#fff8e8] bg-no-repeat"
          style={{
            backgroundImage: "url('/images/pet-default-avatars-v2.png')",
            backgroundPosition: petAvatarPosition(pet.type),
            backgroundSize: "400% auto",
          }}
        />
      )}
    </span>
  );
}

function previewPetInfoItems(pet: PreviewPet) {
  return [
    {
      key: "type",
      value: pet.type.trim() || "Pet",
      icon: PiPawPrint,
    },
    ...(pet.details ?? []).map((detail) => ({
      key: detail.label,
      value: detail.value,
      icon: previewPetDetailIcon(detail.label),
    })),
  ].filter((item) => item.value.trim());
}

function previewPetDetailIcon(label: string): IconType {
  const normalized = label.toLowerCase();
  if (normalized === "breed") return PiTag;
  if (normalized === "age") return PiCalendarBlank;
  if (normalized === "weight") return PiScales;
  if (normalized === "sex") return PiGenderIntersex;
  return PiShieldCheck;
}

function BoardingDetails({ request }: { request: NeedPreviewSnapshot }) {
  const boarding = request.boarding!;
  const [routinesExpanded, setRoutinesExpanded] = useState(false);
  const [homeExpanded, setHomeExpanded] = useState(false);
  const [suppliesExpanded, setSuppliesExpanded] = useState(false);
  const groupedRoutines = routineGroups
    .map((group) => ({
      ...group,
      routines: boarding.routines.filter(
        (routine) => routineType(routine) === group.type,
      ),
    }))
    .filter((group) => group.routines.length);
  let routineSlots = routinesExpanded ? Number.POSITIVE_INFINITY : 3;
  const visibleRoutineGroups = groupedRoutines
    .map((group) => {
      const routines = group.routines.slice(0, Math.max(0, routineSlots));
      routineSlots -= routines.length;
      return { ...group, routines };
    })
    .filter((group) => group.routines.length);
  return (
    <>
      <PageSection title="Care routines" icon={PiClock}>
        {groupedRoutines.length ? (
          <div className="space-y-7">
            {visibleRoutineGroups.map((group) => (
              <div key={group.type}>
                <h3 className="mb-2 text-sm font-bold text-[#5d3a86]">
                  {group.title}
                </h3>
                <div className="divide-y divide-[#eee9ef] border-y border-[#eee9ef]">
                  {group.routines.map((routine) => (
                    <RoutineRow
                      key={routine.id}
                      routine={routine}
                      request={request}
                    />
                  ))}
                </div>
              </div>
            ))}
            {boarding.routines.length > 3 && (
              <ExpandButton
                expanded={routinesExpanded}
                onClick={() => setRoutinesExpanded((value) => !value)}
                hiddenCount={boarding.routines.length - 3}
                label="routines"
              />
            )}
          </div>
        ) : (
          <Empty text="No care routines added" />
        )}
      </PageSection>

      <PageSection title="The right boarding home" icon={PiShieldCheck}>
        {boarding.homeFit.needs.length ||
        boarding.homeFit.ok.length ||
        boarding.homeFit.avoid.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            <PreferenceList
              label="Needs"
              items={
                homeExpanded
                  ? boarding.homeFit.needs
                  : boarding.homeFit.needs.slice(0, 2)
              }
              tone="needs"
            />
            <PreferenceList
              label="Works well"
              items={
                homeExpanded
                  ? boarding.homeFit.ok
                  : boarding.homeFit.ok.slice(0, 2)
              }
              tone="ok"
            />
            <PreferenceList
              label="Please avoid"
              items={
                homeExpanded
                  ? boarding.homeFit.avoid
                  : boarding.homeFit.avoid.slice(0, 2)
              }
              tone="avoid"
            />
          </div>
        ) : (
          <Empty text="No home preferences added" />
        )}
        {boarding.homeFit.notes && (
          <div className="mt-5 flex gap-3 border-t border-[#eee9ef] pt-4 text-sm leading-6 text-[#625a67]">
            <PiInfo className="mt-0.5 shrink-0 text-[#6f45a0]" size={18} />
            <p>{boarding.homeFit.notes}</p>
          </div>
        )}
        {boarding.homeFit.needs.length +
          boarding.homeFit.ok.length +
          boarding.homeFit.avoid.length >
          6 && (
          <ExpandButton
            expanded={homeExpanded}
            onClick={() => setHomeExpanded((value) => !value)}
            hiddenCount={
              boarding.homeFit.needs.slice(2).length +
              boarding.homeFit.ok.slice(2).length +
              boarding.homeFit.avoid.slice(2).length
            }
            label="home preferences"
          />
        )}
      </PageSection>

      <PageSection title="Supplies" icon={PiPackage}>
        {boarding.supplies.owner.length || boarding.supplies.sitter.length ? (
          <div className="grid gap-7 md:grid-cols-2">
            <SupplyList
              label="Owner brings"
              items={
                suppliesExpanded
                  ? boarding.supplies.owner
                  : boarding.supplies.owner.slice(0, 3)
              }
            />
            <div>
              <SupplyList
                label="Sitter provides"
                items={
                  suppliesExpanded
                    ? boarding.supplies.sitter
                    : boarding.supplies.sitter.slice(0, 3)
                }
              />
              {boarding.supplies.sitter.length > 0 && (
                <CostArrangement
                  label="Supply cost arrangement"
                  value={request.pricing.supplyCostLabel}
                />
              )}
            </div>
          </div>
        ) : (
          <Empty text="No supply arrangements added" />
        )}
        {boarding.supplies.owner.length + boarding.supplies.sitter.length >
          6 && (
          <ExpandButton
            expanded={suppliesExpanded}
            onClick={() => setSuppliesExpanded((value) => !value)}
            hiddenCount={
              boarding.supplies.owner.slice(3).length +
              boarding.supplies.sitter.slice(3).length
            }
            label="supply items"
          />
        )}
      </PageSection>

      <PageSection title="Pickup & return" icon={PiCar}>
        <div className="grid gap-6 md:grid-cols-[1fr_260px] md:items-start">
          <TransportSteps label={boarding.transportLabel} area={request.area} />
          <CostArrangement
            label="Transport cost arrangement"
            value={request.pricing.transportCostLabel}
          />
        </div>
      </PageSection>
    </>
  );
}

function ReadOnlyVisitCalendar({
  request,
  sidebar = false,
}: {
  request: NeedPreviewSnapshot;
  sidebar?: boolean;
}) {
  const visit = request.visit!;
  const startDate = parsePreviewCalendarDate(request.dates.startDate);
  const endDate = parsePreviewCalendarDate(request.dates.endDate);
  const calendarStartMonth = startDate
    ? startOfPreviewMonth(startDate)
    : undefined;
  const calendarEndMonth = endDate ? startOfPreviewMonth(endDate) : undefined;
  const initialDate = startDate ?? new Date();
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfPreviewMonth(initialDate),
  );
  const plannedDateSet = new Set(visit.visitDates ?? []);
  const firstPlannedDate = visit.visitDates?.[0];
  const candidateDateSet = new Set(
    visit.visitDateCandidates?.length
      ? visit.visitDateCandidates
      : (visit.visitDates ?? []),
  );
  const excludedDateSet = new Set(visit.excludedVisitDates ?? []);
  const hasMultipleMonths = Boolean(
    calendarStartMonth &&
    calendarEndMonth &&
    calendarStartMonth.getTime() !== calendarEndMonth.getTime(),
  );

  useEffect(() => {
    if (calendarStartMonth) setCalendarMonth(calendarStartMonth);
  }, [request.dates.startDate, request.dates.endDate]);

  const canGoToPreviousMonth = Boolean(
    calendarStartMonth && calendarMonth > calendarStartMonth,
  );
  const canGoToNextMonth = Boolean(
    calendarEndMonth && calendarMonth < calendarEndMonth,
  );
  const changeCalendarMonth = (offset: number) => {
    const nextMonth = startOfPreviewMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + offset,
        1,
      ),
    );
    if (calendarStartMonth && nextMonth < calendarStartMonth) {
      setCalendarMonth(calendarStartMonth);
      return;
    }
    if (calendarEndMonth && nextMonth > calendarEndMonth) {
      setCalendarMonth(calendarEndMonth);
      return;
    }
    setCalendarMonth(nextMonth);
  };

  if (!startDate || !endDate || !candidateDateSet.size) return null;

  return (
    <section
      className={cn(
        "w-full max-w-full",
        !sidebar && "mb-3 w-fit rounded-xl border border-[#eee9ef] bg-white p-4",
      )}
    >
      <div className="w-full max-w-[360px]">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!hasMultipleMonths || !canGoToPreviousMonth}
            onClick={() => changeCalendarMonth(-1)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#514956] transition hover:opacity-60 disabled:pointer-events-none"
          >
            <PiCaretLeft size={24} />
          </button>
          <p className="text-base font-bold text-[#514956]">
            {calendarMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <button
            type="button"
            aria-label="Next month"
            disabled={!hasMultipleMonths || !canGoToNextMonth}
            onClick={() => changeCalendarMonth(1)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#514956] transition hover:opacity-60 disabled:pointer-events-none"
          >
            <PiCaretRight size={24} />
          </button>
        </div>
        <DayPicker
          mode="single"
          month={calendarMonth}
          showOutsideDays
          fixedWeeks
          startMonth={calendarStartMonth}
          endMonth={calendarEndMonth}
          hideNavigation
          disabled={[
            ...(startDate ? [{ before: startDate }] : []),
            ...(endDate ? [{ after: endDate }] : []),
          ]}
          components={{
            DayButton: ({ day, modifiers, className, ...props }) => {
              const date = toPreviewDateValue(day.date);
              const isPlanned = plannedDateSet.has(date);
              const isExcluded =
                candidateDateSet.has(date) && excludedDateSet.has(date);
              return (
                <button
                  {...props}
                  type="button"
                  disabled
                  tabIndex={-1}
                  className={cn(
                    className,
                    "h-10 w-10 rounded-[10px] text-xs transition",
                    modifiers.disabled || modifiers.outside
                      ? "text-[#c8c3c9]"
                      : "text-[#514956]",
                    isPlanned &&
                      "bg-[#eee7f3] font-bold text-[#5d3a86]",
                    isPlanned &&
                      date === firstPlannedDate &&
                      "bg-[#5d3a86] text-white",
                    isExcluded &&
                      "border border-dashed border-[#c9c0ce] bg-[#faf8f5] text-[#aaa4ae] line-through",
                  )}
                />
              );
            },
          }}
          classNames={{
            root: "w-full max-w-[360px]",
            months: "w-full",
            month: "w-full",
            month_grid: "w-full table-fixed",
            weekdays: "w-full",
            weekday: "h-8 p-0 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-[#9b929f]",
            day: "h-12 p-0 text-center",
            day_button: "mx-auto",
            month_caption: "hidden",
          }}
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#eee9ef] pt-4 text-[11px] text-[#817a85]">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[#eee7f3]" />
            Care dates
          </span>
          {visit.excludedVisitDates?.length ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-dashed border-[#c9c0ce] bg-[#faf8f5]" />
              Excluded
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function parsePreviewCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function startOfPreviewMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toPreviewDateValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function VisitDetails({ request }: { request: NeedPreviewSnapshot }) {
  return (
    <div>
      <PetGroups pets={request.pets} />
      <VisitTaskDetails request={request} />
    </div>
  );
}

function VisitTaskDetails({ request }: { request: NeedPreviewSnapshot }) {
  const visit = request.visit!;
  const [expanded, setExpanded] = useState(false);
  const [expandedVisits, setExpandedVisits] = useState<Set<number>>(
    () => new Set([visit.visits[0]?.number ?? 1]),
  );
  const initialVisitCount = 2;
  const visibleVisits = expanded
    ? visit.visits
    : visit.visits.slice(0, initialVisitCount);
  const toggleVisit = (number: number) => {
    setExpandedVisits((current) => {
      const next = new Set(current);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };
  return (
    <PageSection title="Care schedule" icon={PiCalendarCheck}>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#706a78]">
        <span>{visit.scheduleLabel}</span>
        <span aria-hidden="true">·</span>
        <span className="font-bold text-[#514956]">
          {visit.totalVisits} {visit.totalVisits === 1 ? "visit" : "visits"}
        </span>
        <span aria-hidden="true">·</span>
        <span>{request.dates.label}</span>
      </div>
      {request.additionalCareNotes && (
        <div className="mb-5">
          <Note text={request.additionalCareNotes} />
        </div>
      )}
      <div className="space-y-4">
        {visibleVisits.map((item) => {
          const isExpanded = expandedVisits.has(item.number);
          const taskGroups = groupVisitTasks(request, item.tasks);
          const petGroupCount = visitPetGroupCount(request, item.tasks);
          return (
            <section
              key={item.number}
              className="w-full min-w-0 max-w-full rounded-[16px] border border-[#e2dbe5] bg-white px-4 py-3 sm:px-5"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleVisit(item.number)}
                className="flex w-full items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d6aa7] focus-visible:ring-offset-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5f0f8] text-[#6f45a0]">
                  {isExpanded ? <PiCaretDown size={17} /> : <PiCaretRight size={17} />}
                </span>
                <span className="font-bold text-[#5d3a86]">Visit {item.number}</span>
                <span aria-hidden="true" className="text-[#817a85]">·</span>
                <span className="flex items-center gap-1.5 text-sm text-[#817a85]">
                  <PiClock />
                  {item.time}
                </span>
                <span className="ml-auto text-xs font-bold text-[#817a85]">
                  {isExpanded
                    ? `${item.tasks.length} ${item.tasks.length === 1 ? "task" : "tasks"}`
                    : `${petGroupCount} pet ${petGroupCount === 1 ? "group" : "groups"}`}
                </span>
              </button>
              {isExpanded && (
                <div className="mt-3 space-y-3 border-t border-[#eee9ef] pt-3">
                  {item.tasks.length ? (
                    taskGroups.map((group) => (
                      <div
                        key={group.key}
                        className="grid gap-3 md:grid-cols-[minmax(145px,0.8fr)_minmax(0,1.8fr)] md:gap-4"
                      >
                        <VisitTaskTarget request={request} group={group} />
                        <div className="divide-y divide-[#eee9ef] border-y border-[#eee9ef] md:border-y-0">
                          {group.tasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              request={request}
                              compact
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-[#fff5f6] px-4 py-3 text-sm font-semibold text-[#a74755]">
                      No tasks assigned to this visit.
                    </p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {visit.visits.length > initialVisitCount && (
        <ExpandButton
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          hiddenCount={visit.visits.length - initialVisitCount}
          label="visits"
        />
      )}
    </PageSection>
  );
}

function VisitTaskTarget({
  request,
  group,
}: {
  request: NeedPreviewSnapshot;
  group: ReturnType<typeof groupVisitTasks>[number];
}) {
  const labels = new Set(group.tasks.flatMap((task) => task.petLabels));
  const orderedPets = groupPets(request.pets).flatMap((petGroup) => petGroup.members);
  const targetPets = labels.size
    ? orderedPets.filter((pet) => labels.has(pet.label))
    : [];
  const targetLabel =
    targetPets.length === 1 ? targetPets[0].label : group.label;

  return (
    <div className="flex items-center gap-3 md:border-r md:border-[#eee9ef] md:pr-4">
      {targetPets.length ? (
        <div className="flex shrink-0 -space-x-2">
          {targetPets.slice(0, 2).map((pet) => (
            <PreviewPetAvatar key={pet.id} pet={pet} />
          ))}
        </div>
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f0f8] text-[#6f45a0]">
          <PiPawPrint size={22} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#302a34]">{targetLabel}</p>
        <p className="mt-0.5 text-xs text-[#817a85]">{group.label}</p>
      </div>
    </div>
  );
}

function CustomDetails({ request }: { request: NeedPreviewSnapshot }) {
  const custom = request.custom!;
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <PageSection title="Requested care" icon={PiSparkle}>
        {custom.tasks.length ? (
          <>
            <div className="divide-y divide-[#eee9ef] border-y border-[#eee9ef]">
              {(expanded ? custom.tasks : custom.tasks.slice(0, 3)).map(
                (task) => (
                  <TaskRow key={task.id} task={task} request={request} />
                ),
              )}
            </div>
            {custom.tasks.length > 3 && (
              <ExpandButton
                expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                hiddenCount={custom.tasks.length - 3}
                label="tasks"
              />
            )}
          </>
        ) : (
          <Empty text="No tasks added" />
        )}
      </PageSection>
      <PageSection title="Requirements & cautions" icon={PiShieldCheck}>
        <div className="grid gap-7 md:grid-cols-2">
          <PreferenceList
            label="Helper requirements"
            items={custom.requirements}
            tone="needs"
          />
          <PreferenceList
            label="Before accepting"
            items={custom.cautions}
            tone="avoid"
          />
        </div>
      </PageSection>
    </>
  );
}

function RoutineRow({
  routine,
  request,
}: {
  routine: PreviewRoutine;
  request: NeedPreviewSnapshot;
}) {
  const Icon = taskIcon(routine.label);
  return (
    <div className="grid gap-3 py-4 text-sm md:grid-cols-[minmax(150px,0.8fr)_minmax(145px,0.8fr)_minmax(150px,0.8fr)_minmax(210px,1.25fr)] md:items-start">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f0f8] text-[#6f45a0]">
          <Icon size={18} />
        </span>
        <p className="font-bold">{routine.label}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#9a919d] md:hidden">
          Frequency
        </p>
        <p className="mt-1 leading-6 text-[#625a67] md:mt-0">
          {routine.schedule}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#9a919d] md:hidden">
          Target pets
        </p>
        <span className="mt-1 inline-flex rounded-lg bg-[#f4eddf] px-2.5 py-1.5 text-xs font-bold text-[#69533c] md:mt-0">
          {targetLabel(request, routine.petLabels)}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#9a919d] md:hidden">
          Instructions
        </p>
        <p className="mt-1 leading-6 text-[#625a67] md:mt-0">
          {routine.instructions || "—"}
        </p>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  request,
  index,
  showTarget = true,
  compact = false,
}: {
  task: PreviewTask;
  request: NeedPreviewSnapshot;
  index?: number;
  showTarget?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-start gap-3 py-2.5 text-sm">
        <PiCheckCircle className="mt-0.5 shrink-0 text-[#6f45a0]" size={18} />
        <div className="min-w-0">
          <p className="font-semibold text-[#302a34]">{task.label}</p>
          {task.notes && (
            <p className="mt-1 text-xs leading-5 text-[#706a78]">{task.notes}</p>
          )}
        </div>
      </div>
    );
  }
  const Icon = taskIcon(task.label);
  return (
    <div className="py-3 text-sm">
      <div className="flex flex-nowrap items-center gap-x-3">
        {typeof index === "number" && (
          <span className="w-5 shrink-0 text-center text-xs font-bold text-[#9a919d]">
            {index + 1}
          </span>
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f0f8] text-[#6f45a0]">
          <Icon size={18} />
        </span>
        <p
          title={task.label}
          className="min-w-0 flex-1 break-words whitespace-normal font-bold"
        >
          {task.label}
        </p>
        {showTarget && (
          <span
            title={targetLabel(request, task.petLabels)}
            className="max-w-[220px] shrink-0 truncate whitespace-nowrap rounded-lg bg-[#f4eddf] px-2.5 py-1.5 text-xs font-bold text-[#69533c]"
          >
            {targetLabel(request, task.petLabels)}
          </span>
        )}
        <span
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            task.priority === "must"
              ? "bg-[#eee7f3] text-[#5d3a86]"
              : "bg-[#f3ede7] text-[#765942]",
          )}
        >
          {task.priority === "must" ? "Required" : "Preferred"}
        </span>
      </div>
      {task.notes && (
        <p className="ml-8 mt-2 text-xs leading-5 text-[#706a78]">
          <span className="font-bold text-[#8a5d34]">Note:</span> {task.notes}
        </p>
      )}
    </div>
  );
}

function PriceSidebar({
  request,
  preview,
}: {
  request: NeedPreviewSnapshot;
  preview: boolean;
}) {
  const extraCosts =
    request.careType === "boarding"
      ? [
          { label: "Supply costs", value: request.pricing.supplyCostLabel },
          {
            label: "Transport costs",
            value: request.pricing.transportCostLabel,
          },
        ]
      : request.careType === "visit"
        ? [{ label: "Travel costs", value: request.pricing.transportCostLabel }]
        : [];
  const careBreakdown = getCareBreakdown(request);
  const hasVisitCalendar = request.careType === "visit" && request.visit;
  return (
    <aside className="lg:sticky lg:top-[88px]">
      <section className="rounded-[20px] border border-[#ddd6df] bg-white p-5 shadow-[0_24px_65px_-50px_rgba(48,42,52,0.6)] sm:p-8">
        {hasVisitCalendar && (
          <div className="border-b border-[#eee9ef] pb-5">
            <ReadOnlyVisitCalendar request={request} sidebar />
          </div>
        )}

        <div className={cn(hasVisitCalendar && "pt-5")}>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-2xl font-bold leading-8 tracking-[-0.03em] text-[#5d3a86]">
              {request.pricing.estimatedTotal}
            </p>
            <p className="text-xs font-semibold text-[#817a85]">estimated total</p>
          </div>
          <dl className="mt-3 divide-y divide-[#eee9ef] border-y border-[#eee9ef]">
            {request.careType === "visit" ? (
              <SideRow label={visitBudgetFormula(request)} value={careBreakdown.value} />
            ) : (
              <SideRow
                label={request.careType === "boarding" ? "Care fee" : "Agreed price"}
                value={careBreakdown.value}
                detail={careBreakdown.detail}
              />
            )}
            {extraCosts.map((item) => (
              <SideRow key={item.label} label={item.label} value={item.value} />
            ))}
          </dl>
          {request.careType !== "visit" && (
            <p className="mt-3 text-xs font-medium leading-5 text-[#817a85]">
              {shortFormula(request.pricing.formula)}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3.5">
          <button
            type="button"
            disabled={preview}
            className="flex h-14 w-full items-center justify-center rounded-[11px] bg-[#5d3a86] px-4 text-sm font-bold text-white shadow-[0_10px_24px_-14px_rgba(93,58,134,0.75)] transition enabled:hover:bg-[#4b2e6d] disabled:cursor-not-allowed disabled:opacity-90"
          >
            {request.careType === "visit" ? "Apply to help" : "Make an offer"}
          </button>
          <button
            type="button"
            disabled={preview}
            className="flex h-14 w-full items-center justify-center rounded-[11px] border border-[#7e5a9d] bg-white px-4 text-sm font-bold text-[#5d3a86] transition enabled:hover:bg-[#f7f2fa] disabled:cursor-not-allowed"
          >
            Save request
          </button>
        </div>
        {request.careType === "visit" && (
          <p className="mt-3 text-center text-xs leading-5 text-[#817a85]">
            Message the owner before matching.
          </p>
        )}
        {preview && (
          <p className="mt-3 text-center text-[11px] leading-5 text-[#817a85]">
            These actions become available to sitters after publishing.
          </p>
        )}

        {request.careType !== "visit" && (
          <div className="mt-6 border-t border-[#eee9ef] pt-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <PiShieldCheck className="text-[#3e8168]" size={18} />
              Request details
            </p>
            <p className="mt-2 text-xs leading-5 text-[#817a85]">
              Dates, tasks, supplies and transport arrangements are confirmed with
              the owner after matching.
            </p>
          </div>
        )}
      </section>
    </aside>
  );
}

function PageSection({
  title,
  icon: Icon,
  children,
  className,
  badge,
}: {
  title: string;
  icon: IconType;
  children: ReactNode;
  className?: string;
  badge?: string;
}) {
  return (
    <section className={cn("py-3 sm:py-4", className)}>
      <header className="mb-3 flex items-center gap-3">
        <Icon className="text-[#6f45a0]" size={21} />
        <h2 className="text-xl font-bold tracking-[-0.02em]">{title}</h2>
        {badge && (
          <span className="rounded-full border border-[#d7e1d5] bg-[#f0f5ee] px-2.5 py-1 text-xs font-semibold text-[#3e6843]">
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function PreferenceList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "needs" | "ok" | "avoid";
}) {
  const Icon = tone === "avoid" ? PiWarning : PiCheck;
  const color =
    tone === "avoid"
      ? "text-[#a86431]"
      : tone === "ok"
        ? "text-[#3e8168]"
        : "text-[#5d3a86]";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#8a5d34]">
        {label}
      </p>
      {items.length ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li
              key={item}
              className="flex gap-2.5 text-sm leading-6 text-[#625a67]"
            >
              <Icon className={cn("mt-1 shrink-0", color)} size={15} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#aaa4ae]">None specified</p>
      )}
    </div>
  );
}

function SupplyList({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: string; label: string; petLabel: string }>;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-[#5d3a86]">{label}</p>
      {items.length ? (
        <ul className="mt-3 divide-y divide-[#eee9ef] border-y border-[#eee9ef]">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2.5 font-semibold">
                <PiPackage className="shrink-0 text-[#6f45a0]" size={17} />
                {item.label}
              </span>
              <span className="shrink-0 rounded-lg bg-[#f4eddf] px-2 py-1 text-[11px] font-bold text-[#69533c]">
                {item.petLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#aaa4ae]">No items</p>
      )}
    </div>
  );
}

function CostArrangement({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-[14px] border border-[#e2d8e7] bg-[#f7f2fa] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a5d34]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#5d3a86]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#817a85]">
        {costTreatment(value)}
      </p>
    </div>
  );
}

function ExpandButton({
  expanded,
  onClick,
  hiddenCount,
  label,
}: {
  expanded: boolean;
  onClick: () => void;
  hiddenCount: number;
  label: string;
}) {
  const itemLabel = hiddenCount === 1 ? label.replace(/s$/, "") : label;
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onClick}
      className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-bold text-[#5d3a86] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d6aa7] focus-visible:ring-offset-2"
    >
      {expanded ? <PiCaretUp /> : <PiCaretDown />}
      {expanded ? "Show less" : `See ${hiddenCount} more ${itemLabel}`}
    </button>
  );
}

function TransportSteps({ label, area }: { label: string; area: string }) {
  const steps = transportSteps(label);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => (
          <div key={step} className="contents">
            <div className="flex min-w-[160px] flex-1 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5d3a86] text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm font-bold leading-5">{step}</p>
            </div>
            {index < steps.length - 1 && (
              <span className="hidden text-[#b5aeb8] md:inline">→</span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-[#817a85]">
        <PiMapPin className="text-[#6f45a0]" />
        {area}
      </p>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <PiInfo className="shrink-0 text-[#6f45a0]" size={18} />
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  );
}
function SideRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <dt className="text-xs text-[#817a85]">
        {label}
        {detail && (
          <span className="mt-1 block text-[10px] leading-4 text-[#aaa4ae]">
            {detail}
          </span>
        )}
      </dt>
      <dd className="max-w-[165px] text-right text-xs font-bold leading-5">
        {value}
      </dd>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-[#f7f4f7] px-4 py-3 text-sm text-[#817a85]">
      {text}
    </p>
  );
}

function MissingPreview({ onBack }: { onBack: () => void }) {
  return (
    <main className="flex min-h-[calc(100dvh-80px)] items-center justify-center bg-[#fbfaf8] px-5">
      <section className="w-full max-w-md rounded-[20px] border border-[#e4dee6] bg-white p-8 text-center shadow-[0_20px_60px_-42px_rgba(48,42,52,0.5)]">
        <PiPawPrint className="mx-auto text-[#8d6aa7]" size={34} />
        <h1 className="mt-4 text-2xl font-bold">Preview unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-[#706a78]">
          Return to your request and open the sitter view again.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#5d3a86] px-5 text-sm font-bold text-white"
        >
          <PiArrowLeft />
          Back to edit
        </button>
      </section>
    </main>
  );
}

function previewCareType(value: string | null): PreviewCareType {
  if (value === "boarding" || value === "custom") return value;
  return "visit";
}

function buildDemoPreview(careType: PreviewCareType): NeedPreviewSnapshot {
  const base = {
    version: 1 as const,
    careType,
    serviceTitle:
      careType === "boarding"
        ? "Pet boarding"
        : careType === "custom"
          ? "Custom care"
          : "Home visits",
    title:
      careType === "boarding"
        ? "A calm home for Momo and Buddy"
        : careType === "custom"
          ? "A little extra help for Momo and Buddy"
          : "Gentle home visits for Momo",
    area: "Shibuya, Tokyo",
    areaDetail: "Near Shibuya station",
    dates: {
      label: "Aug 8 – 11, 2026",
      startDate: "2026-08-08",
      endDate: "2026-08-11",
      notes: "Please send a short update after each visit.",
      totalDays: 4,
      totalNights: 3,
    },
    pets: [
      {
        id: "demo-momo",
        label: "Momo",
        type: "Cat",
        quantity: 1,
        details: [
          { label: "Breed", value: "Domestic shorthair" },
          { label: "Age", value: "4 years" },
          { label: "Sex", value: "Female" },
        ],
        notes: "Quiet company and a little playtime help her settle.",
      },
      {
        id: "demo-buddy",
        label: "Buddy",
        type: "Dog",
        quantity: 1,
        details: [{ label: "Age", value: "6 years" }],
        notes: "A gentle senior who enjoys calm cuddles.",
      },
    ],
    pricing: {
      priceLabel: "¥3,000 / visit",
      supplyCostLabel: "Owner provides supplies",
      transportCostLabel: "Included",
      estimatedTotal: "¥12,000",
      formula: "Estimated total = 4 visits × price per visit",
    },
    additionalCareNotes: "The key is inside the small lockbox by the entrance.",
  } satisfies Omit<NeedPreviewSnapshot, "visit" | "boarding" | "custom">;

  if (careType === "visit") {
    return {
      ...base,
      visit: {
        scheduleLabel: "Twice a day",
        totalVisits: 4,
        visitDates: [
          "2026-08-08",
          "2026-08-09",
          "2026-08-10",
          "2026-08-11",
        ],
        visitDateCandidates: [
          "2026-08-08",
          "2026-08-09",
          "2026-08-10",
          "2026-08-11",
        ],
        excludedVisitDates: [],
        visits: [
          {
            number: 1,
            time: "08:00–10:00",
            tasks: [
              {
                id: "demo-morning-food",
                label: "Refresh food and water",
                priority: "must",
                petLabels: ["Momo"],
              },
              {
                id: "demo-morning-litter",
                label: "Scoop litter box",
                priority: "must",
                petLabels: ["Momo"],
              },
              {
                id: "demo-morning-buddy",
                label: "Short walk and gentle companionship",
                priority: "must",
                petLabels: ["Buddy"],
              },
            ],
          },
          {
            number: 2,
            time: "18:00–20:00",
            tasks: [
              {
                id: "demo-evening-food",
                label: "Refresh dinner and water",
                priority: "must",
                petLabels: ["Momo", "Buddy"],
              },
            ],
          },
        ],
      },
    };
  }

  if (careType === "boarding") {
    return {
      ...base,
      boarding: {
        routines: [],
        homeFit: { needs: [], ok: [], avoid: [], notes: "" },
        supplies: { owner: [], sitter: [] },
        transportLabel: "Pickup and return will be discussed after matching",
      },
    };
  }

  return {
    ...base,
    custom: { tasks: [], requirements: [], cautions: [] },
  };
}

const routineGroups: Array<{
  type: PreviewRoutine["scheduleType"];
  title: string;
}> = [
  { type: "daily", title: "Every day" },
  { type: "repeating", title: "Recurring" },
  { type: "once", title: "Once during the stay" },
  { type: "as-needed", title: "As needed" },
];

function routineType(routine: PreviewRoutine): PreviewRoutine["scheduleType"] {
  if (routine.scheduleType) return routine.scheduleType;
  if (routine.schedule.startsWith("Every ")) return "repeating";
  if (routine.schedule.startsWith("Once")) return "once";
  if (routine.schedule === "As needed") return "as-needed";
  return "daily";
}

function taskIcon(label: string): IconType {
  const value = label.toLowerCase();
  if (value.includes("feed")) return PiBowlFood;
  if (value.includes("water")) return PiDrop;
  if (value.includes("clean") || value.includes("litter")) return PiBroom;
  if (value.includes("medication")) return PiPill;
  if (value.includes("play") || value.includes("companionship"))
    return PiGameController;
  if (value.includes("transport") || value.includes("pickup")) return PiCar;
  return PiSparkle;
}

function pluralize(type: string, quantity: number) {
  return quantity === 1 || type.endsWith("s")
    ? type.toLowerCase()
    : `${type.toLowerCase()}s`;
}

function targetLabel(request: NeedPreviewSnapshot, labels: string[]) {
  if (!labels.length) return "No pet selected";
  if (labels.length === request.pets.length) return "All pets";
  const orderedPets = groupPets(request.pets).flatMap((group) => group.members);
  const selectedLabels = new Set(labels);
  const orderedLabels = [
    ...orderedPets
      .filter((pet) => selectedLabels.has(pet.label))
      .map((pet) => pet.label),
    ...labels.filter(
      (label) => !orderedPets.some((pet) => pet.label === label),
    ),
  ];
  return orderedLabels
    .map((label) => {
      const index = orderedPets.findIndex((pet) => pet.label === label);
      const pet = orderedPets[index];
      if (!pet) return label;
      const groupName =
        pet.label.toLowerCase() === pet.type.toLowerCase()
          ? `Group ${String.fromCharCode(65 + index)}`
          : pet.label;
      return `${groupName} · ${pet.quantity} ${pluralize(pet.type, pet.quantity)}`;
    })
    .join(", ");
}

function groupVisitTasks(request: NeedPreviewSnapshot, tasks: PreviewTask[]) {
  const groups = new Map<
    string,
    { key: string; label: string; tasks: PreviewTask[] }
  >();
  tasks.forEach((task) => {
    const group = visitTaskGroup(request, task.petLabels);
    const existing = groups.get(group.key);
    if (existing) {
      existing.tasks.push(task);
    } else {
      groups.set(group.key, { ...group, tasks: [task] });
    }
  });
  return Array.from(groups.values());
}

function visitPetGroupCount(request: NeedPreviewSnapshot, tasks: PreviewTask[]) {
  const labels = new Set(tasks.flatMap((task) => task.petLabels));
  if (!labels.size) return 0;
  return groupPets(request.pets).filter((group) =>
    group.members.some((pet) => labels.has(pet.label)),
  ).length;
}

function visitTaskGroup(request: NeedPreviewSnapshot, labels: string[]) {
  if (!labels.length) return { key: "none", label: "No pet group" };
  const orderedPets = groupPets(request.pets).flatMap((group) => group.members);
  const selectedPets = orderedPets.filter((pet) => labels.includes(pet.label));
  if (selectedPets.length === request.pets.length) {
    const groupCount = groupPets(request.pets).length;
    return {
      key: "all",
      label: `${groupCount} pet ${groupCount === 1 ? "group" : "groups"}`,
    };
  }
  if (!selectedPets.length) {
    return { key: `labels:${labels.join("|")}`, label: labels.join(", ") };
  }

  const types = Array.from(
    new Map(
      selectedPets.map((pet) => {
        const type = pet.type.trim() || "Pet";
        return [type.toLowerCase(), type];
      }),
    ).values(),
  );
  return {
    key: types.map((type) => type.toLowerCase()).join("|"),
    label: types.map((type) => `${type} group`).join(" · "),
  };
}

function transportSteps(label: string) {
  if (label.includes("Owner handles")) return ["Owner drops off and picks up"];
  if (label.includes("Sitter handles"))
    return ["Sitter picks up the pets", "Sitter returns the pets"];
  if (label.includes("Owner drops off"))
    return ["Owner drops off the pets", "Sitter returns the pets"];
  if (label.includes("Sitter picks up"))
    return ["Sitter picks up the pets", "Owner collects after the stay"];
  if (label.includes("taxi")) return ["Pet taxi handles pickup and return"];
  return ["Pickup and return will be discussed after matching"];
}

function costTreatment(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("reimburse"))
    return "Reimbursed separately after matching.";
  if (
    lower.includes("discuss") ||
    lower.includes("not selected") ||
    lower.includes("not set")
  )
    return "Confirm this arrangement after matching.";
  if (lower.includes("no sitter") || lower.includes("paid to pet taxi"))
    return "No additional payment to the sitter.";
  return "Included in the estimated total when set as a fixed allowance.";
}

function buildRequestStory(request: NeedPreviewSnapshot) {
  const pets = petSummary(request.pets);
  if (request.careType === "boarding" && request.boarding) {
    const ownerItems = request.boarding.supplies.owner.length;
    const sitterItems = request.boarding.supplies.sitter.length;
    const supplySentence = sitterItems
      ? `I’ll bring ${ownerItems} ${ownerItems === 1 ? "item" : "items"}, and I need the sitter to provide ${sitterItems}; supply costs are ${request.pricing.supplyCostLabel.toLowerCase()}.`
      : `I’ll bring the arranged supplies, so the sitter does not need to provide additional items.`;
    return `I’ll be away for ${request.dates.totalNights} nights (${request.dates.label}) and need a sitter to care for ${pets} in their home. I’m looking for a boarding home in ${request.area}. ${transportStory(request.boarding.transportLabel)} ${supplySentence} Transport costs are ${request.pricing.transportCostLabel.toLowerCase()}.`;
  }
  if (request.careType === "visit" && request.visit) {
    const transportSentence = visitTransportStory(
      request.pricing.transportCostLabel,
    );
    return [
      `I need a sitter to visit my home ${request.visit.scheduleLabel.toLowerCase()} between ${request.dates.label} and care for ${pets}.`,
      "I need you to complete some tasks on each visit; you can review them below.",

      transportSentence,
      "If you have relevant experience and are interested, please get in touch.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  const taskCount = request.custom?.tasks.length ?? 0;
  return `I’m looking for help caring for ${pets} between ${request.dates.label}. This is a custom request with ${taskCount} ${taskCount === 1 ? "task" : "tasks"}; please review the requested care, location, requirements and cautions below before making an offer.`;
}

function petSummary(pets: PreviewPet[]) {
  if (!pets.length) return "my pets";
  const groups = groupPets(pets);
  const parts = groups.map(
    (group) => `${group.quantity} ${pluralize(group.type, group.quantity)}`,
  );
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

function previewVisitDate(value: string) {
  const date = new Date(value + "T00:00:00");
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    : value;
}

function groupPets(pets: PreviewPet[]) {
  const groups = new Map<
    string,
    { key: string; type: string; quantity: number; members: PreviewPet[] }
  >();
  pets.forEach((pet) => {
    const key = pet.type.trim().toLowerCase() || "pet";
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += pet.quantity;
      existing.members.push(pet);
    } else {
      groups.set(key, {
        key,
        type: pet.type.trim() || "Pet",
        quantity: pet.quantity,
        members: [pet],
      });
    }
  });
  return Array.from(groups.values());
}

function petAvatarPosition(type: string) {
  const value = type.toLowerCase();
  if (value.includes("dog")) return "0% 5.556%";
  if (value.includes("cat")) return "33.333% 5.556%";
  if (value.includes("rabbit")) return "66.667% 5.556%";
  if (value.includes("bird")) return "100% 5.556%";
  if (value.includes("hamster")) return "0% 50%";
  if (value.includes("guinea pig")) return "33.333% 50%";
  if (value.includes("ferret")) return "66.667% 50%";
  if (value.includes("turtle")) return "100% 50%";
  if (value.includes("chinchilla")) return "0% 94.444%";
  return "33.333% 94.444%";
}

function transportStory(label: string) {
  if (label.includes("Owner handles"))
    return "I’ll handle both drop-off and pickup.";
  if (label.includes("Sitter handles"))
    return "I need the sitter to handle both pickup and return.";
  if (label.includes("Owner drops off"))
    return "I’ll drop the pets off, and I need the sitter to return them after the stay.";
  if (label.includes("Sitter picks up"))
    return "I need the sitter to pick the pets up, and I’ll collect them after the stay.";
  if (label.includes("taxi"))
    return "A pet taxi will handle pickup and return.";
  return "We’ll confirm pickup and return after matching.";
}

function visitTransportStory(label: string) {
  const lower = label.toLowerCase();
  if (
    lower.includes("not provided") ||
    lower.includes("not set") ||
    lower.includes("not applicable")
  )
    return "";
  if (lower.includes("reimburse"))
    return "I’ll reimburse actual transport costs separately.";
  return "I’ll pay for your transport costs.";
}

function shortFormula(value: string) {
  const note = value.replace(/^Estimated total\s*=\s*/i, "");
  return (
    note.charAt(0).toUpperCase() +
    note
      .slice(1)
      .replace(
        /total visits\s*×\s*price per visit/i,
        "scheduled visits × visit fee",
      )
      .replace(
        /\(transport costs not included; supply costs not included\)/i,
        "(transport and supply costs not included)",
      )
  );
}

function visitBudgetFormula(request: NeedPreviewSnapshot) {
  if (request.careType !== "visit" || !request.visit) return "Visit fee";
  const totalVisits = request.visit.totalVisits || 0;
  const unitPrice = request.pricing.priceLabel.split("/")[0].trim();
  return `${totalVisits} ${totalVisits === 1 ? "visit" : "visits"} × ${unitPrice}`;
}

function getCareBreakdown(request: NeedPreviewSnapshot) {
  if (request.careType === "custom")
    return { value: request.pricing.priceLabel };
  const count =
    request.careType === "boarding"
      ? request.dates.totalNights
      : (request.visit?.totalVisits ?? 0);
  const unit = request.careType === "boarding" ? "nights" : "visits";
  const match = request.pricing.priceLabel.match(/([^\d]*)([\d,]+)/);
  if (!count || !match) return { value: request.pricing.priceLabel };
  const amount = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return { value: request.pricing.priceLabel };
  const symbol = match[1].trim() || "";
  return {
    value: `${symbol}${(amount * count).toLocaleString()}`,
    ...(request.careType === "boarding"
      ? { detail: `${count} ${unit} × ${symbol}${amount.toLocaleString()}` }
      : {}),
  };
}
