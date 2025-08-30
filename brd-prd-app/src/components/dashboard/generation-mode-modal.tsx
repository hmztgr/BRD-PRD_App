'use client'

import React from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Zap, 
  Globe, 
  Users, 
  Search, 
  Crown,
  Check,
  Lock
} from 'lucide-react'

interface GenerationModeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode: (mode: 'standard' | 'advanced') => void
  userTier: string
  locale: string
}

// Static translations
const translations = {
  en: {
    title: 'Choose Generation Mode',
    subtitle: 'Select the document generation approach that best fits your needs',
    standardMode: 'Standard Mode',
    standardDescription: 'Quick and efficient document generation',
    standardFeatures: [
      'Standard business document templates',
      'Multi-document generation suites',
      'AI-powered content creation',
      'Professional formatting'
    ],
    advancedMode: 'Advanced Mode',
    advancedBeta: 'Beta',
    advancedDescription: 'Comprehensive business planning with intelligent assistance',
    advancedFeatures: [
      'Iterative business planning workflow',
      'Intelligent data gathering and research',
      'Multi-document generation suites',
      'Country-specific intelligence & regulations',
      'Save/resume planning sessions',
      'Document upload and analysis'
    ],
    selectButton: 'Select',
    upgradeRequired: 'Upgrade Required',
    upgradeMessage: 'Advanced mode requires Hobby tier or higher',
    freeWith: 'Available with your plan',
    premiumFeature: 'Premium Feature'
  },
  ar: {
    title: 'اختر وضع الإنشاء',
    subtitle: 'حدد طريقة إنشاء المستندات التي تناسب احتياجاتك بشكل أفضل',
    standardMode: 'الوضع القياسي',
    standardDescription: 'إنشاء مستندات سريع وفعال',
    standardFeatures: [
      'قوالب مستندات الأعمال القياسية',
      'مجموعات إنشاء المستندات المتعددة',
      'إنشاء محتوى بالذكاء الاصطناعي',
      'تنسيق احترافي'
    ],
    advancedMode: 'الوضع المتقدم',
    advancedBeta: 'تجريبي',
    advancedDescription: 'تخطيط أعمال شامل مع مساعدة ذكية',
    advancedFeatures: [
      'سير عمل تخطيط الأعمال التفاعلي',
      'جمع البيانات والبحث الذكي',
      'مجموعات إنشاء المستندات المتعددة',
      'ذكاء واللوائح الخاصة بكل دولة',
      'حفظ/استئناف جلسات التخطيط',
      'تحميل وتحليل المستندات'
    ],
    selectButton: 'اختيار',
    upgradeRequired: 'ترقية مطلوبة',
    upgradeMessage: 'الوضع المتقدم يتطلب باقة الهواة أو أعلى',
    freeWith: 'متاح مع خطتك',
    premiumFeature: 'ميزة مميزة'
  }
}

export function GenerationModeModal({ 
  isOpen, 
  onClose, 
  onSelectMode, 
  userTier, 
  locale = 'en' 
}: GenerationModeModalProps) {
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'
  const canUseAdvanced = userTier !== 'free' && userTier !== null

  const handleModeSelect = (mode: 'standard' | 'advanced') => {
    if (mode === 'advanced' && !canUseAdvanced) {
      // Could trigger upgrade flow here
      return
    }
    onSelectMode(mode)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-4xl ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className={isRTL ? 'text-right' : 'text-left'}>
          <DialogTitle className="text-2xl">{t.title}</DialogTitle>
          <DialogDescription className="text-base">
            {t.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Standard Mode Card */}
          <Card className="relative cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="h-6 w-6 text-primary" />
                <div className={isRTL ? 'text-right' : ''}>
                  <CardTitle className="text-xl">{t.standardMode}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {t.freeWith}
                  </Badge>
                </div>
              </div>
              <CardDescription className={isRTL ? 'text-right' : ''}>
                {t.standardDescription}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {t.standardFeatures.map((feature, index) => (
                  <li key={index} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className={`text-sm ${isRTL ? 'text-right' : ''}`}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handleModeSelect('standard')}
                className="w-full"
                size="lg"
              >
                <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.selectButton}
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Mode Card */}
          <Card className={`relative cursor-pointer hover:shadow-lg transition-shadow ${!canUseAdvanced ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Zap className="h-6 w-6 text-purple-500" />
                <div className={isRTL ? 'text-right' : ''}>
                  <CardTitle className="text-xl">
                    {t.advancedMode}
                    <Badge variant="outline" className={`ml-2 ${isRTL ? 'mr-2 ml-0' : ''}`}>
                      {t.advancedBeta}
                    </Badge>
                  </CardTitle>
                  <Badge 
                    variant={canUseAdvanced ? "default" : "destructive"} 
                    className="mt-1"
                  >
                    {canUseAdvanced ? (
                      <>
                        <Crown className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t.premiumFeature}
                      </>
                    ) : (
                      <>
                        <Lock className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t.upgradeRequired}
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              <CardDescription className={isRTL ? 'text-right' : ''}>
                {t.advancedDescription}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {t.advancedFeatures.map((feature, index) => (
                  <li key={index} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {canUseAdvanced ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isRTL ? 'text-right' : ''} ${!canUseAdvanced ? 'text-gray-500' : ''}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              {!canUseAdvanced && (
                <div className={`text-sm text-muted-foreground mb-4 p-3 bg-muted rounded-md ${isRTL ? 'text-right' : ''}`}>
                  {t.upgradeMessage}
                </div>
              )}
              
              <Button 
                onClick={() => handleModeSelect('advanced')}
                className="w-full"
                size="lg"
                disabled={!canUseAdvanced}
                variant={canUseAdvanced ? "default" : "secondary"}
              >
                <Zap className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {canUseAdvanced ? t.selectButton : t.upgradeRequired}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h4 className={`font-semibold mb-3 ${isRTL ? 'text-right' : ''}`}>
            {locale === 'ar' ? 'مقارنة الميزات:' : 'Feature Comparison:'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Globe className="h-4 w-4 text-blue-500" />
              <span>{locale === 'ar' ? 'دعم متعدد اللغات' : 'Multi-language Support'}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className="h-4 w-4 text-green-500" />
              <span>{locale === 'ar' ? 'بحث ذكي (متقدم فقط)' : 'Smart Research (Advanced Only)'}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Users className="h-4 w-4 text-purple-500" />
              <span>{locale === 'ar' ? 'تعاون الفريق (قريباً)' : 'Team Collaboration (Coming Soon)'}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}