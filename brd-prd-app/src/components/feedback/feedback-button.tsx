'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, Camera, Upload, Bug, Star, Lightbulb, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FeedbackButtonProps {
  className?: string
  variant?: 'floating' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  locale?: string
}

interface FeedbackData {
  type: 'bug' | 'suggestion' | 'review' | 'question'
  message: string
  email?: string
  screenshot?: File
  attachments?: FileList
  includeConsoleLog?: boolean
  consoleLogs?: string
  url: string
  userAgent: string
  timestamp: string
}

export function FeedbackButton({ 
  className = '',
  variant = 'floating',
  size = 'md',
  locale = 'en'
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackData['type']>('suggestion')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [includeConsoleLog, setIncludeConsoleLog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  
  const screenshotInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const translations = {
    en: {
      feedback: 'Feedback',
      sendFeedback: 'Send Feedback',
      feedbackType: 'Feedback Type',
      bugReport: 'Bug Report',
      suggestion: 'Suggestion',
      review: 'Review/Rating',
      question: 'Question/Help',
      message: 'Message',
      messagePlaceholder: 'Describe your feedback, bug, or suggestion...',
      email: 'Email (optional)',
      emailPlaceholder: 'your.email@example.com',
      takeScreenshot: 'Take Screenshot',
      uploadScreenshot: 'Upload Screenshot',
      attachFiles: 'Attach Files',
      includeConsole: 'Include console logs (for bug reports)',
      consoleHelp: 'This helps us debug issues by including browser console information',
      submit: 'Submit Feedback',
      submitting: 'Submitting...',
      success: 'Feedback submitted successfully!',
      error: 'Failed to submit feedback. Please try again.',
      screenshotTaken: 'Screenshot captured!',
      screenshotError: 'Failed to capture screenshot',
      close: 'Close'
    },
    ar: {
      feedback: 'الملاحظات',
      sendFeedback: 'إرسال ملاحظات',
      feedbackType: 'نوع الملاحظات',
      bugReport: 'تقرير خطأ',
      suggestion: 'اقتراح',
      review: 'تقييم/مراجعة',
      question: 'سؤال/مساعدة',
      message: 'الرسالة',
      messagePlaceholder: 'اصف ملاحظاتك أو الخطأ أو اقتراحك...',
      email: 'البريد الإلكتروني (اختياري)',
      emailPlaceholder: 'your.email@example.com',
      takeScreenshot: 'التقاط لقطة شاشة',
      uploadScreenshot: 'رفع لقطة شاشة',
      attachFiles: 'إرفاق ملفات',
      includeConsole: 'تضمين سجلات وحدة التحكم (لتقارير الأخطاء)',
      consoleHelp: 'هذا يساعدنا في تصحيح المشاكل من خلال تضمين معلومات وحدة تحكم المتصفح',
      submit: 'إرسال الملاحظات',
      submitting: 'جاري الإرسال...',
      success: 'تم إرسال الملاحظات بنجاح!',
      error: 'فشل إرسال الملاحظات. حاول مرة أخرى.',
      screenshotTaken: 'تم التقاط لقطة الشاشة!',
      screenshotError: 'فشل التقاط لقطة الشاشة',
      close: 'إغلاق'
    }
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />
      case 'suggestion': return <Lightbulb className="h-4 w-4" />
      case 'review': return <Star className="h-4 w-4" />
      case 'question': return <AlertTriangle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const captureScreenshot = async () => {
    try {
      // Show helpful instruction before opening the browser dialog
      toast({
        title: 'Screenshot Instructions',
        description: 'When prompted, please select "This tab" to capture the current page.',
        variant: 'default'
      })

      // Use screen capture API with clear constraints
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 }
          },
          audio: false
        })
        
        const video = document.createElement('video')
        video.srcObject = stream
        video.style.display = 'none'
        document.body.appendChild(video)
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve
          video.play()
        })
        
        // Small delay to ensure video is fully loaded
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Create canvas and capture the video frame
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' })
              setScreenshot(file)
              toast({
                title: t.screenshotTaken,
                variant: 'default'
              })
            }
          }, 'image/png', 0.9)
        }
        
        // Clean up
        document.body.removeChild(video)
        stream.getTracks().forEach(track => track.stop())
      } else {
        throw new Error('Screen capture not supported in this browser')
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error)
      
      // Provide user-friendly error message
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({
          title: 'Screenshot Cancelled',
          description: 'You can upload a screenshot instead using the upload button.',
          variant: 'default'
        })
      } else {
        toast({
          title: t.screenshotError,
          description: 'Please try uploading a screenshot instead.',
          variant: 'destructive'
        })
      }
    }
  }

  const getConsoleLogs = () => {
    const logs: string[] = []
    
    // Override console methods to capture logs
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    
    // Get recent errors from window.onerror if available
    if (window.performance && window.performance.getEntriesByType) {
      const entries = window.performance.getEntriesByType('navigation')
      if (entries.length > 0) {
        logs.push(`Navigation timing: ${JSON.stringify(entries[0])}`)
      }
    }
    
    // Get any global errors
    if ((window as any).__globalErrors) {
      logs.push(`Global errors: ${JSON.stringify((window as any).__globalErrors)}`)
    }
    
    // Basic browser and page info
    logs.push(`URL: ${window.location.href}`)
    logs.push(`User Agent: ${navigator.userAgent}`)
    logs.push(`Screen: ${window.screen.width}x${window.screen.height}`)
    logs.push(`Viewport: ${window.innerWidth}x${window.innerHeight}`)
    logs.push(`Timestamp: ${new Date().toISOString()}`)
    
    return logs.join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      toast({
        title: 'Message is required',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      
      const feedbackData: FeedbackData = {
        type: feedbackType,
        message: message.trim(),
        email: email.trim() || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        includeConsoleLog,
        consoleLogs: includeConsoleLog ? getConsoleLogs() : undefined
      }

      formData.append('feedback', JSON.stringify(feedbackData))
      
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }
      
      if (attachmentInputRef.current?.files) {
        Array.from(attachmentInputRef.current.files).forEach((file, index) => {
          formData.append(`attachment_${index}`, file)
        })
      }

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: t.success,
          variant: 'default'
        })
        
        // Reset form
        setMessage('')
        setEmail('')
        setScreenshot(null)
        setIncludeConsoleLog(false)
        setFeedbackType('suggestion')
        setIsOpen(false)
        
        if (attachmentInputRef.current) {
          attachmentInputRef.current.value = ''
        }
        if (screenshotInputRef.current) {
          screenshotInputRef.current.value = ''
        }
      } else {
        throw new Error('Submission failed')
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast({
        title: t.error,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const buttonSizes = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-4 text-sm', 
    lg: 'h-11 px-6 text-base'
  }

  const floatingStyles = variant === 'floating' 
    ? 'fixed bottom-4 right-4 z-50 shadow-lg' 
    : ''

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={`${floatingStyles} ${buttonSizes[size]} ${className}`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {t.feedback}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t.sendFeedback}
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your feedback, reporting bugs, or asking questions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">{t.feedbackType}</Label>
            <Select value={feedbackType} onValueChange={(value) => setFeedbackType(value as FeedbackData['type'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    {t.bugReport}
                  </div>
                </SelectItem>
                <SelectItem value="suggestion">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    {t.suggestion}
                  </div>
                </SelectItem>
                <SelectItem value="review">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {t.review}
                  </div>
                </SelectItem>
                <SelectItem value="question">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {t.question}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t.message}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              rows={4}
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={captureScreenshot}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {t.takeScreenshot}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => screenshotInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {t.uploadScreenshot}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => attachmentInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {t.attachFiles}
              </Button>
            </div>

            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setScreenshot(e.target.files[0])
                }
              }}
              className="hidden"
            />
            
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
            />

            {screenshot && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Screenshot attached: {screenshot.name}
              </div>
            )}
          </div>

          {feedbackType === 'bug' && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="console-logs"
                  checked={includeConsoleLog}
                  onCheckedChange={(checked) => setIncludeConsoleLog(checked as boolean)}
                />
                <Label htmlFor="console-logs" className="text-sm">
                  {t.includeConsole}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.consoleHelp}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              {t.close}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex items-center gap-2"
            >
              {getTypeIcon(feedbackType)}
              {isSubmitting ? t.submitting : t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}