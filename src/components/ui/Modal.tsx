import { Loader2, X } from "lucide-react";
type Props = {
  isSitter: boolean;
  title: string;
  closeText?: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
  children: React.ReactNode;
  isProcessing?: boolean;
};
export default function Modal({
  isSitter,
  title,
  closeText = "キャンセル",
  confirmText = "保存",
  onConfirm,
  onClose,
  children,
  isProcessing = false,
}: Props) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
        <div className="w-full sm:max-w-2xl rounded-3xl bg-white shadow-xl border border-border overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-5 sm:px-6 py-5 max-h-[75vh] overflow-auto">
            {!isSitter && (
              <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
                現在、受付は停止中です。
                編集した内容は保存されますが、検索結果には表示されません。
              </div>
            )}
            {children}
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-border bg-muted/20 flex justify-between items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-full border px-4 py-2 text-sm border-border hover:bg-muted/40"
              disabled={isProcessing}
            >
              {closeText}
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 rounded-full bg-primary text-white px-6 py-2 text-sm transition-colors disabled:opacity-70 hover:opacity-90"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessing ? "処理中..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
