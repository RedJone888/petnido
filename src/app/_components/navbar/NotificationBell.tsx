"use client";
import { Bell } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};
export default function NotificationBell({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl text-sm animate-fadeIn">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-medium text-gray-800">通知</span>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500">
                未読 {unreadCount} 件
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-4 text-gray-500 text-center">
                新しい通知はありません
              </p>
            )}
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                  !n.read ? "bg-purple-50/60" : ""
                }`}
              >
                <p className="font-medium text-gray-800 truncate">{n.title}</p>
                <p className="text-gray-500 text-xs line-clamp-2">{n.body}</p>
                <p className="text-gray-400 text-[11px] mt-1">{n.createdAt}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-right">
            <Link
              href="/notifications"
              className="text-xs text-purple-700 hover:underline"
            >
              すべての通知を見る
            </Link>
          </div>
        </div>
      )}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
