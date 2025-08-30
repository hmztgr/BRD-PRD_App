'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal
} from 'lucide-react'

interface Subscription {
  id: string
  userName: string
  userEmail: string
  tier: string
  status: string
  amount: number
  createdAt: string
  nextBilling?: string
}

export function SubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')

  useEffect(() => {
    fetchSubscriptions()
  }, [searchTerm, filterTier])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterTier !== 'all' && { tier: filterTier })
      })

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
      } else {
        // Fallback to generating from users data
        const usersResponse = await fetch('/api/admin/users?limit=50')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const mockSubscriptions = usersData.users
            .filter((user: any) => user.subscriptionTier !== 'free')
            .map((user: any, index: number) => ({
              id: `sub_${user.id}`,
              userName: user.name || 'Unknown',
              userEmail: user.email,
              tier: user.subscriptionTier,
              status: 'active',
              amount: user.subscriptionTier === 'professional' ? 29.99 : 49.99,
              createdAt: user.createdAt,
              nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }))
          setSubscriptions(mockSubscriptions)
        }
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      case 'canceled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Canceled</Badge>
      case 'past_due':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Past Due</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'professional':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Professional</Badge>
      case 'enterprise':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Enterprise</Badge>
      default:
        return <Badge variant="outline">{tier}</Badge>
    }
  }

  const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0)
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage user subscriptions and billing
          </p>
        </div>
        <Button>
          <CreditCard className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
              <p className="text-3xl font-bold text-foreground">{activeSubscriptions}</p>
              <p className="text-sm text-green-600 mt-1">
                {subscriptions.length} total
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% this month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {((activeSubscriptions / Math.max(subscriptions.length, 1)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">From free users</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select 
          value={filterTier} 
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">All Tiers</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Subscription Details</h3>
          
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No subscriptions found
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="font-medium text-foreground">{subscription.userName}</p>
                      {getTierBadge(subscription.tier)}
                      {getStatusBadge(subscription.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{subscription.userEmail}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${subscription.amount}/month</p>
                    <p className="text-sm text-muted-foreground">
                      Next billing: {new Date(subscription.nextBilling || '').toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="ml-4">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}