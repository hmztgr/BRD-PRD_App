'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Eye, 
  Folder, 
  FolderOpen,
  RefreshCw,
  Trash2,
  Share2,
  Copy
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface GeneratedDocument {
  id: string
  title: string
  type: 'BRD' | 'PRD' | 'technical' | 'case-study' | 'business-plan' | 'other'
  status: 'generating' | 'completed' | 'error'
  content?: string
  createdAt: Date
  updatedAt: Date
  size: number
  downloadUrl?: string
  previewUrl?: string
  error?: string
}

interface DocumentFolder {
  id: string
  name: string
  documents: GeneratedDocument[]
  createdAt: Date
  isExpanded: boolean
}

interface GeneratedFilesSidebarProps {
  sessionId?: string
  className?: string
  locale?: string
  onDocumentSelect?: (document: GeneratedDocument) => void
  onDocumentDownload?: (document: GeneratedDocument) => void
}

// Mock data for development
const mockFolders: DocumentFolder[] = [
  {
    id: 'folder-1',
    name: 'Business Planning Session - Dec 2024',
    createdAt: new Date(),
    isExpanded: true,
    documents: [
      {
        id: 'doc-1',
        title: 'Business Requirements Document',
        type: 'BRD',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 156000,
        downloadUrl: '#',
        previewUrl: '#'
      },
      {
        id: 'doc-2',
        title: 'Product Requirements Document',
        type: 'PRD',
        status: 'generating',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 0
      },
      {
        id: 'doc-3',
        title: 'Technical Architecture',
        type: 'technical',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 203000,
        downloadUrl: '#',
        previewUrl: '#'
      }
    ]
  }
]

