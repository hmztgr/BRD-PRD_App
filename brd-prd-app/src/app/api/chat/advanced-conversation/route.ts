import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
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

interface AdvancedConversationRequest {
  message: string
  conversationId?: string
  planningSessionId?: string
  country: string
  mode: 'advanced'
  messageHistory: Message[]
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, planningSessionId, country, messageHistory }: AdvancedConversationRequest = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Find or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id
        }
      })
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          status: 'active',
          metadata: {
            mode: 'advanced',
            country,
            planningSessionId
          }
        }
      })
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    })

    // Generate advanced AI response with planning capabilities
    const aiResponse = await generateAdvancedAIResponse(messageHistory, message, country, planningSessionId)
    
    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.message,
        metadata: aiResponse.metadata
      }
    })

    // Update conversation status
    const currentMetadata = conversation.metadata as Record<string, unknown> || {}
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: aiResponse.canGenerateDocument ? 'ready_for_generation' : 'active',
        metadata: {
          ...currentMetadata,
          lastActivity: new Date(),
          messageCount: messageHistory.length + 2,
          planningSession: aiResponse.planningSession ? JSON.parse(JSON.stringify(aiResponse.planningSession)) : null
        }
      }
    })

    return NextResponse.json({
      message: aiResponse.message,
      conversationId: conversation.id,
      canGenerateDocument: aiResponse.canGenerateDocument,
      planningSession: aiResponse.planningSession,
      documentTypes: aiResponse.metadata?.documentTypes,
      countryContext: aiResponse.metadata?.countryContext,
      researchFindings: aiResponse.metadata?.researchFindings,
      planningStep: aiResponse.metadata?.planningStep,
      confidence: aiResponse.metadata?.confidence
    })

  } catch (error) {
    console.error('Advanced conversation API error:', error)
    return NextResponse.json(
      { error: 'Failed to process advanced conversation' },
      { status: 500 }
    )
  }
}

async function generateAdvancedAIResponse(
  messageHistory: Message[], 
  userMessage: string, 
  country: string,
  planningSessionId?: string
) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Detect if user is writing in Arabic
    const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(userMessage)
    
    // Build conversation context for Gemini
    const conversationContext = messageHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n')

    // Advanced planning prompt based on country context
    const countryContext = country === 'saudi-arabia' ? 
      (isArabic ? 'السوق السعودي والبيئة التنظيمية' : 'Saudi Arabian market and regulatory environment') :
      (isArabic ? 'السوق العالمي' : 'global market context')

    const prompt = isArabic ? 
      `أنت مستشار أعمال متقدم متخصص في التخطيط الشامل للأعمال مع التركيز على ${countryContext}.

هدفك: إرشاد المستخدم عبر عملية تخطيط شاملة لإنشاء مجموعة كاملة من الوثائق المهنية.

مراحل التخطيط المتقدم:
1. فهم الفكرة التجارية والرؤية
2. تحليل السوق والجمهور المستهدف  
3. التخطيط الاستراتيجي والميزة التنافسية
4. النمذجة المالية والتوقعات
5. خطة التسويق والعمليات
6. تحليل المخاطر والحلول
7. مراجعة شاملة وإنشاء المجموعة

${conversationContext ? `المحادثة السابقة:\n${conversationContext}\n\n` : ''}رسالة المستخدم الحالية: ${userMessage}

المرحلة الحالية: تحليل وجمع المتطلبات
الثقة: 85%

الإرشادات:
- اسأل أسئلة عميقة ومحددة حول كل جانب من جوانب الأعمال
- قدم رؤى استراتيجية بناءً على السوق المحدد
- اجمع معلومات كافية لإنشاء: BRD، PRD، خطة العمل، دراسة الجدوى، عرض المستثمرين
- أشر عندما تكون مستعداً لإنشاء مجموعة المستندات الكاملة

يرجى الرد بشكل مهني ومتقدم.` :
      `You are an advanced business consultant specializing in comprehensive business planning with focus on ${countryContext}.

Your goal: Guide the user through a comprehensive planning process to create a complete suite of professional documents.

Advanced Planning Stages:
1. Understanding business idea and vision
2. Market analysis and target audience
3. Strategic planning and competitive advantage
4. Financial modeling and projections
5. Marketing and operations plan
6. Risk analysis and mitigation
7. Comprehensive review and suite generation

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Current user message: ${userMessage}

Current Stage: Analysis and Requirements Gathering
Confidence: 85%

Guidelines:
- Ask deep, specific questions about every aspect of the business
- Provide strategic insights based on the specified market
- Gather enough information to create: BRD, PRD, Business Plan, Feasibility Study, Investor Pitch
- Indicate when you're ready to generate the complete document suite

Please respond professionally and comprehensively.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiMessage = response.text()

    // Determine current planning step and metadata
    const conversationLength = messageHistory.length + 1
    const planningSteps = [
      'Understanding Business Concept',
      'Market Analysis', 
      'Strategic Planning',
      'Financial Planning',
      'Marketing Strategy',
      'Risk Assessment',
      'Final Review'
    ]
    
    const currentStepIndex = Math.min(Math.floor(conversationLength / 3), planningSteps.length - 1)
    const currentStep = planningSteps[currentStepIndex]
    
    // Simulate planning session data
    const planningSession: PlanningSession = {
      id: planningSessionId || `planning_${Date.now()}`,
      businessIdea: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage,
      country,
      industry: 'Technology', // Would be extracted from conversation
      currentStep,
      completedSteps: planningSteps.slice(0, currentStepIndex),
      requiredDocuments: ['BRD', 'PRD', 'Business Plan', 'Feasibility Study', 'Investor Pitch'],
      collectedData: { messageCount: conversationLength },
      researchFindings: [], // Would be populated from research
      status: 'active'
    }

    // Advanced readiness logic
    const aiIndicatesReady = aiMessage.toLowerCase().includes("ready to generate") || 
                            aiMessage.toLowerCase().includes("complete document suite") ||
                            aiMessage.toLowerCase().includes("comprehensive planning") ||
                            aiMessage.includes("مستعد لإنشاء") ||
                            aiMessage.includes("مجموعة المستندات") ||
                            aiMessage.includes("التخطيط الشامل")
    
    const canGenerateDocument = (conversationLength >= 6 && aiIndicatesReady) || conversationLength >= 12

    const metadata = {
      documentTypes: ['BRD', 'PRD', 'Business Plan', 'Feasibility Study', 'Investor Pitch'],
      countryContext: country,
      researchFindings: [],
      planningStep: currentStep,
      confidence: Math.min(70 + (conversationLength * 3), 95)
    }

    return {
      message: aiMessage,
      canGenerateDocument,
      planningSession,
      metadata
    }

  } catch (error) {
    console.error('Advanced Gemini API error:', error)
    
    return {
      message: "I'm having trouble connecting to the advanced planning system right now. Can you please try again?",
      canGenerateDocument: false,
      planningSession: null,
      metadata: {
        documentTypes: [],
        countryContext: country,
        researchFindings: [],
        planningStep: 'Error Recovery',
        confidence: 0
      }
    }
  }
}