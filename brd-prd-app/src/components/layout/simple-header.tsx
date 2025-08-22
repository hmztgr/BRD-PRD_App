'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'

interface SimpleHeaderProps {
  locale: string;
}

export function SimpleHeader({ locale }: SimpleHeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isRTL = locale === 'ar';
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  
  // Get the current path without locale prefix
  const pathWithoutLocale = pathname.replace(`/${locale}`, '');
  
  // Generate the URL for the other locale
  const getLocaleUrl = (targetLocale: string) => {
    return `/${targetLocale}${pathWithoutLocale}`;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/${locale}` });
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className={isRTL ? "ml-4 hidden md:flex" : "mr-4 hidden md:flex"}>
          <Link href={`/${locale}`} className={isRTL ? "ml-6 flex items-center space-x-reverse space-x-2" : "mr-6 flex items-center space-x-2"}>
            <span className="hidden font-bold sm:inline-block">
              {locale === 'ar' ? 'منشئ متطلبات المشاريع' : 'BRD/PRD Generator'}
            </span>
          </Link>
        </div>
        
        <div className={`flex flex-1 items-center justify-between md:justify-end ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <nav className={`flex items-center text-sm font-medium ${isRTL ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
            <Link
              href={`/${locale}/dashboard`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <Link
              href={`/${locale}/documents`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {locale === 'ar' ? 'المستندات' : 'Documents'}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {locale === 'ar' ? 'الأسعار' : 'Pricing'}
            </Link>
            <Link
              href={`/${locale}/feedback`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {locale === 'ar' ? 'التقييمات' : 'Feedback'}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {locale === 'ar' ? 'تواصل معنا' : 'Contact'}
            </Link>
          </nav>
          
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
            {/* Language Switcher */}
            <div className="flex items-center border rounded-md">
              <Link
                href={getLocaleUrl('en')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  locale === 'en' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                EN
              </Link>
              <Link
                href={getLocaleUrl('ar')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  locale === 'ar' 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                ع
              </Link>
            </div>

            {/* Authentication Section */}
            {status === 'loading' ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              </div>
            ) : session ? (
              /* Authenticated User Menu */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block">{session.user?.name || session.user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showUserMenu && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50`}>
                    <div className="py-1">
                      <Link
                        href={`/${locale}/settings`}
                        className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {locale === 'ar' ? 'الإعدادات' : 'Settings'}
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleSignOut();
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not Authenticated - Show Sign In/Up Buttons */
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Link
                  href={`/${locale}/auth/signin`}
                  className="px-4 py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80"
                >
                  {locale === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}