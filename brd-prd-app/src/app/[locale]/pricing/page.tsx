'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star, Crown, Zap, Users, Heart } from 'lucide-react'

// Static translations
const translations = {
  en: {
    title: "Choose Your Plan",
    subtitle: "Select the perfect plan for your document generation needs",
    monthly: "Monthly",
    yearly: "Yearly",
    saveText: "Save 15%",
    perMonth: "/month",
    popular: "MOST POPULAR",
    getStarted: "Get Started",
    startFreeTrial: "Start Free Trial",
    startProfessionalTrial: "Start Professional Trial",
    choosePlan: "Choose Plan",
    loading: "Loading...",
    billingPeriod: "Billing Period", 
    tokensPerMonth: "tokens/month",
    faqTitle: "Frequently Asked Questions",
    faqQuestions: {
      tokens: {
        question: "What are tokens?",
        answer: "Tokens measure AI usage for document generation. Typically, 1,000 tokens = 1 standard business document. Your token limit resets monthly."
      },
      upgrade: {
        question: "Can I upgrade or downgrade anytime?",
        answer: "Yes! You can change your plan anytime through your account settings. Changes take effect immediately with prorated billing."
      },
      refunds: {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day money-back guarantee for all paid plans. Contact support if you're not satisfied."
      },
      security: {
        question: "Is my data secure?",
        answer: "Absolutely. All data is encrypted in transit and at rest. We're GDPR compliant and follow industry best practices."
      }
    },
    plans: {
      free: {
        name: 'Free',
        description: 'Perfect for getting started',
        features: [
          'Basic document templates',
          'AI-powered generation (GPT-3.5)',
          'PDF & DOCX export',
          'English & Arabic support',
          'Email support',
        ],
        limitations: [
          'Limited to 3-6 documents per month',
          'Basic templates only',
          'Standard AI response time',
        ]
      },
      hobby: {
        name: 'Hobby',
        description: 'For hobbyists and small projects',
        features: [
          'Everything in Free',
          '50K tokens per month',
          'Advanced templates library',
          'Priority AI processing',
          'Document versioning',
          'Advanced export options',
          'Live chat support',
        ],
        limitations: [
          'Up to 15-25 documents per month',
        ]
      },
      professional: {
        name: 'Professional',
        description: 'Premium AI models for professionals',
        features: [
          'Everything in Hobby',
          '100K tokens per month',
          'Premium AI models (GPT-4, Claude-3 Opus, Gemini Pro)',
          'Advanced document analysis',
          'Custom template creation',
          'Priority processing',
          'Premium export formats',
          'Priority support',
        ],
        limitations: [
          'Up to 30-50 documents per month',
        ]
      },
      business: {
        name: 'Business',
        description: 'For teams and collaborative work',
        features: [
          'Everything in Hobby',
          '200K tokens per month',
          'Team collaboration',
          'Real-time editing',
          'Comment system',
          'Document sharing',
          'API access',
          'Priority support',
        ],
        limitations: [
          'Up to 80-120 documents per month',
        ]
      },
      enterprise: {
        name: 'Enterprise',
        description: 'Custom solutions for large organizations',
        features: [
          'Everything in Business',
          'Unlimited tokens',
          'Custom AI model fine-tuning',
          'White-label solutions',
          'Dedicated account manager',
          'Custom integrations',
          'SLA guarantees',
          '24/7 premium support',
        ],
        limitations: []
      }
    }
  },
  ar: {
    title: "اختر خطتك",
    subtitle: "اختر الخطة المثالية لاحتياجات إنشاء المستندات",
    monthly: "شهرياً",
    yearly: "سنوياً", 
    saveText: "وفر 15%",
    perMonth: "/شهر",
    popular: "الأكثر شعبية",
    getStarted: "ابدأ",
    startFreeTrial: "ابدأ التجربة المجانية",
    startProfessionalTrial: "ابدأ التجربة الاحترافية",
    choosePlan: "اختر الخطة",
    loading: "جاري التحميل...",
    billingPeriod: "فترة الفوترة",
    tokensPerMonth: "رمز/شهر",
    faqTitle: "الأسئلة الشائعة",
    faqQuestions: {
      tokens: {
        question: "ما هي الرموز؟",
        answer: "الرموز تقيس استخدام الذكاء الاصطناعي لإنشاء المستندات. عادة، 1000 رمز = مستند أعمال واحد قياسي. حد الرموز الخاص بك يعاد تعيينه شهرياً."
      },
      upgrade: {
        question: "هل يمكنني الترقية أو التراجع في أي وقت؟",
        answer: "نعم! يمكنك تغيير خطتك في أي وقت من خلال إعدادات حسابك. تدخل التغييرات حيز التنفيذ فوراً مع الفوترة المتناسبة."
      },
      refunds: {
        question: "هل تقدمون استرداد الأموال؟",
        answer: "نحن نقدم ضمان استرداد الأموال لمدة 30 يوماً لجميع الخطط المدفوعة. تواصل مع الدعم إذا لم تكن راضياً."
      },
      security: {
        question: "هل بياناتي آمنة؟",
        answer: "بالتأكيد. جميع البيانات مشفرة أثناء النقل وأثناء الراحة. نحن متوافقون مع GDPR ونتبع أفضل الممارسات في الصناعة."
      }
    },
    plans: {
      free: {
        name: 'مجاني',
        description: 'مثالي للبداية',
        features: [
          'قوالب المستندات الأساسية',
          'التوليد بالذكاء الاصطناعي (GPT-3.5)',
          'تصدير PDF و DOCX',
          'دعم الإنجليزية والعربية',
          'دعم البريد الإلكتروني',
        ],
        limitations: [
          'محدود بـ 3-6 مستندات في الشهر',
          'القوالب الأساسية فقط',
          'وقت استجابة الذكاء الاصطناعي العادي',
        ]
      },
      hobby: {
        name: 'هواة',
        description: 'للهواة والمشاريع الصغيرة',
        features: [
          'كل شيء في المجاني',
          '50 ألف رمز شهرياً',
          'مكتبة القوالب المتقدمة',
          'معالجة ذكاء اصطناعي ذات أولوية',
          'إصدارات المستندات',
          'خيارات تصدير متقدمة',
          'دعم المحادثة المباشرة',
        ],
        limitations: [
          'حتى 15-25 مستند في الشهر',
        ]
      },
      professional: {
        name: 'احترافي',
        description: 'نماذج ذكاء اصطناعي متميزة للمحترفين',
        features: [
          'كل شيء في الهواة',
          '100 ألف رمز شهرياً',
          'نماذج ذكاء اصطناعي متميزة (GPT-4، Claude-3 Opus، Gemini Pro)',
          'تحليل المستندات المتقدم',
          'إنشاء قوالب مخصصة',
          'معالجة ذات أولوية',
          'تنسيقات تصدير متميزة',
          'دعم ذو أولوية',
        ],
        limitations: [
          'حتى 30-50 مستند في الشهر',
        ]
      },
      business: {
        name: 'الأعمال',
        description: 'للفرق والعمل التعاوني',
        features: [
          'كل شيء في الهواة',
          '200 ألف رمز شهرياً',
          'تعاون الفريق',
          'تحرير في الوقت الفعلي',
          'نظام التعليقات',
          'مشاركة المستندات',
          'وصول API',
          'دعم ذو أولوية',
        ],
        limitations: [
          'حتى 80-120 مستند في الشهر',
        ]
      },
      enterprise: {
        name: 'المؤسسات',
        description: 'حلول مخصصة للمؤسسات الكبيرة',
        features: [
          'كل شيء في الأعمال',
          'رموز غير محدودة',
          'ضبط نموذج الذكاء الاصطناعي المخصص',
          'حلول العلامة البيضاء',
          'مدير حساب مخصص',
          'تكامل مخصص',
          'ضمانات SLA',
          'دعم متميز على مدار 24/7',
        ],
        limitations: []
      }
    }
  }
}

