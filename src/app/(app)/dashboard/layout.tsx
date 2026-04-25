import NavLinks from "./_components/nav-links";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#f6f7fb] h-full">
      <div className="max-w-7xl mx-auto h-full overflow-hidden py-2 flex">
        <NavLinks />
        <main className="flex-1 px-4">
          <div className="overflow-hidden h-full bg-white rounded-xl shadow-[0px_0px_20px_rgba(15,23,42,0.08)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
