import React from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
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
    description: 'Chat with our AI assistant to create professional business documents'
  },
  ar: {
    backToDashboard: 'العودة إلى لوحة التحكم',
    createNewDocument: 'إنشاء مستند جديد',
    description: 'تحدث مع مساعد الذكاء الاصطناعي لإنشاء مستندات أعمال احترافية'
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
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              href={`/${locale}/dashboard`}
              className={`inline-flex items-center text-sm text-muted-foreground hover:text-primary ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-1 rotate-180' : 'mr-1'}`} />
              {t.backToDashboard}
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t.createNewDocument}</h1>
            <p className="text-muted-foreground mt-2">
              {t.description}
            </p>
          </div>

          {/* Chat Interface */}
          <ChatInterface userName={session.user.name || session.user.email || 'User'} locale={locale} />
        </div>
      </main>
    </div>
  )
}