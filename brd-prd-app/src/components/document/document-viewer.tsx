'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Edit, 
  Share2, 
  Clock, 
  User, 
  FileText, 
  Zap,
  Calendar
} from 'lucide-react'

interface DocumentViewerProps {
  document: {
    id: string
    title: string
    content: string
    type: string
    status: string
    language: string
    tokensUsed: number
    createdAt: string | Date
    updatedAt: string | Date
    aiModel?: string | null
    generationTime?: number | null
    user: {
      name?: string | null
      email?: string | null
    }
  }
}

// Helper function to convert markdown to HTML
function markdownToHtml(markdown: string, title: string): string {
  const html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <style>
        @media print {
          body { margin: 1cm; }
        }
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; margin-top: 30px; }
        h3 { color: #7f8c8d; margin-top: 25px; }
        strong { color: #2c3e50; }
        p { margin-bottom: 15px; text-align: justify; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'pdf' | 'docx' | 'md') => {
    setIsExporting(true)
    try {
      if (format === 'md') {
        // Simple markdown export
        const blob = new Blob([document.content], { type: 'text/markdown' })
        const filename = `${document.title}.md`
        const url = URL.createObjectURL(blob)
        const a = globalThis.document.createElement('a')
        a.href = url
        a.download = filename
        globalThis.document.body.appendChild(a)
        a.click()
        globalThis.document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        // Open print dialog for PDF
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          const htmlContent = markdownToHtml(document.content, document.title)
          printWindow.document.write(htmlContent)
          printWindow.document.close()
          printWindow.focus()
          printWindow.print()
          printWindow.close()
        }
      } else {
        // Use API for DOCX
        const response = await fetch('/api/documents/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: document.id,
            format: format
          })
        })

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`)
        }

        const blob = await response.blob()
        const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || `${document.title}.${format}`
        
        const url = URL.createObjectURL(blob)
        const a = globalThis.document.createElement('a')
        a.href = url
        a.download = filename
        globalThis.document.body.appendChild(a)
        a.click()
        globalThis.document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: `Check out this ${document.type.toUpperCase()}: ${document.title}`,
          url: window.location.href
        })
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Sharing failed:', error)
    }
  }

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
      case 'in_review': return 'bg-blue-100 text-blue-300'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(document.type)}</span>
                <CardTitle className="text-2xl">{document.title}</CardTitle>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {document.user.name || document.user.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(document.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {document.type.toUpperCase()}
                </div>
                <Badge className={getStatusColor(document.status)}>
                  {document.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('md')} 
                  disabled={isExporting}
                  className="mr-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export MD
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('pdf')} 
                  disabled={isExporting}
                  className="mr-1"
                >
                  Export PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExport('docx')} 
                  disabled={isExporting}
                >
                  Export Word
                </Button>
              </div>
              
              <Button size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="font-semibold">{document.tokensUsed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Generation Time</p>
                <p className="font-semibold">
                  {document.generationTime ? `${Math.round(document.generationTime / 1000)}s` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Word Count</p>
                <p className="font-semibold">{document.content.split(' ').length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-semibold">
                  {formatDate(document.updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Content */}
      <Card>
        <CardHeader>
          <CardTitle>Document Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className={`prose prose-sm max-w-none ${
              document.language === 'ar' ? 'text-right' : 'text-left'
            }`}
            style={{ direction: document.language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <pre className="whitespace-pre-wrap font-sans leading-relaxed">
              {document.content}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}