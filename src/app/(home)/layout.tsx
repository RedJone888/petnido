import FooterHome from "./_components/FooterHome";
import { LocalizedPublicLayoutFrame } from "@/app/[lang]/_components/localized-public-layout-frame";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocalizedPublicLayoutFrame footer={<FooterHome />}>
      {children}
    </LocalizedPublicLayoutFrame>
  );
}
