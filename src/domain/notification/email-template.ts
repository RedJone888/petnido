import type { NotificationLocale, NotificationType } from "./notification";

const category: Record<NotificationType, "message" | "application" | "booking" | "need"> = {
  MESSAGE_RECEIVED: "message",
  APPLICATION_RECEIVED: "application",
  APPLICATION_ACCEPTED: "application",
  APPLICATION_DECLINED: "application",
  APPLICATION_CANCELLED: "application",
  APPLICATION_NEED_ENDED: "application",
  NEED_MATCHED: "need",
  NEED_REOPENED: "need",
  NEED_CLOSED: "need",
  BOOKING_REQUESTED: "booking",
  BOOKING_CONFIRMED: "booking",
  BOOKING_DECLINED: "booking",
  BOOKING_CANCELLED: "booking",
};

const text = {
  zh: {
    message: ["你在 PetNido 收到一条新消息", "登录后可在消息中心安全查看。"],
    application: ["你的 PetNido 应聘有新动态", "登录后可在应聘管理中查看状态。"],
    booking: ["你的 PetNido 预约有新动态", "登录后可在预约管理中查看状态。"],
    need: ["你的 PetNido 需求状态已变化", "登录后可在需求管理中查看状态。"],
    view: "登录 PetNido 查看",
    settings: "管理邮件通知或退订",
  },
  en: {
    message: ["You have a new PetNido message", "Sign in to view it safely in your message center."],
    application: ["Your PetNido application has an update", "Sign in to review the status in application management."],
    booking: ["Your PetNido booking has an update", "Sign in to review the status in booking management."],
    need: ["Your PetNido need status changed", "Sign in to review the status in need management."],
    view: "Sign in to PetNido",
    settings: "Manage or unsubscribe from email notifications",
  },
  ja: {
    message: ["PetNidoに新しいメッセージがあります", "ログインしてメッセージセンターで安全に確認できます。"],
    application: ["PetNidoの応募に更新があります", "ログインして応募管理で状態を確認できます。"],
    booking: ["PetNidoの予約に更新があります", "ログインして予約管理で状態を確認できます。"],
    need: ["PetNidoの依頼ステータスが変わりました", "ログインして依頼管理で状態を確認できます。"],
    view: "PetNidoにログイン",
    settings: "メール通知の管理・配信停止",
  },
} as const;

function safeBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://petnido.example";
  }
}

export function buildNotificationEmail(input: {
  type: NotificationType;
  locale: NotificationLocale;
  baseUrl: string;
}) {
  const copy = text[input.locale];
  const notificationCategory = category[input.type];
  const [subject, body] = copy[notificationCategory];
  const baseUrl = safeBaseUrl(input.baseUrl);
  const destination = {
    message: "/dashboard/messages",
    application: "/dashboard/applications",
    booking: "/dashboard/bookings",
    need: "/dashboard/needs",
  }[notificationCategory];
  const dashboardUrl = `${baseUrl}${destination}`;
  const settingsUrl = `${baseUrl}/dashboard/messages`;
  return {
    subject,
    html: `<main style="font-family:Arial,sans-serif;line-height:1.6;color:#2f2733"><h1 style="font-size:20px">${subject}</h1><p>${body}</p><p><a href="${dashboardUrl}">${copy.view}</a></p><hr><p style="font-size:12px;color:#6b6470"><a href="${settingsUrl}">${copy.settings}</a></p></main>`,
  };
}

export function retryDelayMilliseconds(attempt: number) {
  return Math.min(24 * 60 * 60 * 1000, 60_000 * 2 ** Math.max(0, attempt - 1));
}
