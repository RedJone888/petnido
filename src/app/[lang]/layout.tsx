import FooterHome from "@/app/(home)/_components/FooterHome";
import { LocalizedPublicLayoutFrame } from "./_components/localized-public-layout-frame";

export default function LocalizedPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocalizedPublicLayoutFrame footer={<FooterHome />}>
      {children}
    </LocalizedPublicLayoutFrame>
  );
}
