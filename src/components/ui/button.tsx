import Link from "next/link";
import { forwardRef } from "react";
import cn from "@/lib/cn";

const variantStyles = {
  primary: cn(
    "text-on-primary bg-primary",
    "shadow-lg hover:shadow-xl",
    "hover:scale-105 active:scale-95",
  ),
  secondary: cn(
    "bg-on-primary text-primary hover:bg-primary/5",
    "border-2 border-primary/10 shadow-lg ",
    "shadow-sm",
  ),
  solid: cn("bg-primary hover:bg-brand-700 text-on-primary", "shadow-xl"),
  danger: cn("bg-danger-text hover:bg-red-600 text-on-primary", "shadow-xl"),
  outline: cn(
    "border border-primary ",
    "bg-on-primary hover:bg-primary",
    "text-primary hover:text-on-primary",
  ),
  outlineMuted: cn(
    "border border-slate-200 hover:border-primary",
    "bg-on-primary",
    "text-slate-400 hover:text-primary",
  ),
  outlineDanger: cn(
    "border border-slate-200 hover:border-red-500",
    "bg-on-primary",
    "text-slate-400 hover:text-red-500",
  ),
  ghost: cn(
    "border border-transparent bg-transparent",
    "text-gray-500 hover:bg-brand-50 hover:text-primary",
  ),
  link: cn(
    "border border-transparent bg-transparent",
    "text-primary shadow-none gap-2 hover:gap-3",
  ),
  // Backward-compatible aliases. Prefer solid/outlineMuted/outlineDanger/link.
  outline1:
    "border border-slate-200 hover:border-primary bg-white text-slate-400 hover:text-primary",
  outline2:
    "border border-slate-200 hover:border-red-500 bg-white text-slate-400 hover:text-red-500",
  ghost1:
    "border border-transparent bg-transparent text-primary shadow-none gap-2 hover:gap-3",
  // Backward-compatible aliases. Prefer primary/secondary/outline/ghost/danger.
  outlineDark:
    "border border-primary bg-white text-primary hover:bg-primary hover:text-white",
  outlineLight:
    "border border-neutral-300 bg-white text-neutral-800 hover:border-primary hover:bg-brand-50 hover:text-primary",
  stepCancel:
    "border border-transparent bg-brand-50 text-primary shadow-brand-soft hover:bg-brand-100 hover:shadow-brand-strong",
};

const sizeStyles = {
  icon: "p-2 text-sm",
  sm: "px-3.5 py-2 text-sm",
  md: "px-6 py-2.5 text-md",
  lg: "px-8 py-4 text-md",
};

const shapeStyles = {
  default: "rounded-xl",
  pill: "rounded-full",
};

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;
export type ButtonShape = keyof typeof shapeStyles;

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonAsLink = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    disabled?: never;
    type?: never;
  };

export type ButtonProps = ButtonAsButton;
export type ButtonLinkProps = ButtonAsLink;

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonAsButton | ButtonAsLink
>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      shape = "default",
      ...props
    },
    ref,
  ) => {
    const baseClass = cn(
      "inline-flex items-center justify-center gap-2 transition-all",
      "font-bold duration-200 ease-out cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      sizeStyles[size],
      shapeStyles[shape],
      variantStyles[variant],
      className,
    );

    if ("href" in props) {
      return (
        <Link ref={ref as any} className={baseClass} {...(props as any)} />
      );
    }

    return <button ref={ref as any} className={baseClass} {...props} />;
  },
);

Button.displayName = "Button";
