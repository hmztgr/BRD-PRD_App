import { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password - BRD-PRD App',
  description: 'Set your new password',
}

interface ResetPasswordPageProps {
  params: Promise<{
    locale: string
    token: string
  }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale, token } = await params;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordForm locale={locale} token={token} />
      </div>
    </div>
  )
}