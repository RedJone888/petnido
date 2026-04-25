import cn from "@/lib/cn";
export default function PillButton({
  active,
  onClick,
  children,
  className,
  type,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
        active
          ? "bg-primary text-white shadow-sm"
          : "border border-border bg-white hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </button>
  );
}
