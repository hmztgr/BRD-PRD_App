import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateDocument, AIProvider } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      sessionId,
      templateId,
      templateType,
      planningData,
      country = 'saudi-arabia',
      industry,
      businessType
    } = body

    console.log('=== MULTI-DOC GENERATION REQUEST ===')
    console.log('Template ID:', templateId)
    console.log('Template Type:', templateType)
    console.log('Country:', country)
    console.log('Industry:', industry)
    console.log('Business Type:', businessType)
    console.log('Session ID:', sessionId)

    // Build project idea based on template type and planning data
    let projectIdea = ''
    
    switch (templateType) {
      case 'BRD':
        projectIdea = `Generate a Business Requirements Document (BRD) for a ${businessType || 'business'} project in the ${industry || 'technology'} industry, targeting the ${country} market.`
        break
      case 'PRD':
        projectIdea = `Generate a Product Requirements Document (PRD) for a ${businessType || 'product'} in the ${industry || 'technology'} industry, designed for the ${country} market.`
        break
      case 'business-plan':
        projectIdea = `Generate a comprehensive Business Plan for a ${businessType || 'startup'} in the ${industry || 'technology'} industry, targeting the ${country} market.`
        break
      case 'technical-spec':
        projectIdea = `Generate Technical Architecture and Specifications for a ${businessType || 'technology solution'} in the ${industry || 'technology'} industry.`
        break
      case 'financial':
        projectIdea = `Generate Financial Projections and Analysis for a ${businessType || 'business'} in the ${industry || 'technology'} industry, targeting the ${country} market.`
        break
      case 'pitch-deck':
        projectIdea = `Generate an Investor Pitch Deck for a ${businessType || 'startup'} in the ${industry || 'technology'} industry, targeting the ${country} market.`
        break
      case 'case-study':
        projectIdea = `Generate a Market Case Study and Competitive Analysis for a ${businessType || 'business'} in the ${industry || 'technology'} industry, focusing on the ${country} market.`
        break
      default:
        projectIdea = `Generate a comprehensive ${templateType} document for a ${businessType || 'business'} project in the ${industry || 'technology'} industry.`
    }

    // Add planning data context if available
    if (planningData) {
      projectIdea += '\n\nAdditional Context from Planning Session:\n' + JSON.stringify(planningData, null, 2)
    }

    // Generate the document using the main generation function
    const result = await generateDocument(
      {
        userId: session.user.id,
        projectIdea,
        language: 'en', // TODO: Get from request or user preferences
        uploadedFiles: [], // TODO: Get files from session
        additionalInfo: {
          templateType,
          country,
          industry,
          businessType,
          sessionId
        }
      },
      'openai' as AIProvider
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Return format expected by MultiDocumentGenerator
    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      content: result.content,
      size: result.content?.length || 0,
      downloadUrl: `/api/documents/${result.documentId}/download`,
      previewUrl: `/api/documents/${result.documentId}/preview`,
      tokensUsed: result.tokensUsed,
      generationTime: result.generationTime,
      model: result.model
    })

  } catch (error) {
    console.error('Multi-document generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}