import { Suspense } from 'react'
import { SystemManagementClient } from './system-management-client'

export default function SystemPage() {
  return (
    <Suspense fallback={<div>Loading system management...</div>}>
      <SystemManagementClient />
    </Suspense>
  )
}