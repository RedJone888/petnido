import FooterSimple from "./_components/FooterSimple";
import { AppLayoutFrame } from "./_components/app-layout-frame";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayoutFrame footer={<FooterSimple />}>{children}</AppLayoutFrame>
  );
}
