import Link from "next/link"
import { FileText, Sparkles, Globe, Zap, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedbackDisplay } from "@/components/feedback/feedback-display"

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const isRTL = locale === 'ar';
  
  return (
    <div className="flex flex-col min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                {locale === 'ar' 
                  ? 'إنشاء مستندات احترافية للمتطلبات'
                  : 'Create Professional BRDs & PRDs'
                }
                <span className="block text-primary">
                  {locale === 'ar' 
                    ? 'بمساعدة الذكاء الاصطناعي'
                    : 'with AI Assistance'
                  }
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                {locale === 'ar'
                  ? 'إنشاء مستندات شاملة لمتطلبات الأعمال والمنتجات بمساعدة الذكاء الاصطناعي. يدعم العربية والإنجليزية مع الوعي الثقافي.'
                  : 'Generate comprehensive Business Requirements Documents and Product Requirements Documents with AI-powered assistance. Supports Arabic and English with cultural awareness.'
                }
              </p>
            </div>
            
            <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button asChild size="lg">
                <Link href={`/${locale}/auth/signup`}>
                  <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {locale === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`/${locale}/pricing`}>
                  {locale === 'ar' ? 'الأسعار' : 'View Pricing'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 items-center">
            <div className="flex flex-col justify-center space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold sm:text-5xl">
                  {locale === 'ar' 
                    ? 'المميزات الرئيسية'
                    : 'Key Features'
                  }
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mx-auto">
                  {locale === 'ar'
                    ? 'مجموعة متكاملة من الأدوات لإنشاء وإدارة مستندات متطلبات المشاريع'
                    : 'A comprehensive suite of tools for creating and managing project requirement documents'
                  }
                </p>
              </div>
            </div>
            
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    {locale === 'ar' ? 'إنشاء المستندات' : 'Document Generation'}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'إنشاء مستندات BRD و PRD شاملة وعالية الجودة باستخدام الذكاء الاصطناعي'
                    : 'Generate comprehensive, high-quality BRDs and PRDs with AI assistance'
                  }
                </p>
              </div>
              
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    {locale === 'ar' ? 'دعم متعدد اللغات' : 'Multi-language Support'}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'دعم كامل للعربية والإنجليزية مع الوعي الثقافي والتخصيص للسوق السعودي'
                    : 'Full Arabic and English support with cultural awareness and Saudi market customization'
                  }
                </p>
              </div>
              
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    {locale === 'ar' ? 'إنتاجية عالية' : 'Fast & Efficient'}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'توليد مستندات عالية الجودة في دقائق بدلاً من ساعات أو أيام'
                    : 'Generate high-quality documents in minutes instead of hours or days'
                  }
                </p>
              </div>
              
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    {locale === 'ar' ? 'آمن وموثوق' : 'Secure & Reliable'}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'حماية متقدمة للبيانات مع نسخ احتياطي تلقائي وتشفير شامل'
                    : 'Enterprise-grade security with automatic backups and end-to-end encryption'
                  }
                </p>
              </div>
              
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    {locale === 'ar' ? 'تعاون الفريق' : 'Team Collaboration'}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'مشاركة وتعديل المستندات مع الفريق في الوقت الفعلي'
                    : 'Share and collaborate on documents with your team in real-time'
                  }
                </p>
              </div>
              
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    {locale === 'ar' ? 'قوالب ذكية' : 'Smart Templates'}
                  </h3>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {locale === 'ar'
                    ? 'قوالب جاهزة مخصصة للسوق السعودي ومختلف الصناعات'
                    : 'Pre-built templates customized for Saudi market and various industries'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <FeedbackDisplay 
            locale={locale}
            maxItems={6}
            showHeader={true}
          />
          
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href={`/${locale}/feedback`}>
                {locale === 'ar' ? 'مشاهدة جميع التقييمات' : 'View All Reviews'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {locale === 'ar' 
                  ? 'ابدأ إنشاء مستنداتك الآن'
                  : 'Start Creating Your Documents Today'
                }
              </h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                {locale === 'ar'
                  ? 'انضم إلى آلاف المهنيين الذين يستخدمون منصتنا لإنشاء مستندات عالية الجودة'
                  : 'Join thousands of professionals who use our platform to create high-quality documents'
                }
              </p>
            </div>
            <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button asChild size="lg">
                <Link href={`/${locale}/auth/signup`}>
                  {locale === 'ar' ? 'ابدأ مجاناً' : 'Get Started Free'}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`/${locale}/auth/signin`}>
                  {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
