'use client'

import * as React from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`peer h-4 w-4 shrink-0 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors ${
        checked ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-600' : ''
      } ${className}`}
    >
      {checked && <Check className="h-3 w-3 text-white stroke-[3]" />}
    </button>
  )
}
