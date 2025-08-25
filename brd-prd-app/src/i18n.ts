import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'ar'] as const;

export default getRequestConfig(async ({ locale }): Promise<{messages: Record<string, any>; timeZone: string}> => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as 'en' | 'ar')) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Riyadh' // Saudi Arabia timezone for better localization
  };
});