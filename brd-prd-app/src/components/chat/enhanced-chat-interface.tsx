'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Upload,
  Settings,
  Globe,
  Brain,
  MessageSquare,
  Save,
  Play,
  Pause
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
  metadata?: {
    documentTypes?: string[]
    countryContext?: string
    researchFindings?: any[]
    planningStep?: string
    confidence?: number
  }
}

interface PlanningSession {
  id: string
  businessIdea: string
  country: string
  industry: string
  currentStep: string
  completedSteps: string[]
  requiredDocuments: string[]
  collectedData: Record<string, any>
  researchFindings: any[]
  status: 'active' | 'paused' | 'completed'
}

interface EnhancedChatInterfaceProps {
  userName: string
  locale?: string
  mode: 'standard' | 'advanced'
}

// Helper function to detect Arabic text
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text)
}

// Static translations
const translations = {
  en: {
    standardTitle: 'Document Generator',
    advancedTitle: 'Advanced Business Planning Assistant',
    standardWelcome: (name: string) => `Hello ${name}! I'm here to help you create professional business documents. What type of document would you like to generate?`,
    advancedWelcome: (name: string) => `Hello ${name}! I'm your Advanced Business Planning Assistant. Tell me about your business idea and I'll guide you through a comprehensive planning process. What's your business concept?`,
    placeholder: 'Describe your business idea or document needs...',
    sendHint: 'Press Enter to send • Shift+Enter for new line',
    send: 'Send',
    generating: 'Processing...',
    generateDocument: 'Generate Document',
    generateDocuments: 'Generate Documents',
    saveProgress: 'Save Progress',
    pauseSession: 'Pause Session',
    resumeSession: 'Resume Session',
    newChat: 'New Session',
    modeSwitch: 'Switch Mode',
    countrySelector: 'Country Focus',
    settingsTab: 'Settings',
    chatTab: 'Chat',
    planningSteps: 'Planning Steps',
    currentStep: 'Current Step',
    completedSteps: 'Completed Steps',
    dataCollection: 'Data Collection',
    researchFindings: 'Research Findings'
  },
  ar: {
    standardTitle: 'منشئ المستندات',
    advancedTitle: 'مساعد التخطيط المتقدم للأعمال',
    standardWelcome: (name: string) => `مرحباً ${name}! أنا هنا لمساعدتك في إنشاء مستندات أعمال احترافية. ما نوع المستند الذي تريد إنشاؤه؟`,
    advancedWelcome: (name: string) => `مرحباً ${name}! أنا مساعدك المتقدم لتخطيط الأعمال. أخبرني عن فكرة مشروعك وسأرشدك خلال عملية تخطيط شاملة. ما هو مفهوم مشروعك؟`,
    placeholder: 'اوصف فكرة مشروعك أو احتياجات المستندات...',
    sendHint: 'اضغط Enter للإرسال • Shift+Enter للسطر الجديد',
    send: 'إرسال',
    generating: 'جاري المعالجة...',
    generateDocument: 'إنشاء المستند',
    generateDocuments: 'إنشاء المستندات',
    saveProgress: 'حفظ التقدم',
    pauseSession: 'إيقاف الجلسة مؤقتاً',
    resumeSession: 'استئناف الجلسة',
    newChat: 'جلسة جديدة',
    modeSwitch: 'تبديل الوضع',
    countrySelector: 'تركيز البلد',
    settingsTab: 'الإعدادات',
    chatTab: 'المحادثة',
    planningSteps: 'خطوات التخطيط',
    currentStep: 'الخطوة الحالية',
    completedSteps: 'الخطوات المكتملة',
    dataCollection: 'جمع البيانات',
    researchFindings: 'نتائج البحث'
  }
}

