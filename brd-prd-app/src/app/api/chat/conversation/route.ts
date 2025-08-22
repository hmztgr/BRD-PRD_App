import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationRequest {
  message: string
  conversationId?: string
  messageHistory: Message[]
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationId, messageHistory }: ConversationRequest = await req.json()

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
          metadata: {}
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

    // Analyze conversation progress and generate AI response
    const aiResponse = await generateAIResponse(messageHistory, message)
    
    // Save AI response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.message
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
          messageCount: messageHistory.length + 2
        }
      }
    })

    return NextResponse.json({
      message: aiResponse.message,
      conversationId: conversation.id,
      canGenerateDocument: aiResponse.canGenerateDocument
    })

  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    )
  }
}

async function generateAIResponse(messageHistory: Message[], userMessage: string) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Detect if user is writing in Arabic
    const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(userMessage)
    
    // Build conversation context for Gemini
    const conversationContext = messageHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n')

    const prompt = isArabic ? 
      `أنت محلل أعمال متخصص في جمع المتطلبات لإنشاء الوثائق المهنية (BRD/PRD).

هدفك: طرح أسئلة مركزة لفهم المشروع بشكل كامل، ثم الإشارة عندما يكون لديك معلومات كافية.

${conversationContext ? `المحادثة السابقة:\n${conversationContext}\n\n` : ''}رسالة المستخدم الحالية: ${userMessage}

الإرشادات:
- إذا قال المستخدم "هذا كل شيء" أو "لا يوجد شيء آخر" أو ما شابه، ولديك معلومات أساسية عن المشروع، أجب بـ: "ممتاز! لدي كل المعلومات التي أحتاجها. أنا مستعد لإنشاء وثيقتك المهنية الآن."
- إذا كان لديك معلومات كافية (نوع المشروع، الأهداف، الميزات، المستخدمين)، اسأل إذا كان هناك شيء آخر لإضافته واذكر: "لدي معلومات كافية لإنشاء وثيقة. يمكنك الضغط على زر 'إنشاء الوثيقة' للحصول على وثيقتك، ولكن إذا كان لديك تفاصيل أخرى فسيساعدني ذلك في إنشاء وثيقة أفضل."
- إذا قالوا لا/لا يوجد شيء آخر، أشر إلى أنك مستعد لإنشاء الوثيقة
- كن ودودًا ومفيدًا في المحادثة

يرجى الرد بشكل طبيعي بناءً على سياق المحادثة.` :
      `You are a business analyst helping to gather requirements for creating professional documents (BRD/PRD). 

Your goal: Ask focused questions to understand the project completely, then indicate when you have enough information.

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}Current user message: ${userMessage}

Guidelines:
- If the user says "that's everything", "nothing else", "that's all", or similar, AND you have basic project info, respond with: "Perfect! I have all the information I need. I'm ready to generate your professional document now."
- If you have enough info (project type, goals, features, users), ask if there's anything else to add and mention: "I have enough information to generate a document. You can press the 'Generate Document' button to get your document, but if you have more details it would help me create a better document."
- If they say no/nothing else, indicate you're ready to generate the document
- Be conversational and helpful

Please respond naturally based on the conversation context.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiMessage = response.text()

    // Determine if ready to generate document based on AI response and conversation length
    const conversationLength = messageHistory.length + 1
    const aiIndicatesReady = aiMessage.toLowerCase().includes("ready to generate") || 
                            aiMessage.toLowerCase().includes("i have all the information") ||
                            aiMessage.toLowerCase().includes("enough information") ||
                            aiMessage.includes("مستعد لإنشاء") ||
                            aiMessage.includes("لدي كل المعلومات") ||
                            aiMessage.includes("معلومات كافية")
    const canGenerateDocument = (conversationLength >= 4 && aiIndicatesReady) || conversationLength >= 8

    return {
      message: aiMessage,
      canGenerateDocument
    }

  } catch (error) {
    console.error('Gemini API error:', error)
    
    return {
      message: "I'm having trouble connecting right now. Can you please try again?",
      canGenerateDocument: false
    }
  }
}