const translations = {
  en: {
    title: 'Generated Files',
    noFiles: 'No files generated yet',
    refresh: 'Refresh',
    download: 'Download',
    preview: 'Preview',
    share: 'Share',
    delete: 'Delete',
    copy: 'Copy Link',
    generating: 'Generating...',
    completed: 'Completed',
    error: 'Error',
    createdAt: 'Created',
    size: 'Size',
    expandFolder: 'Expand folder',
    collapseFolder: 'Collapse folder'
  },
  ar: {
    title: 'الملفات المُنشأة',
    noFiles: 'لم يتم إنشاء ملفات بعد',
    refresh: 'تحديث',
    download: 'تحميل',
    preview: 'معاينة',
    share: 'مشاركة',
    delete: 'حذف',
    copy: 'نسخ الرابط',
    generating: 'جاري الإنشاء...',
    completed: 'مكتمل',
    error: 'خطأ',
    createdAt: 'تاريخ الإنشاء',
    size: 'الحجم',
    expandFolder: 'توسيع المجلد',
    collapseFolder: 'طي المجلد'
  }
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getDocumentTypeColor(type: GeneratedDocument['type']): string {
  switch (type) {
    case 'BRD': return 'bg-blue-100 text-blue-800'
    case 'PRD': return 'bg-purple-100 text-purple-800'
    case 'technical': return 'bg-green-100 text-green-800'
    case 'case-study': return 'bg-orange-100 text-orange-800'
    case 'business-plan': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getDocumentIcon(type: GeneratedDocument['type']) {
  switch (type) {
    case 'BRD': return '📋'
    case 'PRD': return '📝'
    case 'technical': return '⚙️'
    case 'case-study': return '📊'
    case 'business-plan': return '📈'
    default: return '📄'
  }
}

export function GeneratedFilesSidebar({
  sessionId,
  className,
  locale = 'en',
  onDocumentSelect,
  onDocumentDownload
}: GeneratedFilesSidebarProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>(mockFolders)
  const [isLoading, setIsLoading] = useState(false)
  
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  // Fetch generated documents
  useEffect(() => {
    if (sessionId) {
      fetchGeneratedDocuments()
    }
  }, [sessionId])

  const fetchGeneratedDocuments = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/documents/generated?sessionId=${sessionId}`)
      // const data = await response.json()
      // setFolders(data.folders)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error fetching generated documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ))
  }

  const handleDocumentAction = (action: string, document: GeneratedDocument) => {
    switch (action) {
      case 'preview':
        onDocumentSelect?.(document)
        break
      case 'download':
        onDocumentDownload?.(document)
        break
      case 'share':
        // TODO: Implement share functionality
        break
      case 'copy':
        // TODO: Implement copy link functionality
        break
      case 'delete':
        // TODO: Implement delete functionality
        break
    }
  }

  const totalDocuments = folders.reduce((acc, folder) => acc + folder.documents.length, 0)

  return (
    <div className={`${className} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FileText className="h-5 w-5" />
              {t.title}
              {totalDocuments > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalDocuments}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGeneratedDocuments()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {folders.length === 0 ? (
            <div className={`text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t.noFiles}</p>
            </div>
          ) : (
            folders.map((folder) => (
              <div key={folder.id} className="space-y-2">
                {/* Folder Header */}
                <div
                  className={`flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                  onClick={() => toggleFolder(folder.id)}
                >
                  {folder.isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder.documents.length} {locale === 'ar' ? 'ملف' : 'files'}
                    </p>
                  </div>
                </div>

                {/* Documents in Folder */}
                {folder.isExpanded && (
                  <div className={`space-y-2 ${isRTL ? 'mr-6' : 'ml-6'}`}>
                    {folder.documents.map((document) => (
                      <div
                        key={document.id}
                        className={`p-3 border rounded-lg hover:bg-muted/25 transition-colors ${
                          document.status === 'generating' ? 'opacity-75' : ''
                        }`}
                      >
                        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {/* Document Icon */}
                          <div className="text-lg flex-shrink-0">
                            {getDocumentIcon(document.type)}
                          </div>

                          <div className={`flex-1 min-w-0 space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            {/* Document Title & Type */}
                            <div>
                              <p className="text-sm font-medium truncate">
                                {document.title}
                              </p>
                              <div className={`flex items-center gap-1 mt-1 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs truncate max-w-16 ${getDocumentTypeColor(document.type)}`}
                                  title={document.type.toUpperCase()}
                                >
                                  {document.type.toUpperCase()}
                                </Badge>
                                <Badge 
                                  variant={
                                    document.status === 'completed' ? 'default' :
                                    document.status === 'error' ? 'destructive' :
                                    'secondary'
                                  }
                                  className="text-xs truncate max-w-20"
                                  title={
                                    document.status === 'generating' ? t.generating :
                                    document.status === 'completed' ? t.completed :
                                    document.status === 'error' ? t.error : ''
                                  }
                                >
                                  {document.status === 'generating' && t.generating}
                                  {document.status === 'completed' && t.completed}
                                  {document.status === 'error' && t.error}
                                </Badge>
                              </div>
                            </div>

                            {/* Document Info */}
                            <div className={`text-xs text-muted-foreground space-y-1 ${isRTL ? 'text-right' : ''}`}>
                              <p>
                                {t.createdAt}: {formatDistanceToNow(document.createdAt, { addSuffix: true })}
                              </p>
                              {document.size > 0 && (
                                <p>
                                  {t.size}: {formatFileSize(document.size)}
                                </p>
                              )}
                            </div>

                            {/* Document Actions */}
                            {document.status === 'completed' && (
                              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentAction('preview', document)}
                                  className="h-6 w-6 p-0"
                                  title={t.preview}
                                  aria-label={t.preview}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentAction('download', document)}
                                  className="h-6 w-6 p-0"
                                  title={t.download}
                                  aria-label={t.download}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentAction('share', document)}
                                  className="h-6 w-6 p-0"
                                  title={t.share}
                                  aria-label={t.share}
                                >
                                  <Share2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            {/* Error Message */}
                            {document.status === 'error' && document.error && (
                              <div className={`text-xs text-destructive p-2 bg-destructive/10 rounded ${isRTL ? 'text-right' : ''}`}>
                                {document.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}