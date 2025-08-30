'use client'

import React, { useState, useCallback } from 'react'
import { Dropzone } from '@/components/ui/dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, X, Download, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: Date
  content?: string // Extracted text content
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
}

interface DocumentUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  maxFiles?: number
  className?: string
  locale?: string
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to get file type icon
function getFileIcon(type: string) {
  switch (type) {
    case 'application/pdf':
      return '📄'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return '📝'
    case 'text/plain':
      return '📃'
    default:
      return '📄'
  }
}

const translations = {
  en: {
    title: 'Upload Documents',
    description: 'Upload existing documents to enhance your business planning',
    uploadedFiles: 'Uploaded Files',
    noFiles: 'No files uploaded yet',
    processing: 'Processing...',
    completed: 'Completed',
    error: 'Error',
    remove: 'Remove',
    preview: 'Preview',
    download: 'Download'
  },
  ar: {
    title: 'رفع المستندات',
    description: 'ارفع المستندات الموجودة لتحسين تخطيط أعمالك',
    uploadedFiles: 'الملفات المرفوعة',
    noFiles: 'لم يتم رفع ملفات بعد',
    processing: 'جاري المعالجة...',
    completed: 'مكتمل',
    error: 'خطأ',
    remove: 'إزالة',
    preview: 'معاينة',
    download: 'تحميل'
  }
}

export function DocumentUploader({ 
  onFilesUploaded, 
  maxFiles = 10, 
  className,
  locale = 'en' 
}: DocumentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    setIsUploading(true)
    setError(null)
    
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (let i = 0; i < newFiles.length; i++) {
      const file = files[i]
      const uploadedFile = newFiles[i]

      try {
        // Update progress
        setUploadProgress((i / newFiles.length) * 100)
        
        // Create FormData
        const formData = new FormData()
        formData.append('files', file)
        formData.append('fileId', uploadedFile.id)

        // Upload file
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()

        // Update file status - API returns files array with processed content
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                status: 'processing',
                content: result.files && result.files[0] ? result.files[0] : `Processed: ${file.name}`
              }
            : f
        ))

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mark as completed
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'completed' }
            : f
        ))

      } catch (err) {
        console.error('File upload error:', err)
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                status: 'error', 
                error: err instanceof Error ? err.message : 'Upload failed' 
              }
            : f
        ))
      }
    }

    setIsUploading(false)
    setUploadProgress(0)
    
    // Notify parent component
    const completedFiles = newFiles.filter(f => f.status === 'completed')
    if (completedFiles.length > 0) {
      onFilesUploaded(completedFiles)
    }
  }, [uploadedFiles.length, maxFiles, onFilesUploaded])

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const canUploadMore = uploadedFiles.length < maxFiles && !isUploading

  return (
    <div className={`space-y-6 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <FileText className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
            {t.description}
          </p>
        </CardHeader>
        <CardContent>
          {canUploadMore ? (
            <Dropzone
              onFilesAccepted={handleFilesAccepted}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              error={error}
              locale={locale}
              multiple
            />
          ) : (
            <div className={`text-center p-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {isUploading 
                  ? t.processing 
                  : `Maximum ${maxFiles} files reached`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <FileText className="h-5 w-5" />
              {t.uploadedFiles} ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="text-2xl">
                      {getFileIcon(file.type)}
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'error' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {file.status === 'uploading' && `${file.progress || 0}%`}
                      {file.status === 'processing' && t.processing}
                      {file.status === 'completed' && t.completed}
                      {file.status === 'error' && t.error}
                    </Badge>
                  </div>

                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {file.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Implement preview */}}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* TODO: Implement download */}}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {uploadedFiles.length === 0 && (
        <div className={`text-center p-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t.noFiles}</p>
        </div>
      )}
    </div>
  )
}