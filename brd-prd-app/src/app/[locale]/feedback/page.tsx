import React from 'react'
import { FeedbackPageClient } from './feedback-page-client'

interface FeedbackPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { locale } = await params;
  return <FeedbackPageClient locale={locale} />;
}