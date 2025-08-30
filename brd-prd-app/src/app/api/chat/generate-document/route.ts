import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await req.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Get conversation and messages
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

    const startTime = Date.now()
    
    // Generate document using conversation history
    const documentData = await generateDocumentFromConversation(conversation.messages)
    
    const generationTime = Date.now() - startTime

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title: documentData.title,
        type: documentData.type,
        content: documentData.content,
        status: 'generated',
        language: documentData.language || 'en',
        tokensUsed: documentData.tokensUsed,
        generationTime,
        metadata: {
          conversationId,
          model: documentData.model,
          generatedAt: new Date()
        }
      }
    })

    // Update conversation status
    const currentMetadata = conversation.metadata as Record<string, unknown> || {}
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'document_generated',
        metadata: {
          ...currentMetadata,
          documentId: document.id,
          completedAt: new Date()
        }
      }
    })

    return NextResponse.json({
      documentId: document.id,
      documentType: documentData.type,
      tokensUsed: documentData.tokensUsed,
      generationTime
    })

  } catch (error) {
    console.error('Document generation API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}

interface MessageRecord {
  id: string
  role: string
  content: string
  createdAt: Date
  conversationId: string
}

async function generateDocumentFromConversation(messages: MessageRecord[]) {
  const conversationText = messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
    .join('\n\n')

  // Detect if conversation is primarily in Arabic
  const arabicContent = messages.filter(msg => /[\u0600-\u06FF\u0750-\u077F]/.test(msg.content))
  const isArabicConversation = arabicContent.length > messages.length * 0.3

  const systemPrompt = isArabicConversation ? `أنت محلل أعمال خبير. بناءً على المحادثة المقدمة، قم بإنشاء وثيقة متطلبات العمل (BRD) أو وثيقة متطلبات المنتج (PRD) شاملة.

قم بتنسيق الوثيقة بالهيكل التالي:

# [اسم المشروع] - وثيقة متطلبات العمل

## 1. الملخص التنفيذي
نظرة عامة موجزة على المشروع والأهداف والنتائج المتوقعة.

## 2. نظرة عامة على المشروع
- **اسم المشروع:** 
- **وصف المشروع:**
- **الأهداف التجارية:**
- **معايير النجاح:**

## 3. تحليل أصحاب المصلحة
- **أصحاب المصلحة الأساسيون:**
- **أصحاب المصلحة الثانويون:**
- **المستخدمون النهائيون:**

## 4. متطلبات العمل
### 4.1 المتطلبات الوظيفية
قائمة بالميزات والقدرات المحددة التي يجب أن يوفرها النظام.

### 4.2 المتطلبات غير الوظيفية
- متطلبات الأداء
- متطلبات الأمان
- متطلبات قابلية التوسع
- متطلبات سهولة الاستخدام

## 5. قصص المستخدم ومعايير القبول
قصص المستخدم المفصلة مع معايير القبول.

## 6. الاعتبارات التقنية
- تفضيلات المجموعة التقنية
- متطلبات التكامل
- متطلبات البنية التحتية

## 7. قيود المشروع
- الجدول الزمني
- الميزانية
- الموارد
- القيود التقنية

## 8. تقييم المخاطر
المخاطر المحتملة واستراتيجيات التخفيف.

## 9. مقاييس النجاح ومؤشرات الأداء
كيف سيتم قياس النجاح.

## 10. خارطة طريق التنفيذ
المراحل عالية المستوى والمعالم.

---

**نسخة الوثيقة:** 1.0  
**تاريخ الإنشاء:** ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}  
**الحالة:** مسودة  

بناءً على المحادثة، قم باستخراج المعلومات ذات الصلة وإنشاء وثيقة مهنية ومفصلة. استخدم لغة مهنية وتأكد من أن جميع الأقسام شاملة.` : 
    `You are an expert business analyst. Based on the conversation provided, create a comprehensive Business Requirements Document (BRD) or Product Requirements Document (PRD).

Format the document with the following structure:

# [Project Name] - Business Requirements Document

## 1. Executive Summary
Brief overview of the project, objectives, and expected outcomes.

## 2. Project Overview
- **Project Name:** 
- **Project Description:**
- **Business Objectives:**
- **Success Criteria:**

## 3. Stakeholder Analysis
- **Primary Stakeholders:**
- **Secondary Stakeholders:**
- **End Users:**

## 4. Business Requirements
### 4.1 Functional Requirements
List specific features and capabilities the system must provide.

### 4.2 Non-Functional Requirements
- Performance requirements
- Security requirements
- Scalability requirements
- Usability requirements

## 5. User Stories & Acceptance Criteria
Detailed user stories with acceptance criteria.

## 6. Technical Considerations
- Technology stack preferences
- Integration requirements
- Infrastructure requirements

## 7. Project Constraints
- Timeline
- Budget
- Resources
- Technical limitations

## 8. Risk Assessment
Potential risks and mitigation strategies.

## 9. Success Metrics & KPIs
How success will be measured.

## 10. Implementation Roadmap
High-level phases and milestones.

---

**Document Version:** 1.0  
**Created:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  
**Status:** Draft  

Based on the conversation, extract relevant information and create a professional, detailed document. Use professional language and ensure all sections are comprehensive.`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `${systemPrompt}\n\nPlease create a professional BRD based on this conversation:\n\n${conversationText}`
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    // Estimate tokens (Gemini doesn't provide exact count)
    const tokensUsed = Math.ceil(content.length / 4)

    // Extract title from the content
    const titleMatch = content.match(/^#\s*(.+?)(?:\s*-\s*Business Requirements Document)?$/m)
    const title = titleMatch ? titleMatch[1].trim() : 'Business Requirements Document'

    return {
      title,
      type: 'BRD',
      content,
      language: isArabicConversation ? 'ar' : 'en',
      tokensUsed,
      model: 'gemini-1.5-flash'
    }

  } catch (error) {
    console.error('Document generation error:', error)
    
    // Fallback document
    const fallbackTitle = 'Project Requirements Document'
    const fallbackContent = `# ${fallbackTitle}

## Executive Summary
This document outlines the requirements for the project discussed in our conversation.

## Project Overview
Based on our discussion, this project involves creating a solution that addresses the specified business needs.

## Next Steps
Please review this document and provide additional details to complete the requirements analysis.

---
*This document was generated automatically and requires review and completion.*`

    return {
      title: fallbackTitle,
      type: 'BRD',
      content: fallbackContent,
      language: 'en',
      tokensUsed: 0,
      model: 'fallback'
    }
  }
}