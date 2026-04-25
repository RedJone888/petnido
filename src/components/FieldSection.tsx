import cn from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
type Props = {
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  right?: React.ReactNode;
  contentClassName?: string;
};
export default function FieldSection({
  icon: Icon,
  title,
  description,
  children,
  className = "",
  headerClassName = "",
  iconClassName = "",
  titleClassName = "",
  right,
  contentClassName = "",
}: Props) {
  return (
    <section className={cn(className)}>
      {(Icon || title || description || right) && (
        <div
          className={cn("flex items-end justify-between mb-3", headerClassName)}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon
                  className={cn(
                    "h-4 w-4 text-secondary shrink-0",
                    iconClassName,
                  )}
                />
              )}
              {title && (
                <span
                  className={cn(
                    "text-sm font-semibold tracking-wide text-gray-700",
                    titleClassName,
                  )}
                >
                  {title}
                </span>
              )}
            </div>
            {description && <div className="mt-1 ml-4 px-1">{description}</div>}
          </div>

          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}

      <div className={cn("space-y-3 pl-6", contentClassName)}>{children}</div>
    </section>
  );
}
