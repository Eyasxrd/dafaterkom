"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SelectContext = React.createContext<SelectContextType | null>(null)

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Select = ({ value, onValueChange, children, className }: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={containerRef} className={cn("relative", className)}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              value,
              isOpen,
              setIsOpen,
            })
          }
          return child
        })}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value?: string
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  onValueChange?: (value: string) => void
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  (
    {
      className,
      children,
      value: propValue,
      isOpen: propIsOpen,
      setIsOpen: propSetIsOpen,
      onValueChange: _onValueChange,
      onClick,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(SelectContext)
    const isOpen = propIsOpen ?? context?.isOpen ?? false
    const setIsOpen = propSetIsOpen ?? context?.setIsOpen
    const value = propValue ?? context?.value

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          setIsOpen?.(!isOpen)
          onClick?.(e)
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 px-3.5 py-2 text-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900/50 dark:text-gray-200",
          className
        )}
        {...props}
      >
        <div className="flex-1 text-left truncate">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { value })
            }
            return child
          })}
        </div>
        <svg className="w-4 h-4 ml-2 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps {
  children?: React.ReactNode
  value?: string
  placeholder?: string
}

const SelectValue = ({ children, value: propValue, placeholder }: SelectValueProps) => {
  const context = React.useContext(SelectContext)
  const value = propValue ?? context?.value

  if (value) {
    return <span>{children || value}</span>
  }
  return <span className="text-gray-400 dark:text-gray-500">{placeholder || children || "Select an option"}</span>
}

interface SelectContentProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
  className?: string
}

const SelectContent = ({
  children,
  value: propValue,
  onValueChange: propOnValueChange,
  isOpen: propIsOpen,
  setIsOpen: propSetIsOpen,
  className,
}: SelectContentProps) => {
  const context = React.useContext(SelectContext)
  const isOpen = propIsOpen ?? context?.isOpen ?? false
  const value = propValue ?? context?.value
  const onValueChange = propOnValueChange ?? context?.onValueChange
  const setIsOpen = propSetIsOpen ?? context?.setIsOpen

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "absolute z-50 w-full mt-1.5 glass-panel rounded-2xl shadow-2xl max-h-60 overflow-auto p-1.5 border border-white/50 dark:border-white/10",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onValueChange,
            setIsOpen,
            isSelected: value === (child.props as any).value,
          })
        }
        return child
      })}
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  onValueChange?: (value: string) => void
  setIsOpen?: (open: boolean) => void
  isSelected?: boolean
}

const SelectItem = ({
  value,
  children,
  onValueChange: propOnValueChange,
  setIsOpen: propSetIsOpen,
  isSelected: propIsSelected,
}: SelectItemProps) => {
  const context = React.useContext(SelectContext)
  const onValueChange = propOnValueChange ?? context?.onValueChange
  const setIsOpen = propSetIsOpen ?? context?.setIsOpen
  const isSelected = propIsSelected ?? context?.value === value

  const handleClick = () => {
    onValueChange?.(value)
    setIsOpen?.(false)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-2.5 text-sm font-medium outline-none transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400",
        isSelected && "bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400 font-semibold"
      )}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
