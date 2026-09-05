'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Dafaterkom PWA ServiceWorker active:', reg.scope))
        .catch((err) => console.warn('PWA ServiceWorker registration failed:', err))
    }
  }, [])

  return null
}
