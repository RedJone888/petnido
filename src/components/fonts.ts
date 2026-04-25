import { Inter, Kosugi_Maru, Kiwi_Maru } from "next/font/google";
export const inter = Inter({ subsets: ["latin"] });
export const kosugiMaru = Kosugi_Maru({
  weight: ["400"],
  subsets: ["cyrillic"],
});
export const kiwiMaru = Kiwi_Maru({
  weight: ["400", "300", "500"],
  subsets: ["cyrillic"],
});
