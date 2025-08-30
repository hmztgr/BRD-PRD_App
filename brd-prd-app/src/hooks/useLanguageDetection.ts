'use client'

import { useState, useEffect } from 'react';

interface GeolocationData {
  country: string;
  countryCode: string;
  language?: string;
}

// Arabic-speaking countries (focus on Saudi Arabia and region)
const ARABIC_COUNTRIES = [
  'SA', // Saudi Arabia
  'AE', // UAE
  'KW', // Kuwait
  'QA', // Qatar
  'BH', // Bahrain
  'OM', // Oman
  'JO', // Jordan
  'LB', // Lebanon
  'SY', // Syria
  'IQ', // Iraq
  'EG', // Egypt
  'LY', // Libya
  'TN', // Tunisia
  'DZ', // Algeria
  'MA', // Morocco
  'SD', // Sudan
  'YE', // Yemen
];

export function useLanguageDetection() {
  const [detectedLanguage, setDetectedLanguage] = useState<'en' | 'ar'>('en');
  const [isDetecting, setIsDetecting] = useState(true);
  const [userLocation, setUserLocation] = useState<GeolocationData | null>(null);

  useEffect(() => {
    const detectLanguage = async () => {
      try {
        // 1. Check if user has a saved preference
        const savedLanguage = localStorage.getItem('preferred-language') as 'en' | 'ar';
        if (savedLanguage) {
          setDetectedLanguage(savedLanguage);
          setIsDetecting(false);
          return;
        }

        // 2. Try geolocation detection for Saudi users
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false,
                maximumAge: 300000 // 5 minutes
              });
            });

            // Use a geolocation API to get country information
            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
            
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              const countryCode = geoData.countryCode;
              
              setUserLocation({
                country: geoData.countryName,
                countryCode: countryCode,
              });

              // If user is in an Arabic-speaking country, default to Arabic
              if (ARABIC_COUNTRIES.includes(countryCode)) {
                setDetectedLanguage('ar');
                setIsDetecting(false);
                return;
              }
            }
          } catch {
            console.log('Geolocation failed, trying browser locale detection');
          }
        }

        // 3. Fallback to browser language detection
        const browserLanguages = navigator.languages || [navigator.language];
        
        for (const lang of browserLanguages) {
          const langCode = lang.toLowerCase();
          
          // Check for Arabic language codes
          if (langCode.startsWith('ar') || langCode.includes('arab')) {
            setDetectedLanguage('ar');
            setIsDetecting(false);
            return;
          }
        }

        // 4. Check for RTL script direction preference
        const isRTL = document.dir === 'rtl' || 
                     document.documentElement.dir === 'rtl' ||
                     getComputedStyle(document.documentElement).direction === 'rtl';
        
        if (isRTL) {
          setDetectedLanguage('ar');
        }

      } catch (error) {
        console.error('Language detection failed:', error);
      } finally {
        setIsDetecting(false);
      }
    };

    detectLanguage();
  }, []);

  const setLanguagePreference = (language: 'en' | 'ar') => {
    setDetectedLanguage(language);
    localStorage.setItem('preferred-language', language);
    
    // Update document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  };

  const isSaudiUser = userLocation?.countryCode === 'SA';
  
  return {
    detectedLanguage,
    isDetecting,
    userLocation,
    isSaudiUser,
    setLanguagePreference,
    isArabicCountry: userLocation ? ARABIC_COUNTRIES.includes(userLocation.countryCode) : false
  };
}