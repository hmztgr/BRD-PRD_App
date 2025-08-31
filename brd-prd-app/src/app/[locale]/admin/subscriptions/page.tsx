import { Suspense } from 'react'
import { SubscriptionsManagementClient } from './subscriptions-management-client'

interface SubscriptionsPageProps {
  params: Promise<{ locale: string }>
}

export default async function SubscriptionsPage({ params }: SubscriptionsPageProps) {
  const { locale } = await params

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <SubscriptionsManagementClient locale={locale} />
    </Suspense>
  )
}