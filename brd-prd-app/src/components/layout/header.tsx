'use client'

import React from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, FileText, Settings, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()

  // Extract current locale from pathname
  const currentLocale = pathname.startsWith('/ar') ? 'ar' : 'en'
  const isRTL = currentLocale === 'ar'

  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/${currentLocale}` })
  }

  const switchLanguage = (newLocale: 'ar' | 'en') => {
    const pathWithoutLocale = pathname.replace(/^\/(?:ar|en)/, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale}`
    router.push(newPath)
    
    // Update document direction
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLocale
    
    // Save preference
    localStorage.setItem('preferred-language', newLocale)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className={cn(
          "hidden md:flex",
          isRTL ? "ml-8" : "mr-8"
        )}>
          <Link 
            href={`/${currentLocale}`} 
            className={cn(
              "flex items-center",
              isRTL ? "ml-8 space-x-reverse space-x-2" : "mr-8 space-x-2"
            )}
          >
            <Logo variant="full" size="md" className="text-foreground" />
          </Link>
        </div>
        
        <div className={cn(
          "flex flex-1 items-center justify-between md:justify-end",
          isRTL ? "space-x-reverse space-x-2" : "space-x-2"
        )}>
          <nav className={cn(
            "flex items-center text-sm font-medium",
            isRTL ? "space-x-reverse space-x-6" : "space-x-6"
          )}>
            <Link
              href={`/${currentLocale}/dashboard`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {t('navigation.dashboard')}
            </Link>
            <Link
              href={`/${currentLocale}/documents`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {t('navigation.documents')}
            </Link>
            <Link
              href={`/${currentLocale}/templates`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {t('navigation.templates')}
            </Link>
          </nav>
          
          <div className={cn(
            "flex items-center",
            isRTL ? "space-x-reverse space-x-2" : "space-x-2"
          )}>
            {/* Language Switcher */}
            <div className={cn(
              "flex items-center border rounded-md",
              isRTL ? "space-x-reverse" : ""
            )}>
              <Button
                variant={currentLocale === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => switchLanguage('en')}
                className="text-xs px-2 py-1"
              >
                EN
              </Button>
              <Button
                variant={currentLocale === 'ar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => switchLanguage('ar')}
                className="text-xs px-2 py-1"
              >
                ع
              </Button>
            </div>

            {session?.user ? (
              <div className={cn(
                "flex items-center",
                isRTL ? "space-x-reverse space-x-2" : "space-x-2"
              )}>
                <Button variant="ghost" size="sm" className="text-white hover:text-gray-300" style={{ color: '#ffffff !important' }}>
                  <User className={cn(
                    "h-4 w-4 text-white",
                    isRTL ? "ml-2" : "mr-2"
                  )} />
                  <span style={{ color: '#ffffff !important' }}>{session.user.name || session.user.email}</span>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${currentLocale}/settings`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className={cn(
                "flex items-center",
                isRTL ? "space-x-reverse space-x-2" : "space-x-2"
              )}>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${currentLocale}/auth/signin`}>
                    {t('navigation.signIn')}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/${currentLocale}/auth/signup`}>
                    {t('navigation.signUp')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}