import { Button } from "@/components/ui/button";
import Link from "next/link";
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  btnLabel?: string;
  href?: string;
  onAction?: () => void;
}
export default function EmptyState({
  icon,
  title,
  description,
  btnLabel,
  href,
  onAction,
}: EmptyStateProps) {
  console.log("btnLabel", btnLabel);
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-purple2">{icon}</div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h2>
      <p className="text-sm text-neutral-600 max-w-md mb-6">{description}</p>
      {btnLabel && href && (
        <Link
          href={href}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white"
        >
          {btnLabel}
        </Link>
      )}
      {btnLabel && onAction && (
        <Button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white"
        >
          {btnLabel}
        </Button>
      )}
    </div>
  );
}
