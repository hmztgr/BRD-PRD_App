import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminUser, hasAdminPermission } from '@/lib/admin-auth'
import { FeedbackManagementClient } from './feedback-management-client'

export const metadata: Metadata = {
  title: 'Feedback Management | Admin',
  description: 'Manage user feedback, suggestions, and support requests',
  robots: {
    index: false,
    follow: false
  }
}

interface FeedbackPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function FeedbackManagementPage({ params }: FeedbackPageProps) {
  const { locale } = await params
  
  // Check admin authentication
  const adminUser = await getAdminUser()
  if (!adminUser) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/feedback`)
  }

  // Check feedback management permission
  if (!hasAdminPermission(adminUser, 'manage_feedback')) {
    redirect(`/${locale}/admin?error=insufficient_permissions`)
  }

  return <FeedbackManagementClient />
}