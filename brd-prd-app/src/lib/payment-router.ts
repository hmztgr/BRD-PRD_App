/**
 * Payment Router Logic
 * Routes payments to appropriate provider based on user location
 */

// Arabic-speaking countries that should use Moyasar (matches useLanguageDetection)
export const ARABIC_COUNTRIES = [
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

export type PaymentProvider = 'stripe' | 'moyasar';

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  currency: 'usd' | 'sar';
  locale: 'en' | 'ar';
  exchangeRate?: number; // USD to local currency
}

/**
 * Determine which payment provider to use based on country code
 */
export function getPaymentProvider(countryCode?: string): PaymentProviderConfig {
  // Default to Stripe for international users
  if (!countryCode) {
    return {
      provider: 'stripe',
      currency: 'usd', 
      locale: 'en',
    };
  }

  // Use Moyasar for Arabic countries
  if (ARABIC_COUNTRIES.includes(countryCode.toUpperCase())) {
    return {
      provider: 'moyasar',
      currency: 'sar',
      locale: 'ar',
      exchangeRate: 3.75, // 1 USD = 3.75 SAR
    };
  }

  // Default to Stripe for all other countries
  return {
    provider: 'stripe',
    currency: 'usd',
    locale: 'en',
  };
}

/**
 * Get payment provider from browser/client context
 */
export function getPaymentProviderFromBrowser(): PaymentProviderConfig {
  // Check localStorage for saved user location
  const savedLocation = typeof window !== 'undefined' 
    ? localStorage.getItem('user-location')
    : null;
    
  if (savedLocation) {
    try {
      const location = JSON.parse(savedLocation);
      return getPaymentProvider(location.countryCode);
    } catch {
      // Fall through to browser detection
    }
  }

  // Check browser language for Arabic preference
  if (typeof navigator !== 'undefined') {
    const browserLanguages = navigator.languages || [navigator.language];
    
    for (const lang of browserLanguages) {
      const langCode = lang.toLowerCase();
      if (langCode.startsWith('ar') || langCode.includes('arab')) {
        return {
          provider: 'moyasar',
          currency: 'sar',
          locale: 'ar',
          exchangeRate: 3.75,
        };
      }
    }
  }

  // Default to Stripe
  return {
    provider: 'stripe',
    currency: 'usd',
    locale: 'en',
  };
}

/**
 * Convert price between currencies
 */
export function convertPrice(
  amount: number,
  fromCurrency: 'usd' | 'sar',
  toCurrency: 'usd' | 'sar',
  exchangeRate: number = 3.75
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'usd' && toCurrency === 'sar') {
    return Math.round(amount * exchangeRate);
  }

  if (fromCurrency === 'sar' && toCurrency === 'usd') {
    return Math.round(amount / exchangeRate);
  }

  return amount;
}

/**
 * Get localized currency symbol
 */
export function getCurrencySymbol(currency: 'usd' | 'sar', locale: 'en' | 'ar' = 'en'): string {
  const symbols = {
    usd: { en: '$', ar: '$' },
    sar: { en: 'SAR', ar: 'ر.س.' }
  };
  
  return symbols[currency][locale];
}

/**
 * Format price with appropriate currency and locale
 */
export function formatPaymentPrice(
  amount: number, 
  config: PaymentProviderConfig
): string {
  const formatter = new Intl.NumberFormat(
    config.locale === 'ar' ? 'ar-SA' : 'en-US',
    {
      style: 'currency',
      currency: config.currency.toUpperCase(),
      minimumFractionDigits: 2,
    }
  );

  return formatter.format(amount);
}

/**
 * Get payment method logos for display
 */
export function getPaymentMethodLogos(provider: PaymentProvider): string[] {
  switch (provider) {
    case 'moyasar':
      return ['mada', 'visa', 'mastercard', 'applepay'];
    case 'stripe':
      return ['visa', 'mastercard', 'amex', 'applepay', 'googlepay'];
    default:
      return ['visa', 'mastercard'];
  }
}

/**
 * Get payment provider display name
 */
export function getPaymentProviderName(provider: PaymentProvider, locale: 'en' | 'ar' = 'en'): string {
  const names = {
    stripe: { en: 'International Payment', ar: 'دفع دولي' },
    moyasar: { en: 'Local Payment', ar: 'دفع محلي' }
  };
  
  return names[provider][locale];
}