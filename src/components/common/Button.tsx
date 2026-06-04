import { type ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

const variantStyles = {
  primary:
    "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 hover:shadow-brand-500/25",
  secondary:
    "bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700 hover:border-surface-600",
  danger:
    "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25",
  ghost:
    "bg-transparent hover:bg-surface-800 text-surface-400 hover:text-white",
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}