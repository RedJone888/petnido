import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GlobalConfirm } from "@/components/GlobalConfirm";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PetNido",
  description: "ペットシッターのマッチングサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`flex flex-col ${inter.className}`} data-layout="app">
        <Providers>
          <Navbar />
          <main id="__main-content" className="flex-1">
            {children}
            <GlobalConfirm />
          </main>
          <Footer />
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
