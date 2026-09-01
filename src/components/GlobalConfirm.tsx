"use client";
import cn from "@/lib/cn";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export function GlobalConfirm() {
  const { t } = useLanguage();
  const { isOpen, isDeleting, options, onConfirm, onCancel } =
    useConfirmStore();
  if (!isOpen || !options) return null;
  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[1200] bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200" />
        <AlertDialog.Content
          data-global-confirm
          className="fixed left-1/2 top-1/2 z-[1201] w-[min(92vw,29rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_28px_70px_-30px_rgba(15,23,42,0.5)] animate-in zoom-in-95 duration-200"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              {options.variant === "danger" ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-danger-border bg-[linear-gradient(145deg,#fff_0%,var(--color-danger-bg)_100%)] text-danger-action shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_9px_-7px_rgba(194,45,71,0.65)]">
                  <Trash2 className="h-[18px] w-[18px]" />
                </span>
              ) : null}
              <AlertDialog.Title className="text-xl font-bold leading-7 tracking-[-0.015em] text-slate-900">
                {options.title}
              </AlertDialog.Title>
            </div>

            <AlertDialog.Description asChild>
              <div
                className={cn(
                  "mt-1.5 py-2 text-sm leading-6 text-slate-600",
                  options.variant === "danger" && "pl-[46px] pr-2",
                )}
              >
                {options.content}
              </div>
            </AlertDialog.Description>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-[10px] px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                disabled={isDeleting}
                onClick={onCancel}
              >
                {options.cancelText ?? t.core.common.cancel}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  "inline-flex min-h-10 min-w-[96px] items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                  options.variant === "danger"
                    ? "bg-danger-action hover:bg-danger-hover"
                    : "button-primary-raised",
                )}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeleting ? t.core.common.loading : options.confirmText}
              </button>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
