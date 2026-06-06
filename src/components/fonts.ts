import {
  Inter,
  Kosugi_Maru,
  Kiwi_Maru,
  Plus_Jakarta_Sans,
} from "next/font/google";
export const inter = Inter({ subsets: ["latin"] });
export const kosugiMaru = Kosugi_Maru({
  weight: ["400"],
  subsets: ["cyrillic"],
});
export const kiwiMaru = Kiwi_Maru({
  weight: ["400", "300", "500"],
  subsets: ["cyrillic"],
});

export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});
