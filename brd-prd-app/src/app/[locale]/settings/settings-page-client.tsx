'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, User, CreditCard, Bell, Shield, Eye, Save } from 'lucide-react'
import Link from 'next/link'

interface SettingsPageClientProps {
  locale: string
}

export function SettingsPageClient({ locale }: SettingsPageClientProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const isRTL = locale === 'ar'

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              {locale === 'ar' ? 'مطلوب تسجيل الدخول' : 'Authentication Required'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar' 
                ? 'يجب تسجيل الدخول للوصول إلى الإعدادات'
                : 'You need to be signed in to access settings'
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

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Settings className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">
              {locale === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {locale === 'ar' 
              ? 'إدارة معلومات حسابك وتفضيلاتك'
              : 'Manage your account information and preferences'
            }
          </p>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  {locale === 'ar' ? 'الاسم' : 'Name'}
                </Label>
                <Input 
                  id="name"
                  value={session?.user?.name || ''}
                  className="bg-gray-700 border-gray-600 text-white"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">
                  {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input 
                  id="email"
                  type="email"
                  value={session?.user?.email || ''}
                  className="bg-gray-700 border-gray-600 text-white"
                  readOnly
                />
              </div>
            </CardContent>
          </Card>

          {/* Plan Card */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {locale === 'ar' ? 'الخطة الحالية' : 'Current Plan'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {locale === 'ar' ? 'مجاني' : 'Free Plan'}
                </Badge>
                <p className="text-gray-400">
                  {locale === 'ar' 
                    ? 'ترقية للحصول على المزيد من الميزات'
                    : 'Upgrade to unlock more features'
                  }
                </p>
                <Link href={`/${locale}/pricing`}>
                  <Button variant="outline" className="w-full">
                    {locale === 'ar' ? 'ترقية الآن' : 'Upgrade Now'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {locale === 'ar' ? 'التفضيلات' : 'Preferences'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">
                    {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </Label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">
                    {locale === 'ar' ? 'النشرة الإخبارية' : 'Newsletter'}
                  </Label>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        <Card className="mt-8 bg-gray-800/50 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {locale === 'ar' ? 'المستندات' : 'Documents'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {locale === 'ar' 
                ? 'إدارة المستندات المنشأة'
                : 'Manage your generated documents'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/${locale}/documents`}>
              <Button variant="outline" className="w-full sm:w-auto">
                {locale === 'ar' ? 'عرض المستندات' : 'View Documents'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}