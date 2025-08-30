import { redirect } from 'next/navigation'
import { getAdminUser, hasAdminPermission } from '@/lib/admin-auth'
import { SettingsClient } from './settings-client'

export default async function SettingsPage({ params }: { params: { locale: string } }) {
  const { locale } = await params
  const adminUser = await getAdminUser()
  
  if (!adminUser || !hasAdminPermission(adminUser, 'manage_settings')) {
    redirect(`/${locale}/auth/signin?message=admin-access-required`)
  }

  return <SettingsClient />
}