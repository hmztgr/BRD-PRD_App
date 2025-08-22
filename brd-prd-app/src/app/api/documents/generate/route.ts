import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateDocument, AIProvider } from '@/lib/ai'

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
      uploadedFiles = [],
      additionalInfo = {},
      preferredProvider = 'openai'
    } = body

    console.log('=== GENERATION REQUEST ===')
    console.log('Project idea:', projectIdea.substring(0, 100))
    console.log('Uploaded files count:', uploadedFiles.length)
    console.log('Additional info keys:', Object.keys(additionalInfo))
    if (uploadedFiles.length > 0) {
      console.log('First file preview:', uploadedFiles[0].substring(0, 200))
    }
    console.log('=============================')

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

    // Generate the document
    const result = await generateDocument(
      {
        userId: session.user.id,
        projectIdea: projectIdea.trim(),
        language,
        uploadedFiles,
        additionalInfo
      },
      preferredProvider as AIProvider
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      content: result.content,
      tokensUsed: result.tokensUsed,
      generationTime: result.generationTime,
      model: result.model
    })

  } catch (error) {
    console.error('Document generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}