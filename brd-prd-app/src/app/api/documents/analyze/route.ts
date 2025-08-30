import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { analyzeProjectIdea } from '@/lib/ai/openai'
import { analyzeProjectIdeaWithGemini } from '@/lib/ai/gemini'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      projectIdea,
      language = 'en',
      uploadedFiles = []
    } = body

    // Validate required fields
    if (!projectIdea) {
      return NextResponse.json(
        { error: 'Project idea is required' },
        { status: 400 }
      )
    }

    // Validate language
    const validLanguages = ['en', 'ar']
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Supported languages: en, ar' },
        { status: 400 }
      )
    }

    let analysisResult
    try {
      // Try OpenAI analysis first
      analysisResult = await analyzeProjectIdea({
        projectIdea,
        language,
        uploadedFiles
      })
    } catch (error) {
      console.error('OpenAI analysis failed, trying Gemini:', error)
      
      // Try Gemini analysis as fallback
      try {
        analysisResult = await analyzeProjectIdeaWithGemini({
          projectIdea,
          language,
          uploadedFiles
        })
      } catch (geminiError) {
        console.error('Gemini analysis also failed, using fallback logic:', geminiError)
        
        // Fallback analysis logic
        const wordCount = projectIdea.split(' ').length
        const hasFileContent = uploadedFiles && uploadedFiles.length > 0
        const hasKeywords = /\b(app|website|platform|system|software|service|business|product)\b/i.test(projectIdea)
        const hasDetails = /\b(user|customer|feature|function|requirement|goal)\b/i.test(projectIdea)
        
        if ((wordCount >= 20 && hasKeywords && hasDetails) || hasFileContent) {
          analysisResult = {
            hasEnoughInfo: true,
            confidence: hasFileContent ? 85 : 75,
            extractedInfo: {
              projectType: 'software',
              industry: 'technology'
            }
          }
        } else {
          analysisResult = {
            hasEnoughInfo: false,
            confidence: 30,
            questions: language === 'ar' ? [
              'ما هو نوع المشروع بالضبط؟',
              'من هو الجمهور المستهدف؟',
              'ما هي الميزات الأساسية المطلوبة؟',
              'ما هي أهداف العمل الرئيسية؟',
              'ما هي الصناعة أو القطاع؟'
            ] : [
              'What exactly is the type of project?',
              'Who is the target audience?',
              'What are the core features required?',
              'What are the main business objectives?',
              'What industry or sector is this for?'
            ]
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}