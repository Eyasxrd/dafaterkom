'use client'

import React from 'react'
import {
  Leaf,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  Ban,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Star,
  Flame,
  Coffee,
  Truck,
  Smartphone,
  Calendar,
  Users,
  Wheat,
  Clock,
  Zap,
  Info
} from 'lucide-react'

export interface DietaryTagDef {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  bgClass: string
  textClass: string
  borderClass: string
  description?: string
}

export const DIETARY_TAGS: Record<string, DietaryTagDef> = {
  vegan: {
    id: 'vegan',
    label: 'Vegan',
    icon: Leaf,
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-500/30',
    description: '100% plant-based with zero animal derivatives'
  },
  vegetarian: {
    id: 'vegetarian',
    label: 'Vegetarian',
    icon: Sprout,
    bgClass: 'bg-green-500/10 dark:bg-green-500/20',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-500/30',
    description: 'Meat-free recipe containing dairy or plant ingredients'
  },
  gluten_free: {
    id: 'gluten_free',
    label: 'Gluten-Free',
    icon: ShieldCheck,
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-500/30',
    description: 'Contains no wheat, barley, rye, or gluten components'
  },
  halal: {
    id: 'halal',
    label: 'Halal',
    icon: CheckCircle2,
    bgClass: 'bg-teal-500/10 dark:bg-teal-500/20',
    textClass: 'text-teal-700 dark:text-teal-300',
    borderClass: 'border-teal-500/30',
    description: 'Prepared strictly according to Halal guidelines'
  },
  dairy_free: {
    id: 'dairy_free',
    label: 'Dairy-Free',
    icon: Ban,
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/20',
    textClass: 'text-sky-700 dark:text-sky-300',
    borderClass: 'border-sky-500/30',
    description: 'No milk, cream, cheese, or lactose content'
  },
  nut_free: {
    id: 'nut_free',
    label: 'Nut-Free',
    icon: ShieldAlert,
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    borderClass: 'border-indigo-500/30',
    description: 'Prepared without tree nuts or peanuts'
  },
  sugar_free: {
    id: 'sugar_free',
    label: 'Sugar-Free',
    icon: Zap,
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    borderClass: 'border-cyan-500/30',
    description: 'Naturally sweetened or zero added refined sugars'
  },
  organic: {
    id: 'organic',
    label: 'Organic',
    icon: SunMedium,
    bgClass: 'bg-lime-500/10 dark:bg-lime-500/20',
    textClass: 'text-lime-700 dark:text-lime-300',
    borderClass: 'border-lime-500/30',
    description: 'Made with certified organic ingredients'
  },
  bestseller: {
    id: 'bestseller',
    label: 'Bestseller',
    icon: Flame,
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/20',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-500/30',
    description: 'Most loved and frequently ordered'
  },
  chef_special: {
    id: 'chef_special',
    label: "Chef's Special",
    icon: Star,
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/20',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-500/30',
    description: 'Artisan handcrafted recipe curated by our executive chef'
  },
  new_item: {
    id: 'new_item',
    label: 'New',
    icon: Sparkles,
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-500/30',
    description: 'Fresh addition to our seasonal collection'
  }
}

export const MENU_CHANNELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  dine_in: {
    label: 'In-House Dine-In',
    icon: Coffee,
    color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
  },
  delivery: {
    label: 'Direct Delivery & Pickup',
    icon: Truck,
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  apps: {
    label: 'Delivery Apps',
    icon: Smartphone,
    color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'
  },
  seasonal: {
    label: 'Seasonal / Limited Time',
    icon: Calendar,
    color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
  },
  catering: {
    label: 'Catering & Events',
    icon: Users,
    color: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30'
  }
}

export default function DietaryBadge({
  tagKey,
  size = 'md',
  showLabel = true,
  className = ''
}: {
  tagKey: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}) {
  const def = DIETARY_TAGS[tagKey]
  if (!def) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
        <Info className="w-3 h-3" />
        {tagKey}
      </span>
    )
  }

  const IconComponent = def.icon
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  }[size]

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size]

  return (
    <span
      title={def.description || def.label}
      className={`inline-flex items-center font-bold rounded-full border shadow-xs transition-colors ${def.bgClass} ${def.textClass} ${def.borderClass} ${sizeClasses} ${className}`}
    >
      <IconComponent className={`${iconSizes} shrink-0`} />
      {showLabel && <span>{def.label}</span>}
    </span>
  )
}
