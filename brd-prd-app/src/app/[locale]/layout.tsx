import React, { ReactNode, use } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { SimpleHeader } from '@/components/layout/simple-header';
import { AuthProvider } from '@/components/providers/session-provider';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { Toaster } from '@/components/ui/toaster';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import enMessages from '../../../messages/en.json';
import arMessages from '../../../messages/ar.json';


type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return {
    title: locale === 'ar' ? 'منشئ متطلبات المشاريع - إنشاء مستندات الأعمال باستخدام الذكاء الاصطناعي' : 'BRD/PRD Generator - AI-Powered Business Document Creation',
    description: locale === 'ar' ? 'إنشاء مستندات الأعمال باستخدام الذكاء الاصطناعي' : 'Create professional Business Requirements Documents (BRDs) and Product Requirements Documents (PRDs) with AI assistance. Supports Arabic and English with cultural awareness.'
  };
}

export default function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = use(params);
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages based on locale
  const messages = locale === 'ar' ? arMessages : enMessages;

  return (
    <AuthProvider>
      <SimpleHeader locale={locale} />
      <main className="min-h-screen">
        {children}
      </main>
      <FeedbackButton 
        locale={locale}
        variant="floating"
        size="md"
      />
      <Toaster />
    </AuthProvider>
  );
}