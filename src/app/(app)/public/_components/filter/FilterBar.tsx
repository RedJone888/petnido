"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
export function FilterBar({ children }: { children?: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);
  return (
    <div className="w-full border-b border-border bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
        {/* 左侧：地区 / 国 搜索框 */}
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="地域または国を検索"
              className="pl-9"
              onChange={(e) => {
                handleSearch(e.target.value);
              }}
              defaultValue={searchParams.get("query")?.toString()}
            />
          </div>
        </div>

        {/* 右侧按钮插槽（slot） */}
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