const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    tokens: '10K',
    description: 'Perfect for getting started',
    icon: Zap,
    features: [
      'Basic document templates',
      'AI-powered generation (GPT-3.5)',
      'PDF & DOCX export',
      'English & Arabic support',
      'Email support',
    ],
    limitations: [
      'Limited to 3-6 documents per month',
      'Basic templates only',
      'Standard AI response time',
    ],
    popular: false,
    cta: 'Get Started',
    priceIds: {
      monthly: null,
      yearly: null,
    }
  },
  hobby: {
    name: 'Hobby',
    price: 3.80,
    monthlyPrice: 3.80,
    yearlyPrice: 34.20, // 15% discount + 10% token bonus
    tokens: '50K',
    description: 'For hobbyists and small projects',
    icon: Heart,
    features: [
      'Everything in Free',
      '50K tokens per month',
      'Advanced templates library',
      'Priority AI processing',
      'Document versioning',
      'Advanced export options',
      'Live chat support',
    ],
    limitations: [
      'Up to 15-25 documents per month',
    ],
    popular: false,
    cta: 'Start Free Trial',
    priceIds: {
      monthly: 'price_hobby_monthly',
      yearly: 'price_hobby_yearly',
    }
  },
  professional: {
    name: 'Professional',
    price: 19.80,
    monthlyPrice: 19.80,
    yearlyPrice: 178.20, // 15% discount + 10% token bonus
    tokens: '100K',
    description: 'Premium AI models for professionals',
    icon: Star,
    features: [
      'Everything in Hobby',
      '100K tokens per month',
      'Premium AI models (GPT-4, Claude-3 Opus, Gemini Pro)',
      'Advanced document analysis',
      'Custom template creation',
      'Priority processing',
      'Premium export formats',
      'Priority support',
    ],
    limitations: [
      'Up to 30-50 documents per month',
    ],
    popular: true,
    cta: 'Start Professional Trial',
    priceIds: {
      monthly: 'price_professional_monthly',
      yearly: 'price_professional_yearly',
    }
  },
  business: {
    name: 'Business',
    price: 9.80,
    monthlyPrice: 9.80,
    yearlyPrice: 88.20, // 15% discount + 10% token bonus
    tokens: '200K',
    description: 'For teams and collaborative work',
    icon: Users,
    features: [
      'Everything in Hobby',
      '200K tokens per month',
      'Team collaboration',
      'Real-time editing',
      'Comment system',
      'Document sharing',
      'API access',
      'Team management',
      'Advanced reporting',
    ],
    limitations: [
      'Up to 65-130 documents per month',
      'Standard AI models (no premium)',
    ],
    popular: false,
    cta: 'Start Business Trial',
    priceIds: {
      monthly: 'price_business_monthly',
      yearly: 'price_business_yearly',
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 39.80,
    monthlyPrice: 39.80,
    yearlyPrice: 358.20, // 15% discount + 10% token bonus
    tokens: '1M',
    description: 'For large organizations',
    icon: Crown,
    features: [
      'Everything in Professional & Business',
      '1M tokens per month',
      'Premium AI models included',
      'Custom templates',
      'SSO integration',
      'Advanced security',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Training sessions',
      'White-label options',
    ],
    limitations: [],
    popular: false,
    cta: 'Contact Sales',
    priceIds: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly',
    }
  },
}

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations.en;
  const isRTL = locale === 'ar';
  
  return <PricingPageClient locale={locale} t={t} isRTL={isRTL} />;
}

