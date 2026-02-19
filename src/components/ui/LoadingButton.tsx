import { Button, type ButtonProps } from "@/components/ui/Button";
import cn from "@/lib/cn";
type loadingButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
  disabledText?: string;
};
export function LoadingButton({
  loading,
  loadingText = "処理中...",
  children,
  className,
  disabled,
  disabledText,
  ...props
}: loadingButtonProps) {
  return (
    <Button
      className={cn("px-6 py-2.5 rounded-xl", className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="flex justify-center items-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{loadingText}</span>
        </div>
      ) : (
        <span>{disabled && disabledText ? disabledText : children}</span>
      )}
    </Button>
  );
}
