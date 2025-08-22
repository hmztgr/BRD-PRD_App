'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function DirectionProvider() {
  const pathname = usePathname()

  useEffect(() => {
    const isArabic = pathname.startsWith('/ar')
    const direction = isArabic ? 'rtl' : 'ltr'
    const language = isArabic ? 'ar' : 'en'

    // Update document attributes
    document.documentElement.dir = direction
    document.documentElement.lang = language
    
    // Add/remove Arabic font class
    if (isArabic) {
      document.documentElement.classList.add('font-arabic')
      document.body.classList.add('font-arabic')
    } else {
      document.documentElement.classList.remove('font-arabic')
      document.body.classList.remove('font-arabic')
    }
  }, [pathname])

  return null
}