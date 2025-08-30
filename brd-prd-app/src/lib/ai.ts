import { generateWithOpenAI, analyzeProjectIdea, type GenerationOptions, type GenerationResult } from './ai/openai'
import { generateWithGemini, analyzeProjectIdeaWithGemini } from './ai/gemini'
import { prisma } from './prisma'

export type AIProvider = 'openai' | 'gemini'

export interface DocumentGenerationOptions {
  userId: string
  projectIdea: string
  language: 'en' | 'ar'
  uploadedFiles?: string[]
  additionalInfo?: Record<string, string>
}

export interface DocumentGenerationResult {
  success: boolean
  documentId?: string
  content?: string
  tokensUsed?: number
  generationTime?: number
  model?: string
  error?: string
}

export async function generateDocument(
  options: DocumentGenerationOptions,
  provider: AIProvider = 'openai'
): Promise<DocumentGenerationResult> {
  try {
    console.log('=== AI GENERATION START ===')
    console.log('Provider:', provider)
    console.log('Language:', options.language)
    console.log('User ID:', options.userId)
    console.log('Project idea length:', options.projectIdea.length)
    console.log('Uploaded files count:', options.uploadedFiles?.length || 0)
    
    // First, analyze the project idea to determine if we have enough information
    let analysis
    
    if (provider === 'gemini') {
      // Use Gemini analysis directly
      try {
        analysis = await analyzeProjectIdeaWithGemini({
          projectIdea: options.projectIdea,
          language: options.language,
          uploadedFiles: options.uploadedFiles
        })
      } catch (error) {
        console.log('Gemini analysis failed, skipping analysis:', error)
        // Skip analysis for Gemini if it fails, assume we have enough info
        analysis = {
          hasEnoughInfo: true,
          confidence: 75,
          extractedInfo: {
            projectType: 'business',
            industry: 'technology'
          }
        }
      }
    } else {
      // Use OpenAI analysis with Gemini fallback
      try {
        analysis = await analyzeProjectIdea({
          projectIdea: options.projectIdea,
          language: options.language,
          uploadedFiles: options.uploadedFiles
        })
      } catch (error) {
        console.log('OpenAI analysis failed, using Gemini:', error)
        analysis = await analyzeProjectIdeaWithGemini({
          projectIdea: options.projectIdea,
          language: options.language,
          uploadedFiles: options.uploadedFiles
        })
      }
    }
    
    console.log('Analysis result:', {
      hasEnoughInfo: analysis.hasEnoughInfo,
      confidence: analysis.confidence,
      questionsCount: analysis.questions?.length || 0
    })

    // If we don't have enough information and no additional info provided, return error
    // But be more lenient for longer project descriptions (over 500 characters)
    const shouldProceed = analysis.hasEnoughInfo || 
                         options.projectIdea.length > 500 || 
                         (options.additionalInfo && Object.keys(options.additionalInfo).length > 0) ||
                         analysis.confidence >= 25
                         
    if (!shouldProceed) {
      return {
        success: false,
        error: `Insufficient information to generate document. Confidence: ${analysis.confidence}%. Please provide more details.`
      }
    }

    // Generate the document using the specified provider
    let generationResult: GenerationResult

    if (provider === 'openai') {
      try {
        const generationOptions: GenerationOptions = {
          projectIdea: options.projectIdea,
          language: options.language,
          uploadedFiles: options.uploadedFiles,
          additionalInfo: options.additionalInfo
        }
        
        generationResult = await generateWithOpenAI(generationOptions)
      } catch (error) {
        console.log('OpenAI failed, falling back to Gemini:', error)
        // Fallback to Gemini if OpenAI fails
        generationResult = await generateWithGemini({
          projectIdea: options.projectIdea,
          language: options.language,
          uploadedFiles: options.uploadedFiles,
          additionalInfo: options.additionalInfo
        })
      }
    } else {
      // Use Gemini directly
      generationResult = await generateWithGemini({
        projectIdea: options.projectIdea,
        language: options.language,
        uploadedFiles: options.uploadedFiles,
        additionalInfo: options.additionalInfo
      })
    }

    console.log('Generation completed:', {
      contentLength: generationResult.content.length,
      tokensUsed: generationResult.tokensUsed,
      generationTime: generationResult.generationTime,
      model: generationResult.model
    })

    // Save the document to database
    const document = await prisma.document.create({
      data: {
        title: `Generated Document - ${new Date().toLocaleDateString()}`,
        content: generationResult.content,
        type: 'brd', // Default to BRD, could be enhanced to detect type
        status: 'draft',
        language: options.language,
        tokensUsed: generationResult.tokensUsed,
        userId: options.userId,
        aiModel: generationResult.model,
        generationTime: generationResult.generationTime,
        metadata: {
          projectIdea: options.projectIdea,
          uploadedFilesCount: options.uploadedFiles?.length || 0,
          analysisConfidence: analysis.confidence,
          additionalInfo: options.additionalInfo,
          provider
        }
      }
    })

    // Update user token usage
    await prisma.user.update({
      where: { id: options.userId },
      data: {
        tokensUsed: {
          increment: generationResult.tokensUsed
        }
      }
    })

    // Track usage history
    await prisma.usageHistory.create({
      data: {
        userId: options.userId,
        tokensUsed: generationResult.tokensUsed,
        operation: 'document_generation',
        documentType: 'brd',
        aiModel: generationResult.model,
        success: true
      }
    })

    console.log('Document saved:', document.id)
    console.log('=== AI GENERATION END ===')

    return {
      success: true,
      documentId: document.id,
      content: generationResult.content,
      tokensUsed: generationResult.tokensUsed,
      generationTime: generationResult.generationTime,
      model: generationResult.model
    }

  } catch (error) {
    console.error('Document generation error:', error)
    
    // Track failed usage
    try {
      await prisma.usageHistory.create({
        data: {
          userId: options.userId,
          tokensUsed: 0,
          operation: 'document_generation',
          documentType: 'brd',
          aiModel: provider,
          success: false
        }
      })
    } catch (dbError) {
      console.error('Failed to track failed usage:', dbError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during document generation'
    }
  }
}

export async function getUserTokenUsage(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tokensUsed: true,
        subscriptionTier: true,
        _count: {
          select: {
            documents: true,
            usageHistory: true
          }
        },
        usageHistory: {
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            tokensUsed: true,
            operation: true,
            documentType: true,
            aiModel: true,
            success: true,
            date: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      tokensUsed: user.tokensUsed || 0,
      plan: user.subscriptionTier,
      documentsCount: user._count.documents,
      usageHistoryCount: user._count.usageHistory,
      recentUsage: user.usageHistory
    }
  } catch (error) {
    console.error('Get user token usage error:', error)
    throw error
  }
}

// Re-export OpenAI functions for backward compatibility
export { analyzeProjectIdea } from './ai/openai'