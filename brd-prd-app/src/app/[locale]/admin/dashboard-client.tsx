'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Settings,
  Shield,
  BarChart3,
  Clock
} from 'lucide-react'
import { Icons } from '@/components/ui/icons'

interface AdminDashboardProps {
  locale: string
  adminUser: {
    id: string
    name: string | null
    email: string
    role: string
    adminPermissions: string[]
  }
}

interface DashboardMetrics {
  totalUsers: number
  newUsersToday: number
  totalRevenue: number
  revenueGrowth: number
  activeSubscriptions: number
  pendingFeedback: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  recentActivities: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    user?: string
    status: string
  }>
}

export function AdminDashboardClient({ locale, adminUser }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    
    const fetchDashboardMetrics = async (signal: AbortSignal) => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard/metrics', { signal })
        if (!response.ok) throw new Error('Failed to fetch metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardMetrics(controller.signal)
    
    return () => {
      controller.abort()
    }
  }, [])

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return <Users className="h-4 w-4" />
      case 'payment': return <DollarSign className="h-4 w-4" />
      case 'feedback': return <MessageSquare className="h-4 w-4" />
      case 'system_alert': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-500">
          <AlertTriangle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
        <Button 
          onClick={fetchDashboardMetrics}
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </Card>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {adminUser.name || adminUser.email}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{adminUser.role}</span>
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.newUsersToday} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Subscription revenue stream
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className={`h-4 w-4 ${getHealthColor(metrics.systemHealth)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getHealthColor(metrics.systemHealth)}`}>
              {metrics.systemHealth}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest platform activities and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities</p>
              ) : (
                metrics.recentActivities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()} 
                        {activity.user && ` • by ${activity.user}`}
                      </p>
                    </div>
                    <Badge 
                      variant={activity.status === 'completed' ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="w-full">
                View all activities
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = `/${locale}/admin/users`}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = `/${locale}/admin/analytics`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = `/${locale}/admin/feedback`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Feedback
              {metrics.pendingFeedback > 0 && (
                <Badge className="ml-auto" variant="destructive">
                  {metrics.pendingFeedback}
                </Badge>
              )}
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = `/${locale}/admin/settings`}
            >
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>

            <div className="pt-2 border-t">
              <Button 
                className="w-full justify-start text-red-600" 
                variant="ghost"
                onClick={() => {
                  if (confirm('Are you sure you want to refresh the dashboard?')) {
                    fetchDashboardMetrics()
                  }
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications/Alerts */}
      {metrics.systemHealth !== 'healthy' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              System health is showing {metrics.systemHealth} status. 
              Please check system logs and monitoring tools.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}