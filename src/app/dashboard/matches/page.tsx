// src/app/dashboard/matches/page.tsx

"use client";

import Link from "next/link";

export default function DashboardMatches() {
  // ---- MOCK MATCH / BOOKING DATA ----
  const matches = [
    {
      id: "m1",
      needTitle: "帮我照顾兔子两天",
      sitterName: "兔兔姐姐",
      role: "OWNER", // OWNER 视角 / SITTER 视角
      startDate: "2025-02-01",
      endDate: "2025-02-03",
      price: 3000,
      status: "PENDING", // PENDING | CONFIRMED | COMPLETED | CANCELLED
    },
    {
      id: "m2",
      needTitle: "猫咪日托（Kyoto）",
      sitterName: "宠物博士",
      role: "OWNER",
      startDate: "2025-01-15",
      endDate: "2025-01-15",
      price: 2000,
      status: "CONFIRMED",
    },
    {
      id: "m3",
      needTitle: "狗狗散步 1 小时",
      sitterName: "Nara 宅家达人",
      role: "SITTER",
      startDate: "2025-01-05",
      endDate: "2025-01-05",
      price: 1000,
      status: "COMPLETED",
    },
    {
      id: "m4",
      needTitle: "鸟类短期寄养",
      sitterName: "鸟友专员",
      role: "SITTER",
      startDate: "2025-01-10",
      endDate: "2025-01-12",
      price: 2500,
      status: "CANCELLED",
    },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">匹配 / 订单中心</h1>

      <div className="space-y-6">
        {matches.map((match) => (
          <MatchCard key={match.id} data={match} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------
   Match Card Component
------------------------------------------ */

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface MatchData {
  id: string;
  needTitle: string;
  sitterName: string;
  role: "OWNER" | "SITTER";
  startDate: string;
  endDate: string;
  price: number;
  status: BookingStatus;
}

function MatchCard({ data }: { data: MatchData }) {
  const statusColor: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const statusText: Record<BookingStatus, string> = {
    PENDING: "待确认",
    CONFIRMED: "已确认",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  };

  return (
    <div className="border rounded-lg p-5 shadow-sm hover:shadow transition">
      <div className="flex justify-between">
        <h3 className="text-xl font-semibold">{data.needTitle}</h3>

        <span
          className={`px-3 py-1 rounded-full text-sm ${
            statusColor[data.status]
          }`}
        >
          {statusText[data.status]}
        </span>
      </div>

      <p className="text-gray-600 text-sm mt-1">💬 对方：{data.sitterName}</p>
      <p className="text-gray-500 text-sm">
        👤 {data.role === "OWNER" ? "我是主人" : "我是照顾者"}
      </p>

      <p className="mt-2 text-gray-700">
        📅 {data.startDate} → {data.endDate}
      </p>

      <p className="mt-2 text-purple-600 font-semibold">
        💴 价格：¥{data.price}
      </p>
    </div>
  );
}
