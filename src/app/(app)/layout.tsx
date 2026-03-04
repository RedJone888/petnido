import FooterSimple from "@/components/FooterSimple";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100vh-81px)] flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      <FooterSimple />
    </div>
  );
}
