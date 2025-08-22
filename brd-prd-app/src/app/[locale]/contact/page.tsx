'use client'

import React from 'react'
import { ContactForm } from '@/components/contact/contact-form'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Phone,
  HelpCircle,
  CreditCard,
  Settings,
  Users
} from 'lucide-react'

interface ContactPageProps {
  params: {
    locale: string
  }
}

export default function ContactPage({ params: { locale } }: ContactPageProps) {
  const isRTL = locale === 'ar'

  const contactReasons = [
    {
      icon: HelpCircle,
      title: locale === 'ar' ? 'الدعم التقني' : 'Technical Support',
      description: locale === 'ar' 
        ? 'مساعدة في استخدام المنصة وحل المشاكل التقنية'
        : 'Help with using the platform and resolving technical issues'
    },
    {
      icon: CreditCard,
      title: locale === 'ar' ? 'المبيعات والفوترة' : 'Sales & Billing',
      description: locale === 'ar' 
        ? 'أسئلة حول الأسعار والاشتراكات والفوترة'
        : 'Questions about pricing, subscriptions, and billing'
    },
    {
      icon: Settings,
      title: locale === 'ar' ? 'طلب ميزات' : 'Feature Requests',
      description: locale === 'ar' 
        ? 'اقتراح ميزات جديدة أو تحسينات على المنصة'
        : 'Suggest new features or improvements to the platform'
    },
    {
      icon: Users,
      title: locale === 'ar' ? 'دعم الفرق' : 'Team Support',
      description: locale === 'ar' 
        ? 'مساعدة في إعداد وإدارة فرق العمل'
        : 'Help with setting up and managing team accounts'
    }
  ]

  return (
    <div className={`min-h-screen  py-8 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {locale === 'ar' 
              ? 'نحن هنا لمساعدتك. تواصل معنا لأي استفسار أو مساعدة تحتاجها'
              : 'We\'re here to help you. Reach out to us for any questions or assistance you need'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm locale={locale} />
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <Card>
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : ''}`}>
                  {locale === 'ar' ? 'طرق التواصل' : 'Get In Touch'}
                </h3>
                
                <div className="space-y-4">
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </p>
                      <p className="text-gray-600 text-sm">support@brd-prd-app.com</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <MessageCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {locale === 'ar' ? 'متاح قريباً' : 'Coming Soon'}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === 'ar' ? 'أوقات الاستجابة' : 'Response Time'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {locale === 'ar' ? 'خلال 24 ساعة' : 'Within 24 hours'}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {locale === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {locale === 'ar' ? 'توقيت السعودية (GMT+3)' : 'Saudi Arabia (GMT+3)'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Common Inquiries */}
            <Card>
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : ''}`}>
                  {locale === 'ar' ? 'الاستفسارات الشائعة' : 'Common Inquiries'}
                </h3>
                
                <div className="space-y-4">
                  {contactReasons.map((reason, index) => {
                    const Icon = reason.icon
                    return (
                      <div key={index} className={`flex items-start gap-3 p-3 rounded-lg  ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <Icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{reason.title}</p>
                          <p className="text-gray-600 text-xs mt-1">{reason.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card>
              <CardContent className="p-6 text-center">
                <HelpCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {locale === 'ar' 
                    ? 'قد تجد إجابة سؤالك في قائمة الأسئلة الشائعة'
                    : 'Find quick answers to common questions'
                  }
                </p>
                {/* TODO: Add FAQ page link when implemented */}
                <p className="text-blue-600 text-sm">
                  {locale === 'ar' ? 'صفحة الأسئلة الشائعة قريباً' : 'FAQ page coming soon'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16">
          <Card>
            <CardContent className="p-8">
              <h2 className={`text-2xl font-bold text-gray-900 mb-6 text-center ${isRTL ? 'text-right' : ''}`}>
                {locale === 'ar' ? 'نحن نقدر تواصلكم معنا' : 'We Value Your Communication'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'استجابة سريعة' : 'Quick Response'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'ar' 
                      ? 'نرد على جميع الاستفسارات خلال 24 ساعة'
                      : 'We respond to all inquiries within 24 hours'
                    }
                  </p>
                </div>

                <div>
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'فريق خبير' : 'Expert Team'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'ar' 
                      ? 'فريق دعم متخصص ومدرب لمساعدتكم'
                      : 'Specialized and trained support team to help you'
                    }
                  </p>
                </div>

                <div>
                  <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'دعم شامل' : 'Comprehensive Support'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'ar' 
                      ? 'دعم في جميع جوانب استخدام المنصة'
                      : 'Support for all aspects of using the platform'
                    }
                  </p>
                </div>

                <div>
                  <div className="bg-orange-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {locale === 'ar' ? 'حلول مخصصة' : 'Custom Solutions'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'ar' 
                      ? 'نقدم حلول مخصصة حسب احتياجاتكم'
                      : 'We provide custom solutions based on your needs'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}