function PricingPageClient({ locale, t, isRTL }: { locale: string, t: any, isRTL: boolean }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // Get dynamic CTA text based on user's current subscription
  const getCtaText = (planKey: keyof typeof PRICING_PLANS, plan: typeof PRICING_PLANS[keyof typeof PRICING_PLANS]) => {
    // If user is not logged in, show default CTA
    if (!session?.user) {
      if (planKey === 'free') return t.getStarted;
      if (planKey === 'hobby') return t.startFreeTrial;
      if (planKey === 'professional') return t.startProfessionalTrial;
      return t.choosePlan;
    }

    // For free plan, always show "Get Started"
    if (planKey === 'free') {
      return t.getStarted
    }

    // For existing users, show contextual text based on their current tier
    // Note: This would require fetching user's current subscription tier from the backend
    // For now, we'll show upgrade/switch language for logged-in users
    const tierOrder = ['free', 'hobby', 'professional', 'business', 'enterprise']
    const currentUserTier = 'professional' // This should come from user data in a real implementation
    const currentTierIndex = tierOrder.indexOf(currentUserTier)
    const planTierIndex = tierOrder.indexOf(planKey)

    if (planTierIndex > currentTierIndex) {
      return `Upgrade to ${plan.name}`
    } else if (planTierIndex === currentTierIndex) {
      return 'Current Plan'
    } else if (planTierIndex < currentTierIndex) {
      return `Switch to ${plan.name}`
    }

    return plan.cta
  }

  const handleSubscribe = async (planId: keyof typeof PRICING_PLANS) => {
    // Get current locale from pathname
    const currentPath = window.location.pathname;
    const locale = currentPath.split('/')[1] || 'en';
    
    if (planId === 'free') {
      if (!session) {
        router.push(`/${locale}/auth/signup`)
      } else {
        router.push(`/${locale}/dashboard`)
      }
      return
    }

    if (!session) {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/pricing`)
      return
    }

    const plan = PRICING_PLANS[planId]
    const priceId = plan.priceIds[billingCycle]

    if (!priceId) {
      console.error('Price ID not found for plan:', planId, billingCycle)
      return
    }

    setIsLoading(planId)

    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId,
          successPath: `/${locale}/dashboard?checkout=success`,
          cancelPath: `/${locale}/pricing?checkout=canceled`
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (error: any) {
      console.error('Error creating checkout:', error)
      
      // Show user-friendly error message
      alert(`Sorry, there was an issue starting your subscription: ${error.message}. Please try again or contact support.`)
      
    } finally {
      setIsLoading(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const getSavings = (plan: typeof PRICING_PLANS[keyof typeof PRICING_PLANS]) => {
    if (billingCycle === 'monthly') return null
    
    const annualCost = plan.yearlyPrice
    const monthlyCost = plan.monthlyPrice * 12
    const savings = monthlyCost - annualCost
    const percentage = Math.round((savings / monthlyCost) * 100)
    
    return { amount: savings, percentage }
  }

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-black border-b border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white">
              {t.title}
            </h1>
            <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {t.monthly}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {t.yearly}
                <Badge variant="secondary" className="ml-2">
                  {t.saveText}
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => {
            const planKey = key as keyof typeof PRICING_PLANS
            const Icon = plan.icon
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            const savings = getSavings(plan)
            
            return (
              <Card 
                key={key}
                className={`relative p-6 ${
                  plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500"
                  >
                    {t.popular}
                  </Badge>
                )}

                <div className="text-center">
                  <Icon className="mx-auto h-12 w-12 text-blue-400" />
                  <h3 className="mt-4 text-2xl font-semibold text-blue-400">
                    {t.plans[key as keyof typeof t.plans].name}
                  </h3>
                  <p className="mt-2 text-gray-300">
                    {t.plans[key as keyof typeof t.plans].description}
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="ml-1 text-gray-300">
                        {t.perMonth}
                      </span>
                    )}
                  </div>
                  
                  {savings && billingCycle === 'yearly' && (
                    <p className="mt-1 text-sm text-green-600">
                      Save {formatPrice(savings.amount)} ({savings.percentage}% off)
                    </p>
                  )}

                  <div className="mt-2">
                    <span className="text-lg font-medium text-blue-400">
                      {plan.tokens} {t.tokensPerMonth}
                    </span>
                    {billingCycle === 'yearly' && price > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        +10% bonus
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleSubscribe(planKey)}
                  disabled={isLoading === planKey || getCtaText(planKey, plan) === 'Current Plan'}
                  className="w-full mt-6"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {isLoading === planKey ? t.loading : getCtaText(planKey, plan)}
                </Button>

                <div className="mt-6 space-y-3">
                  {t.plans[key as keyof typeof t.plans].features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-sm text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                  
                  {t.plans[key as keyof typeof t.plans].limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start">
                      <X className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-sm text-gray-400">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-black border-2 border-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {t.faqTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-2">
                {t.faqQuestions.tokens.question}
              </h3>
              <p className="text-gray-300 text-sm">
                {t.faqQuestions.tokens.answer}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                {t.faqQuestions.upgrade.question}
              </h3>
              <p className="text-gray-300 text-sm">
                {t.faqQuestions.upgrade.answer}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                {t.faqQuestions.refunds.question}
              </h3>
              <p className="text-gray-300 text-sm">
                {t.faqQuestions.refunds.answer}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                {t.faqQuestions.security.question}
              </h3>
              <p className="text-gray-300 text-sm">
                {t.faqQuestions.security.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}