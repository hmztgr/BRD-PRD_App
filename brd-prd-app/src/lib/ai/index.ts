import { generateWithOpenAI } from './openai'
import type { GenerationOptions, GenerationResult } from './openai'
import { generateWithGemini } from './gemini'
import { prisma } from '@/lib/prisma'

export type AIProvider = 'openai' | 'gemini'

export interface DocumentGenerationRequest extends GenerationOptions {
  userId: string
  uploadedFiles?: string[] // Array of file contents
}

export interface AnalysisResult {
  hasEnoughInfo: boolean
  extractedInfo?: {
    projectType?: string
    industry?: string
    targetAudience?: string
    keyFeatures?: string[]
    businessGoals?: string[]
  }
  questions?: string[]
  confidence: number // 0-100
}

export interface DocumentGenerationResponse extends GenerationResult {
  success: boolean
  documentId?: string
  error?: string
}

export async function generateDocument(
  request: DocumentGenerationRequest,
  preferredProvider: AIProvider = 'openai'
): Promise<DocumentGenerationResponse> {
  try {
    // Check user's token limit before generation
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { tokensUsed: true, tokensLimit: true, subscriptionTier: true }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        content: '',
        tokensUsed: 0,
        generationTime: 0,
        model: ''
      }
    }

    // Check if user has enough tokens (estimate 3000 tokens for generation)
    const estimatedTokens = 3000
    if (user.tokensUsed + estimatedTokens > user.tokensLimit) {
      return {
        success: false,
        error: 'Insufficient tokens. Please upgrade your plan or wait for next billing cycle.',
        content: '',
        tokensUsed: 0,
        generationTime: 0,
        model: ''
      }
    }

    // Try generating with preferred provider
    let result: GenerationResult
    try {
      if (preferredProvider === 'openai') {
        result = await generateWithOpenAI(request)
      } else {
        result = await generateWithGemini(request)
      }
    } catch (error) {
      console.error(`${preferredProvider} generation failed, trying fallback:`, error)
      
      // Fallback to the other provider
      const fallbackProvider = preferredProvider === 'openai' ? 'gemini' : 'openai'
      if (fallbackProvider === 'openai') {
        result = await generateWithOpenAI(request)
      } else {
        result = await generateWithGemini(request)
      }
    }

    // Extract title from the project idea (first 50 characters or until first period/newline)
    const title = request.projectIdea.split(/[.\n]/)[0].substring(0, 50).trim()
    
    // Save the generated document to database
    const document = await prisma.document.create({
      data: {
        title: title || 'Generated Project Documentation',
        content: result.content,
        type: 'comprehensive', // Since we're generating all document types in one
        language: request.language,
        tokensUsed: result.tokensUsed,
        aiModel: result.model,
        generationTime: result.generationTime,
        userId: request.userId,
        status: 'draft'
      }
    })

    // Update user's token usage
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        tokensUsed: {
          increment: result.tokensUsed
        }
      }
    })

    // Record usage history
    await prisma.usageHistory.create({
      data: {
        userId: request.userId,
        tokensUsed: result.tokensUsed,
        operation: 'document_generation',
        documentType: 'comprehensive',
        aiModel: result.model,
        success: true
      }
    })

    return {
      success: true,
      documentId: document.id,
      ...result
    }

  } catch (error) {
    console.error('Document generation failed:', error)
    
    // Record failed usage
    await prisma.usageHistory.create({
      data: {
        userId: request.userId,
        tokensUsed: 0,
        operation: 'document_generation',
        documentType: 'comprehensive',
        success: false
      }
    }).catch(console.error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document generation failed',
      content: '',
      tokensUsed: 0,
      generationTime: 0,
      model: ''
    }
  }
}

export async function getUserTokenUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tokensUsed: true,
      tokensLimit: true,
      subscriptionTier: true
    }
  })

  if (!user) {
    throw new Error('User not found')
  }

  return {
    used: user.tokensUsed,
    limit: user.tokensLimit,
    remaining: user.tokensLimit - user.tokensUsed,
    percentage: Math.round((user.tokensUsed / user.tokensLimit) * 100),
    tier: user.subscriptionTier
  }
}

export async function getDocumentTemplates(type?: string, language?: string) {
  const whereCondition: {
    isPublic: boolean
    category?: string
    language?: string
  } = {
    isPublic: true
  }

  if (type) {
    whereCondition.category = type
  }

  if (language) {
    whereCondition.language = language
  }

  return await prisma.template.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      industry: true,
      language: true,
      usageCount: true
    },
    orderBy: [
      { usageCount: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

export { GenerationOptions, GenerationResult }