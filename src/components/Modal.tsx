"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  // 关闭模态框并导航回列表页的函数
  const onDismiss = () => {
    // 使用 router.back() 或 push('/') 到列表页
    router.back();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
      onClick={onDismiss}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl bg-white shadow-2xl rounded-xl flex flex-col"
        // 阻止点击模态框内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部（不滚动）：包含标题和关闭按钮 */}
        <div className="flex justify-end p-4 shrink-0">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10"
            aria-label="Close"
          >
            {/* 使用 Lucide icon 作为关闭按钮 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* 内容区（可滚动）：使用overflow-y-auto */}
        <div className="overflow-y-auto grow p-6">{children}</div>
      </div>
    </div>
  );
}
