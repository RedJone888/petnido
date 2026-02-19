"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  if (!isHome) {
    return (
      <footer className="bg-background text-center text-xs text-neutral-400 py-4 border-t border-border">
        © 2025 PetNido
      </footer>
    );
  }
  return (
    <footer className="w-full bg-gray-50 border-t border-border py-14 text-gray-600">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div>
          <h3 className="text-2xl font-semibold text-primary mb-3">PetNido</h3>
          <p class-time="text-gray-500 leading-relaxed">
            ペットと人がやさしくつながる、 あたたかいコミュニティを目指して。
          </p>
        </div>

        {/* Column 1 */}
        <FooterCol
          title="サービス"
          items={[
            { href: "/public/browse/needs", label: "お世話の依頼を見る" },
            { href: "/public/browse/sitters", label: "シッターを探す" },
            { href: "/dashboard", label: "マイページ" },
          ]}
        />

        {/* Column 2 */}
        <FooterCol
          title="PetNido について"
          items={[
            { href: "/", label: "ホーム" },
            { href: "#", label: "私たちの思い" },
            { href: "#", label: "よくある質問" },
          ]}
        />

        {/* Column 3 */}
        <FooterCol
          title="サポート"
          items={[
            { href: "#", label: "お問い合わせ" },
            { href: "#", label: "利用規約" },
            { href: "#", label: "プライバシーポリシー" },
          ]}
        />
      </div>

      <div className="text-center text-gray-400 text-sm mt-12">
        © {new Date().getFullYear()} PetNido — ペットと人がつながる場所
      </div>
    </footer>
  );
}

/* ------------ Small Footer Column Component ------------ */

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="hover:text-primary-hover hover:underline transition"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
