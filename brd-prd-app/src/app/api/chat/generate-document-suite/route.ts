import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface DocumentSuiteRequest {
  conversationId: string
  planningSessionId?: string
  country: string
  mode: 'advanced'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, planningSessionId, country }: DocumentSuiteRequest = await req.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Get conversation and its messages
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check user's token limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const estimatedTokens = 15000 // Conservative estimate for full document suite
    if (user.tokensUsed + estimatedTokens > user.tokensLimit) {
      return NextResponse.json({ 
        error: 'Insufficient tokens for document suite generation',
        tokensNeeded: estimatedTokens,
        tokensRemaining: user.tokensLimit - user.tokensUsed
      }, { status: 429 })
    }

    // Extract business context from conversation
    const businessContext = extractBusinessContext(conversation.messages)
    
    // Generate document suite
    const documentSuite = await generateDocumentSuite(businessContext, country)
    
    // Save documents to database
    const savedDocuments = []
    let totalTokensUsed = 0

    for (const doc of documentSuite.documents) {
      const savedDoc = await prisma.document.create({
        data: {
          title: doc.title,
          content: doc.content,
          type: doc.type.toLowerCase(),
          tokensUsed: doc.tokensUsed,
          aiModel: 'gemini-1.5-flash',
          generationTime: doc.generationTime,
          userId: session.user.id,
          metadata: {
            conversationId,
            planningSessionId,
            country,
            partOfSuite: true,
            suiteId: documentSuite.id
          }
        }
      })
      savedDocuments.push(savedDoc)
      totalTokensUsed += doc.tokensUsed
    }

    // Update user's token usage
    await prisma.user.update({
      where: { id: session.user.id },
      data: { tokensUsed: user.tokensUsed + totalTokensUsed }
    })

    // Update conversation status
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'document_generated',
        metadata: {
          ...((conversation.metadata as Record<string, unknown>) || {}),
          documentSuiteGenerated: true,
          documentSuiteId: documentSuite.id,
          totalTokensUsed
        }
      }
    })

    return NextResponse.json({
      success: true,
      documentSuiteId: documentSuite.id,
      documentCount: documentSuite.documents.length,
      totalTokensUsed,
      documents: savedDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type
      })),
      message: `Successfully generated ${documentSuite.documents.length} professional documents`
    })

  } catch (error) {
    console.error('Document suite generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate document suite' },
      { status: 500 }
    )
  }
}

function extractBusinessContext(messages: any[]): any {
  // Extract key business information from conversation messages
  const userMessages = messages.filter(msg => msg.role === 'user').map(msg => msg.content).join(' ')
  
  // Simple context extraction (this could be enhanced with more sophisticated NLP)
  return {
    businessDescription: userMessages.substring(0, 500),
    fullConversation: userMessages,
    messageCount: messages.length
  }
}

async function generateDocumentSuite(businessContext: any, country: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(businessContext.businessDescription)
  const countryContext = country === 'saudi-arabia' ? 
    (isArabic ? 'السعودية' : 'Saudi Arabia') : 
    (isArabic ? 'السوق العالمي' : 'Global Market')

  const suiteId = `suite_${Date.now()}`
  const documents = []

  // Define document types for advanced mode suite
  const documentTypes = [
    { type: 'BRD', title: isArabic ? 'وثيقة متطلبات الأعمال' : 'Business Requirements Document' },
    { type: 'PRD', title: isArabic ? 'وثيقة متطلبات المنتج' : 'Product Requirements Document' },
    { type: 'Business Plan', title: isArabic ? 'خطة الأعمال' : 'Business Plan' },
    { type: 'Feasibility Study', title: isArabic ? 'دراسة الجدوى' : 'Feasibility Study' },
    { type: 'Investor Pitch', title: isArabic ? 'عرض المستثمرين' : 'Investor Pitch Deck' }
  ]

  for (const docType of documentTypes) {
    try {
      const startTime = Date.now()
      
      const prompt = isArabic ? 
        `بناءً على المحادثة التالية حول فكرة المشروع، أنشئ ${docType.title} شاملة ومهنية:

السياق التجاري: ${businessContext.businessDescription}
السوق المستهدف: ${countryContext}

يجب أن تكون الوثيقة:
1. مهنية ومفصلة
2. تتبع أفضل الممارسات في الصناعة
3. تراعي البيئة التجارية المحلية
4. تحتوي على أقسام واضحة ومنظمة
5. تقدم توصيات قابلة للتنفيذ

أنشئ وثيقة كاملة بتفاصيل شاملة.` :
        `Based on the following business conversation and context, create a comprehensive and professional ${docType.title}:

Business Context: ${businessContext.businessDescription}
Target Market: ${countryContext}

The document should be:
1. Professional and detailed
2. Follow industry best practices
3. Consider local business environment
4. Have clear, organized sections
5. Provide actionable recommendations

Create a complete document with comprehensive details.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const content = response.text()
      
      const generationTime = Date.now() - startTime
      const tokensUsed = Math.floor(content.length / 4) // Rough estimate

      documents.push({
        id: `${suiteId}_${docType.type.toLowerCase().replace(' ', '_')}`,
        type: docType.type,
        title: `${docType.title} - ${businessContext.businessDescription.substring(0, 50)}...`,
        content,
        tokensUsed,
        generationTime
      })

      // Small delay between generations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`Error generating ${docType.type}:`, error)
      // Continue with other documents even if one fails
    }
  }

  return {
    id: suiteId,
    documents,
    generatedAt: new Date(),
    totalDocuments: documents.length
  }
}