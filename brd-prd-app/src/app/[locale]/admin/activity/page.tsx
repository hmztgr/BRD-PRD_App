import { Suspense } from 'react'
import { ActivityManagementClient } from './activity-management-client'

export default function ActivityPage() {
  return (
    <Suspense fallback={<div>Loading activity logs...</div>}>
      <ActivityManagementClient />
    </Suspense>
  )
}