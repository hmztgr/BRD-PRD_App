import { Suspense } from 'react'
import { RevenueManagementClient } from './revenue-management-client'

export default function RevenuePage() {
  return (
    <Suspense fallback={<div>Loading revenue data...</div>}>
      <RevenueManagementClient />
    </Suspense>
  )
}