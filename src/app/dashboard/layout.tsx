import DashboardShell from "@/components/dashboard/DashboardShell";
import ClientLayout from "../ClientLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <DashboardShell>{children}</DashboardShell>
    </ClientLayout>
  );
}
