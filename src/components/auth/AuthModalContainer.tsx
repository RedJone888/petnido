"use client";

import { useEffect, useState } from "react";
import AuthModalContent from "./AuthModalContent";
import { createPortal } from "react-dom";

export default function AuthModalContainer({ open }: { open: boolean }) {
  const [mounted, setMounted] = useState(false);
  // 只有在浏览器端运行后，mounted 才会变成 true
  useEffect(() => {
    setMounted(true);
  }, []);
  // 如果弹窗没开启，或者还没在客户端挂载好，直接不渲染
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-999">
      <AuthModalContent />
    </div>,
    document.body,
  );
}
