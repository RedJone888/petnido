"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useLanguage } from "@/components/providers/language-provider";
import { notificationPresentation } from "@/domain/notification/notification";
import { trpc } from "@/utils/trpc";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { lang, t } = useLanguage();
  const copy = t.core.workflow;
  const utils = trpc.useUtils();
  const count = trpc.notification.unreadCount.useQuery(undefined, { refetchInterval: 30_000 });
  const notifications = trpc.notification.listMine.useQuery({ limit: 5, unreadOnly: false }, { enabled: open });
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: async () => Promise.all([utils.notification.unreadCount.invalidate(), utils.notification.listMine.invalidate()]),
  });
  const unreadCount = count.data ?? 0;
  return (
    <div className="relative">
      <button type="button" aria-label={copy.notificationsTitle} aria-expanded={open} aria-controls="notification-menu" onClick={() => setOpen((value) => !value)} className="relative rounded-full p-2 transition hover:bg-gray-100">
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-bg0 px-1 text-[10px] text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
      </button>
      {open ? (
        <div id="notification-menu" role="dialog" aria-label={copy.notificationsTitle} className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><span className="font-bold text-gray-800">{copy.notificationsTitle}</span>{unreadCount ? <span className="text-xs text-gray-500">{copy.unread} {unreadCount}</span> : null}</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.isLoading ? <p className="px-4 py-6 text-center text-gray-500" role="status">{copy.loadingNotifications}</p> : null}
            {!notifications.isLoading && !notifications.data?.length ? <p className="px-4 py-6 text-center text-gray-500">{copy.noNotifications}</p> : null}
            {notifications.data?.map((notification) => {
              const text = notificationPresentation(notification, lang);
              return <Link key={notification.id} href={notification.href} onClick={() => { setOpen(false); if (!notification.read) markRead.mutate({ id: notification.id }); }} className={`block px-4 py-3 hover:bg-gray-50 ${notification.read ? "" : "bg-purple-50/60"}`}><p className="truncate font-bold text-gray-800">{text.title}</p><p className="line-clamp-2 text-xs text-gray-500">{text.body}</p><p className="mt-1 text-[11px] text-gray-400">{new Date(notification.createdAt).toLocaleString(lang)}</p></Link>;
            })}
          </div>
          <div className="border-t border-gray-100 px-4 py-2 text-right"><Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="text-xs font-bold text-purple-700 hover:underline">{copy.notificationsTitle}</Link></div>
        </div>
      ) : null}
    </div>
  );
}
