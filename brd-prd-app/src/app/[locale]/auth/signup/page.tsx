import React, { Suspense } from 'react'
import { SignUpForm } from '@/components/forms/signup-form'
import { FileText } from 'lucide-react'
import Link from 'next/link'

function SignUpFormWrapper() {
  return <SignUpForm />
}

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-center p-6">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Smart Business Docs AI</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Suspense fallback={<div>Loading...</div>}>
            <SignUpFormWrapper />
          </Suspense>
        </div>
      </div>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2025 Smart Business Docs AI. All rights reserved.
      </footer>
    </div>
  )
}