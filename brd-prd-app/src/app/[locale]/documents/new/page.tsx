import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { ChatInterface } from '@/components/chat/chat-interface'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewDocumentPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50/40">
        <Sidebar />
      </aside>
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Create New Document</h1>
            <p className="text-muted-foreground mt-2">
              Chat with our AI assistant to create professional business documents
            </p>
          </div>

          {/* Chat Interface */}
          <ChatInterface userName={session.user.name || session.user.email || 'User'} />
        </div>
      </main>
    </div>
  )
}