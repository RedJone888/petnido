"use client";

import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { useMemo, useState } from "react";
import { format, eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  Info,
  MapPin,
  MessageCircle,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Currency, FrequencyType, NeedStatus, PetType, ServiceCategory } from "@prisma/client";
import { CURRENCY_META } from "@/domain/location/constants";
import { NEED_DISPLAY_CONFIG, NEED_TYPE_JA, FREQUENCY_TYPE_JA } from "@/domain/need/constant";
import { PET_META } from "@/domain/pet/constant";
import UserAvatar from "@/components/shared/user-avatar";

interface NeedDetailPageProps {
  initialNeed: any;
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function formatDateRange(startDate: Date, endDate: Date) {
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  if (isSameDay(startDate, endDate)) return format(startDate, "yyyy年M月d日");
  if (sameYear) {
    return `${format(startDate, "yyyy年M月d日")} — ${format(endDate, "M月d日")}`;
  }
  return `${format(startDate, "yyyy年M月d日")} — ${format(endDate, "yyyy年M月d日")}`;
}

function getPetLabel(pet: any) {
  const petCategory = pet.petCategory as PetType;
  if (petCategory === PetType.OTHER) return pet.petType || "その他のペット";
  return PET_META[petCategory]?.label?.ja?.name || "ペット";
}

function getVisitTasks(category: ServiceCategory) {
  if (category === ServiceCategory.FOSTER) {
    return [
      { title: "食事と水分の管理", detail: "いつものフードを決まった量で用意" },
      { title: "トイレ・ケージの清掃", detail: "清潔な環境を保って記録" },
      { title: "様子の確認と報告", detail: "写真付きで毎日の様子を共有" },
    ];
  }
  return [
    { title: "食事と水分の用意", detail: "いつもの場所・分量で準備" },
    { title: "トイレや生活スペースの確認", detail: "必要に応じて簡単な清掃もお願いします" },
    { title: "遊び・声かけ・見守り", detail: "ペットの性格に合わせて無理なく対応" },
    { title: "訪問後の写真報告", detail: "お世話の様子を一言添えて共有" },
  ];
}

function SectionHeading({ eyebrow, title, icon: Icon }: { eyebrow: string; title: string; icon: typeof Home }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-500">{eyebrow}</p>
        <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">{title}</h2>
      </div>
      <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 sm:flex">
        <Icon size={19} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function VisitCalendar({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(startDate));
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }),
    });
  }, [calendarMonth]);

  const shiftMonth = (offset: number) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1));
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(64,45,112,0.06)] md:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">上门时间</p>
          <p className="mt-1 text-xs text-slate-500">{formatDateRange(startDate, endDate)}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            aria-label="前の月"
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-violet-600"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[88px] text-center text-sm font-black text-slate-800">{format(calendarMonth, "yyyy年M月")}</span>
          <button
            type="button"
            aria-label="次の月"
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-violet-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((weekday, index) => (
          <div key={weekday} className={`pb-2 text-[11px] font-bold ${index > 4 ? "text-danger-text" : "text-slate-400"}`}>
            {weekday}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = day.getMonth() === calendarMonth.getMonth();
          const inRange = isWithinInterval(day, { start: startDate, end: endDate });
          const isStart = isSameDay(day, startDate);
          const isEnd = isSameDay(day, endDate);
          return (
            <div key={day.toISOString()} className="relative flex h-11 items-center justify-center">
              {inRange && <span className={`absolute inset-x-0 h-9 bg-violet-50 ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}`} />}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isStart || isEnd
                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                    : inRange
                      ? "text-violet-700"
                      : inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-600" />上门日期</span>
        <span className="inline-flex items-center gap-2"><Clock3 size={14} className="text-slate-400" />具体时段与发布人确认</span>
      </div>
    </div>
  );
}

export default function NeedDetailPage({ initialNeed }: NeedDetailPageProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applyNote, setApplyNote] = useState("");

  if (!initialNeed) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <PawPrint className="mx-auto mb-4 text-violet-400" size={34} />
        <h1 className="text-xl font-black text-slate-900">この依頼は見つかりませんでした</h1>
        <p className="mt-2 text-sm text-slate-500">募集が終了したか、URLが変更された可能性があります。</p>
      </div>
    );
  }

  const startDate = new Date(initialNeed.startDate);
  const endDate = new Date(initialNeed.endDate);
  const category = initialNeed.category as ServiceCategory;
  const categoryMeta = NEED_TYPE_JA[category] || NEED_TYPE_JA.OTHER;
  const CategoryIcon = categoryMeta.icon;
  const currencyMeta = CURRENCY_META[initialNeed.currency as Currency] || CURRENCY_META.JPY;
  const statusMeta = NEED_DISPLAY_CONFIG[initialNeed.status as NeedStatus] || NEED_DISPLAY_CONFIG.OPEN;
  const tasks = getVisitTasks(category);
  const ownerName = initialNeed.owner?.name || "ペットオーナー";
  const coverPetCategory = (initialNeed.needPets?.[0]?.petCategory as PetType) || PetType.DOG;
  const coverImage = initialNeed.photos?.[0]?.url || PET_META[coverPetCategory].placeImg;
  const frequencyLabel = initialNeed.frequencyType === FrequencyType.CUSTOM
    ? `${initialNeed.customDays || ""}日に${initialNeed.customTimes || ""}回`
    : initialNeed.frequencyType
      ? FREQUENCY_TYPE_JA[initialNeed.frequencyType as FrequencyType]
      : "時間は相談可能";

  return (
    <div className="min-h-full bg-[#fbfafc] pb-28 text-slate-900 md:pb-12">
      <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/public/needs" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-violet-600">
            <ArrowLeft size={17} /> お世話の依頼一覧
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isFavorite ? "收藏を解除" : "收藏する"}
              onClick={() => setIsFavorite((value) => !value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${isFavorite ? "border-danger-border bg-danger-bg text-danger-text" : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600"}`}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button type="button" className="hidden h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 transition hover:border-violet-200 hover:text-violet-600 sm:flex">
              <Send size={15} /> 共有
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(64,45,112,0.08)]">
          <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative min-h-[270px] bg-violet-100 lg:min-h-[360px]">
              <AppImage src={coverImage} alt="依頼のイメージ" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border bg-white/90 px-3 py-1.5 text-xs font-black backdrop-blur ${categoryMeta.tagClassName}`}>
                  <CategoryIcon size={14} /> {categoryMeta.labelShort}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-emerald-900/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" /> {statusMeta.label}
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="mb-1 text-xs font-bold text-white/75">PETNIDO CARE REQUEST</p>
                  <p className="text-sm font-semibold text-white/90">大切な家族のための、近所のサポート</p>
                </div>
                <div className="hidden rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur-md sm:block">
                  <p className="text-[10px] font-bold text-white/70">募集期限</p>
                  <p className="text-sm font-black">{format(endDate, "M月d日")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center p-6 md:p-10 lg:p-12">
              <div className="mb-5 flex items-center gap-3">
                <UserAvatar size={42} image={initialNeed.owner?.image} name={ownerName} />
                <div>
                  <p className="text-xs font-bold text-slate-400">{ownerName}さんからの依頼</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-black text-slate-800"><ShieldCheck size={14} className="text-emerald-500" /> 本人確認済み</p>
                </div>
              </div>
              <h1 className="max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-4xl">{initialNeed.title}</h1>
              <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5"><MapPin size={18} className="mt-0.5 shrink-0 text-violet-600" /><span><strong className="block text-xs text-slate-400">場所</strong><span className="mt-1 block font-bold text-slate-700">{initialNeed.addressRaw || "近隣エリア"}</span></span></div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5"><CalendarDays size={18} className="mt-0.5 shrink-0 text-violet-600" /><span><strong className="block text-xs text-slate-400">期間</strong><span className="mt-1 block font-bold text-slate-700">{formatDateRange(startDate, endDate)}</span></span></div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5"><Clock3 size={18} className="mt-0.5 shrink-0 text-violet-600" /><span><strong className="block text-xs text-slate-400">頻度</strong><span className="mt-1 block font-bold text-slate-700">{frequencyLabel}</span></span></div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5"><PawPrint size={18} className="mt-0.5 shrink-0 text-violet-600" /><span><strong className="block text-xs text-slate-400">ペット</strong><span className="mt-1 block font-bold text-slate-700">{initialNeed.needPets?.length || 0}匹・{categoryMeta.labelShort}</span></span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
          <main className="space-y-8">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <SectionHeading eyebrow="The story" title="依頼のストーリー" icon={MessageCircle} />
              <div className="relative rounded-2xl bg-[#fcf9ff] p-5 pl-12 text-[15px] leading-8 text-slate-600 md:p-7 md:pl-16">
                <span className="absolute left-5 top-3 text-5xl font-black leading-none text-violet-200 md:left-7">“</span>
                <p className="whitespace-pre-wrap">{initialNeed.requirement || "大切なペットが安心して過ごせるよう、日常のお世話をお願いしたいです。"}</p>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <SectionHeading eyebrow="Meet the pets" title="需要照顾的宠物" icon={PawPrint} />
              <div className="grid gap-4 md:grid-cols-2">
                {(initialNeed.needPets || []).map((pet: any, index: number) => {
                  const petCategory = pet.petCategory as PetType;
                  const petImage = pet.photos?.[0]?.url || PET_META[petCategory]?.placeImg || "/placeholders/dog.png";
                  const petLabel = getPetLabel(pet);
                  return (
                    <div key={pet.id || index} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-violet-50">
                        <AppImage src={petImage} alt={petLabel} width={80} height={80} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-black text-slate-900">{petLabel}</h3>
                            <p className="mt-1 text-xs font-bold text-slate-500">{pet.count}匹 · {pet.petType || "性格は相談時に確認"}</p>
                          </div>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-violet-600 shadow-sm">#{index + 1}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{pet.description || "いつものペースを大切にした、やさしいお世話をお願いします。"}</p>
                        {pet.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{pet.tags.slice(0, 3).map((tag: string) => <span key={tag} className="rounded-full border border-violet-100 bg-white px-2 py-1 text-[10px] font-bold text-violet-600">{tag}</span>)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <SectionHeading eyebrow="Visit schedule" title="需要上门的日历" icon={CalendarDays} />
              <VisitCalendar startDate={startDate} endDate={endDate} />
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <SectionHeading eyebrow="Care checklist" title="需要完成的任务" icon={CheckCircle2} />
              <div className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <div key={task.title} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={16} strokeWidth={3} /></div>
                    <div><h3 className="text-sm font-black text-slate-800">{task.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{task.detail}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-xs leading-5 text-amber-800"><Info size={16} className="mt-0.5 shrink-0" /><p>报名后可以和发布人确认钥匙交接、具体时段，以及宠物的临时变化。</p></div>
            </section>
          </main>

          <aside className="space-y-5 lg:sticky lg:top-5">
            <section className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-[0_18px_55px_rgba(85,44,148,0.12)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Estimated reward</p><p className="mt-2 text-3xl font-black tracking-tight text-violet-700">{currencyMeta.symbol}{Number(initialNeed.totalPrice || 0).toLocaleString()}</p></div>
                <span className="rounded-2xl bg-violet-50 px-3 py-2 text-right text-[10px] font-bold leading-4 text-violet-700">{currencyMeta.label.ja.short}<br />総額目安</span>
              </div>
              <div className="mb-5 flex items-center justify-between border-y border-slate-100 py-4 text-xs"><span className="text-slate-500">1回あたり</span><span className="font-black text-slate-800">{currencyMeta.symbol}{Number(initialNeed.priceAmount || 0).toLocaleString()} / {categoryMeta.priceDisplayUnit}</span></div>
              {isApplied ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-sm font-black text-emerald-700"><CheckCircle2 size={18} />报名意向已发送</div><p className="mt-2 text-xs leading-5 text-emerald-700/80">发布人确认后，你可以在消息中继续沟通细节。</p></div>
              ) : showApply ? (
                <div className="space-y-3"><textarea value={applyNote} onChange={(event) => setApplyNote(event.target.value)} rows={4} placeholder="简单介绍一下你和宠物照护的经验吧…" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /><button type="button" onClick={() => { setIsApplied(true); setShowApply(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"><MessageCircle size={17} />发送报名意向</button><button type="button" onClick={() => setShowApply(false)} className="w-full py-1 text-xs font-bold text-slate-400 hover:text-slate-600">先看看再说</button></div>
              ) : (
                <button type="button" onClick={() => setShowApply(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"><MessageCircle size={18} />この依頼に応募する</button>
              )}
              <button type="button" onClick={() => setIsFavorite((value) => !value)} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${isFavorite ? "border-danger-border bg-danger-bg text-danger-text" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-600"}`}><Heart size={17} fill={isFavorite ? "currentColor" : "none"} />{isFavorite ? "收藏中" : "收藏这个依頼"}</button>
              <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">报名后先通过消息确认，再决定是否正式匹配。</p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Posted by</p>
              <div className="flex items-center gap-3"><UserAvatar size={52} image={initialNeed.owner?.image} name={ownerName} /><div><h3 className="font-black text-slate-900">{ownerName}</h3><p className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><ShieldCheck size={13} />本人確認済み</p></div></div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{initialNeed.owner?.profile?.bio || "ペットが安心して過ごせるよう、丁寧に相談しながらお願いしたいです。"}</p>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-5 text-center"><div><p className="text-lg font-black text-slate-900">{initialNeed.owner?._count?.needs || 1}</p><p className="mt-1 text-[10px] font-bold text-slate-400">发布中的需求</p></div><div><p className="text-lg font-black text-slate-900">{initialNeed.owner?.createdAt ? format(new Date(initialNeed.owner.createdAt), "yyyy") : "—"}</p><p className="mt-1 text-[10px] font-bold text-slate-400">加入年份</p></div></div>
              <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:border-violet-200 hover:text-violet-600"><UserRound size={15} />查看发布人资料</button>
            </section>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs leading-5 text-slate-500"><Sparkles size={16} className="mt-0.5 shrink-0 text-violet-500" /><p>PetNido 建议先通过消息了解宠物日常，再确认是否适合彼此。</p></div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(29,25,45,0.08)] backdrop-blur md:hidden">
        <div className="flex gap-2"><button type="button" onClick={() => setIsFavorite((value) => !value)} className={`flex w-12 items-center justify-center rounded-2xl border ${isFavorite ? "border-danger-border text-danger-text" : "border-slate-200 text-slate-500"}`}><Heart size={18} fill={isFavorite ? "currentColor" : "none"} /></button><button type="button" onClick={() => setShowApply(true)} className="flex-1 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200">{isApplied ? "报名意向已发送" : "报名照顾 · " + currencyMeta.symbol + Number(initialNeed.totalPrice || 0).toLocaleString()}</button></div>
      </div>
    </div>
  );
}
