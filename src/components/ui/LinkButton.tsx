"use client";
import Link from "next/link";
// import { variantsty } from "@/components/ui/Button";
import cn from "@/lib/cn";
type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variants;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;
export function LinkButton({
  href,
  children,
  className = "",
  variant = "primary",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center transition-all shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-hover",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
{
  /* <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center transition-all shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-hover",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    /> */
}
