import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface VerifyEmailPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string; message?: string }>;
}

async function VerifyEmailContent({ searchParams, locale }: { searchParams: { token?: string; error?: string; message?: string }, locale: string }) {
  const { token, error, message } = searchParams;

  const translations = {
    en: {
      title: 'Email Verification',
      verifying: 'Verifying your email...',
      success: 'Email Verified Successfully!',
      successMessage: 'Your email has been verified. You can now sign in to your account.',
      error: 'Verification Failed',
      invalidToken: 'Invalid or expired verification link.',
      alreadyUsed: 'This verification link has already been used.',
      expired: 'This verification link has expired.',
      genericError: 'Unable to verify your email. Please try again or request a new verification email.',
      signIn: 'Sign In',
      requestNew: 'Request New Verification Email'
    },
    ar: {
      title: 'تأكيد البريد الإلكتروني',
      verifying: 'جاري تأكيد بريدك الإلكتروني...',
      success: 'تم تأكيد البريد الإلكتروني بنجاح!',
      successMessage: 'تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول إلى حسابك.',
      error: 'فشل التأكيد',
      invalidToken: 'رابط التأكيد غير صالح أو منتهي الصلاحية.',
      alreadyUsed: 'تم استخدام رابط التأكيد هذا بالفعل.',
      expired: 'انتهت صلاحية رابط التأكيد هذا.',
      genericError: 'تعذر تأكيد بريدك الإلكتروني. يرجى المحاولة مرة أخرى أو طلب بريد تأكيد جديد.',
      signIn: 'تسجيل الدخول',
      requestNew: 'طلب بريد تأكيد جديد'
    }
  };

  const t = translations[locale as keyof typeof translations] || translations.en;
  const isRTL = locale === 'ar';

  // If there's a success message, show success state
  if (message === 'email-verified') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-700">{t.success}</CardTitle>
          <CardDescription>{t.successMessage}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full">
            <Link href={`/${locale}/auth/signin`}>{t.signIn}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If there's an error, show error state
  if (error) {
    let errorMessage = t.genericError;
    
    if (error.includes('invalid') || error.includes('expired')) {
      errorMessage = t.invalidToken;
    } else if (error.includes('used')) {
      errorMessage = t.alreadyUsed;
    }

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-700">{t.error}</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${locale}/auth/signin`}>{t.signIn}</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href={`/${locale}/auth/signup`}>{t.requestNew}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If there's a token, show verifying state (the GET handler will process it)
  if (token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle>{t.verifying}</CardTitle>
          <CardDescription>Please wait while we verify your email address...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // No token provided
  return redirect(`/${locale}/auth/signin?error=no-token`);
}

export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const isRTL = locale === 'ar';

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 p-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <Suspense fallback={
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        }>
          <VerifyEmailContent searchParams={searchParamsResolved} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}