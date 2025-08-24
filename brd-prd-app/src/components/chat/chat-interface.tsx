'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Send, Bot, User, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

// Helper function to detect Arabic text
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text)
}

interface ChatInterfaceProps {
  userName: string
  locale?: string
}

// Static translations
const translations = {
  en: {
    title: 'AI Document Assistant',
    welcomeMessage: (name: string) => `Hello ${name}! I'm here to help you create professional business documents. Tell me about your project idea and I'll ask clarifying questions to ensure we capture all the important details.`,
    placeholder: 'Tell me about your project idea...',
    sendHint: 'Press Enter to send • Shift+Enter for new line',
    send: 'Send',
    generating: 'Generating...',
    generateDocument: 'Generate Document',
    newChat: 'New Chat'
  },
  ar: {
    title: 'مساعد الذكاء الاصطناعي للمستندات',
    welcomeMessage: (name: string) => `مرحباً ${name}! أنا هنا لمساعدتك في إنشاء مستندات أعمال احترافية. أخبرني عن فكرة مشروعك وسأطرح أسئلة توضيحية للتأكد من أننا نلتقط جميع التفاصيل المهمة.`,
    placeholder: 'أخبرني عن فكرة مشروعك...',
    sendHint: 'اضغط Enter للإرسال • Shift+Enter للسطر الجديد',
    send: 'إرسال',
    generating: 'جاري الإنشاء...',
    generateDocument: 'إنشاء المستند',
    newChat: 'محادثة جديدة'
  }
}

export function ChatInterface({ userName, locale = 'en' }: ChatInterfaceProps) {
  const router = useRouter()
  const t = translations[locale as keyof typeof translations] || translations.en;
  const isRTL = locale === 'ar';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t.welcomeMessage(userName),
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [canGenerateDocument, setCanGenerateDocument] = useState(false)
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
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
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
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setConversationId(data.conversationId)
      setCanGenerateDocument(data.canGenerateDocument || false)

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

  const generateDocument = async () => {
    if (!conversationId || !canGenerateDocument) return

    setIsLoading(true)
    
    // Detect conversation language for generating message
    const hasArabicInConversation = messages.some(msg => isArabicText(msg.content))
    
    const generatingMessage: Message = {
      id: 'generating',
      role: 'assistant',
      content: isRTL ? 
        'ممتاز! لدي كل المعلومات التي أحتاجها. دعني أنشئ وثيقتك المهنية الآن...' :
        'Perfect! I have all the information I need. Let me generate your professional document now...',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, generatingMessage])

    try {
      const response = await fetch('/api/chat/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate document')
      }

      // Detect conversation language to respond appropriately
      const hasArabicInConversation = messages.some(msg => isArabicText(msg.content))
      
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: isRTL ? 
          `رائع! لقد أنشأت وثيقة ${data.documentType} بنجاح. تتضمن الوثيقة جميع التفاصيل التي ناقشناها وتتبع المعايير المهنية. يمكنك الآن عرضها وتنزيلها.` :
          `Great! I've generated your ${data.documentType} successfully. The document includes all the details we discussed and follows professional standards. You can view and download it now.`,
        timestamp: new Date()
      }

      setMessages(prev => prev.filter(m => m.id !== 'generating').concat(successMessage))
      
      // Navigate to the document page
      router.push(`/documents/${data.documentId}`)

    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== 'generating'))
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I encountered an error while generating the document: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-[600px] max-w-4xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between p-4 border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t.title}</h3>
        </div>
        {canGenerateDocument && (
          <Button 
            onClick={generateDocument}
            disabled={isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {t.generateDocument}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
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
                  <p 
                    className="text-sm whitespace-pre-wrap"
                    style={{
                      direction: isArabicText(message.content) ? 'rtl' : 'ltr',
                      textAlign: isArabicText(message.content) ? 'right' : 'left'
                    }}
                  >
                    {message.content}
                  </p>
                )}
                
                <p className={`text-xs mt-1 ${
                  message.role === 'user' 
                    ? 'text-blue-100' 
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
        </div>
        <p className={`text-xs text-gray-500 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t.sendHint}
        </p>
      </div>
    </Card>
  )
}