'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2,
  RefreshCw,
  Search,
  Filter,
  FileType,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Input } from '@/components/ui/input'

interface UploadedFile {
  id: string
  name: string
  originalName: string
  type: string
  size: number
  uploadedAt: Date
  status: 'processing' | 'completed' | 'error'
  content?: string // Extracted text content
  preview?: string // Preview text
  error?: string
  tags?: string[]
}

interface UploadedFilesSidebarProps {
  sessionId?: string
  files?: UploadedFile[]
  className?: string
  locale?: string
  onFileSelect?: (file: UploadedFile) => void
  onFileDelete?: (fileId: string) => void
  onFileDownload?: (file: UploadedFile) => void
}

// Mock data for development
const mockFiles: UploadedFile[] = [
  {
    id: 'file-1',
    name: 'business-plan-draft.pdf',
    originalName: 'Business Plan Draft v2.pdf',
    type: 'application/pdf',
    size: 2450000,
    uploadedAt: new Date(Date.now() - 3600000), // 1 hour ago
    status: 'completed',
    content: 'Business plan content extracted from PDF...',
    preview: 'This business plan outlines our strategy for entering the Saudi Arabian market...',
    tags: ['business-plan', 'strategy']
  },
  {
    id: 'file-2',
    name: 'market-research.docx',
    originalName: 'Market Research Analysis.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 890000,
    uploadedAt: new Date(Date.now() - 7200000), // 2 hours ago
    status: 'completed',
    content: 'Market research analysis content...',
    preview: 'Our market research shows significant opportunity in the healthcare sector...',
    tags: ['research', 'market-analysis']
  },
  {
    id: 'file-3',
    name: 'competitor-analysis.pdf',
    originalName: 'Competitor Analysis.pdf',
    type: 'application/pdf',
    size: 1200000,
    uploadedAt: new Date(Date.now() - 86400000), // 1 day ago
    status: 'processing',
  }
]

