'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { FeedbackDisplay } from '@/components/feedback/feedback-display'
import { MessageSquare, Eye, Plus } from 'lucide-react'

interface FeedbackPageProps {
  params: {
    locale: string
  }
}

export default function FeedbackPage({ params: { locale } }: FeedbackPageProps) {
  const [activeTab, setActiveTab] = useState('view')
  const [refreshKey, setRefreshKey] = useState(0)
  
  const isRTL = locale === 'ar'

  const handleFeedbackSuccess = () => {
    // Switch to view tab after successful submission
    setActiveTab('view')
    // Refresh the feedback display
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className={`min-h-screen  py-8 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {locale === 'ar' ? 'آراء وتقييمات العملاء' : 'Customer Feedback'}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {locale === 'ar' 
              ? 'شارك تجربتك معنا أو اطلع على تقييمات العملاء الآخرين لمنصتنا'
              : 'Share your experience with us or explore what other customers think about our platform'
            }
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="view" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Eye className="h-4 w-4" />
              {locale === 'ar' ? 'عرض التقييمات' : 'View Feedback'}
            </TabsTrigger>
            <TabsTrigger value="submit" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Plus className="h-4 w-4" />
              {locale === 'ar' ? 'إضافة تقييم' : 'Submit Feedback'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            <FeedbackDisplay 
              key={refreshKey}
              locale={locale}
              maxItems={9}
              showHeader={false}
              showLoadMore={true}
            />
          </TabsContent>

          <TabsContent value="submit" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <FeedbackForm 
                locale={locale}
                onSuccess={handleFeedbackSuccess}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Information */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className={`text-2xl font-bold text-gray-900 mb-6 ${isRTL ? 'text-right' : ''}`}>
            {locale === 'ar' ? 'لماذا رأيك مهم؟' : 'Why Your Feedback Matters'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`text-center ${isRTL ? 'text-right md:text-center' : ''}`}>
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {locale === 'ar' ? 'تحسين الخدمة' : 'Improve Service'}
              </h3>
              <p className="text-gray-600 text-sm">
                {locale === 'ar' 
                  ? 'نستخدم ملاحظاتكم لتطوير منصتنا وتحسين تجربة المستخدم'
                  : 'We use your feedback to enhance our platform and improve user experience'
                }
              </p>
            </div>

            <div className={`text-center ${isRTL ? 'text-right md:text-center' : ''}`}>
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {locale === 'ar' ? 'ميزات جديدة' : 'New Features'}
              </h3>
              <p className="text-gray-600 text-sm">
                {locale === 'ar' 
                  ? 'اقتراحاتكم تساعدنا في إضافة ميزات جديدة مفيدة'
                  : 'Your suggestions help us add valuable new features'
                }
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}