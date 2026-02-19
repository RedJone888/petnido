"use client";
import Link from "next/link";
import { forwardRef } from "react";
import cn from "@/lib/cn";
const variantStyles = {
  primary: cn(
    "text-white bg-linear-to-br from-secondary to-primary",
    "shadow-brand-soft hover:shadow-brand-strong",
    "duration-200 ease-out",
  ),
  // "bg-brand-600 hover:bg-brand-700 shadow-purple hover:shadow-purple-lg",
  // primary: [
  //   "shadow-[0_6px_18px_rgba(0,0,0,0.2)]",
  //   "duration-200 ease-out",
  //   "hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]",
  // ].join(" "),
  // primary: "bg-primary-hover text-primary-foreground hover:bg-primary",
  outlineDark: [
    "text-neutral-800",
    "bg-white",
    "border border-gray-300",
    "shadow-[0_6px_18px_rgba(0,0,0,0.2)]",
    "duration-200 ease-out",
    "hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]",
  ].join(" "),
  // outlineDark:
  //   "bg-white border border-btn-fore hover:bg-btn-hover text-btn-fore",
  outlineLight:
    "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50",
  ghost:
    "bg-transparent text-primary border border-purple1 hover:bg-neutral-100",
  stepCancel: [
    "text-primary",
    "bg-linear-to-br from-white to-neutral-100",
    "shadow-[0_6px_18px_rgba(0,0,0,0.2)]",
    "duration-200 ease-out",
    "hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]",
  ].join(" "),
};

type BaseProps = {
  variant?: keyof typeof variantStyles;
  className?: string;
  children: React.ReactNode;
};
type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type ButtonAsLink = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outlineDark" | "outlineLight" | "ghost" | "stepCancel";
};

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonAsButton | ButtonAsLink
>(({ className, variant = "primary", ...props }, ref) => {
  const baseClass = cn(
    "inline-flex items-center justify-center gap-2 transition-all",
    "rounded-xl py-2.5 px-6 text-sm font-bold",
    "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
    variantStyles[variant],
    className,
  );
  if ("href" in props) {
    return <Link className={baseClass} {...(props as any)} />;
  }
  return <button className={baseClass} {...props} />;
});

Button.displayName = "Button";
