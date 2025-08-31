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
  ArrowDownRight
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

// Mock data types
interface RevenueData {
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  growth: number
  transactions: number
  averageOrderValue: number
  conversionRate: number
  recurringRevenue: number
  oneTimeRevenue: number
  refunds: number
  chargebacks: number
}

interface ChartData {
  month: string
  revenue: number
  transactions: number
  growth: number
}

interface TierRevenue {
  tier: string
  revenue: number
  users: number
  percentage: number
}

// Mock data
const mockRevenueData: RevenueData = {
  totalRevenue: 458325.50,
  monthlyRevenue: 12485.50,
  yearlyRevenue: 149826.00,
  growth: 18.5,
  transactions: 847,
  averageOrderValue: 14.75,
  conversionRate: 3.8,
  recurringRevenue: 11236.80,
  oneTimeRevenue: 1248.70,
  refunds: 326.40,
  chargebacks: 89.00
}

const mockChartData: ChartData[] = [
  { month: 'Jan', revenue: 8234, transactions: 523, growth: 12.3 },
  { month: 'Feb', revenue: 9456, transactions: 598, growth: 14.8 },
  { month: 'Mar', revenue: 10234, transactions: 645, growth: 8.2 },
  { month: 'Apr', revenue: 9876, transactions: 612, growth: -3.5 },
  { month: 'May', revenue: 11234, transactions: 687, growth: 13.7 },
  { month: 'Jun', revenue: 10987, transactions: 698, growth: -2.2 },
  { month: 'Jul', revenue: 12456, transactions: 745, growth: 13.4 },
  { month: 'Aug', revenue: 11890, transactions: 723, growth: -4.5 },
  { month: 'Sep', revenue: 13245, transactions: 798, growth: 11.4 },
  { month: 'Oct', revenue: 12987, transactions: 812, growth: -1.9 },
  { month: 'Nov', revenue: 14325, transactions: 845, growth: 10.3 },
  { month: 'Dec', revenue: 12485, transactions: 847, growth: -12.8 }
]

const mockTierRevenue: TierRevenue[] = [
  { tier: 'Enterprise', revenue: 5970, users: 30, percentage: 47.8 },
  { tier: 'Business', revenue: 2688, users: 160, percentage: 21.5 },
  { tier: 'Professional', revenue: 2376, users: 120, percentage: 19.0 },
  { tier: 'Hobby', revenue: 1451, users: 382, percentage: 11.6 },
  { tier: 'Free', revenue: 0, users: 523, percentage: 0 }
]

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981']

export function RevenueManagementClient() {
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData>(mockRevenueData)
  const [chartData, setChartData] = useState<ChartData[]>(mockChartData)
  const [tierRevenue, setTierRevenue] = useState<TierRevenue[]>(mockTierRevenue)
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

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

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Revenue Management</h1>
        <div className="flex gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-background"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <span className={`text-sm flex items-center ${revenueData.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {revenueData.growth > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {formatPercentage(revenueData.growth)}
            </span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(revenueData.monthlyRevenue)}</div>
          <p className="text-sm text-gray-400">Monthly Revenue</p>
        </Card>

        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-400">YTD</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(revenueData.yearlyRevenue)}</div>
          <p className="text-sm text-gray-400">Yearly Revenue</p>
        </Card>

        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <span className="text-sm text-green-500">+12.3%</span>
          </div>
          <div className="text-2xl font-bold text-white">{revenueData.transactions}</div>
          <p className="text-sm text-gray-400">Total Transactions</p>
        </Card>

        <Card className="p-6 bg-background border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Users className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-sm text-gray-400">AOV</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(revenueData.averageOrderValue)}</div>
          <p className="text-sm text-gray-400">Avg Order Value</p>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6 bg-background border-border mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="transactions" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue by Tier */}
        <Card className="p-6 bg-background border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Tier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierRevenue}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tier, percentage }) => `${tier}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {tierRevenue.map((entry, index) => (
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