import React from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { formatTokens } from '@/lib/utils'

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

// Static translations
const translations = {
  en: {
    welcomeBack: "Welcome back, {name}!",
    subtitle: "Ready to create some amazing documents? Let's get started.",
    createDocument: "Create Document",
    newDocument: "New Document",
    myDocuments: "My Documents",
    documentsCreated: "documents created",
    tokensUsed: "Tokens Used",
    tokensOf: "of {limit} ({tier} tier)",
    referrals: "Referrals",
    usersReferred: "users referred",
    bonusTokensEarned: "+{tokens} bonus tokens earned",
    getStartedTitle: "🚀 Get Started",
    getStartedDescription: "Create your first AI-powered document in minutes",
    quickStartGuide: "Quick Start Guide:",
    quickStartStep1: "1. Choose a document type (BRD, PRD, Technical)",
    quickStartStep2: "2. Provide your requirements and context", 
    quickStartStep3: "3. Let AI generate your professional document",
    quickStartStep4: "4. Review, edit, and export to PDF",
    createFirstDocument: "Create First Document",
    referralProgramTitle: "🎯 Referral Program",
    referralProgramDescription: "Earn tokens by inviting others to join",
    earnRewards: "Earn Rewards:",
    referralReward1: "• 10K tokens per user signup",
    referralReward2: "• 50K tokens per paid subscription", 
    referralReward3: "• Bonus tokens for upgrades",
    referralReward4: "• Social media follow rewards",
    viewReferralDashboard: "View Referral Dashboard"
  },
  ar: {
    welcomeBack: "مرحباً بعودتك، {name}!",
    subtitle: "مستعد لإنشاء مستندات رائعة؟ فلنبدأ.",
    createDocument: "إنشاء مستند",
    newDocument: "مستند جديد",
    myDocuments: "مستنداتي",
    documentsCreated: "مستند تم إنشاؤه",
    tokensUsed: "الرموز المستخدمة",
    tokensOf: "من {limit} (باقة {tier})",
    referrals: "الإحالات",
    usersReferred: "مستخدم تمت إحالته",
    bonusTokensEarned: "+{tokens} رموز مكافأة مكتسبة",
    getStartedTitle: "🚀 ابدأ",
    getStartedDescription: "أنشئ أول مستند بالذكاء الاصطناعي في دقائق",
    quickStartGuide: "دليل البداية السريعة:",
    quickStartStep1: "1. اختر نوع المستند (BRD، PRD، تقني)",
    quickStartStep2: "2. قدم متطلباتك والسياق",
    quickStartStep3: "3. دع الذكاء الاصطناعي ينشئ مستندك الاحترافي", 
    quickStartStep4: "4. راجع وحرر وصدر إلى PDF",
    createFirstDocument: "إنشاء أول مستند",
    referralProgramTitle: "🎯 برنامج الإحالة",
    referralProgramDescription: "احصل على رموز بدعوة الآخرين للانضمام",
    earnRewards: "احصل على مكافآت:",
    referralReward1: "• 10 آلاف رمز لكل تسجيل مستخدم",
    referralReward2: "• 50 ألف رمز لكل اشتراك مدفوع",
    referralReward3: "• رموز مكافأة للترقيات",
    referralReward4: "• مكافآت متابعة وسائل التواصل الاجتماعي",
    viewReferralDashboard: "عرض لوحة الإحالات"
  }
}

// Simple template function
function template(str: string, values: Record<string, any>): string {
  return str.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations.en;
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${locale}/auth/signin`)
  }

  // Get user data with token usage and document count
  const [user, documentCount, referralCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tokensUsed: true,
        tokensLimit: true,
        subscriptionTier: true,
        totalReferralTokens: true
      }
    }),
    prisma.document.count({
      where: { userId: session.user.id }
    }),
    prisma.user.count({
      where: { referredBy: session.user.id }
    })
  ])

  if (!user) {
    redirect(`/${locale}/auth/signin`)
  }

  const tokenUsagePercentage = Math.round((user.tokensUsed / user.tokensLimit) * 100)
  const isRTL = locale === 'ar'

  return (
    <div className={`flex min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className={`w-64 border-r bg-gray-50/40 ${isRTL ? 'order-2' : ''}`}>
        <Sidebar />
      </aside>
      
      <main className={`flex-1 p-6 ${isRTL ? 'order-1' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {template(t.welcomeBack, { name: session.user.name })}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t.subtitle}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.createDocument}</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/${locale}/documents/new`}>{t.newDocument}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.myDocuments}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t.documentsCreated}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.tokensUsed}</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTokens(user.tokensUsed)}</div>
                <p className="text-xs text-muted-foreground">
                  {template(t.tokensOf, { 
                    limit: formatTokens(user.tokensLimit), 
                    tier: user.subscriptionTier 
                  })}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(tokenUsagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === 'ar' ? `${tokenUsagePercentage}% مستخدم` : `${tokenUsagePercentage}% used`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.referrals}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t.usersReferred}
                </p>
                {user.totalReferralTokens > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {template(t.bonusTokensEarned, { tokens: formatTokens(user.totalReferralTokens) })}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.getStartedTitle}</CardTitle>
                <CardDescription>
                  {t.getStartedDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">{t.quickStartGuide}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t.quickStartStep1}</li>
                    <li>{t.quickStartStep2}</li>
                    <li>{t.quickStartStep3}</li>
                    <li>{t.quickStartStep4}</li>
                  </ul>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/documents/new`}>{t.createFirstDocument}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.referralProgramTitle}</CardTitle>
                <CardDescription>
                  {t.referralProgramDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">{t.earnRewards}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>{t.referralReward1}</li>
                    <li>{t.referralReward2}</li>
                    <li>{t.referralReward3}</li>
                    <li>{t.referralReward4}</li>
                  </ul>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/referral`}>{t.viewReferralDashboard}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}