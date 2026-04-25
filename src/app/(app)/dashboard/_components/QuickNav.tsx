import Link from "next/link";
export default function QuickNav() {
  const navItems2 = [
    {
      label: "依頼",
      icon: "🐾",
      count: 0,
      href: "/dashboard/needs",
    },
    {
      label: "サービス",
      icon: "💼",
      count: 0,
      href: "/dashboard/serviceprofile",
    },
    {
      label: "メッセージ",
      icon: "💬",
      href: "/dashboard/messages",
      count: 3,
    },
    {
      label: "通知",
      icon: "🔔",
      href: "/dashboard/notifications",
      count: 2,
    },
    {
      label: "設定",
      icon: "⚙️",
      count: 0,
      href: "/dashboard/settings",
    },
  ];

  return (
    <section className="px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
      <h3 className="text-xs font-semibold text-primary mb-2">
        クイックアクション
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {navItems2.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-center gap-4 px-4 py-2 bg-white border border-primary/50 rounded-full transition-all relative hover:scale-105"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-bold text-primary/80">
              {item.label}
            </span>
            {item.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
