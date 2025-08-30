import { redirect } from 'next/navigation'
import { getAdminUser, hasAdminPermission } from '@/lib/admin-auth'
import { FeedbackClient } from './feedback-client'

export default async function FeedbackPage({ params }: { params: { locale: string } }) {
  const { locale } = await params
  const adminUser = await getAdminUser()
  
  if (!adminUser || !hasAdminPermission(adminUser, 'manage_content')) {
    redirect(`/${locale}/auth/signin?message=admin-access-required`)
  }

  return <FeedbackClient />
}