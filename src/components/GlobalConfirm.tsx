"use client";
import cn from "@/lib/cn";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useConfirmStore } from "@/store/useConfirmStore";
import { AlertTriangle, Loader2 } from "lucide-react";

export function GlobalConfirm() {
  const { isOpen, isDeleting, options, onConfirm, onCancel } =
    useConfirmStore();
  if (!isOpen || !options) return null;
  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-100 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-101 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-start">
            <div className="flex items-center justify-start gap-4">
              {options.variant === "danger" && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/50">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              )}
              <AlertDialog.Title className="text-xl font-bold text-slate-900 leading-tight">
                {options.title}
              </AlertDialog.Title>
            </div>

            <div className="mt-6 text-[15px] text-slate-500 leading-relaxed w-full">
              {options.content}
            </div>
          </div>
          <div className="mt-6 flex flex-row-reverse gap-3">
            <button
              onClick={onConfirm}
              className={cn(
                "min-w-[120px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-70 active:scale-95",
                options.variant === "danger"
                  ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-200",
              )}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "処理中..." : options.confirmText}
            </button>
            <button
              className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-50"
              disabled={isDeleting}
              onClick={onCancel}
            >
              キャンセル
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
