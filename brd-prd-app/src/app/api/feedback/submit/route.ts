import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface FeedbackData {
  type: 'bug' | 'suggestion' | 'review' | 'question'
  message: string
  email?: string
  includeConsoleLog?: boolean
  consoleLogs?: string
  url: string
  userAgent: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const feedbackJson = formData.get('feedback') as string
    
    if (!feedbackJson) {
      return NextResponse.json(
        { error: 'Feedback data is required' },
        { status: 400 }
      )
    }

    const feedback: FeedbackData = JSON.parse(feedbackJson)
    
    // Validate required fields
    if (!feedback.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'feedback')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique ID for this feedback
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Handle screenshot upload
    let screenshotPath: string | null = null
    const screenshot = formData.get('screenshot') as File
    if (screenshot && screenshot.size > 0) {
      const screenshotBuffer = Buffer.from(await screenshot.arrayBuffer())
      const screenshotName = `${feedbackId}_screenshot_${screenshot.name}`
      screenshotPath = join(uploadsDir, screenshotName)
      await writeFile(screenshotPath, screenshotBuffer)
    }

    // Handle attachment uploads
    const attachmentPaths: string[] = []
    const formEntries = Array.from(formData.entries())
    
    for (const [key, value] of formEntries) {
      if (key.startsWith('attachment_') && value instanceof File && value.size > 0) {
        const attachmentBuffer = Buffer.from(await value.arrayBuffer())
        const attachmentName = `${feedbackId}_${key}_${value.name}`
        const attachmentPath = join(uploadsDir, attachmentName)
        await writeFile(attachmentPath, attachmentBuffer)
        attachmentPaths.push(attachmentPath)
      }
    }

    // Prepare feedback record with file paths
    const feedbackRecord = {
      id: feedbackId,
      ...feedback,
      screenshot: screenshotPath,
      attachments: attachmentPaths,
      submittedAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
    }

    // Save feedback to JSON file for now (in production, save to database)
    const feedbackFile = join(uploadsDir, `${feedbackId}.json`)
    await writeFile(feedbackFile, JSON.stringify(feedbackRecord, null, 2))

    // Log feedback submission
    console.log('Feedback submitted:', {
      id: feedbackId,
      type: feedback.type,
      email: feedback.email || 'anonymous',
      hasScreenshot: !!screenshotPath,
      attachmentCount: attachmentPaths.length,
      url: feedback.url
    })

    // In production, you might want to:
    // 1. Save to database
    // 2. Send email notification to support team
    // 3. Create support ticket
    // 4. Send auto-reply to user if email provided

    // For now, let's try to save to database if available
    try {
      const { prisma } = await import('@/lib/prisma')
      
      await prisma.feedback.create({
        data: {
          type: feedback.type,
          message: feedback.message,
          email: feedback.email || null,
          rating: 0,
          status: 'pending',
          metadata: JSON.stringify({
            url: feedback.url,
            userAgent: feedback.userAgent,
            consoleLogs: feedback.consoleLogs,
            screenshot: screenshotPath ? screenshotName : null,
            attachments: attachmentPaths.map(path => path.split('/').pop()),
            ipAddress: feedbackRecord.ipAddress
          })
        }
      })
      
      console.log('Feedback saved to database')
    } catch (dbError) {
      console.warn('Could not save feedback to database:', dbError)
      // Continue anyway, feedback is saved to file
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId
    })

  } catch (error: any) {
    console.error('Feedback submission error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}