import { Suspense } from 'react'
import { AccountManagementClient } from './account-management-client'

export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading account management...</div>}>
      <AccountManagementClient />
    </Suspense>
  )
}