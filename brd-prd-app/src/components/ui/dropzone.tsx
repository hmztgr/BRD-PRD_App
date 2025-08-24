'use client'

import React, { useCallback } from 'react'
import { useDropzone, DropzoneOptions } from 'react-dropzone'
import { Upload, FileText, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface DropzoneProps extends Omit<DropzoneOptions, 'onDrop'> {
  onFilesAccepted: (files: File[]) => void
  className?: string
  children?: React.ReactNode
  uploadProgress?: number
  isUploading?: boolean
  error?: string | null
  success?: boolean
  locale?: string
}

// File type validation
const acceptedFileTypes = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
}

const translations = {
  en: {
    dragAndDrop: 'Drag and drop files here, or click to select files',
    uploadInProgress: 'Uploading...',
    uploadSuccess: 'Upload completed successfully!',
    supportedFormats: 'Supported formats: PDF, Word, Text files',
    maxFileSize: 'Maximum file size: 10MB',
    selectFiles: 'Select Files'
  },
  ar: {
    dragAndDrop: 'اسحب وأفلت الملفات هنا، أو انقر لتحديد الملفات',
    uploadInProgress: 'جاري الرفع...',
    uploadSuccess: 'تم الرفع بنجاح!',
    supportedFormats: 'التنسيقات المدعومة: PDF، Word، ملفات نصية',
    maxFileSize: 'الحد الأقصى لحجم الملف: 10 ميجابايت',
    selectFiles: 'تحديد الملفات'
  }
}

export function Dropzone({ 
  onFilesAccepted, 
  className, 
  children,
  uploadProgress = 0,
  isUploading = false,
  error = null,
  success = false,
  locale = 'en',
  ...dropzoneOptions 
}: DropzoneProps) {
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAccepted(acceptedFiles)
  }, [onFilesAccepted])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: 10 * 1024 * 1024, // 10MB
    ...dropzoneOptions
  })

  const hasErrors = error || fileRejections.length > 0

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
        {
          // Normal state
          "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/25": 
            !isDragActive && !hasErrors && !success && !isUploading,
          
          // Active drag state
          "border-primary bg-primary/10": isDragActive && !isDragReject,
          
          // Reject state
          "border-destructive bg-destructive/10": isDragReject || hasErrors,
          
          // Success state
          "border-green-500 bg-green-50": success,
          
          // Uploading state
          "border-primary bg-primary/5": isUploading,
          
          // Disabled
          "cursor-not-allowed opacity-50": isUploading
        },
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <input {...getInputProps()} />
      
      {children || (
        <div className={`flex flex-col items-center space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Icon */}
          <div className={`p-4 rounded-full ${
            hasErrors 
              ? 'bg-destructive/20 text-destructive' 
              : success 
                ? 'bg-green-100 text-green-600'
                : isUploading
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
          }`}>
            {hasErrors ? (
              <AlertCircle className="h-8 w-8" />
            ) : success ? (
              <Check className="h-8 w-8" />
            ) : isUploading ? (
              <Upload className="h-8 w-8 animate-bounce" />
            ) : (
              <FileText className="h-8 w-8" />
            )}
          </div>
          
          {/* Status Text */}
          <div className="space-y-2">
            <p className={`text-lg font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
              {hasErrors ? (
                <span className="text-destructive">
                  {error || 'File upload failed'}
                </span>
              ) : success ? (
                <span className="text-green-600">{t.uploadSuccess}</span>
              ) : isUploading ? (
                <span className="text-primary">{t.uploadInProgress}</span>
              ) : (
                t.dragAndDrop
              )}
            </p>
            
            <div className={`text-sm text-muted-foreground space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p>{t.supportedFormats}</p>
              <p>{t.maxFileSize}</p>
            </div>
          </div>
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="w-full max-w-xs space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                {uploadProgress}% {locale === 'ar' ? 'مكتمل' : 'complete'}
              </p>
            </div>
          )}
          
          {/* Error Messages */}
          {fileRejections.length > 0 && (
            <div className="text-sm text-destructive space-y-1">
              {fileRejections.map(({ file, errors }) => (
                <div key={file.name} className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="font-medium">{file.name}:</p>
                  {errors.map(error => (
                    <p key={error.code} className="ml-2">
                      {error.message}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
          
          {/* Action Button for non-drag environments */}
          {!isDragActive && !isUploading && (
            <button
              type="button"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              {t.selectFiles}
            </button>
          )}
        </div>
      )}
    </div>
  )
}