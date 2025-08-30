'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguageDetection } from '@/hooks/useLanguageDetection';

interface LanguageContextType {
  language: 'en' | 'ar';
  isRTL: boolean;
  isSaudiUser: boolean;
  isDetecting: boolean;
  switchLanguage: (newLanguage: 'en' | 'ar') => void;
  userLocation: { country: string; countryCode: string } | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    detectedLanguage, 
    isDetecting, 
    userLocation, 
    isSaudiUser, 
    setLanguagePreference 
  } = useLanguageDetection();

  const [language, setLanguage] = useState<'en' | 'ar'>(detectedLanguage);

  useEffect(() => {
    setLanguage(detectedLanguage);
  }, [detectedLanguage]);

  useEffect(() => {
    // Update document direction and language when language changes
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const switchLanguage = (newLanguage: 'en' | 'ar') => {
    setLanguage(newLanguage);
    setLanguagePreference(newLanguage);

    // Update URL to include locale prefix
    const currentPathWithoutLocale = pathname.replace(/^\/(?:en|ar)/, '') || '/';
    const newPath = `/${newLanguage}${currentPathWithoutLocale}`;
    
    // Navigate to new locale path
    router.push(newPath);
  };

  const value: LanguageContextType = {
    language,
    isRTL: language === 'ar',
    isSaudiUser,
    isDetecting,
    switchLanguage,
    userLocation
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}