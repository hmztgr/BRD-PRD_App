import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    if (!hasAdminPermission(adminUser, 'manage_users')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userEmail, userName, subject, message } = body

    // Validation
    if (!userEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'User email, subject, and message are required' },
        { status: 400 }
      )
    }

    try {
      // TODO: Integrate with Mailjet or your email service
      // For now, we'll use a placeholder implementation
      
      // Example Mailjet integration would look like:
      /*
      const mailjet = require('node-mailjet').connect(
        process.env.MAILJET_API_KEY,
        process.env.MAILJET_SECRET_KEY
      )
      
      const result = await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [{
          From: {
            Email: process.env.EMAIL_FROM || 'admin@smartdocs.ai',
            Name: 'Smart Business Docs Admin'
          },
          To: [{
            Email: userEmail,
            Name: userName || 'User'
          }],
          Subject: subject,
          TextPart: message,
          HTMLPart: message.replace(/\n/g, '<br>')
        }]
      })
      */

      // Mock successful email sending for now
      console.log(`[Email] Would send email to ${userEmail} with subject "${subject}"`)
      console.log(`[Email] Message: ${message}`)

      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${userEmail}`,
        // In production, return the email service response
        emailId: `mock_email_${Date.now()}`
      })

    } catch (emailError) {
      console.error('Email sending error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email. Email service may be unavailable.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Send email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}