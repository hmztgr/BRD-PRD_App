import React from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { DocumentViewer } from '@/components/document/document-viewer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface DocumentPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { locale, id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${locale}/auth/signin`)
  }

  const document = await prisma.document.findFirst({
    where: {
      id: id,
      userId: session.user.id
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!document) {
    notFound()
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50/40">
        <Sidebar />
      </aside>
      
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              href={`/${locale}/documents`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Documents
            </Link>
          </div>

          {/* Document Viewer */}
          <DocumentViewer document={document} />
        </div>
      </main>
    </div>
  )
}