export function EnhancedChatInterface({ 
  userName, 
  locale = 'en',
  mode = 'standard'
}: EnhancedChatInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: mode === 'advanced' ? t.advancedWelcome(userName) : t.standardWelcome(userName),
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [canGenerateDocument, setCanGenerateDocument] = useState(false)
  
  // Planning state (for advanced mode)
  const [planningSession, setPlanningSession] = useState<PlanningSession | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>('saudi-arabia')
  const [currentTab, setCurrentTab] = useState<string>('chat')
  
  // UI refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Initialize session based on mode
  useEffect(() => {
    const modeFromUrl = searchParams?.get('mode')
    if (modeFromUrl && mode !== modeFromUrl) {
      // Handle mode mismatch
      console.log('Mode mismatch detected')
    }
  }, [mode, searchParams])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const endpoint = mode === 'advanced' 
        ? '/api/chat/advanced-conversation' 
        : '/api/chat/conversation'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          planningSessionId: planningSession?.id,
          country: selectedCountry,
          mode,
          messageHistory: messages.filter(m => !m.isTyping)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'))

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          documentTypes: data.documentTypes,
          countryContext: data.countryContext,
          researchFindings: data.researchFindings,
          planningStep: data.planningStep,
          confidence: data.confidence
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      setConversationId(data.conversationId)
      setCanGenerateDocument(data.canGenerateDocument || false)

      // Update planning session for advanced mode
      if (mode === 'advanced' && data.planningSession) {
        setPlanningSession(data.planningSession)
      }

    } catch (error) {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'))
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateDocuments = async () => {
    if (!conversationId || !canGenerateDocument) return

    setIsLoading(true)
    
    const generatingMessage: Message = {
      id: 'generating',
      role: 'assistant',
      content: mode === 'advanced' 
        ? (isRTL ? 'ممتاز! لدي كل المعلومات المطلوبة. دعني أنشئ مجموعة المستندات الآن...' 
                 : 'Perfect! I have all the required information. Let me generate your document suite now...')
        : (isRTL ? 'ممتاز! دعني أنشئ مستندك الاحترافي الآن...' 
                 : 'Perfect! Let me generate your professional document now...'),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, generatingMessage])

    try {
      const endpoint = mode === 'advanced' 
        ? '/api/chat/generate-document-suite'
        : '/api/chat/generate-document'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          planningSessionId: planningSession?.id,
          country: selectedCountry,
          mode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate documents')
      }

      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: mode === 'advanced'
          ? (isRTL ? `رائع! لقد أنشأت مجموعة من ${data.documentCount} مستندات بنجاح. تتضمن المستندات جميع التفاصيل التي ناقشناها وتتبع المعايير المهنية لبلدك.`
                   : `Great! I've generated a suite of ${data.documentCount} documents successfully. The documents include all the details we discussed and follow professional standards for your country.`)
          : (isRTL ? `رائع! لقد أنشأت مستند ${data.documentType} بنجاح. يتضمن المستند جميع التفاصيل التي ناقشناها.`
                   : `Great! I've generated your ${data.documentType} successfully. The document includes all the details we discussed.`),
        timestamp: new Date()
      }

      setMessages(prev => prev.filter(m => m.id !== 'generating').concat(successMessage))
      
      // Navigate to appropriate view based on mode
      if (mode === 'advanced' && data.documentSuiteId) {
        router.push(`/documents/suite/${data.documentSuiteId}`)
      } else if (data.documentId) {
        router.push(`/documents/${data.documentId}`)
      }

    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== 'generating'))
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error while generating the documents: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const saveProgress = async () => {
    if (!planningSession) return

    try {
      const response = await fetch('/api/planning/save-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: planningSession.id,
          messages: messages.filter(m => !m.isTyping),
          conversationId
        })
      })

      if (response.ok) {
        // Show success feedback
        const saveMessage: Message = {
          id: 'save-' + Date.now(),
          role: 'system',
          content: isRTL ? 'تم حفظ التقدم بنجاح' : 'Progress saved successfully',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, saveMessage])
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderAdvancedControls = () => {
    if (mode !== 'advanced') return null

    return (
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {planningSession && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={saveProgress}
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              {t.saveProgress}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPlanningSession(prev => 
                  prev ? { ...prev, status: prev.status === 'active' ? 'paused' : 'active' } : null
                )
              }}
            >
              {planningSession.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4" />
                  {t.pauseSession}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {t.resumeSession}
                </>
              )}
            </Button>
          </>
        )}
        <Badge variant="outline" className={`text-xs ${isRTL ? 'ml-2' : 'mr-2'}`}>
          {selectedCountry === 'saudi-arabia' ? '🇸🇦 Saudi Arabia' : '🌍 Global'}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {mode === 'advanced' ? (
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
          <div className={`flex items-center justify-between p-4 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{t.advancedTitle}</h3>
            </div>
            {renderAdvancedControls()}
          </div>

          <TabsList className={`grid w-full grid-cols-2 ${isRTL ? 'rtl' : ''}`}>
            <TabsTrigger value="chat" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MessageSquare className="h-4 w-4" />
              {t.chatTab}
            </TabsTrigger>
            <TabsTrigger value="settings" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Settings className="h-4 w-4" />
              {t.settingsTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            {renderChatContent()}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 p-4">
            {renderAdvancedSettings()}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="flex flex-col h-full">
          <div className={`flex items-center justify-between p-4 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{t.standardTitle}</h3>
            </div>
            {canGenerateDocument && (
              <Button 
                onClick={generateDocuments}
                disabled={isLoading}
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {t.generateDocument}
              </Button>
            )}
          </div>
          {renderChatContent()}
        </Card>
      )}
    </div>
  )

  function renderChatContent() {
    return (
      <>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                } gap-2`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white dark:bg-blue-500' 
                    : message.role === 'system'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : message.role === 'system' ? (
                    <Settings className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                      : message.role === 'system'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-200 dark:text-gray-100'
                  }`}
                  style={{
                    direction: isArabicText(message.content) ? 'rtl' : 'ltr',
                    textAlign: isArabicText(message.content) ? 'right' : 'left'
                  }}
                >
                  {message.isTyping ? (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p 
                        className="text-sm whitespace-pre-wrap"
                        style={{
                          direction: isArabicText(message.content) ? 'rtl' : 'ltr',
                          textAlign: isArabicText(message.content) ? 'right' : 'left'
                        }}
                      >
                        {message.content}
                      </p>
                      
                      {/* Show metadata for advanced mode */}
                      {mode === 'advanced' && message.metadata && (
                        <div className="mt-2 text-xs opacity-75 space-y-1">
                          {message.metadata.planningStep && (
                            <Badge variant="outline" className="mr-1">
                              {message.metadata.planningStep}
                            </Badge>
                          )}
                          {message.metadata.confidence && (
                            <Badge variant="secondary" className="mr-1">
                              {message.metadata.confidence}% confidence
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' 
                      ? 'text-blue-100 dark:text-blue-200' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              disabled={isLoading}
              className={`flex-1 min-h-[40px] max-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '40px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <Button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="mb-0"
            >
              {isLoading ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {mode === 'advanced' && canGenerateDocument && (
              <Button 
                onClick={generateDocuments}
                disabled={isLoading}
                size="sm"
                className="mb-0"
                variant="default"
              >
                <FileText className="h-4 w-4" />
                {t.generateDocuments}
              </Button>
            )}
          </div>
          <p className={`text-xs text-gray-500 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.sendHint}
          </p>
        </div>
      </>
    )
  }

  function renderAdvancedSettings() {
    return (
      <div className="space-y-6">
        <div>
          <h4 className={`font-semibold mb-3 ${isRTL ? 'text-right' : ''}`}>
            {t.countrySelector}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedCountry === 'saudi-arabia' ? 'default' : 'outline'}
              onClick={() => setSelectedCountry('saudi-arabia')}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <span>🇸🇦</span>
              Saudi Arabia
            </Button>
            <Button
              variant={selectedCountry === 'global' ? 'default' : 'outline'}
              onClick={() => setSelectedCountry('global')}
              className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Globe className="h-4 w-4" />
              Global
            </Button>
          </div>
          <p className={`text-xs text-muted-foreground mt-2 ${isRTL ? 'text-right' : ''}`}>
            {selectedCountry === 'saudi-arabia' 
              ? (isRTL ? 'سيتم استخدام الذكاء المتقدم للسوق السعودي' : 'Advanced Saudi market intelligence will be used')
              : (isRTL ? 'سيتم استخدام الذكاء العالمي للأسواق' : 'Global market intelligence will be used')
            }
          </p>
        </div>

        {planningSession && (
          <div>
            <h4 className={`font-semibold mb-3 ${isRTL ? 'text-right' : ''}`}>
              {t.planningSteps}
            </h4>
            <div className="space-y-2">
              <div className={`text-sm ${isRTL ? 'text-right' : ''}`}>
                <span className="font-medium">{t.currentStep}: </span>
                <Badge variant="default">{planningSession.currentStep}</Badge>
              </div>
              <div className={`text-sm ${isRTL ? 'text-right' : ''}`}>
                <span className="font-medium">{t.completedSteps}: </span>
                <span>{planningSession.completedSteps.length}</span>
              </div>
              {planningSession.researchFindings.length > 0 && (
                <div className={`text-sm ${isRTL ? 'text-right' : ''}`}>
                  <span className="font-medium">{t.researchFindings}: </span>
                  <span>{planningSession.researchFindings.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
}