export const notificationTypes = [
  "MESSAGE_RECEIVED",
  "APPLICATION_RECEIVED",
  "APPLICATION_ACCEPTED",
  "APPLICATION_DECLINED",
  "APPLICATION_CANCELLED",
  "APPLICATION_NEED_ENDED",
  "NEED_MATCHED",
  "NEED_REOPENED",
  "NEED_CLOSED",
  "BOOKING_REQUESTED",
  "BOOKING_CONFIRMED",
  "BOOKING_DECLINED",
  "BOOKING_CANCELLED",
] as const;

export type NotificationType = (typeof notificationTypes)[number];
export type NotificationResourceKind = "CONVERSATION" | "APPLICATION" | "BOOKING";
export type NotificationLocale = "zh" | "en" | "ja";

export type NotificationView = {
  type: NotificationType;
  subject: string;
};

const copy: Record<NotificationLocale, Record<NotificationType, { title: string; body: (subject: string) => string }>> = {
  zh: {
    MESSAGE_RECEIVED: { title: "收到新消息", body: (subject) => `关于“${subject}”的会话有一条新消息。` },
    APPLICATION_RECEIVED: { title: "收到新应聘", body: (subject) => `有人应聘了“${subject}”。` },
    APPLICATION_ACCEPTED: { title: "应聘已接受", body: (subject) => `你对“${subject}”的应聘已被接受。` },
    APPLICATION_DECLINED: { title: "应聘未被接受", body: (subject) => `你对“${subject}”的应聘已被婉拒。` },
    APPLICATION_CANCELLED: { title: "应聘已取消", body: (subject) => `“${subject}”关联的应聘已取消。` },
    APPLICATION_NEED_ENDED: { title: "需求已选择其他服务者", body: (subject) => `“${subject}”已不再接受应聘。` },
    NEED_MATCHED: { title: "需求已找到服务者", body: (subject) => `“${subject}”已变更为已找到服务者。` },
    NEED_REOPENED: { title: "需求已重新公开", body: (subject) => `“${subject}”已重新进入公开状态。` },
    NEED_CLOSED: { title: "需求已结束", body: (subject) => `“${subject}”已过期并结束。` },
    BOOKING_REQUESTED: { title: "收到预约请求", body: (subject) => `有人请求预约“${subject}”。` },
    BOOKING_CONFIRMED: { title: "预约已确认", body: (subject) => `“${subject}”的预约已确认。` },
    BOOKING_DECLINED: { title: "预约未被接受", body: (subject) => `“${subject}”的预约请求已被婉拒。` },
    BOOKING_CANCELLED: { title: "预约已取消", body: (subject) => `“${subject}”的预约已取消。` },
  },
  en: {
    MESSAGE_RECEIVED: { title: "New message", body: (subject) => `There is a new message about “${subject}”.` },
    APPLICATION_RECEIVED: { title: "New application", body: (subject) => `Someone applied to “${subject}”.` },
    APPLICATION_ACCEPTED: { title: "Application accepted", body: (subject) => `Your application for “${subject}” was accepted.` },
    APPLICATION_DECLINED: { title: "Application declined", body: (subject) => `Your application for “${subject}” was declined.` },
    APPLICATION_CANCELLED: { title: "Application cancelled", body: (subject) => `The application linked to “${subject}” was cancelled.` },
    APPLICATION_NEED_ENDED: { title: "Need matched elsewhere", body: (subject) => `“${subject}” is no longer accepting applications.` },
    NEED_MATCHED: { title: "Provider selected", body: (subject) => `“${subject}” now has a selected provider.` },
    NEED_REOPENED: { title: "Need reopened", body: (subject) => `“${subject}” is public again.` },
    NEED_CLOSED: { title: "Need closed", body: (subject) => `“${subject}” expired and was closed.` },
    BOOKING_REQUESTED: { title: "New booking request", body: (subject) => `Someone requested to book “${subject}”.` },
    BOOKING_CONFIRMED: { title: "Booking confirmed", body: (subject) => `Your booking for “${subject}” was confirmed.` },
    BOOKING_DECLINED: { title: "Booking declined", body: (subject) => `Your booking request for “${subject}” was declined.` },
    BOOKING_CANCELLED: { title: "Booking cancelled", body: (subject) => `The booking for “${subject}” was cancelled.` },
  },
  ja: {
    MESSAGE_RECEIVED: { title: "新しいメッセージ", body: (subject) => `「${subject}」について新しいメッセージがあります。` },
    APPLICATION_RECEIVED: { title: "新しい応募", body: (subject) => `「${subject}」に応募が届きました。` },
    APPLICATION_ACCEPTED: { title: "応募が承認されました", body: (subject) => `「${subject}」への応募が承認されました。` },
    APPLICATION_DECLINED: { title: "応募は承認されませんでした", body: (subject) => `「${subject}」への応募は見送られました。` },
    APPLICATION_CANCELLED: { title: "応募がキャンセルされました", body: (subject) => `「${subject}」に関連する応募がキャンセルされました。` },
    APPLICATION_NEED_ENDED: { title: "別の提供者が決まりました", body: (subject) => `「${subject}」は応募受付を終了しました。` },
    NEED_MATCHED: { title: "提供者が決まりました", body: (subject) => `「${subject}」は提供者決定済みになりました。` },
    NEED_REOPENED: { title: "依頼を再公開しました", body: (subject) => `「${subject}」は再び公開されています。` },
    NEED_CLOSED: { title: "依頼が終了しました", body: (subject) => `「${subject}」は期限切れで終了しました。` },
    BOOKING_REQUESTED: { title: "新しい予約リクエスト", body: (subject) => `「${subject}」に予約リクエストが届きました。` },
    BOOKING_CONFIRMED: { title: "予約が確定しました", body: (subject) => `「${subject}」の予約が確定しました。` },
    BOOKING_DECLINED: { title: "予約は承認されませんでした", body: (subject) => `「${subject}」の予約リクエストは見送られました。` },
    BOOKING_CANCELLED: { title: "予約がキャンセルされました", body: (subject) => `「${subject}」の予約がキャンセルされました。` },
  },
};

export function notificationPresentation(notification: NotificationView, locale: NotificationLocale) {
  const item = copy[locale][notification.type];
  return { title: item.title, body: item.body(notification.subject) };
}

export function notificationResourceHref(resourceKind: NotificationResourceKind, resourceId: string) {
  const encoded = encodeURIComponent(resourceId);
  if (resourceKind === "CONVERSATION") return `/dashboard/notifications?view=conversations&conversation=${encoded}`;
  if (resourceKind === "APPLICATION") return `/dashboard/applications?application=${encoded}`;
  return `/dashboard/bookings?booking=${encoded}`;
}

export function notificationResourceAuthorized(
  notification: { resourceKind: NotificationResourceKind; resourceId: string },
  authorized: Record<NotificationResourceKind, ReadonlySet<string>>,
) {
  return authorized[notification.resourceKind].has(notification.resourceId);
}
