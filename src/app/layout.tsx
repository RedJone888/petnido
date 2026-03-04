import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { GlobalConfirm } from "@/components/GlobalConfirm";
import { Metadata } from "next";
import { Providers } from "@/providers/Providers";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PetNido",
  description: "ペットシッターのマッチングサービス",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  // manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const [openAuth, setOpenAuth] = useState(false);
  // const handleCloseAuth = () => {
  //   localStorage.removeItem("authRedirect");
  //   setOpenAuth(false);
  // };
  return (
    <html lang="ja">
      <body className={`flex flex-col ${inter.className} min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
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
