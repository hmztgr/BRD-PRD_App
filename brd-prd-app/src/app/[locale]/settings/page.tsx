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

interface SettingsPageProps {
  params: {
    locale: string
  }
}

export default function SettingsPage({ params: { locale } }: SettingsPageProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const isRTL = locale === 'ar'

  if (status === 'loading') {
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
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>
              {locale === 'ar' ? 'غير مسموح' : 'Access Denied'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar' 
                ? 'يجب تسجيل الدخول للوصول إلى الإعدادات'
                : 'You must be signed in to access settings'
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

  const tabs = [
    {
      id: 'profile',
      label: locale === 'ar' ? 'الملف الشخصي' : 'Profile',
      icon: User
    },
    {
      id: 'subscription',
      label: locale === 'ar' ? 'الاشتراك' : 'Subscription',
      icon: CreditCard
    },
    {
      id: 'notifications',
      label: locale === 'ar' ? 'الإشعارات' : 'Notifications',
      icon: Bell
    },
    {
      id: 'privacy',
      label: locale === 'ar' ? 'الخصوصية' : 'Privacy',
      icon: Eye
    }
  ]

  const renderProfileSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' ? 'معلومات الحساب' : 'Account Information'}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' 
            ? 'تحديث معلومات ملفك الشخصي'
            : 'Update your profile information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className={isRTL ? 'text-right block' : ''}>
            {locale === 'ar' ? 'الاسم' : 'Name'}
          </Label>
          <Input
            id="name"
            defaultValue={session.user.name || ''}
            className={isRTL ? 'text-right' : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className={isRTL ? 'text-right block' : ''}>
            {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          </Label>
          <Input
            id="email"
            type="email"
            defaultValue={session.user.email || ''}
            disabled
            className={`${isRTL ? 'text-right' : ''} opacity-50`}
          />
        </div>
        <Button variant="outline" className={`${isRTL ? 'flex-row-reverse' : ''}`}>
          <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )

  const renderSubscriptionSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' ? 'إدارة الاشتراك' : 'Subscription Management'}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' 
            ? 'عرض وإدارة تفاصيل اشتراكك'
            : 'View and manage your subscription details'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium">
            {locale === 'ar' ? 'الخطة الحالية:' : 'Current Plan:'}
          </span>
          <Badge variant="secondary">
            {locale === 'ar' ? 'المجانية' : 'Free'}
          </Badge>
        </div>
        <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium">
            {locale === 'ar' ? 'الرموز المتبقية:' : 'Tokens Remaining:'}
          </span>
          <span>10,000 / 10,000</span>
        </div>
        <div className="pt-4">
          <Link href={`/${locale}/pricing`}>
            <Button variant="outline" className="w-full">
              {locale === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  const renderNotificationSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' 
            ? 'إدارة كيفية تلقي الإشعارات'
            : 'Manage how you receive notifications'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <div className="font-medium">
                {locale === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
              </div>
              <div className="text-sm text-gray-500">
                {locale === 'ar' 
                  ? 'تلقي إشعارات عبر البريد الإلكتروني'
                  : 'Receive notifications via email'
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <div className="font-medium">
                {locale === 'ar' ? 'تحديثات المنتج' : 'Product Updates'}
              </div>
              <div className="text-sm text-gray-500">
                {locale === 'ar' 
                  ? 'تلقي أخبار المنتج والميزات الجديدة'
                  : 'Receive product news and feature updates'
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPrivacySettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' ? 'إعدادات الخصوصية' : 'Privacy Settings'}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : ''}>
          {locale === 'ar' 
            ? 'إدارة خصوصية بياناتك وحسابك'
            : 'Manage your data privacy and account settings'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <div className="font-medium">
                {locale === 'ar' ? 'ملف شخصي عام' : 'Public Profile'}
              </div>
              <div className="text-sm text-gray-500">
                {locale === 'ar' 
                  ? 'جعل ملفك الشخصي مرئياً للآخرين'
                  : 'Make your profile visible to others'
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="toggle" />
            </div>
          </div>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : ''}>
              <div className="font-medium">
                {locale === 'ar' ? 'تحليل الاستخدام' : 'Usage Analytics'}
              </div>
              <div className="text-sm text-gray-500">
                {locale === 'ar' 
                  ? 'مساعدتنا في تحسين الخدمة بمشاركة بيانات الاستخدام'
                  : 'Help us improve by sharing usage data'
                }
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings()
      case 'subscription':
        return renderSubscriptionSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'privacy':
        return renderPrivacySettings()
      default:
        return renderProfileSettings()
    }
  }

  return (
    <div className={`min-h-screen  py-8 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Settings className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">
              {locale === 'ar' ? 'الإعدادات' : 'Settings'}
            </h1>
          </div>
          <p className={`text-lg text-gray-300 ${isRTL ? 'text-right' : ''}`}>
            {locale === 'ar' 
              ? 'إدارة تفضيلات حسابك وإعدادات التطبيق'
              : 'Manage your account preferences and application settings'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>
                  {locale === 'ar' ? 'إعدادات الحساب' : 'Account Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium border-r-2 transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-900 border-blue-400 text-blue-300'
                            : 'border-transparent text-gray-300 hover: hover:text-white'
                        } ${isRTL ? 'flex-row-reverse text-right border-r-0 border-l-2' : ''}`}
                      >
                        <IconComponent className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}