import ClientLayout from "@/app/ClientLayout";
export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children};</ClientLayout>;
}
