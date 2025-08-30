import { redirect } from 'next/navigation'
import { getAdminUser, hasAdminPermission } from '@/lib/admin-auth'
import { SubscriptionsClient } from './subscriptions-client'

export default async function SubscriptionsPage({ params }: { params: { locale: string } }) {
  const { locale } = await params
  const adminUser = await getAdminUser()
  
  if (!adminUser || !hasAdminPermission(adminUser, 'view_analytics')) {
    redirect(`/${locale}/auth/signin?message=admin-access-required`)
  }

  return <SubscriptionsClient />
}