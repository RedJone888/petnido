import { FilterBar } from "@/components/browse/filter/FilterBar";

export function FilterSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-sm">
      <FilterBar>{children}</FilterBar>
    </div>
  );
}
export function ListSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 overflow-y-auto">
      {children}
    </div>
  );
}
