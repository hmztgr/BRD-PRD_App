import React from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { NewDocumentClient } from './new-document-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface NewDocumentPageProps {
  params: Promise<{ locale: string }>;
}

// Static translations
const translations = {
  en: {
    backToDashboard: 'Back to Dashboard',
    createNewDocument: 'Create New Document',
    standardDescription: 'Chat with our AI assistant to create comprehensive business document suites',
    advancedDescription: 'Advanced business planning with intelligent data gathering and multi-document generation',
    planningChat: 'Planning Chat',
    uploadDocs: 'Upload Docs',
    research: 'Research',
    progress: 'Progress',
    generate: 'Generate'
  },
  ar: {
    backToDashboard: 'العودة إلى لوحة التحكم',
    createNewDocument: 'إنشاء مستند جديد',
    standardDescription: 'تحدث مع مساعد الذكاء الاصطناعي لإنشاء مجموعات مستندات أعمال شاملة',
    advancedDescription: 'تخطيط أعمال متقدم مع جمع البيانات الذكي وإنشاء المستندات المتعددة',
    planningChat: 'محادثة التخطيط',
    uploadDocs: 'رفع المستندات',
    research: 'البحث',
    progress: 'التقدم',
    generate: 'إنشاء'
  }
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions)
  const t = translations[locale as keyof typeof translations] || translations.en;
  const isRTL = locale === 'ar';

  if (!session?.user) {
    redirect(`/${locale}/auth/signin`)
  }

  return (
    <div className="flex min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className={`w-64 border-r bg-gray-50/40 ${isRTL ? 'order-2' : ''}`}>
        <Sidebar />
      </aside>
      
      <main className="flex-1 overflow-hidden">
        {/* Breadcrumb */}
        <div className="p-6 pb-0">
          <Link 
            href={`/${locale}/dashboard`}
            className={`inline-flex items-center text-sm text-muted-foreground hover:text-primary ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-1 rotate-180' : 'mr-1'}`} />
            {t.backToDashboard}
          </Link>
        </div>

        {/* Client Component with all integrated features */}
        <NewDocumentClient
          userName={session.user.name || session.user.email || 'User'}
          locale={locale}
          translations={t}
          isRTL={isRTL}
        />
      </main>
    </div>
  )
}