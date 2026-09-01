"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarClock, FilePenLine, Heart, Inbox, PawPrint, Send, Sparkles, UserRound } from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";
import { trpc } from "@/utils/trpc";
import { DashboardHomeContentSkeleton } from "./DashboardHomeSkeleton";

export function DashboardHomeContent({
  user,
  initialSummary,
}: {
  user: { name?: string | null; image?: string | null; email?: string | null };
  initialSummary?: any;
}) {
  const { lang, t } = useLanguage();
  const summary = trpc.dashboardSummary.getMine.useQuery(undefined, {
    initialData: initialSummary ?? undefined,
    refetchOnMount: false,
  });
  const conversations = trpc.conversation.listMine.useQuery({ includeArchived: false });
  const needDrafts = trpc.publishDraft.listMine.useQuery({ kind: "NEED", includeAbandoned: false });
  const serviceDrafts = trpc.publishDraft.listMine.useQuery({ kind: "SERVICE", includeAbandoned: false });
  const receivedBookings = trpc.serviceBooking.listReceived.useQuery();
  const myBookings = trpc.serviceBooking.listMine.useQuery();
  const pets = trpc.pet.listMine.useQuery();
  const preference = trpc.notificationPreference.getMine.useQuery();
  const data = summary.data;
  const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en-US";
  const copy = {
    en: { title: "Overview", hello: "Welcome", subtitle: "Manage your care activity and next steps here.", attention: "Needs your attention", unread: "Unread conversations", applications: "Applications to review", bookings: "Bookings to confirm", drafts: "Unfinished drafts", ongoing: "Upcoming care", activity: "Your activity", openNeeds: "Open requests", services: "Published services", favorites: "Favorites", draftsCount: "Drafts", messages: "Recent messages", allMessages: "View all messages", recentDrafts: "Recent drafts", continue: "Continue", saved: "Saved", profile: "Complete your account", addPet: "Add a pet profile so you can reuse it when publishing.", email: "Bind or verify an email and enable alerts so new messages do not get missed.", complete: "Review profile", view: "View", counterpart: "with", startTitle: "Get started with PetNido", startDetail: "Prepare reusable details, choose how you want to use PetNido, and stay informed when someone contacts you.", startProfile: "Complete your profile and pet details", startProfileDetail: "Save your address, preferred currency, and pet information to reuse when publishing a request or booking a service.", personalProfile: "Personal profile", petProfiles: "Pet profiles", startCare: "Choose your care direction", startCareDetail: "Find someone to care for your pets, or offer care to pet owners nearby.", findCare: "I need pet care", publishNeed: "Publish a request", browseServices: "Browse sitter services", offerCare: "I want to provide care", publishService: "Publish a service", browseRequests: "Browse nearby requests", startAlerts: "Turn on email notifications", startAlertsDetail: "Know as soon as a new message arrives, even when you are not on PetNido.", manageAlerts: "Manage notifications" },
    zh: { title: "总览", hello: "欢迎", subtitle: "在这里查看并管理你的照护活动与下一步事项。", attention: "待处理事项", unread: "未读会话", applications: "待处理的需求应聘", bookings: "待确认的服务预约", drafts: "未完成的草稿", ongoing: "即将进行的照护", activity: "我的活动", openNeeds: "公开中的需求", services: "已发布的服务", favorites: "收藏内容", draftsCount: "草稿", messages: "最近消息", allMessages: "查看全部消息", recentDrafts: "最近草稿", continue: "继续编辑", saved: "保存于", profile: "完善账号资料", addPet: "添加宠物档案，发布时可以直接复用。", email: "绑定或验证邮箱并开启提醒，避免错过新的站内消息。", complete: "前往完善", view: "查看", counterpart: "对方", startTitle: "开始使用 PetNido", startDetail: "先准备可复用的资料，再选择你想使用 PetNido 的方式，并确保有人联系你时能够及时知道。", startProfile: "完善个人资料与宠物档案", startProfileDetail: "保存常用地址、使用货币和宠物信息，发布需求或预约服务时可以直接复用。", personalProfile: "个人资料", petProfiles: "宠物档案", startCare: "选择你的照护方向", startCareDetail: "你可以为宠物寻找照护，也可以向附近的宠物主人提供服务。", findCare: "我要寻找宠物照护", publishNeed: "发布照护需求", browseServices: "浏览 sitter 服务", offerCare: "我要提供照护", publishService: "发布照护服务", browseRequests: "浏览附近需求", startAlerts: "开启邮件通知", startAlertsDetail: "即使没有停留在网站上，也能在收到新消息时及时知道。", manageAlerts: "管理通知" },
    ja: { title: "概要", hello: "ようこそ", subtitle: "ケアに関する活動と次のステップをここで管理できます。", attention: "対応が必要", unread: "未読の会話", applications: "確認待ちの応募", bookings: "確認待ちの予約", drafts: "未完了の下書き", ongoing: "今後のケア", activity: "アクティビティ", openNeeds: "公開中の依頼", services: "公開済みサービス", favorites: "お気に入り", draftsCount: "下書き", messages: "最近のメッセージ", allMessages: "すべて見る", recentDrafts: "最近の下書き", continue: "編集を続ける", saved: "保存日時", profile: "アカウントを完成", addPet: "公開時に再利用できるペットプロフィールを追加しましょう。", email: "メールを登録・確認して通知を有効にすると、新着メッセージを見逃しません。", complete: "設定する", view: "見る", counterpart: "相手", startTitle: "PetNidoを始める", startDetail: "再利用できる情報を準備し、PetNidoの使い方を選び、連絡をすぐに確認できるようにしましょう。", startProfile: "プロフィールとペット情報を完成", startProfileDetail: "住所、通貨、ペット情報を保存すると、依頼の作成やサービス予約で再利用できます。", personalProfile: "個人プロフィール", petProfiles: "ペットプロフィール", startCare: "ケアの方向を選ぶ", startCareDetail: "ペットのケアを探すことも、近くの飼い主にケアを提供することもできます。", findCare: "ペットケアを探す", publishNeed: "依頼を作成", browseServices: "シッターサービスを見る", offerCare: "ケアを提供する", publishService: "サービスを公開", browseRequests: "近くの依頼を見る", startAlerts: "メール通知を有効にする", startAlertsDetail: "サイトを開いていない時も、新しいメッセージをすぐに確認できます。", manageAlerts: "通知を管理" },
  }[lang];
  const nextCopy = {
    en: { title: "Suggested next steps", profileTitle: "Complete your reusable details", profileDetail: "Add your pet information before publishing another request or booking a service.", profileAction: "Complete profiles", requestLiveTitle: "Your request is live", enableAlertDetail: "No applications yet. Turn on email notifications so you know as soon as a sitter contacts you.", enableAlertAction: "Turn on notifications", browseServiceDetail: "No applications or messages yet. You can also compare nearby sitter services instead of waiting.", browseServiceAction: "Browse sitter services", publishServiceTitle: "Start offering care", publishServiceDetail: "You are accepting work but have not published a service. Publish what you can offer so owners can find you, or browse nearby requests and apply proactively.", publishServiceAction: "Publish a service", browseNeedTitle: "Find pets you can care for", browseNeedDetail: "Your service is available. You can also browse nearby requests and apply proactively.", browseNeedAction: "Browse nearby requests", emailTitle: "Do not miss new messages", emailDetail: "Turn on email notifications to hear about replies even when you are away from PetNido.", draftDetail: "Your drafts are saved safely. Continue whenever you are ready.", requestDraftAction: "Request drafts", serviceDraftAction: "Service drafts", favoriteNeeds: "Favorite requests", favoriteServices: "Favorite services" },
    zh: { title: "接下来可以做", profileTitle: "完善可复用的资料", profileDetail: "补充个人资料和宠物信息，之后发布需求或预约服务时可以直接复用。", profileAction: "完善资料", requestLiveTitle: "你的需求正在公开中", enableAlertDetail: "暂时还没有 sitter 应聘。开启邮件通知，有人联系时可以立即知道。", enableAlertAction: "开启邮件通知", browseServiceDetail: "暂时还没有应聘或消息。除了等待，你也可以主动比较附近 sitter 提供的服务。", browseServiceAction: "浏览附近服务", publishServiceTitle: "开始提供照护", publishServiceDetail: "你已经开启接单状态，但还没有发布服务。可以发布你能提供的照护，让宠物主人找到你，也可以主动浏览附近需求并应聘。", publishServiceAction: "发布照护服务", browseNeedTitle: "寻找可以照顾的宠物", browseNeedDetail: "你的服务已处于接单状态，也可以主动浏览附近需求并应聘。", browseNeedAction: "浏览附近需求", emailTitle: "不要错过新消息", emailDetail: "开启邮件通知，即使没有停留在 PetNido，也能及时知道有人回复。", draftDetail: "草稿已经保存，可以在方便时继续。", requestDraftAction: "需求草稿", serviceDraftAction: "服务草稿", favoriteNeeds: "收藏的需求", favoriteServices: "收藏的服务" },
    ja: { title: "次にできること", profileTitle: "再利用できる情報を完成", profileDetail: "プロフィールとペット情報を追加すると、依頼作成やサービス予約で再利用できます。", profileAction: "プロフィールを完成", requestLiveTitle: "依頼は公開中です", enableAlertDetail: "応募はまだありません。メール通知を有効にすると、シッターからの連絡をすぐ確認できます。", enableAlertAction: "メール通知を有効にする", browseServiceDetail: "応募やメッセージはまだありません。待つだけでなく、近くのシッターサービスも比較できます。", browseServiceAction: "近くのサービスを見る", publishServiceTitle: "ケアの提供を始める", publishServiceDetail: "受付中ですが、サービスはまだ公開されていません。サービスを公開して飼い主に見つけてもらうか、近くの依頼に自分から応募できます。", publishServiceAction: "サービスを公開", browseNeedTitle: "ケアできるペットを探す", browseNeedDetail: "サービスは受付中です。近くの依頼を探して自分から応募することもできます。", browseNeedAction: "近くの依頼を見る", emailTitle: "新着メッセージを見逃さない", emailDetail: "メール通知を有効にすると、PetNidoを開いていない時も返信を確認できます。", draftDetail: "下書きは保存されています。都合のよい時に続けられます。", requestDraftAction: "依頼の下書き", serviceDraftAction: "サービスの下書き", favoriteNeeds: "お気に入りの依頼", favoriteServices: "お気に入りのサービス" },
  }[lang];

  const allDrafts = [
    ...(needDrafts.data ?? []).map((draft) => ({ ...draft, kind: "NEED" as const })),
    ...(serviceDrafts.data ?? []).map((draft) => ({ ...draft, kind: "SERVICE" as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const unread = conversations.data?.filter((item) => item.unread).length ?? 0;
  const attention = [
    { label: copy.unread, count: unread, href: "/dashboard/messages", icon: Inbox },
    { label: copy.applications, count: data?.counts.receivedApplications ?? 0, href: "/dashboard/applications", icon: Send },
    { label: copy.bookings, count: data?.counts.receivedBookings ?? 0, href: "/dashboard/bookings", icon: CalendarClock },
  ].filter((item) => item.count > 0);
  const ongoing = [
    ...(receivedBookings.data ?? []).filter((item) => item.state === "CONFIRMED"),
    ...(myBookings.data ?? []).filter((item) => item.state === "CONFIRMED"),
  ].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 3);
  const activity = [
    { label: copy.openNeeds, value: data?.needStates.OPEN ?? 0, href: "/dashboard/needs", icon: PawPrint },
    { label: copy.services, value: data?.totals.services ?? 0, href: "/dashboard/serviceprofile", icon: Sparkles },
    { label: nextCopy.favoriteNeeds, value: data?.favoritedNeedsCount ?? 0, href: "/dashboard/favorites?type=needs", icon: Heart },
    { label: nextCopy.favoriteServices, value: data?.favoritedServicesCount ?? 0, href: "/dashboard/favorites?type=services", icon: Heart },
  ];
  const activeActivity = activity.filter((item) => item.value > 0);
  const recentConversations = conversations.data?.slice(0, 3) ?? [];
  const overviewLoading = summary.isLoading || conversations.isLoading || needDrafts.isLoading || serviceDrafts.isLoading || receivedBookings.isLoading || myBookings.isLoading;
  const isEmptyOverview = !overviewLoading && attention.length === 0 && ongoing.length === 0 && activeActivity.length === 0 && recentConversations.length === 0 && allDrafts.length === 0 && !data?.serviceProfile.isAccepting;
  const emailAlertsEnabled = Boolean(preference.data?.canEnableEmail && preference.data?.emailInstant);
  const nextSteps: Array<{ key: string; title: string; detail: string; action: string; href: string; secondaryAction?: string; secondaryHref?: string; icon: typeof AlertCircle }> = [];
  if (!pets.isLoading && !pets.data?.length) {
    nextSteps.push({ key: "profile", title: nextCopy.profileTitle, detail: nextCopy.profileDetail, action: nextCopy.profileAction, href: "/dashboard/profile", icon: UserRound });
  }
  const hasOpenNeeds = (data?.needStates.OPEN ?? 0) > 0;
  const hasReceivedApplications = (data?.counts.receivedApplications ?? 0) > 0;
  if (hasOpenNeeds && !hasReceivedApplications) {
    nextSteps.push(emailAlertsEnabled
      ? { key: "browse-services", title: nextCopy.requestLiveTitle, detail: nextCopy.browseServiceDetail, action: nextCopy.browseServiceAction, href: "/services", icon: Heart }
      : { key: "request-alerts", title: nextCopy.requestLiveTitle, detail: nextCopy.enableAlertDetail, action: nextCopy.enableAlertAction, href: "/dashboard/messages", icon: Inbox });
  } else if (!preference.isLoading && !emailAlertsEnabled) {
    nextSteps.push({ key: "email", title: nextCopy.emailTitle, detail: nextCopy.emailDetail, action: nextCopy.enableAlertAction, href: "/dashboard/messages", icon: Inbox });
  }
  if (data?.serviceProfile.isAccepting && (data.totals.services ?? 0) === 0) {
    nextSteps.push({ key: "publish-service", title: nextCopy.publishServiceTitle, detail: nextCopy.publishServiceDetail, action: nextCopy.publishServiceAction, href: "/dashboard/serviceprofile/services/new", secondaryAction: nextCopy.browseNeedAction, secondaryHref: "/needs", icon: Sparkles });
  }
  if (data?.serviceProfile.isAccepting && (data.totals.services ?? 0) > 0 && (data.counts.submittedApplications ?? 0) === 0) {
    nextSteps.push({ key: "browse-needs", title: nextCopy.browseNeedTitle, detail: nextCopy.browseNeedDetail, action: nextCopy.browseNeedAction, href: "/needs", icon: PawPrint });
  }
  if (allDrafts.length) {
    const needDraftCount = needDrafts.data?.length ?? 0;
    const serviceDraftCount = serviceDrafts.data?.length ?? 0;
    const title = lang === "zh"
      ? `你有${needDraftCount ? ` ${needDraftCount} 个需求草稿` : ""}${needDraftCount && serviceDraftCount ? "和" : ""}${serviceDraftCount ? ` ${serviceDraftCount} 个服务草稿` : ""}`
      : lang === "ja"
        ? `${needDraftCount ? `依頼の下書き${needDraftCount}件` : ""}${needDraftCount && serviceDraftCount ? "と" : ""}${serviceDraftCount ? `サービスの下書き${serviceDraftCount}件` : ""}があります`
        : `You have ${needDraftCount ? `${needDraftCount} request ${needDraftCount === 1 ? "draft" : "drafts"}` : ""}${needDraftCount && serviceDraftCount ? " and " : ""}${serviceDraftCount ? `${serviceDraftCount} service ${serviceDraftCount === 1 ? "draft" : "drafts"}` : ""}`;
    nextSteps.push({ key: "drafts", title, detail: nextCopy.draftDetail, action: needDraftCount ? nextCopy.requestDraftAction : nextCopy.serviceDraftAction, href: needDraftCount ? "/dashboard/needs?tab=drafts" : "/dashboard/serviceprofile?tab=drafts", secondaryAction: needDraftCount && serviceDraftCount ? nextCopy.serviceDraftAction : undefined, secondaryHref: needDraftCount && serviceDraftCount ? "/dashboard/serviceprofile?tab=drafts" : undefined, icon: FilePenLine });
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <header className="flex h-auto shrink-0 items-center border-b border-slate-200/70 px-2 py-3 md:h-[var(--dashboard-title-height)] md:py-0">
        <div className="min-w-0"><h1 className="pr-32 text-2xl font-bold text-slate-900 md:pr-0">{copy.title}</h1><p className="mt-1 text-sm leading-5 text-slate-500">{lang === "zh" ? `${copy.hello}，${user.name || t.core.dashboardHome.guest}。${copy.subtitle}` : lang === "ja" ? `${copy.hello}、${user.name || t.core.dashboardHome.guest}。${copy.subtitle}` : `${copy.hello}, ${user.name || t.core.dashboardHome.guest}. ${copy.subtitle}`}</p></div>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-8 pr-1 pt-4">
        {overviewLoading ? (
          <DashboardHomeContentSkeleton />
        ) : isEmptyOverview ? (
          <section className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-xs">
            <div className="bg-gradient-to-br from-purple-50 via-white to-white px-6 py-8 md:px-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-sm"><Sparkles size={21} /></span>
              <h2 className="mt-5 text-xl font-bold text-slate-900">{copy.startTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{copy.startDetail}</p>
              <div className="mt-7 grid items-stretch gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-primary"><UserRound size={17} /></span><span><strong className="block text-sm text-slate-800">{copy.startProfile}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{copy.startProfileDetail}</span></span></div>
                  <div className="mt-4 flex flex-wrap gap-2 pl-12"><Link href="/dashboard/profile" className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-primary hover:bg-purple-100">{copy.personalProfile}</Link><Link href="/dashboard/profile/pets" className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-primary hover:bg-purple-100">{copy.petProfiles}</Link></div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-primary"><Heart size={17} /></span><span><strong className="block text-sm text-slate-800">{copy.startCare}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{copy.startCareDetail}</span></span></div>
                  <div className="mt-4 space-y-3 pl-12">
                    <div><p className="text-xs font-bold text-slate-700">{copy.findCare}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1"><Link href="/needs/create" className="text-xs font-bold text-primary hover:underline">{copy.publishNeed}</Link><Link href="/services" className="text-xs font-bold text-primary hover:underline">{copy.browseServices}</Link></div></div>
                    <div className="border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-700">{copy.offerCare}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1"><Link href="/dashboard/serviceprofile/services/new" className="text-xs font-bold text-primary hover:underline">{copy.publishService}</Link><Link href="/needs" className="text-xs font-bold text-primary hover:underline">{copy.browseRequests}</Link></div></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-primary"><Inbox size={17} /></span><span><strong className="block text-sm text-slate-800">{copy.startAlerts}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{copy.startAlertsDetail}</span></span></div>
                  <div className="mt-4 pl-12"><Link href="/dashboard/messages" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">{copy.manageAlerts}<ArrowRight size={13} /></Link></div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!overviewLoading && !isEmptyOverview && attention.length ? <section>
          <h2 className="mb-3 text-sm font-bold text-slate-900">{copy.attention}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{attention.map((item) => <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-xs transition hover:border-primary/40 hover:bg-purple-50/40"><span className="grid h-9 w-9 place-items-center rounded-lg bg-purple-50 text-primary"><item.icon size={17} /></span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{item.label}</span><strong className="text-lg text-primary">{item.count}</strong></Link>)}</div>
        </section> : null}

        {!overviewLoading && !isEmptyOverview && (activeActivity.length || recentConversations.length) ? <div className={recentConversations.length && activeActivity.length ? "grid gap-6 xl:grid-cols-[0.9fr_1.1fr]" : "space-y-6"}>
          {activeActivity.length ? <section><h2 className="mb-3 text-sm font-bold text-slate-900">{copy.activity}</h2><div className={activeActivity.length === 1 ? "grid gap-3" : activeActivity.length === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>{activeActivity.map((item) => <Link key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-primary/30"><div className="flex items-center justify-between"><item.icon size={17} className="text-slate-400" /><ArrowRight size={14} className="text-slate-300" /></div><strong className="mt-3 block text-2xl text-slate-900">{item.value}</strong><span className="mt-1 block text-xs font-medium text-slate-500">{item.label}</span></Link>)}</div></section> : null}
          {recentConversations.length ? <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">{copy.messages}</h2><Link href="/dashboard/messages" className="text-xs font-bold text-primary">{copy.allMessages}</Link></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">{recentConversations.map((conversation) => <Link key={conversation.id} href={`/dashboard/messages?conversation=${encodeURIComponent(conversation.id)}`} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"><span className={`h-2 w-2 shrink-0 rounded-full ${conversation.unread ? "bg-primary" : "bg-slate-200"}`} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-800">{conversation.counterpart?.name || t.core.workflow.user}</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{conversation.lastMessage?.body || conversation.context.title}</span></span>{conversation.lastMessageAt ? <time className="shrink-0 text-[10px] text-slate-400">{new Date(conversation.lastMessageAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}</time> : null}</Link>)}</div></section> : null}
        </div> : null}

        {!overviewLoading && !isEmptyOverview && nextSteps.length ? <section>
          <h2 className="mb-3 text-sm font-bold text-slate-900">{nextCopy.title}</h2>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{nextSteps.map((step) => <article key={step.key} className={`flex min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-xs ${step.key === "drafts" ? "border-slate-200" : "border-purple-100"}`}><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${step.key === "drafts" ? "bg-slate-100 text-slate-500" : "bg-purple-50 text-primary"}`}><step.icon size={17} /></span><span className="min-w-0"><strong className="block text-sm text-slate-800">{step.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{step.detail}</span></span></div><div className="mt-4 flex gap-2"><Link href={step.href} className={`inline-flex min-h-9 flex-1 items-center justify-center rounded-lg px-3 text-center text-xs font-bold transition ${step.key === "drafts" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-purple-50 text-primary hover:bg-purple-100"}`}>{step.action}</Link>{step.secondaryAction && step.secondaryHref ? <Link href={step.secondaryHref} className={`inline-flex min-h-9 flex-1 items-center justify-center rounded-lg px-3 text-center text-xs font-bold transition ${step.key === "drafts" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-purple-50 text-primary hover:bg-purple-100"}`}>{step.secondaryAction}</Link> : null}</div></article>)}</div>
        </section> : null}

        {!overviewLoading && !isEmptyOverview && ongoing.length ? <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">{copy.ongoing}</h2><Link href="/dashboard/bookings" className="text-xs font-bold text-primary">{copy.view} →</Link></div><div className="grid gap-3 lg:grid-cols-3">{ongoing.map((booking) => { const person = "customer" in booking ? booking.customer : booking.provider; return <Link key={`${booking.id}-${"customer" in booking ? "received" : "mine"}`} href={`/dashboard/messages?conversation=${encodeURIComponent(booking.conversationId)}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-primary/30"><p className="truncate text-sm font-bold text-slate-900">{booking.serviceTitleSnapshot}</p><p className="mt-2 text-xs text-slate-500">{new Date(booking.startsAt).toLocaleString(locale)} – {new Date(booking.endsAt).toLocaleString(locale)}</p><p className="mt-2 text-xs font-medium text-slate-600">{copy.counterpart}: {person.name || t.core.workflow.userFallback}</p></Link>; })}</div></section> : null}

      </div>
    </div>
  );
}
