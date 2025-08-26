'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Gift, Copy, Check, Share2, Zap, Crown, Star } from 'lucide-react'
import Link from 'next/link'

interface ReferralPageProps {
  params: Promise<{
    locale: string
  }>
}

interface ReferralData {
  referralCode: string
  totalReferrals: number
  pendingReferrals: number
  totalTokensEarned: number
  availableTokens: number
  referralHistory: {
    id: string
    email: string
    status: string
    tokensEarned: number
    createdAt: string
  }[]
}

export default function ReferralPage({ params }: ReferralPageProps) {
  const [locale, setLocale] = useState<string>('en')
  const { data: session, status } = useSession()
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  // Resolve params promise
  useEffect(() => {
    params.then(({ locale: resolvedLocale }) => {
      setLocale(resolvedLocale)
    })
  }, [params])
  
  const isRTL = locale === 'ar'
  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${locale}?ref=${referralData?.referralCode}` 
    : ''

  useEffect(() => {
    if (session?.user?.id) {
      fetchReferralData()
    }
  }, [session])

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referral/stats')
      const data = await response.json()
      setReferralData(data)
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
      // Mock data for demonstration
      setReferralData({
        referralCode: 'ABC123DEF',
        totalReferrals: 5,
        pendingReferrals: 2,
        totalTokensEarned: 15000,
        availableTokens: 15000,
        referralHistory: [
          {
            id: '1',
            email: 'john@example.com',
            status: 'completed',
            tokensEarned: 5000,
            createdAt: '2025-08-15T10:00:00Z'
          },
          {
            id: '2', 
            email: 'sarah@example.com',
            status: 'pending',
            tokensEarned: 0,
            createdAt: '2025-08-20T15:30:00Z'
          }
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyReferralUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferralUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: locale === 'ar' ? 'انضم إلى منصة الوثائق التجارية الذكية' : 'Join Smart Business Docs Platform',
          text: locale === 'ar' 
            ? 'احصل على أدوات الذكي الاصطناعي المجانية لإنشاء الوثائق التجارية'
            : 'Get free AI tools for generating business documents',
          url: referralUrl
        })
      } catch (error) {
        copyReferralUrl()
      }
    } else {
      copyReferralUrl()
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <CardTitle>
              {locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar' 
                ? 'يجب تسجيل الدخول للوصول إلى لوحة الإحالات'
                : 'You must be signed in to access the referral dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/auth/signin`}>
              <Button className="w-full">
                {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const rewardTiers = [
    {
      referrals: 1,
      tokens: 5000,
      title: locale === 'ar' ? 'البداية' : 'Starter',
      icon: Gift,
      color: 'text-blue-400'
    },
    {
      referrals: 5,
      tokens: 30000,
      title: locale === 'ar' ? 'المؤثر' : 'Influencer',
      icon: Star,
      color: 'text-purple-500'
    },
    {
      referrals: 10,
      tokens: 75000,
      title: locale === 'ar' ? 'السفير' : 'Ambassador',
      icon: Crown,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className={`min-h-screen  py-8 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Users className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">
              {locale === 'ar' ? 'برنامج الإحالات' : 'Referral Program'}
            </h1>
          </div>
          <p className={`text-lg text-gray-300 ${isRTL ? 'text-right' : ''}`}>
            {locale === 'ar' 
              ? 'ادع الأصدقاء واكسب رموز مجانية لكل شخص ينضم'
              : 'Invite friends and earn free tokens for each person who joins'
            }
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'إجمالي الإحالات' : 'Total Referrals'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralData?.totalReferrals || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'في انتظار التأكيد' : 'Pending'}
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralData?.pendingReferrals || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'إجمالي الرموز المكتسبة' : 'Total Tokens Earned'}
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralData?.totalTokensEarned?.toLocaleString() || '0'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'الرموز المتاحة' : 'Available Tokens'}
              </CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {referralData?.availableTokens?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Link Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>
                  {locale === 'ar' ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
                </CardTitle>
                <CardDescription className={isRTL ? 'text-right' : ''}>
                  {locale === 'ar' 
                    ? 'شارك هذا الرابط مع الأصدقاء واكسب 5000 رمز لكل عضو جديد'
                    : 'Share this link with friends and earn 5,000 tokens for each new member'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="referral-url" className={isRTL ? 'text-right block' : ''}>
                    {locale === 'ar' ? 'رابط الإحالة' : 'Referral URL'}
                  </Label>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Input
                      id="referral-url"
                      value={referralUrl}
                      readOnly
                      className={`flex-1 ${isRTL ? 'text-right' : ''}`}
                    />
                    <Button
                      onClick={copyReferralUrl}
                      variant="outline"
                      className={`px-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={shareReferralUrl}
                      className={isRTL ? 'flex-row-reverse' : ''}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={isRTL ? 'text-right block' : ''}>
                    {locale === 'ar' ? 'كود الإحالة' : 'Referral Code'}
                  </Label>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Input
                      value={referralData?.referralCode || ''}
                      readOnly
                      className={`max-w-48 font-mono text-lg ${isRTL ? 'text-right' : ''}`}
                    />
                    <Button
                      onClick={() => navigator.clipboard.writeText(referralData?.referralCode || '')}
                      variant="outline"
                      className={`px-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral History */}
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>
                  {locale === 'ar' ? 'تاريخ الإحالات' : 'Referral History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {referralData?.referralHistory?.length ? (
                  <div className="space-y-4">
                    {referralData.referralHistory.map((referral) => (
                      <div
                        key={referral.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={isRTL ? 'text-right' : ''}>
                          <div className="font-medium">{referral.email}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(referral.createdAt).toLocaleDateString(locale)}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Badge 
                            variant={referral.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {referral.status === 'completed' 
                              ? (locale === 'ar' ? 'مكتمل' : 'Completed')
                              : (locale === 'ar' ? 'معلق' : 'Pending')
                            }
                          </Badge>
                          {referral.tokensEarned > 0 && (
                            <span className="text-green-600 font-medium">
                              +{referral.tokensEarned.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                    {locale === 'ar' 
                      ? 'لا توجد إحالات بعد. ابدأ بدعوة الأصدقاء!'
                      : 'No referrals yet. Start inviting friends!'
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rewards & Tiers */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>
                  {locale === 'ar' ? 'مستويات المكافآت' : 'Reward Tiers'}
                </CardTitle>
                <CardDescription className={isRTL ? 'text-right' : ''}>
                  {locale === 'ar' 
                    ? 'اكسب المزيد من الرموز مع المزيد من الإحالات'
                    : 'Earn more tokens with more referrals'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rewardTiers.map((tier, index) => {
                  const IconComponent = tier.icon
                  const isUnlocked = (referralData?.totalReferrals || 0) >= tier.referrals
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${isUnlocked ? 'bg-green-50 border-green-200' : ''}`}
                    >
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <IconComponent className={`h-6 w-6 ${tier.color}`} />
                          <div className={isRTL ? 'text-right' : ''}>
                            <div className="font-semibold">{tier.title}</div>
                            <div className="text-sm text-gray-500">
                              {tier.referrals} {locale === 'ar' ? 'إحالات' : 'referrals'}
                            </div>
                          </div>
                        </div>
                        <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                          <div className="font-bold text-green-600">
                            {tier.tokens.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {locale === 'ar' ? 'رموز' : 'tokens'}
                          </div>
                        </div>
                      </div>
                      {isUnlocked && (
                        <Badge variant="default" className="mt-2">
                          {locale === 'ar' ? '✓ مفتوح' : '✓ Unlocked'}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>
                  {locale === 'ar' ? 'كيف يعمل البرنامج؟' : 'How It Works'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <div className="font-medium mb-1">
                      {locale === 'ar' ? 'شارك رابطك' : 'Share Your Link'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {locale === 'ar' 
                        ? 'أرسل رابط الإحالة للأصدقاء والعائلة'
                        : 'Send your referral link to friends and family'
                      }
                    </div>
                  </div>
                </div>
                
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <div className="font-medium mb-1">
                      {locale === 'ar' ? 'ينضم الأصدقاء' : 'Friends Join'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {locale === 'ar' 
                        ? 'يستخدمون رابطك للتسجيل وإنشاء حساب'
                        : 'They use your link to sign up and create an account'
                      }
                    </div>
                  </div>
                </div>
                
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <div className="font-medium mb-1">
                      {locale === 'ar' ? 'تكسب الرموز' : 'You Earn Tokens'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {locale === 'ar' 
                        ? 'احصل على 5000 رمز لكل عضو جديد ينضم'
                        : 'Get 5,000 tokens for each new member who joins'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}