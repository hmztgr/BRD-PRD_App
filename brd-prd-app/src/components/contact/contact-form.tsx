'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Send, CheckCircle, MessageCircle, Phone, HelpCircle, CreditCard, Settings } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ContactFormProps {
  locale?: string
  onSuccess?: () => void
  compact?: boolean
}

const CONTACT_TYPES = {
  general: { 
    en: 'General Inquiry', 
    ar: 'استفسار عام',
    icon: MessageCircle 
  },
  support: { 
    en: 'Technical Support', 
    ar: 'الدعم التقني',
    icon: HelpCircle 
  },
  sales: { 
    en: 'Sales & Pricing', 
    ar: 'المبيعات والأسعار',
    icon: CreditCard 
  },
  technical: { 
    en: 'Technical Issues', 
    ar: 'مشاكل تقنية',
    icon: Settings 
  },
  billing: { 
    en: 'Billing & Account', 
    ar: 'الفوترة والحساب',
    icon: CreditCard 
  }
}

export function ContactForm({ locale = 'en', onSuccess, compact = false }: ContactFormProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    subject: '',
    message: '',
    type: 'general'
  })

  const isRTL = locale === 'ar'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
        throw new Error(locale === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required')
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error(locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address')
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          type: formData.type,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || (locale === 'ar' ? 'فشل في إرسال الرسالة' : 'Failed to send message'))
      }

      setIsSuccess(true)
      setFormData({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        subject: '',
        message: '',
        type: 'general'
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
            ? 'شكراً لتواصلكم معنا! سنقوم بالرد عليكم قريباً.'
            : 'Thank you for contacting us! We will get back to you soon.'
          }
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={compact ? '' : 'max-w-2xl mx-auto'}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'text-right flex-row-reverse' : ''}`}>
          <Mail className="h-5 w-5" />
          {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
        </CardTitle>
        <CardDescription className={isRTL ? 'text-right' : 'text-left'}>
          {locale === 'ar' 
            ? 'نحن هنا لمساعدتك. أرسل لنا رسالة وسنرد عليك في أسرع وقت ممكن'
            : 'We\'re here to help. Send us a message and we\'ll respond as soon as possible'
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

          {/* Contact type */}
          <div className="space-y-2">
            <Label htmlFor="type" className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'نوع الاستفسار *' : 'Inquiry Type *'}
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className={isRTL ? 'text-right' : ''}>
                <SelectValue placeholder={locale === 'ar' ? 'اختر نوع الاستفسار' : 'Select inquiry type'} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {Object.entries(CONTACT_TYPES).map(([key, details]) => {
                  const Icon = details.icon
                  return (
                    <SelectItem key={key} value={key} className="hover:bg-gray-100 text-gray-900">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Icon className="h-4 w-4" />
                        {details[locale as keyof typeof details] as string}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={isRTL ? 'text-right block' : ''}>
                {locale === 'ar' ? 'الاسم *' : 'Name *'}
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={isRTL ? 'text-right' : ''}
                placeholder={locale === 'ar' ? 'اسمك الكامل' : 'Your full name'}
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

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'الموضوع *' : 'Subject *'}
            </Label>
            <Input
              id="subject"
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className={isRTL ? 'text-right' : ''}
              placeholder={locale === 'ar' ? 'موضوع رسالتك' : 'Brief subject of your message'}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className={isRTL ? 'text-right block' : ''}>
              {locale === 'ar' ? 'الرسالة *' : 'Message *'}
            </Label>
            <Textarea
              id="message"
              required
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className={`min-h-[120px] ${isRTL ? 'text-right' : ''}`}
              placeholder={locale === 'ar' 
                ? 'اشرح استفسارك أو مشكلتك بالتفصيل'
                : 'Please describe your inquiry or issue in detail'
              }
              maxLength={2000}
            />
            <div className={`text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {formData.message.length}/2000 {locale === 'ar' ? 'حرف' : 'characters'}
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
                {locale === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {locale === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
              </>
            )}
          </Button>
        </form>

        {/* Additional contact info */}
        <div className={`mt-8 pt-6 border-t ${isRTL ? 'text-right' : ''}`}>
          <h3 className="font-semibold text-gray-900 mb-3">
            {locale === 'ar' ? 'طرق أخرى للتواصل' : 'Other Ways to Reach Us'}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Mail className="h-4 w-4" />
              <span>support@brd-prd-app.com</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MessageCircle className="h-4 w-4" />
              <span>
                {locale === 'ar' 
                  ? 'الدردشة المباشرة متاحة قريباً'
                  : 'Live chat coming soon'
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}