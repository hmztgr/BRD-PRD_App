import React from 'react'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Plus, Clock, Zap } from 'lucide-react'

interface DocumentsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${locale}/auth/signin`)
  }

  const documents = await prisma.document.findMany({
    where: {
      userId: session.user.id
    },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      language: true,
      tokensUsed: true,
      createdAt: true,
      updatedAt: true,
      aiModel: true,
      generationTime: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brd': return '📋'
      case 'prd': return '📱'
      case 'technical': return '⚙️'
      case 'project_management': return '📊'
      default: return '📄'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-blue-100 text-blue-400800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50/40">
        <Sidebar />
      </aside>
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Documents</h1>
              <p className="text-muted-foreground mt-2">
                Manage all your AI-generated business documents
              </p>
            </div>
            
            <Button variant="outline" asChild>
              <Link href={`/${locale}/documents/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Link>
            </Button>
          </div>

          {/* Documents Grid */}
          {documents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No documents yet</CardTitle>
                <CardDescription className="mb-6">
                  Create your first AI-powered document to get started
                </CardDescription>
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/documents/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Document
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getTypeIcon(document.type)}</span>
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {document.type.toUpperCase()}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg">
                      <Link 
                        href={`/${locale}/documents/${document.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {document.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(document.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {document.tokensUsed.toLocaleString()} tokens
                        </div>
                      </div>
                      
                      {document.aiModel && (
                        <div className="text-xs text-muted-foreground">
                          Generated with {document.aiModel}
                          {document.generationTime && 
                            ` in ${Math.round(document.generationTime / 1000)}s`
                          }
                        </div>
                      )}
                      
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/${locale}/documents/${document.id}`}>
                          View Document
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}