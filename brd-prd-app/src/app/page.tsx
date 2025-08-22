import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Future use: List of Arabic-speaking countries for server-side detection
// const ARABIC_COUNTRIES = [
//   'SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 
//   'SY', 'IQ', 'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'YE'
// ];

async function detectLanguageFromHeaders(): Promise<'ar' | 'en'> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Check for Arabic language preference
  if (acceptLanguage.includes('ar')) {
    return 'ar';
  }
  
  // Default to English
  return 'en';
}

export default async function RootPage() {
  const detectedLanguage = await detectLanguageFromHeaders();
  
  // Redirect to the appropriate locale
  redirect(`/${detectedLanguage}`);
}