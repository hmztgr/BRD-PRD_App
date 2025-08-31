'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { 
  CreditCard,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap
} from 'lucide-react'

interface SubscriptionsManagementClientProps {
  locale: string
}

interface UserSubscription {
  id: string
  userId: string
  email: string
  name: string
  tier: 'FREE' | 'HOBBY' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart: string
  currentPeriodEnd: string
  tokenUsage: number
  tokenLimit: number
  monthlyRevenue: number
  createdAt: string
}

interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  monthlyRevenue: number
  churnRate: number
  tierDistribution: { [key: string]: number }
  revenueGrowth: number
}

type TierFilter = 'ALL' | 'FREE' | 'HOBBY' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE'
type StatusFilter = 'ALL' | 'active' | 'canceled' | 'past_due' | 'trialing'

export function SubscriptionsManagementClient({ locale }: SubscriptionsManagementClientProps) {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Mock data for initial implementation
  const mockStats: SubscriptionStats = {
    totalSubscriptions: 847,
    activeSubscriptions: 723,
    monthlyRevenue: 12485,
    churnRate: 2.3,
    tierDistribution: {
      FREE: 523,
      HOBBY: 187,
      PROFESSIONAL: 89,
      BUSINESS: 38,
      ENTERPRISE: 10
    },
    revenueGrowth: 18.5
  }

  const mockSubscriptions: UserSubscription[] = [
    {
      id: '1',
      userId: 'user1',
      email: 'ahmed@example.com',
      name: 'Ahmed Al-Rashid',
      tier: 'PROFESSIONAL',
      status: 'active',
      stripeCustomerId: 'cus_123456789',
      stripeSubscriptionId: 'sub_123456789',
      currentPeriodStart: '2025-01-01T00:00:00Z',
      currentPeriodEnd: '2025-01-31T23:59:59Z',
      tokenUsage: 85000,
      tokenLimit: 100000,
      monthlyRevenue: 19.80,
      createdAt: '2024-12-15T10:30:00Z'
    },
    {
      id: '2',
      userId: 'user2',
      email: 'sara.tech@startup.sa',
      name: 'Sara Abdullah',
      tier: 'BUSINESS',
      status: 'active',
      stripeCustomerId: 'cus_987654321',
      stripeSubscriptionId: 'sub_987654321',
      currentPeriodStart: '2025-01-15T00:00:00Z',
      currentPeriodEnd: '2025-02-14T23:59:59Z',
      tokenUsage: 150000,
      tokenLimit: 200000,
      monthlyRevenue: 16.80,
      createdAt: '2024-11-20T14:15:00Z'
    },
    {
      id: '3',
      userId: 'user3',
      email: 'mohammed@consultant.com',
      name: 'Mohammed Bin Salman',
      tier: 'HOBBY',
      status: 'active',
      stripeCustomerId: 'cus_555666777',
      stripeSubscriptionId: 'sub_555666777',
      currentPeriodStart: '2025-01-10T00:00:00Z',
      currentPeriodEnd: '2025-02-09T23:59:59Z',
      tokenUsage: 25000,
      tokenLimit: 50000,
      monthlyRevenue: 3.80,
      createdAt: '2025-01-10T09:45:00Z'
    },
    {
      id: '4',
      userId: 'user4',
      email: 'fatima@freelance.ae',
      name: 'Fatima Al-Zahra',
      tier: 'FREE',
      status: 'active',
      currentPeriodStart: '2025-01-01T00:00:00Z',
      currentPeriodEnd: '2025-01-31T23:59:59Z',
      tokenUsage: 8500,
      tokenLimit: 10000,
      monthlyRevenue: 0,
      createdAt: '2024-12-28T16:22:00Z'
    },
    {
      id: '5',
      userId: 'user5',
      email: 'khalid@enterprise.sa',
      name: 'Khalid Al-Mutairi',
      tier: 'ENTERPRISE',
      status: 'active',
      stripeCustomerId: 'cus_enterprise123',
      stripeSubscriptionId: 'sub_enterprise123',
      currentPeriodStart: '2025-01-01T00:00:00Z',
      currentPeriodEnd: '2025-01-31T23:59:59Z',
      tokenUsage: 750000,
      tokenLimit: 1000000,
      monthlyRevenue: 199.00,
      createdAt: '2024-10-01T08:00:00Z'
    }
  ]

  useEffect(() => {
    fetchSubscriptions()
    fetchStats()
  }, [tierFilter, statusFilter, searchTerm])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(tierFilter !== 'ALL' && { tier: tierFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      } else {
        // Use mock data if API not ready
        setSubscriptions(mockSubscriptions)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      setSubscriptions(mockSubscriptions)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(mockStats)
    }
  }

  const getTierColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      FREE: 'text-gray-600 border-gray-600',
      HOBBY: 'text-yellow-600 border-yellow-600',
      PROFESSIONAL: 'text-blue-600 border-blue-600',
      BUSINESS: 'text-green-600 border-green-600',
      ENTERPRISE: 'text-purple-600 border-purple-600'
    }
    return colors[tier] || 'text-gray-600 border-gray-600'
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'text-green-600 border-green-600',
      suspended: 'text-red-600 border-red-600',
      canceled: 'text-red-600 border-red-600',
      past_due: 'text-yellow-600 border-yellow-600',
      trialing: 'text-blue-600 border-blue-600'
    }
    return colors[status] || 'text-gray-600 border-gray-600'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'canceled': return <X className="h-4 w-4 text-red-500" />
      case 'past_due': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'trialing': return <Clock className="h-4 w-4 text-blue-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getUsagePercentage = (usage: number, limit: number) => {
    return Math.round((usage / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = tierFilter === 'ALL' || sub.tier === tierFilter
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter
    
    return matchesSearch && matchesTier && matchesStatus
  })

  const handleViewDetails = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription)
    setShowDetails(true)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'subscriptions_export.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
      
      toast({
        title: "Success",
        description: "Subscriptions data exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
          <p className="text-gray-300">Monitor and manage user subscriptions and billing</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            title="Export subscriptions data"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchSubscriptions}
            title="Refresh subscriptions data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-background border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalSubscriptions}</div>
                <div className="text-sm text-gray-400">Total Subscriptions</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-background border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{stats.activeSubscriptions}</div>
                <div className="text-sm text-gray-400">Active Subscriptions</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-background border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</div>
                <div className="text-sm text-gray-400 flex items-center">
                  Monthly Revenue
                  {stats.revenueGrowth > 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 ml-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 ml-1" />
                  )}
                  <span className={`ml-1 ${stats.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(stats.revenueGrowth)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-background border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{stats.churnRate}%</div>
                <div className="text-sm text-gray-400">Churn Rate</div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Tier Distribution */}
      {stats && (
        <Card className="p-6 bg-background border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.tierDistribution).map(([tier, count]) => (
              <div key={tier} className="text-center">
                <div className="text-2xl font-bold text-white">{count}</div>
                <Badge variant="outline" className={getTierColor(tier)}>
                  {tier}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="p-6 bg-background border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="ALL">All Tiers</option>
              <option value="FREE">Free</option>
              <option value="HOBBY">Hobby</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="BUSINESS">Business</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
              <option value="trialing">Trialing</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="p-6 bg-background border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-400">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Tier</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Usage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((subscription) => {
                const usagePercentage = getUsagePercentage(subscription.tokenUsage, subscription.tokenLimit)
                return (
                  <tr key={subscription.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-white">{subscription.name}</div>
                        <div className="text-sm text-gray-400">{subscription.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={getTierColor(subscription.tier)}>
                        {subscription.tier}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(subscription.status)}
                        <Badge variant="outline" className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            {subscription.tokenUsage.toLocaleString()} / {subscription.tokenLimit.toLocaleString()}
                          </span>
                          <span className="text-white">{usagePercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getUsageColor(usagePercentage)}`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">
                        {formatCurrency(subscription.monthlyRevenue)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-400">
                        <div>{new Date(subscription.currentPeriodStart).toLocaleDateString()}</div>
                        <div>to {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(subscription)}
                          title="View subscription details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Edit subscription (coming soon)"
                          disabled
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No subscriptions found</h3>
            <p className="text-gray-400">
              {searchTerm || tierFilter !== 'ALL' || statusFilter !== 'ALL' 
                ? 'No subscriptions match your current filters.' 
                : 'No subscriptions available.'}
            </p>
          </div>
        )}
      </Card>

      {/* Subscription Details Modal */}
      {showDetails && selectedSubscription && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Subscription Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Customer</label>
                    <div className="text-white">{selectedSubscription.name}</div>
                    <div className="text-sm text-gray-400">{selectedSubscription.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Subscription Tier</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={getTierColor(selectedSubscription.tier)}>
                        {selectedSubscription.tier}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Status</label>
                    <div className="mt-1 flex items-center space-x-2">
                      {getStatusIcon(selectedSubscription.status)}
                      <Badge variant="outline" className={getStatusColor(selectedSubscription.status)}>
                        {selectedSubscription.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Monthly Revenue</label>
                    <div className="text-white text-lg font-semibold">
                      {formatCurrency(selectedSubscription.monthlyRevenue)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Token Usage</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Used: {selectedSubscription.tokenUsage.toLocaleString()} / {selectedSubscription.tokenLimit.toLocaleString()}
                      </span>
                      <span className="text-white">{getUsagePercentage(selectedSubscription.tokenUsage, selectedSubscription.tokenLimit)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getUsageColor(getUsagePercentage(selectedSubscription.tokenUsage, selectedSubscription.tokenLimit))}`}
                        style={{ width: `${Math.min(getUsagePercentage(selectedSubscription.tokenUsage, selectedSubscription.tokenLimit), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Billing Period</label>
                    <div className="text-white">
                      {new Date(selectedSubscription.currentPeriodStart).toLocaleDateString()} - 
                      {new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Customer Since</label>
                    <div className="text-white">
                      {new Date(selectedSubscription.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {selectedSubscription.stripeCustomerId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Stripe Customer ID</label>
                      <div className="text-white font-mono text-sm">{selectedSubscription.stripeCustomerId}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Stripe Subscription ID</label>
                      <div className="text-white font-mono text-sm">{selectedSubscription.stripeSubscriptionId}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button 
                  disabled
                  className="opacity-50 cursor-not-allowed"
                  title="Edit subscription feature coming soon"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Subscription
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}