import Image from "next/image";
import Link from "next/link";
function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-gray-500">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="hover:text-primary hover:underline transition"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default function FooterHome() {
  return (
    <footer className="w-full bg-gray-50 border-t border-border py-6 text-gray-600">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 py-8">
        {/* Brand */}
        <div className="-mt-2">
          <h3 className="flex items-center gap-2 mb-3">
            <Image src="/favicon.svg" alt="logo" width={28} height={28} />
            <span className="text-2xl font-bold text-primary tracking-wider">
              PetNido
            </span>
          </h3>
          <p className="text-gray-500 leading-relaxed text-sm px-2">
            ペットと人がやさしくつながる、 あたたかいコミュニティを目指して
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 col-span-2">
          <FooterCol
            title="サービス"
            items={[
              { href: "/public/browse/needs", label: "お世話の依頼を見る" },
              { href: "/public/browse/sitters", label: "シッターを探す" },
              { href: "/dashboard", label: "マイページ" },
            ]}
          />

          <FooterCol
            title="PetNidoについて"
            items={[
              { href: "/", label: "ホーム" },
              { href: "#thought", label: "私たちの思い" },
              { href: "#question", label: "よくある質問" },
            ]}
          />

          <FooterCol
            title="サポート"
            items={[
              { href: "#inquiry", label: "お問い合わせ" },
              { href: "#rules", label: "利用規約" },
              { href: "#policy", label: "プライバシーポリシー" },
            ]}
          />
        </div>
      </div>

      <div className="text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} PetNido — ペットと人がつながる場所
      </div>
    </footer>
  );
}
