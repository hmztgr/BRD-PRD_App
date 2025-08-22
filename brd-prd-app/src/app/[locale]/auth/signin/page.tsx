import { SignInForm } from '@/components/forms/signin-form'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-center p-6">
        <Link href="/" className="flex items-center space-x-2">
          <FileText className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">BRD/PRD Generator</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <SignInForm />
        </div>
      </div>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2025 BRD/PRD Generator. All rights reserved.
      </footer>
    </div>
  )
}