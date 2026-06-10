"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "warning" | "ghost";
type Size = "sm" | "md";

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
  secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
  destructive: "bg-red-600 hover:bg-red-500 text-white",
  warning: "bg-amber-600 hover:bg-amber-500 text-white",
  ghost: "bg-sky-600 hover:bg-sky-500 text-white",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
