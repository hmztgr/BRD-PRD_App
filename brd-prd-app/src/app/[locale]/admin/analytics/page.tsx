import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminUser, hasAdminPermission } from '@/lib/admin-auth'
import { AnalyticsCharts } from '@/components/admin/analytics-charts'

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  description: 'Business metrics, user analytics, and performance insights',
  robots: {
    index: false,
    follow: false
  }
}

interface AnalyticsPageProps {
  params: {
    locale: string
  }
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = params
  
  // Check admin authentication
  const adminUser = await getAdminUser()
  if (!adminUser) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/analytics`)
  }

  // Check analytics permission
  if (!hasAdminPermission(adminUser, 'view_analytics')) {
    redirect(`/${locale}/admin?error=insufficient_permissions`)
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <AnalyticsCharts adminPermissions={adminUser.adminPermissions} />
    </div>
  )
}