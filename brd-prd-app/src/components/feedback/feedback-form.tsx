'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Send, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FeedbackFormProps {
  locale?: string
  onSuccess?: () => void
  compact?: boolean
}

const FEEDBACK_CATEGORIES = {
  feature: { en: 'Feature Request', ar: 'طلب ميزة جديدة' },
  bug: { en: 'Bug Report', ar: 'تقرير خطأ' },
  improvement: { en: 'Improvement', ar: 'تحسين' },
  praise: { en: 'Praise', ar: 'إشادة' },
  complaint: { en: 'Complaint', ar: 'شكوى' }
}

export function FeedbackForm({ locale = 'en', onSuccess, compact = false }: FeedbackFormProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    rating: 0,
    category: '',
    email: '',
    name: ''
  })

  const isRTL = locale === 'ar'

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.title.trim() || !formData.message.trim() || !formData.rating || !formData.category) {
        throw new Error(locale === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required')
      }

      if (!session && !formData.email.trim()) {
        throw new Error(locale === 'ar' ? 'البريد الإلكتروني مطلوب للتقييم المجهول' : 'Email is required for anonymous feedback')
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          rating: formData.rating,
          category: formData.category,
          email: !session ? formData.email.trim() : undefined,
          name: !session ? formData.name.trim() : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || (locale === 'ar' ? 'فشل في إرسال التقييم' : 'Failed to submit feedback'))
      }

      setIsSuccess(true)
      setFormData({
        title: '',
        message: '',
        rating: 0,
        category: '',
        email: '',
        name: ''
      })
      
      if (onSuccess) {
        onSuccess()
      }

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {locale === 'ar' 
            ? 'شكراً لك على تقييمك! نحن نقدر ملاحظاتك.'
            : 'Thank you for your feedback! We appreciate your input.'
          }
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={compact ? '' : 'max-w-2xl mx-auto'}>
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : 'text-left'}>
          {locale === 'ar' ? 'شارك رأيك معنا' : 'Share Your Feedback'}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
          {locale === 'ar' 
            ? 'نحن نقدر ملاحظاتك لتحسين خدماتنا'
            : 'We value your input to improve our services'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Anonymous user fields */}
          {!session && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={isRTL ? 'text-right block' : ''}>
                  {locale === 'ar' ? 'الاسم (اختياري)' : 'Name (Optional)'}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={isRTL ? 'text-right' : ''}
                  placeholder={locale === 'ar' ? 'اسمك' : 'Your name'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className={isRTL ? 'text-right block' : ''}>
                  {locale === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={isRTL ? 'text-right' : ''}
                  placeholder={locale === 'ar' ? 'بريدك الإلكتروني' : 'your.email@example.com'}
                />
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'التقييم العام *' : 'Overall Rating *'}
            </Label>
            <div className={`flex items-center gap-1 ${isRTL ? 'justify-end' : ''}`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
              <span className={`ml-3 text-sm text-gray-300 ${isRTL ? 'mr-3 ml-0' : ''}`}>
                {formData.rating > 0 && (
                  <>
                    {formData.rating}/5 
                    {formData.rating === 5 && (locale === 'ar' ? ' ممتاز!' : ' Excellent!')}
                    {formData.rating === 4 && (locale === 'ar' ? ' جيد جداً' : ' Very Good')}
                    {formData.rating === 3 && (locale === 'ar' ? ' جيد' : ' Good')}
                    {formData.rating === 2 && (locale === 'ar' ? ' مقبول' : ' Fair')}
                    {formData.rating === 1 && (locale === 'ar' ? ' ضعيف' : ' Poor')}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'نوع التقييم *' : 'Feedback Type *'}
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className={isRTL ? 'text-right' : ''}>
                <SelectValue placeholder={locale === 'ar' ? 'اختر نوع التقييم' : 'Select feedback type'} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FEEDBACK_CATEGORIES).map(([key, labels]) => (
                  <SelectItem key={key} value={key}>
                    {labels[locale as keyof typeof labels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'العنوان *' : 'Title *'}
            </Label>
            <Input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={isRTL ? 'text-right' : ''}
              placeholder={locale === 'ar' ? 'عنوان مختصر لتقييمك' : 'Brief title for your feedback'}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'تفاصيل التقييم *' : 'Feedback Details *'}
            </Label>
            <Textarea
              id="message"
              required
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className={`min-h-[120px] ${isRTL ? 'text-right' : ''}`}
              placeholder={locale === 'ar' 
                ? 'شارك تفاصيل تقييمك، اقتراحاتك، أو أي ملاحظات لديك'
                : 'Share your detailed feedback, suggestions, or any comments you have'
              }
              maxLength={1000}
            />
            <div className={`text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {formData.message.length}/1000 {locale === 'ar' ? 'حرف' : 'characters'}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className={`w-full ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {locale === 'ar' ? 'إرسال التقييم' : 'Submit Feedback'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}