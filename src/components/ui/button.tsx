import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const variants = {
      default: "liquid-btn-primary font-semibold shadow-md active:scale-[0.98] transition-all duration-200",
      outline: "border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-100 shadow-sm active:scale-[0.98] transition-all duration-200",
      ghost: "hover:bg-slate-100/60 dark:hover:bg-white/[0.06] backdrop-blur-sm text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-all duration-200",
      destructive: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-500/25 active:scale-[0.98] transition-all duration-200"
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-6 text-base"
    }

    const classes = cn(
      "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
      variants[variant],
      sizes[size],
      className
    )

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement<any>, {
        className: cn(classes, (props.children as React.ReactElement<any>).props?.className),
        ...props,
        ref
      })
    }

    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
