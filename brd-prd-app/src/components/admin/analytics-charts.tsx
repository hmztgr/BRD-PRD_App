'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import { Icons } from '@/components/ui/icons'

interface AnalyticsData {
  userGrowth: Array<{
    month: string
    totalUsers: number
    newUsers: number
    verifiedUsers: number
    subscribedUsers: number
    verificationRate: number
    conversionRate: number
  }>
  revenueData: Array<{
    month: string
    revenue: number
    subscriptions: number
    averageRevenue: number
  }>
  subscriptionDistribution: Array<{
    tier: string
    users: number
    revenue: number
    percentage: number
  }>
  usageMetrics: Array<{
    date: string
    apiCalls: number
    documentsGenerated: number
    tokensUsed: number
    activeUsers: number
  }>
  currentMetrics: {
    totalUsers: number
    monthlyRecurringRevenue: number
    churnRate: number
    averageLifetimeValue: number
    activeSubscriptions: number
    totalRevenue: number
  }
}

interface AnalyticsChartsProps {
  adminPermissions: string[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AnalyticsCharts({ adminPermissions }: AnalyticsChartsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('12') // months
  const [refreshing, setRefreshing] = useState(false)

  const hasPermission = (permission: string) => {
    return adminPermissions.includes(permission) || adminPermissions.includes('view_analytics')
  }

  const fetchAnalyticsData = async () => {
    if (!hasPermission('view_analytics')) {
      setError('Insufficient permissions to view analytics')
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      const [userGrowthRes, revenueRes, subscriptionRes, usageRes] = await Promise.all([
        fetch(`/api/admin/analytics/users/growth?months=${timeRange}`),
        fetch(`/api/admin/analytics/revenue/overview?months=${timeRange}`),
        fetch(`/api/admin/analytics/subscriptions/distribution`),
        fetch(`/api/admin/analytics/usage?months=${timeRange}`)
      ])

      if (!userGrowthRes.ok || !revenueRes.ok || !subscriptionRes.ok || !usageRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [userGrowthData, revenueData, subscriptionData, usageData] = await Promise.all([
        userGrowthRes.json(),
        revenueRes.json(),
        subscriptionRes.json(),
        usageRes.json()
      ])

      setData({
        userGrowth: userGrowthData.growthData,
        revenueData: revenueData.revenueData,
        subscriptionDistribution: subscriptionData.distribution,
        usageMetrics: usageData.usageData,
        currentMetrics: {
          ...userGrowthData.currentMetrics,
          ...revenueData.currentMetrics
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const exportData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?timeRange=${timeRange}`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to export data')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${timeRange}m-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-500">
          <Activity className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
        <Button 
          onClick={fetchAnalyticsData}
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </Card>
    )
  }

  if (!hasPermission('view_analytics')) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Activity className="h-8 w-8 mx-auto mb-2" />
          <p>You don't have permission to view analytics.</p>
        </div>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Business metrics and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={fetchAnalyticsData}
            disabled={refreshing}
          >
            {refreshing ? (
              <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.currentMetrics.totalRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.currentMetrics.monthlyRecurringRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.currentMetrics.activeSubscriptions?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Paying customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.currentMetrics.churnRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly churn rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Over Time</CardTitle>
                <CardDescription>
                  Monthly user registration and verification trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="totalUsers" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="Total Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
                <CardDescription>
                  Email verification and subscription conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, '']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="verificationRate" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Email Verification Rate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversionRate" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Subscription Conversion Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>
                  Monthly revenue and subscription trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [`$${value}`, name]} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Revenue Per User</CardTitle>
                <CardDescription>
                  Monthly ARPU trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Average Revenue']} />
                    <Bar dataKey="averageRevenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>
                  User distribution across subscription tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({tier, percentage}) => `${tier} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {data.subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier</CardTitle>
                <CardDescription>
                  Revenue contribution by subscription tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.subscriptionDistribution.map((tier, index) => (
                    <div key={tier.tier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{tier.tier}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${tier.revenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{tier.users} users</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: COLORS[index % COLORS.length],
                            width: `${tier.percentage}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Usage</CardTitle>
                <CardDescription>
                  Daily API calls and document generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.usageMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="apiCalls" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="API Calls"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="documentsGenerated" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Documents Generated"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>
                  Daily token consumption and active users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.usageMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tokensUsed" fill="#8884d8" name="Tokens Used" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Summary</span>
          </CardTitle>
          <CardDescription>
            Key performance indicators for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.userGrowth.reduce((sum, item) => sum + item.newUsers, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">New Users</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${data.revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.usageMetrics.reduce((sum, item) => sum + item.documentsGenerated, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Documents Generated</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {(data.usageMetrics.reduce((sum, item) => sum + item.tokensUsed, 0) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">Tokens Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}