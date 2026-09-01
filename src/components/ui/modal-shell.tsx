"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type {
  FormEventHandler,
  Ref,
  ReactNode,
} from "react";

import cn from "@/lib/cn";

type ModalShellProps = {
  title: ReactNode;
  closeLabel: string;
  cancelLabel: string;
  saveLabel?: string;
  savingLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  saveVariant?: "primary" | "danger";
  showSave?: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  titleId?: string;
  panelRef?: Ref<HTMLDivElement>;
  panelClassName?: string;
  bodyClassName?: string;
  overlayClassName?: string;
};

const panelClass =
  "relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl";

export function ModalShell({
  title,
  closeLabel,
  cancelLabel,
  saveLabel,
  savingLabel = "…",
  saving = false,
  saveDisabled = false,
  saveVariant = "primary",
  showSave = true,
  onClose,
  onCancel,
  onSave,
  onSubmit,
  children,
  titleId,
  panelRef,
  panelClassName,
  bodyClassName,
  overlayClassName,
}: ModalShellProps) {
  const content = (
    <>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <h2
          id={titleId}
          className="min-w-0 truncate text-xl font-bold tracking-[-0.02em] text-slate-900"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6",
          bodyClassName,
        )}
      >
        {children}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onCancel ?? onClose}
          className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {cancelLabel}
        </button>
        {showSave ? (
          <button
            type={onSubmit ? "submit" : "button"}
            onClick={onSubmit ? undefined : onSave}
            disabled={saving || saveDisabled}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-5 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              saveVariant === "danger"
                ? "bg-danger-action hover:bg-danger-hover"
                : "button-primary-raised",
            )}
          >
            {saving ? savingLabel : saveLabel}
          </button>
        ) : null}
      </footer>
    </>
  );

  const dialog = (
    <div
      className={cn(
        "fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6",
        overlayClassName,
      )}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={titleId ? undefined : String(title)}
        className={cn(panelClass, panelClassName)}
      >
        {onSubmit ? (
          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            {content}
          </form>
        ) : (
          content
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(dialog, document.body)
    : null;
}
