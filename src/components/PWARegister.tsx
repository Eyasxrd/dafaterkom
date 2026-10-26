'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // Automatically unregister any cached service workers on localhost in development
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        })
        return
      }

      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Dafaterkom PWA ServiceWorker active:', reg.scope))
        .catch((err) => console.warn('PWA ServiceWorker registration failed:', err))
    }
  }, [])

  return null
}
