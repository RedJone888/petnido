import "./globals.css";
import { Toaster } from "sonner";
import SiteChrome from "./_components/SiteChrome";
import { GlobalConfirm } from "@/components/GlobalConfirm";
import { Metadata } from "next";
import { Providers } from "@/components/providers/Providers";
import { inter, kiwiMaru, plusJakarta } from "@/components/fonts";
import { cookies } from "next/headers";
import { validationProfileCookie, validationProfileEnabled } from "@/server/validation/profile-session";
import { auth } from "@/modules/auth";
import type { Session } from "next-auth";
export const metadata: Metadata = {
  title: "PetNido",
  description: "ペットのお世話依頼を作成・閲覧できる開発プレビュー。サービス出品・応募・チャットは開発中です。",
  // icons: {
  //   icon: [
  //     { url: "/favicon.ico" },
  //     { url: "/favicon.svg", type: "image/svg+xml" },
  //   ],
  //   apple: [{ url: "/apple-touch-icon.png" }],
  // },
  // manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const validationCookie = (await cookies()).get(validationProfileCookie)?.value;
  const validationProfileSession = validationProfileEnabled() && validationCookie === process.env.VALIDATION_TEST_TOKEN;
  const initialSession: Session | null = validationProfileSession
    ? {
        user: {
          id: "validation-profile-user",
          email: "profile-e2e@petnido.invalid",
          name: "Profile E2E",
        },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }
    : await auth();
  // const [openAuth, setOpenAuth] = useState(false);
  // const handleCloseAuth = () => {
  //   localStorage.removeItem("authRedirect");
  //   setOpenAuth(false);
  // };
  return (
    <html lang="en">
      <body
        // ${kiwiMaru.className}
        className={`bg-background text-on-background overflow-x-hidden flex flex-col ${plusJakarta.variable} font-sans antialiased min-h-screen`}
      >
        <Providers initialSession={initialSession}>
          <SiteChrome>{children}</SiteChrome>
          {/* 全局层组件 */}
          <GlobalConfirm />
          <Toaster
            richColors
            position="top-center"
            // toastOptions={{
            //   className: "bg-[var(--purple1)]",
            // }}
          />
        </Providers>
      </body>
    </html>
  );
}
