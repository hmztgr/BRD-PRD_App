import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminUser, hasAdminPermission } from '@/lib/admin-auth'
import { ContentManagementClient } from './content-management-client'

export const metadata: Metadata = {
  title: 'Content Management | Admin',
  description: 'Manage templates, content, and document generation settings',
  robots: {
    index: false,
    follow: false
  }
}

interface ContentPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function ContentManagementPage({ params }: ContentPageProps) {
  const { locale } = await params
  
  // Check admin authentication
  const adminUser = await getAdminUser()
  if (!adminUser) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/content`)
  }

  // Check content management permission
  if (!hasAdminPermission(adminUser, 'manage_content')) {
    redirect(`/${locale}/admin?error=insufficient_permissions`)
  }

  return <ContentManagementClient />
}