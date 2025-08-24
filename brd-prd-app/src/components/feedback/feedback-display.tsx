'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Quote, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface Feedback {
  id: string
  title: string
  message: string
  rating: number
  category: string
  createdAt: string
  userName: string
  userImage?: string | null
}

interface FeedbackDisplayProps {
  locale?: string
  maxItems?: number
  showHeader?: boolean
  showLoadMore?: boolean
  compact?: boolean
}

const CATEGORY_LABELS = {
  feature: { en: 'Feature Request', ar: 'طلب ميزة' },
  bug: { en: 'Bug Report', ar: 'تقرير خطأ' },
  improvement: { en: 'Improvement', ar: 'تحسين' },
  praise: { en: 'Praise', ar: 'إشادة' },
  complaint: { en: 'Complaint', ar: 'شكوى' }
}

export function FeedbackDisplay({ 
  locale = 'en', 
  maxItems = 6, 
  showHeader = true, 
  showLoadMore = false,
  compact = false 
}: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const isRTL = locale === 'ar'

  const fetchFeedback = async (loadMore = false) => {
    try {
      setIsLoading(true)
      const currentOffset = loadMore ? offset : 0
      const response = await fetch(`/api/feedback?public=true&limit=${maxItems}&offset=${currentOffset}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const result = await response.json()
      
      if (loadMore) {
        setFeedback(prev => [...prev, ...result.feedback])
      } else {
        setFeedback(result.feedback)
      }
      
      setHasMore(result.feedback.length === maxItems)
      setOffset(currentOffset + result.feedback.length)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const handleLoadMore = () => {
    fetchFeedback(true)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (locale === 'ar') {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          {locale === 'ar' ? 'حدث خطأ في تحميل التقييمات' : 'Error loading feedback'}
        </p>
      </div>
    )
  }

  if (isLoading && feedback.length === 0) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className={`text-center ${isRTL ? 'rtl' : ''}`}>
            <h2 className="text-2xl font-bold text-white">
              {locale === 'ar' ? 'آراء عملائنا' : 'What Our Customers Say'}
            </h2>
            <p className="mt-2 text-gray-300">
              {locale === 'ar' 
                ? 'اكتشف تجارب المستخدمين مع منصتنا'
                : 'Discover what users think about our platform'
              }
            </p>
          </div>
        )}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${compact ? 'gap-4' : ''}`}>
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-16 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (feedback.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <Quote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">
          {locale === 'ar' ? 'لا توجد تقييمات متاحة حالياً' : 'No feedback available yet'}
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
      {showHeader && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">
            {locale === 'ar' ? 'آراء عملائنا' : 'What Our Customers Say'}
          </h2>
          <p className="mt-2 text-gray-300">
            {locale === 'ar' 
              ? 'اكتشف تجارب المستخدمين مع منصتنا'
              : 'Discover what users think about our platform'
            }
          </p>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${compact ? 'gap-4' : ''}`}>
        {feedback.map((item) => (
          <Card key={item.id} className="relative">
            <CardContent className={`p-6 ${compact ? 'p-4' : ''}`}>
              {/* Quote icon */}
              <Quote className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} h-8 w-8 text-gray-200`} />
              
              {/* User info */}
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.userImage || undefined} alt={item.userName} />
                  <AvatarFallback>
                    {item.userImage ? (
                      <User className="h-5 w-5" />
                    ) : (
                      getInitials(item.userName)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <p className="font-medium text-white">{item.userName}</p>
                  <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>

              {/* Rating and category */}
              <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {renderStars(item.rating)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]?.[locale] || item.category}
                </Badge>
              </div>

              {/* Title */}
              <h3 className={`font-semibold text-white mb-2 line-clamp-2 ${isRTL ? 'text-right' : ''}`}>
                {item.title}
              </h3>

              {/* Message */}
              <p className={`text-gray-300 text-sm line-clamp-4 leading-relaxed ${isRTL ? 'text-right' : ''}`}>
                {item.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMore && hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
            className={isRTL ? 'flex-row-reverse' : ''}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </>
            ) : (
              locale === 'ar' ? 'عرض المزيد' : 'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}