const translations = {
  en: {
    title: 'Uploaded Documents',
    noFiles: 'No documents uploaded yet',
    search: 'Search documents...',
    filter: 'Filter',
    preview: 'Preview',
    download: 'Download',
    delete: 'Delete',
    refresh: 'Refresh',
    processing: 'Processing...',
    completed: 'Ready',
    error: 'Error',
    uploadedAt: 'Uploaded',
    size: 'Size',
    type: 'Type',
    showAll: 'Show All',
    showPDF: 'PDF Only',
    showWord: 'Word Only',
    showText: 'Text Only'
  },
  ar: {
    title: 'المستندات المرفوعة',
    noFiles: 'لم يتم رفع مستندات بعد',
    search: 'البحث في المستندات...',
    filter: 'فلترة',
    preview: 'معاينة',
    download: 'تحميل',
    delete: 'حذف',
    refresh: 'تحديث',
    processing: 'جاري المعالجة...',
    completed: 'جاهز',
    error: 'خطأ',
    uploadedAt: 'تاريخ الرفع',
    size: 'الحجم',
    type: 'النوع',
    showAll: 'عرض الكل',
    showPDF: 'PDF فقط',
    showWord: 'Word فقط',
    showText: 'نصوص فقط'
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

function getFileTypeIcon(type: string): string {
  switch (type) {
    case 'application/pdf':
      return '📄'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return '📝'
    case 'text/plain':
      return '📃'
    default:
      return '📁'
  }
}

function getFileTypeLabel(type: string): string {
  switch (type) {
    case 'application/pdf':
      return 'PDF'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word'
    case 'application/msword':
      return 'Word'
    case 'text/plain':
      return 'Text'
    default:
      return 'File'
  }
}

export function UploadedFilesSidebar({
  sessionId,
  files = mockFiles,
  className,
  locale = 'en',
  onFileSelect,
  onFileDelete,
  onFileDownload
}: UploadedFilesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'word' | 'text'>('all')
  const [isLoading, setIsLoading] = useState(false)
  
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  // Filter files based on search and type
  const filteredFiles = files.filter(file => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.preview?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Type filter
    let matchesType = true
    switch (filterType) {
      case 'pdf':
        matchesType = file.type === 'application/pdf'
        break
      case 'word':
        matchesType = file.type.includes('word') || file.type.includes('wordprocessingml')
        break
      case 'text':
        matchesType = file.type === 'text/plain'
        break
      default:
        matchesType = true
    }

    return matchesSearch && matchesType
  })

  // Fetch uploaded files
  useEffect(() => {
    if (sessionId) {
      fetchUploadedFiles()
    }
  }, [sessionId])

  const fetchUploadedFiles = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/files/uploaded?sessionId=${sessionId}`)
      // const data = await response.json()
      // setFiles(data.files)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error fetching uploaded files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileAction = (action: string, file: UploadedFile) => {
    switch (action) {
      case 'select':
        onFileSelect?.(file)
        break
      case 'download':
        onFileDownload?.(file)
        break
      case 'delete':
        onFileDelete?.(file.id)
        break
    }
  }

  return (
    <div className={`${className} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Upload className="h-5 w-5" />
              {t.title}
              {files.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {files.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUploadedFiles()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search and Filter */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="relative flex-1">
                  <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                    isRTL ? 'right-3' : 'left-3'
                  }`} />
                  <Input
                    placeholder={t.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Cycle through filter types
                    const types: typeof filterType[] = ['all', 'pdf', 'word', 'text']
                    const currentIndex = types.indexOf(filterType)
                    const nextIndex = (currentIndex + 1) % types.length
                    setFilterType(types[nextIndex])
                  }}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              
              {filterType !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  {filterType === 'pdf' && t.showPDF}
                  {filterType === 'word' && t.showWord}
                  {filterType === 'text' && t.showText}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className={`text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {files.length === 0 ? t.noFiles : 'No files match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 border rounded-lg hover:bg-muted/25 transition-colors cursor-pointer ${
                    file.status === 'processing' ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleFileAction('select', file)}
                >
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* File Icon */}
                    <div className="text-lg flex-shrink-0">
                      {getFileTypeIcon(file.type)}
                    </div>

                    <div className={`flex-1 min-w-0 space-y-2 ${isRTL ? 'text-right' : ''}`}>
                      {/* File Name & Status */}
                      <div>
                        <p className="text-sm font-medium truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Badge variant="outline" className="text-xs">
                            {getFileTypeLabel(file.type)}
                          </Badge>
                          <Badge 
                            variant={
                              file.status === 'completed' ? 'default' :
                              file.status === 'error' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {file.status === 'processing' && t.processing}
                            {file.status === 'completed' && t.completed}
                            {file.status === 'error' && t.error}
                          </Badge>
                        </div>
                      </div>

                      {/* File Preview */}
                      {file.preview && file.status === 'completed' && (
                        <div className={`text-xs text-muted-foreground p-2 bg-muted/30 rounded ${isRTL ? 'text-right' : ''}`}>
                          <p className="line-clamp-2">{file.preview}</p>
                        </div>
                      )}

                      {/* File Info */}
                      <div className={`text-xs text-muted-foreground space-y-1 ${isRTL ? 'text-right' : ''}`}>
                        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                          </span>
                          <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <FileType className="h-3 w-3" />
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      {/* File Tags */}
                      {file.tags && file.tags.length > 0 && (
                        <div className={`flex flex-wrap gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* File Actions */}
                      {file.status === 'completed' && (
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFileAction('select', file)
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            {t.preview}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFileAction('download', file)
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Download className="h-3 w-3" />
                            {t.download}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFileAction('delete', file)
                            }}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t.delete}
                          </Button>
                        </div>
                      )}

                      {/* Error Message */}
                      {file.status === 'error' && file.error && (
                        <div className={`text-xs text-destructive p-2 bg-destructive/10 rounded ${isRTL ? 'text-right' : ''}`}>
                          {file.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}