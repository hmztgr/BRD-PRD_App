'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Filter,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useApiRequest } from '@/hooks/useApiRequest'

interface RevenueData {
  revenueData: Array<{
    month: string
    revenue: number
    newSubscriptions: number
    canceledSubscriptions: number
    activeSubscriptions: number
    mrr: number
    churnRate: number
  }>
  currentMetrics: {
    currentMonthRevenue: number
    totalActiveSubscriptions: number
    totalLifetimeRevenue: number
    avgRevenuePerUser: number
    revenueGrowth: number
    subscriptionGrowth: number
  }
  subscriptionTiers: Array<{
    tier: string
    count: number
    estimatedMRR: number
  }>
  paymentTrends: {
    totalPayments: number
    averagePayment: number
    currencyBreakdown: Record<string, number>
  }
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981']

export function RevenueManagementClient() {
  const [dateRange, setDateRange] = useState('12') // months
  const [refreshing, setRefreshing] = useState(false)
  
  const { data: revenueData, loading, error, refetch } = useApiRequest<RevenueData>(
    `/api/admin/analytics/revenue/overview?months=${dateRange}`
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading revenue data: {error}</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!revenueData) return null

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Revenue Management</h1>
          <p className="text-muted-foreground">Track revenue, subscriptions, and financial performance</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-background"
          >
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="24">Last 24 Months</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <span className={`text-sm flex items-center ${
              revenueData.currentMetrics.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {revenueData.currentMetrics.revenueGrowth > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {formatPercentage(revenueData.currentMetrics.revenueGrowth)}
            </span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(revenueData.currentMetrics.currentMonthRevenue)}</div>
          <p className="text-sm text-muted-foreground">Current Month Revenue</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(revenueData.currentMetrics.totalLifetimeRevenue)}</div>
          <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <span className={`text-sm flex items-center ${
              revenueData.currentMetrics.subscriptionGrowth > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {revenueData.currentMetrics.subscriptionGrowth > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {formatPercentage(revenueData.currentMetrics.subscriptionGrowth)}
            </span>
          </div>
          <div className="text-2xl font-bold">{revenueData.currentMetrics.totalActiveSubscriptions}</div>
          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-sm text-muted-foreground">ARPU</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(revenueData.currentMetrics.avgRevenuePerUser)}</div>
          <p className="text-sm text-muted-foreground">Avg Revenue Per User</p>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={revenueData.revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="activeSubscriptions" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Active Subscriptions"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Subscription Tiers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Subscription Tiers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueData.subscriptionTiers}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tier, count }) => `${tier}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {revenueData.subscriptionTiers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="p-6 bg-background border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Recurring Revenue</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(revenueData.recurringRevenue)}</p>
              </div>
              <span className="text-green-500">89.9%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">One-time Revenue</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(revenueData.oneTimeRevenue)}</p>
              </div>
              <span className="text-blue-500">10.1%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Refunds</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(revenueData.refunds)}</p>
              </div>
              <span className="text-red-500">-2.6%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Chargebacks</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(revenueData.chargebacks)}</p>
              </div>
              <span className="text-red-500">-0.7%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-6 bg-background border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: '2025-01-31', customer: 'Ahmed Al-Rashid', plan: 'Professional', amount: 19.80, status: 'Completed' },
                { date: '2025-01-31', customer: 'Sara Abdullah', plan: 'Business', amount: 16.80, status: 'Completed' },
                { date: '2025-01-30', customer: 'Mohammed Hassan', plan: 'Enterprise', amount: 199.00, status: 'Completed' },
                { date: '2025-01-30', customer: 'Fatima Al-Zahrani', plan: 'Hobby', amount: 3.80, status: 'Completed' },
                { date: '2025-01-29', customer: 'Omar Khalil', plan: 'Professional', amount: 19.80, status: 'Refunded' },
              ].map((transaction, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-300">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{transaction.customer}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${transaction.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                        transaction.plan === 'Business' ? 'bg-blue-100 text-blue-800' :
                        transaction.plan === 'Professional' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {transaction.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{formatCurrency(transaction.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'Refunded' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}