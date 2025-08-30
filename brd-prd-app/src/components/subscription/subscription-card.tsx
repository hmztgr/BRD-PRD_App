'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Crown, Star, Users, Zap, ExternalLink, CreditCard, Calendar, TrendingUp } from 'lucide-react'

interface SubscriptionData {
  user: {
    id: string
    email: string
    memberSince: string
  }
  subscription: {
    tier: string
    status: string
    billingCycle: string
    isActive: boolean
    endsAt: string | null
    daysUntilRenewal: number | null
    hasStripeCustomer: boolean
    hasActiveSubscription: boolean
  }
  usage: {
    tokensUsed: number
    tokensLimit: number
    tokensRemaining: number
    usagePercentage: number
    isOverLimit: boolean
  }
  billing: {
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    canceledAt: string | null
  } | null
}

const PLAN_ICONS = {
  free: Zap,
  professional: Star,
  business: Users,
  enterprise: Crown,
}

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  professional: 'bg-blue-100 text-blue-300',
  business: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-yellow-100 text-yellow-800',
}

export default function SubscriptionCard() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: '/dashboard' }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (!subscriptionData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Failed to load subscription data
        </div>
      </Card>
    )
  }

  const { subscription, usage, billing } = subscriptionData
  const Icon = PLAN_ICONS[subscription.tier as keyof typeof PLAN_ICONS] || Zap
  const colorClass = PLAN_COLORS[subscription.tier as keyof typeof PLAN_COLORS] || PLAN_COLORS.free

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Icon className="h-8 w-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold capitalize text-white">
                {subscription.tier} Plan
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={colorClass}>
                  {subscription.status}
                </Badge>
                {subscription.billingCycle === 'annual' && (
                  <Badge variant="secondary">Annual</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            {subscription.tier === 'free' ? (
              <Button onClick={handleUpgrade} className="mb-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            ) : (
              <Button 
                onClick={handleManageBilling}
                disabled={isProcessing}
                variant="outline"
                className="mb-2"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessing ? 'Loading...' : 'Manage Billing'}
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Usage Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Token Usage This Month
            </span>
            <span className="text-sm text-gray-500">
              {formatNumber(usage.tokensUsed)} / {formatNumber(usage.tokensLimit)} tokens
            </span>
          </div>
          
          <Progress 
            value={Math.min(usage.usagePercentage, 100)} 
            className="h-3"
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${usage.isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {usage.isOverLimit ? 'Over limit' : `${formatNumber(usage.tokensRemaining)} remaining`}
            </span>
            <span className="text-sm text-gray-500">
              {usage.usagePercentage}% used
            </span>
          </div>
        </div>

        {/* Billing Information */}
        {billing && subscription.isActive && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Billing Period</span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Current period:</span>
                <span>
                  {formatDate(billing.currentPeriodStart)} - {formatDate(billing.currentPeriodEnd)}
                </span>
              </div>
              
              {subscription.daysUntilRenewal !== null && (
                <div className="flex justify-between">
                  <span>
                    {billing.cancelAtPeriodEnd ? 'Expires in:' : 'Renews in:'}
                  </span>
                  <span className={billing.cancelAtPeriodEnd ? 'text-red-600' : 'text-green-600'}>
                    {subscription.daysUntilRenewal} days
                  </span>
                </div>
              )}
              
              {billing.cancelAtPeriodEnd && (
                <div className="text-red-600 text-xs mt-2">
                  Your subscription will not renew and will end on {formatDate(billing.currentPeriodEnd)}.
                  You can reactivate anytime before then.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {subscription.tier === 'free' && (
            <Button onClick={handleUpgrade} className="flex-1">
              Upgrade to Pro
            </Button>
          )}
          
          {subscription.tier !== 'free' && (
            <Button onClick={handleManageBilling} variant="outline" disabled={isProcessing}>
              View Invoices
            </Button>
          )}
          
          <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
            Compare Plans
          </Button>
          
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/usage'}>
            View Usage Details
          </Button>
        </div>
      </Card>

      {/* Usage Warning */}
      {usage.usagePercentage > 80 && (
        <Card className={`p-4 border-l-4 ${usage.isOverLimit ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <div className="flex items-start space-x-3">
            <TrendingUp className={`h-5 w-5 mt-0.5 ${usage.isOverLimit ? 'text-red-500' : 'text-yellow-500'}`} />
            <div>
              <h3 className={`font-semibold ${usage.isOverLimit ? 'text-red-800' : 'text-yellow-800'}`}>
                {usage.isOverLimit ? 'Usage Limit Exceeded' : 'Usage Warning'}
              </h3>
              <p className={`text-sm mt-1 ${usage.isOverLimit ? 'text-red-700' : 'text-yellow-700'}`}>
                {usage.isOverLimit 
                  ? `You've used ${formatNumber(usage.tokensUsed)} tokens, exceeding your ${formatNumber(usage.tokensLimit)} token limit. Consider upgrading to avoid service interruption.`
                  : `You've used ${usage.usagePercentage}% of your monthly tokens. Consider monitoring your usage or upgrading if needed.`
                }
              </p>
              {usage.isOverLimit && subscription.tier !== 'enterprise' && (
                <Button onClick={handleUpgrade} className="mt-3" size="sm">
                  Upgrade Now
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}