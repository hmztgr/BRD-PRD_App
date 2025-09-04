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
  projectId?: string
  country: string
  mode: 'advanced'
  messageHistory: Message[]
}

interface BusinessInformation {
  businessName: boolean
  businessIdea: boolean
  targetMarket: boolean
  industry: boolean
  location: boolean
  businessModel: boolean
  competitors: boolean
  financialProjections: boolean
  marketingStrategy: boolean
  operationalPlan: boolean
  riskAssessment: boolean
  legalRequirements: boolean
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, planningSessionId, projectId, country, messageHistory }: AdvancedConversationRequest = await req.json()

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

    // Load project context if projectId is provided
    let projectContext = null
    if (projectId) {
      try {
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            userId: session.user.id
          },
          include: {
            summaries: {
              orderBy: { createdAt: 'desc' },
              take: 3 // Get last 3 summaries for context
            },
            sessions: {
              orderBy: { startedAt: 'desc' },
              take: 1 // Get latest session data
            }
          }
        })
        
        if (project) {
          projectContext = {
            project: {
              id: project.id,
              name: project.name,
              description: project.description,
              industry: project.industry,
              stage: project.stage,
              confidence: project.confidence,
              totalTokens: project.totalTokens,
              metadata: project.metadata
            },
            summaries: project.summaries.map(s => ({
              summary: s.summary,
              messageRange: s.messageRange,
              createdAt: s.createdAt
            })),
            latestSession: project.sessions[0] ? {
              sessionData: project.sessions[0].sessionData,
              stage: project.sessions[0].stage,
              confidence: project.sessions[0].confidence
            } : null
          }
        }
      } catch (error) {
        console.error('Failed to load project context:', error)
        // Continue without project context
      }
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    })

    // Generate advanced AI response with planning capabilities and project context
    console.log('Starting AI generation at:', new Date().toISOString())
    const startTime = Date.now()
    const aiResponse = await generateAdvancedAIResponse(messageHistory, message, country, planningSessionId, projectContext)
    const endTime = Date.now()
    const processingTime = endTime - startTime
    console.log(`AI response generated in ${processingTime}ms (${(processingTime/1000).toFixed(2)}s) at:`, new Date().toISOString())
    
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

    // Update project if projectId exists (auto-save project state)
    if (projectId) {
      try {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            lastActivity: new Date(),
            stage: aiResponse.metadata?.planningStep || 'active',
            confidence: aiResponse.metadata?.confidence || 0,
            totalTokens: { increment: aiResponse.message.length / 4 }, // Approximate token count
            metadata: {
              ...projectContext?.project?.metadata,
              currentStep: aiResponse.metadata?.planningStep,
              lastConversationId: conversation.id,
              messageCount: messageHistory.length + 2,
              canGenerateDocument: aiResponse.canGenerateDocument,
              updatedAt: new Date().toISOString()
            }
          }
        })
      } catch (error) {
        console.error('Failed to update project auto-save:', error)
        // Continue without breaking the flow
      }
    }

    return NextResponse.json({
      message: aiResponse.message,
      conversationId: conversation.id,
      canGenerateDocument: aiResponse.canGenerateDocument,
      planningSession: aiResponse.planningSession,
      documentTypes: aiResponse.metadata?.documentTypes,
      countryContext: aiResponse.metadata?.countryContext,
      researchFindings: aiResponse.metadata?.researchFindings,
      planningStep: aiResponse.metadata?.planningStep,
      confidence: aiResponse.metadata?.confidence,
      // Timing and verification metrics
      processingMetrics: {
        totalTimeMs: processingTime,
        aiProcessingTimeMs: aiResponse.metadata?.processingTimeMs,
        geminiApiTimeMs: aiResponse.metadata?.geminiApiTimeMs,
        responseLength: aiResponse.metadata?.responseLength,
        responseHash: aiResponse.metadata?.responseHash,
        generatedAt: aiResponse.metadata?.generatedAt,
        isGenuineResponse: processingTime > 500 && aiResponse.metadata?.geminiApiTimeMs > 300 // Basic heuristic
      }
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
  planningSessionId?: string,
  projectContext?: any
) {
  const aiStartTime = Date.now()
  console.log('🤖 AI Generation Process Started:', {
    timestamp: new Date().toISOString(),
    userMessage: userMessage.substring(0, 50) + '...',
    messageHistoryLength: messageHistory.length,
    hasProjectContext: !!projectContext,
    country
  })
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    console.log('📡 Google Gemini API initialized, preparing prompt...')

    // Detect if user is writing in Arabic
    const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(userMessage)
    
    // Build conversation context for Gemini
    const conversationContext = messageHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n')

    // Build project context for AI
    let projectContextPrompt = ''
    if (projectContext) {
      const { project, summaries, latestSession } = projectContext
      
      projectContextPrompt = isArabic ? 
        `معلومات المشروع:
- اسم المشروع: ${project.name}
- الوصف: ${project.description || 'غير محدد'}
- الصناعة: ${project.industry || 'عام'}
- مرحلة المشروع: ${project.stage}
- مستوى الثقة: ${project.confidence}%
- إجمالي الرموز المستخدمة: ${project.totalTokens}

${summaries.length > 0 ? `
الملخصات السابقة:
${summaries.map((s, i) => `${i + 1}. ${s.summary} (النطاق: ${s.messageRange})`).join('\n')}
` : ''}

${latestSession ? `
بيانات الجلسة الأخيرة:
- المرحلة: ${latestSession.stage}
- مستوى الثقة: ${latestSession.confidence}%
${latestSession.sessionData ? `- بيانات إضافية: ${JSON.stringify(latestSession.sessionData)}` : ''}
` : ''}

` : 
        `Project Information:
- Project Name: ${project.name}
- Description: ${project.description || 'Not specified'}
- Industry: ${project.industry || 'General'}
- Project Stage: ${project.stage}
- Confidence Level: ${project.confidence}%
- Total Tokens Used: ${project.totalTokens}

${summaries.length > 0 ? `
Previous Summaries:
${summaries.map((s, i) => `${i + 1}. ${s.summary} (Range: ${s.messageRange})`).join('\n')}
` : ''}

${latestSession ? `
Latest Session Data:
- Stage: ${latestSession.stage}
- Confidence: ${latestSession.confidence}%
${latestSession.sessionData ? `- Additional Data: ${JSON.stringify(latestSession.sessionData)}` : ''}
` : ''}

`
    }

    // Advanced planning prompt based on country context
    const countryContext = country === 'saudi-arabia' ? 
      (isArabic ? 'السوق السعودي والبيئة التنظيمية' : 'Saudi Arabian market and regulatory environment') :
      (isArabic ? 'السوق العالمي' : 'global market context')

    const prompt = isArabic ? 
      `أنت مستشار أعمال متقدم متخصص في التخطيط الشامل للأعمال مع التركيز على ${countryContext}.

هدفك: إرشاد المستخدم عبر عملية تخطيط شاملة لإنشاء مجموعة كاملة من الوثائق المهنية.

${projectContextPrompt}

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

${projectContextPrompt}

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

    console.log('🚀 Sending request to Gemini API...')
    const geminiStartTime = Date.now()
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiMessage = response.text()
    
    const geminiEndTime = Date.now()
    const geminiDuration = geminiEndTime - geminiStartTime
    console.log(`⚡ Gemini API response received in ${geminiDuration}ms (${(geminiDuration/1000).toFixed(2)}s)`)
    console.log('📝 AI response length:', aiMessage.length, 'characters')
    console.log('🔍 Response preview:', aiMessage.substring(0, 100) + '...')

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

    // Analyze business information completeness
    const businessInfo = analyzeBusinessInformation(messageHistory, userMessage)
    const realConfidence = calculateRealisticConfidence(businessInfo, messageHistory, userMessage)
    
    // Advanced readiness logic
    const aiIndicatesReady = aiMessage.toLowerCase().includes("ready to generate") || 
                            aiMessage.toLowerCase().includes("complete document suite") ||
                            aiMessage.toLowerCase().includes("comprehensive planning") ||
                            aiMessage.includes("مستعد لإنشاء") ||
                            aiMessage.includes("مجموعة المستندات") ||
                            aiMessage.includes("التخطيط الشامل")
    
    const canGenerateDocument = (realConfidence >= 65 && aiIndicatesReady) || realConfidence >= 80

    const metadata = {
      documentTypes: ['BRD', 'PRD', 'Business Plan', 'Feasibility Study', 'Investor Pitch'],
      countryContext: country,
      researchFindings: [],
      planningStep: currentStep,
      confidence: realConfidence,
      processingTimeMs: Date.now() - aiStartTime,
      geminiApiTimeMs: geminiDuration,
      responseLength: aiMessage.length,
      responseHash: aiMessage.substring(0, 32), // First 32 chars as uniqueness check
      generatedAt: new Date().toISOString()
    }
    
    const totalProcessingTime = Date.now() - aiStartTime
    console.log(`✅ AI Generation Complete: Total time ${totalProcessingTime}ms (${(totalProcessingTime/1000).toFixed(2)}s)`)
    console.log('🎯 Final confidence level:', realConfidence + '%')
    console.log('📊 Response metadata:', { 
      length: aiMessage.length,
      canGenerate: canGenerateDocument,
      step: currentStep,
      hash: metadata.responseHash
    })

    return {
      message: aiMessage,
      canGenerateDocument,
      planningSession,
      metadata
    }

  } catch (error) {
    const errorTime = Date.now() - aiStartTime
    console.error('❌ Advanced Gemini API error after', errorTime + 'ms:', error)
    
    // Check if it's an API key issue
    const isApiKeyError = error instanceof Error && 
      (error.message.includes('API key') || error.message.includes('authentication'))
    
    console.error('🔐 API Key Status:', {
      hasApiKey: !!process.env.GEMINI_API_KEY,
      keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
      isApiKeyError,
      errorMessage: error instanceof Error ? error.message : String(error)
    })
    
    return {
      message: isApiKeyError 
        ? "There's an issue with the AI system configuration. Please contact support."
        : "I'm having trouble connecting to the advanced planning system right now. Can you please try again?",
      canGenerateDocument: false,
      planningSession: null,
      metadata: {
        documentTypes: [],
        countryContext: country,
        researchFindings: [],
        planningStep: 'Error Recovery',
        confidence: 0,
        processingTimeMs: errorTime,
        error: error instanceof Error ? error.message : String(error),
        generatedAt: new Date().toISOString()
      }
    }
  }
}

/**
 * Analyzes message content to determine what business information has been gathered
 */
function analyzeBusinessInformation(messageHistory: Message[], currentMessage: string): BusinessInformation {
  const allMessages = messageHistory.map(m => m.content).join(' ') + ' ' + currentMessage
  const lowerCaseContent = allMessages.toLowerCase()
  
  return {
    businessName: /\b(company name|business name|called|named|brand)\b/.test(lowerCaseContent) ||
                  /\b[A-Z][a-z]+\s+(Inc|LLC|Corp|Ltd|Co)\b/.test(allMessages),
    
    businessIdea: /(coffee|restaurant|shop|store|service|product|app|platform|cart|food truck|mobile|business idea)/.test(lowerCaseContent) &&
                  currentMessage.trim().length > 5,
    
    targetMarket: /(target|customer|audience|market|demographic|age|gender|students|professionals|families)/.test(lowerCaseContent),
    
    industry: /(coffee|food|tech|retail|healthcare|education|finance|restaurant|hospitality|automotive|real estate)/.test(lowerCaseContent),
    
    location: /(riyadh|saudi|arabia|jeddah|dammam|location|city|area|neighborhood|mall|street|downtown)/.test(lowerCaseContent),
    
    businessModel: /(subscription|b2b|b2c|marketplace|freemium|revenue|pricing|model|how.*make.*money|profit)/.test(lowerCaseContent),
    
    competitors: /(competitor|competition|rival|similar|compare|vs|against|market leader|alternative)/.test(lowerCaseContent),
    
    financialProjections: /(budget|cost|price|revenue|profit|investment|funding|money|capital|expense|income|\$|SAR|riyal)/.test(lowerCaseContent),
    
    marketingStrategy: /(marketing|promotion|advertising|social media|facebook|instagram|twitter|customer acquisition)/.test(lowerCaseContent),
    
    operationalPlan: /(operation|staff|employee|supplier|logistics|process|workflow|daily|schedule|hours)/.test(lowerCaseContent),
    
    riskAssessment: /(risk|challenge|problem|issue|threat|concern|difficulty|obstacle|regulation|permit)/.test(lowerCaseContent),
    
    legalRequirements: /(license|permit|legal|law|regulation|compliance|registration|tax|zakat|ministry)/.test(lowerCaseContent)
  }
}

/**
 * Calculates realistic confidence based on actual business information gathered
 */
function calculateRealisticConfidence(businessInfo: BusinessInformation, messageHistory: Message[], currentMessage: string): number {
  // Define weights for each information category (totals to 100)
  const weights = {
    businessName: 8,
    businessIdea: 20,     // Most important
    targetMarket: 15,     // Very important
    industry: 10,
    location: 8,
    businessModel: 12,    // Important for planning
    competitors: 8,
    financialProjections: 15, // Very important
    marketingStrategy: 8,
    operationalPlan: 8,
    riskAssessment: 5,
    legalRequirements: 3
  }
  
  let confidence = 0
  
  // Add confidence based on completed information categories
  Object.keys(businessInfo).forEach(key => {
    if (businessInfo[key as keyof BusinessInformation]) {
      confidence += weights[key as keyof typeof weights]
    }
  })
  
  // Message quality multiplier
  const messageLength = currentMessage.trim().length
  let qualityMultiplier = 1
  
  if (messageLength < 20) {
    qualityMultiplier = 0.7  // Short messages get reduced confidence
  } else if (messageLength > 100) {
    qualityMultiplier = 1.2  // Detailed messages get bonus confidence
  }
  
  // Apply quality multiplier but cap the bonus
  confidence = Math.min(confidence * qualityMultiplier, confidence + 10)
  
  // Handle greetings and non-business messages FIRST
  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|سلام|مرحبا|أهلا)$/i.test(currentMessage.trim())
  const isNonBusiness = messageLength < 5 || 
                        /^(thanks|thank you|ok|okay|yes|no|sure|الشكر|شكرا|نعم|لا|حسنا)$/i.test(currentMessage.trim())
  
  if (isGreeting || isNonBusiness) {
    // For greetings and non-business messages, confidence should stay at 0%
    // Only give minimal progression if there's actual business content from before
    const hasAnyBusinessInfo = Object.values(businessInfo).some(value => value)
    return hasAnyBusinessInfo ? Math.min(confidence, 2) : 0
  }
  
  // Only add conversation bonus for business-related messages
  const conversationBonus = Math.min(messageHistory.length * 0.5, 5) // Smaller bonus
  confidence += conversationBonus
  
  // Never exceed 95% (there's always some uncertainty)
  return Math.min(Math.round(confidence), 95)
}