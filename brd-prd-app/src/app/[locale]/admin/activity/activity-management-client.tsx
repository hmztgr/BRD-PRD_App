'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Users, 
  Shield, 
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Search,
  RefreshCw
} from 'lucide-react'
import { useApiRequest } from '@/hooks/useApiRequest'

interface ActivityLog {
  id: string
  action: string
  targetId?: string
  metadata?: any
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface ActivityResponse {
  activities: ActivityLog[]
  summary: {
    totalActivities: number
    todayActivities: number
    uniqueAdmins: number
    actionTypes: Record<string, number>
  }
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

export function ActivityManagementClient() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  
  const { data: activityData, loading, error, refetch } = useApiRequest<ActivityResponse>(
    `/api/admin/activity?page=${page}&limit=50${filter ? `&action=${filter}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'text-green-600 bg-green-50'
    if (action.includes('delete') || action.includes('remove')) return 'text-red-600 bg-red-50'
    if (action.includes('update') || action.includes('edit')) return 'text-blue-600 bg-blue-50'
    if (action.includes('login') || action.includes('auth')) return 'text-purple-600 bg-purple-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return Users
    if (action.includes('system') || action.includes('setting')) return Shield
    if (action.includes('error') || action.includes('fail')) return AlertTriangle
    return Activity
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading activity logs: {error}</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor system activity and user actions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {activityData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Activities</p>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{activityData.summary.totalActivities}</div>
              <p className="text-xs text-muted-foreground">All recorded actions</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Today's Activities</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{activityData.summary.todayActivities}</div>
              <p className="text-xs text-muted-foreground">Actions today</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Active Admins</p>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{activityData.summary.uniqueAdmins}</div>
              <p className="text-xs text-muted-foreground">Unique administrators</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Action Types</p>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{Object.keys(activityData.summary.actionTypes || {}).length}</div>
              <p className="text-xs text-muted-foreground">Different action types</p>
            </div>
          </Card>
        </div>
      )}

      {/* Activity Logs */}
      {activityData?.activities && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activityData.activities.map((activity) => {
                const IconComponent = getActionIcon(activity.action)
                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {activity.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(activity.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.admin.name || activity.admin.email}
                      </p>
                      {activity.metadata && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(activity.metadata, null, 2).substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Pagination */}
            {activityData.pagination && activityData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {activityData.pagination.page} of {activityData.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= activityData.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}