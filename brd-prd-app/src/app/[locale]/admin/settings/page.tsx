import { Suspense } from 'react'
import { SettingsManagementClient } from './settings-management-client'

interface SettingsPageProps {
  params: Promise<{ locale: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <SettingsManagementClient locale={locale} />
    </Suspense>
  )
}