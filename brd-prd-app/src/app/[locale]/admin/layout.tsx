import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { getAdminUser } from '@/lib/admin-auth'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function AdminLayoutWrapper({
  children,
  params
}: AdminLayoutWrapperProps) {
  // Await params as required by Next.js
  const { locale } = await params
  
  // Server-side admin authentication check
  const adminUser = await getAdminUser()
  
  if (!adminUser) {
    redirect(`/${locale}/auth/signin?message=admin-access-required`)
  }

  return (
    <AdminLayout locale={locale}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }>
        {children}
      </Suspense>
    </AdminLayout>
  )
}