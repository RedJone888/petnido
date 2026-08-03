import NavLinks from "./_components/nav-links";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#f6f7fb] h-full">
      <div className="mx-auto flex h-full max-w-7xl overflow-hidden md:py-2">
        <NavLinks />
        <main className="min-w-0 flex-1 md:px-4">
          <div className="h-full overflow-hidden bg-white md:rounded-xl md:shadow-[0px_0px_20px_rgba(15,23,42,0.08)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
