import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Earth, Share2 } from "lucide-react";
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
    <footer className="bg-surface-container border-t border-outline-variant/30">
      <div className="flex flex-col md:flex-row justify-between items-start w-full py-16 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto">
        <div className="mb-12 md:mb-0">
          <div className="mb-6 flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="PetNido Logo"
              width={28}
              height={28}
              className="h-8 w-8"
            />
            <span className="text-headline-md font-bold text-primary">
              PetNido
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant max-w-xs mb-8">
            Connecting neighbors for a safer, happier pet community. Dedicated
            to personal care for all furry family members.
          </p>
          <Button
            href="/dashboard/needs/new"
            variant="primary"
            size="md"
            shape="pill"
          >
            Post Your Need
          </Button>
        </div>
        <div className="flex flex-wrap gap-12 md:gap-24">
          <FooterLinks
            title="Platform"
            links={["View All Needs", "View All Sitters", "Safety Measures"]}
          />
          <FooterLinks
            title="Support"
            links={["Help Center", "Community Guidelines", "Verification Info"]}
          />
          <div className="flex flex-col gap-4">
            <h6 className="font-bold text-primary">Follow Us</h6>
            <div className="flex gap-4 text-on-surface-variant">
              <Earth className="cursor-pointer hover:text-primary" />
              <Share2 className="cursor-pointer hover:text-primary" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-outline-variant/10 py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant text-sm max-w-container-max-width mx-auto text-center md:text-left">
        <p>© 2026 PetNido. All rights reserved.</p>
        <div className="flex gap-8">
          <a className="hover:text-primary" href="#">
            プライバシーポリシー
          </a>
          <a className="hover:text-primary" href="#">
            利用規約
          </a>
        </div>
      </div>
    </footer>
  );
}
function FooterLinks({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-primary">{title}</h3>
      {links.map((link) => (
        <Link
          key={link}
          href="#"
          className="text-on-surface-variant transition-all hover:text-primary"
        >
          {link}
        </Link>
      ))}
    </div>
  );
}
function test() {
  return (
    <footer className="border-t border-[rgba(204,195,216,0.3)] bg-[var(--hv2-surface-container)]">
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
      <div className="hv2-container flex flex-col items-start justify-between gap-12 py-16 md:flex-row">
        <div>
          <div className="mb-6 flex items-center gap-2">
            <img
              src="/favicon.svg"
              alt="PetNido Logo"
              className="h-8 w-8 rounded-lg"
            />
            <span className="text-2xl font-bold text-[var(--hv2-primary)]">
              PetNido
            </span>
          </div>
          <p className="hv2-body-md mb-8 max-w-xs">
            Connecting neighbors for a safer, happier pet community.
          </p>
          {/* <Link href="/dashboard/needs/new" className="hv2-footer-button">
              Post Your Need
            </Link> */}
          <Button variant="primary" size="md" shape="pill">
            Post Your Need
          </Button>
        </div>
        <div className="flex flex-wrap gap-12 md:gap-24">
          <FooterLinks
            title="Platform"
            links={["View All Needs", "View All Sitters", "Safety Measures"]}
          />
          <FooterLinks
            title="Support"
            links={["Help Center", "Community Guidelines", "Verification Info"]}
          />
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[var(--hv2-primary)]">Follow Us</h3>
            <div className="flex gap-4 text-[var(--hv2-on-surface-muted)]">
              {/* <Globe className="cursor-pointer hover:text-[var(--hv2-primary)]" /> */}
              <Share2 className="cursor-pointer hover:text-[var(--hv2-primary)]" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
{
  /* 
      <div
        class="border-t border-outline-variant/10 py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant font-body-md text-sm max-w-container-max-width mx-auto text-center md:text-left"
      >
        <p>© 2026 PetNido. All rights reserved.</p>
        <div class="flex gap-8">
          <a class="hover:text-primary" href="#">プライバシーポリシー</a>
          <a class="hover:text-primary" href="#">利用規約</a>
        </div>
      </div>
    </footer> */
}
