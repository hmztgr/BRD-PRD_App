'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  CreditCard, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Plus,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react'

interface DashboardMetrics {
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  documentsGenerated: number
  newUsersToday: number
  revenueGrowth: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  recentActivities: Array<{
    id: string
    action: string
    user: string
    timestamp: string
    type: 'user' | 'system' | 'revenue'
  }>
}

export function AdminDashboardClient() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [fallbackMode, setFallbackMode] = useState(false)
  const { data: session } = useSession()

  const getFallbackMetrics = (): DashboardMetrics => ({
    totalUsers: 1,
    activeSubscriptions: 1,
    totalRevenue: 0,
    documentsGenerated: 0,
    newUsersToday: 0,
    revenueGrowth: 0,
    systemHealth: 'warning' as const,
    recentActivities: [
      {
        id: '1',
        action: 'Emergency admin mode activated',
        user: 'System',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system' as const
      },
      {
        id: '2',
        action: 'Fallback authentication enabled',
        user: 'Emergency Admin',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system' as const
      }
    ]
  })

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
          setFallbackMode(false)
        } else {
          console.error('Failed to fetch dashboard metrics:', response.statusText)
          console.log('Using fallback mode due to API failure')
          setMetrics(getFallbackMetrics())
          setFallbackMode(true)
        }
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error)
        console.log('Using fallback mode due to network error')
        setMetrics(getFallbackMetrics())
        setFallbackMode(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardMetrics()
  }, [])

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Healthy
        </Badge>
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      case 'critical':
        return <Badge variant="outline" className="text-red-600 border-red-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      default:
        return null
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'revenue':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'system':
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            {fallbackMode && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <Shield className="h-3 w-3 mr-1" />
                Emergency Mode
              </Badge>
            )}
            {(session?.user as any)?.isFallbackUser && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Shield className="h-3 w-3 mr-1" />
                Fallback User
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {fallbackMode 
              ? 'Emergency admin mode - database connectivity issues detected'
              : 'Overview of your application\'s performance and user activity'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {getHealthBadge(metrics.systemHealth)}
          <Button>
            <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold text-foreground">{metrics.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">
                +{metrics.newUsersToday} today
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.activeSubscriptions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round((metrics.activeSubscriptions / metrics.totalUsers) * 100)}% conversion
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{metrics.revenueGrowth}% this month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents Generated</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.documentsGenerated.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round(metrics.documentsGenerated / metrics.totalUsers)} avg per user
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {metrics.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.user}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              Manage Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              View Subscriptions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              System Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              Content Management
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}