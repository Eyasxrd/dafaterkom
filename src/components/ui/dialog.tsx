import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const Dialog = ({ open, onOpenChange, children, className }: DialogProps) => {
  if (!open) return null
  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto", className)}>
      <div 
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={() => onOpenChange?.(false)} 
      />
      {children}
    </div>
  )
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  DialogTriggerProps
>(({ children, asChild = false, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      ref
    })
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative z-50 w-full mx-auto glass-panel rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 p-6 transition-all", className)}>
    {children}
  </div>
)

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mb-4", className)}>{children}</div>
)

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
)

const DialogDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-sm text-slate-500 dark:text-slate-400", className)}>{children}</p>
)

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2", className)}>{children}</div>
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
