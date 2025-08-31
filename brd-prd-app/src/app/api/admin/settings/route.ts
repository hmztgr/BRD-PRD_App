import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// Mock settings data for initial implementation
// TODO: Create Settings model in Prisma schema
const mockSettings = [
  // API Settings
  {
    id: '1',
    key: 'OPENAI_API_KEY',
    value: process.env.OPENAI_API_KEY ? 'sk-proj-****************************' : '',
    category: 'api',
    description: 'OpenAI API key for AI document generation',
    isSecret: true,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '2',
    key: 'GEMINI_API_KEY',
    value: process.env.GEMINI_API_KEY ? '****************************' : '',
    category: 'api',
    description: 'Google Gemini API key for fallback AI generation',
    isSecret: true,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '3',
    key: 'STRIPE_PUBLIC_KEY',
    value: process.env.STRIPE_PUBLIC_KEY || '',
    category: 'api',
    description: 'Stripe public key for payment processing',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  // Email Settings
  {
    id: '4',
    key: 'MAILJET_API_KEY',
    value: process.env.MAILJET_API_KEY ? '****************************' : '',
    category: 'email',
    description: 'Mailjet API key for email notifications',
    isSecret: true,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '5',
    key: 'MAILJET_SECRET_KEY',
    value: process.env.MAILJET_SECRET_KEY ? '****************************' : '',
    category: 'email',
    description: 'Mailjet secret key for email authentication',
    isSecret: true,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '6',
    key: 'EMAIL_FROM',
    value: process.env.EMAIL_FROM || 'noreply@smartbusinessdocs.ai',
    category: 'email',
    description: 'Default sender email address',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  // System Settings
  {
    id: '7',
    key: 'DEFAULT_LANGUAGE',
    value: 'en',
    category: 'system',
    description: 'Default language for new users (en/ar)',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '8',
    key: 'MAX_DOCUMENT_SIZE_MB',
    value: '10',
    category: 'system',
    description: 'Maximum document upload size in MB',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '9',
    key: 'RATE_LIMIT_PER_MINUTE',
    value: '60',
    category: 'system',
    description: 'API rate limit per minute per user',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  // Security Settings
  {
    id: '10',
    key: 'SESSION_TIMEOUT_MINUTES',
    value: '60',
    category: 'security',
    description: 'User session timeout in minutes',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: '11',
    key: 'ENABLE_2FA',
    value: 'false',
    category: 'security',
    description: 'Enable two-factor authentication',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  },
  // Feature Flags
  {
    id: '12',
    key: 'ENABLE_ADVANCED_MODE',
    value: 'true',
    category: 'features',
    description: 'Enable advanced document generation mode',
    isSecret: false,
    isEditable: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'system'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // TODO: Replace with actual database query when Settings model is created
    // const settings = await prisma.setting.findMany({
    //   where: category ? { category } : undefined,
    //   orderBy: { category: 'asc' }
    // })

    let settings = mockSettings

    // Filter by category if specified
    if (category) {
      settings = settings.filter(s => s.category === category)
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access with system permission
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    // For now, only SUPER_ADMIN can create settings
    if (adminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { key, value, category, description, isSecret = false } = body

    // Validate required fields
    if (!key || !value || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value, category, description' },
        { status: 400 }
      )
    }

    // TODO: Implement database creation when Settings model is created
    // const newSetting = await prisma.setting.create({
    //   data: {
    //     key,
    //     value,
    //     category,
    //     description,
    //     isSecret,
    //     isEditable: true,
    //     updatedBy: adminUser.email
    //   }
    // })

    // Mock response for now
    const newSetting = {
      id: Date.now().toString(),
      key,
      value,
      category,
      description,
      isSecret,
      isEditable: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminUser.email
    }

    return NextResponse.json({
      success: true,
      setting: newSetting
    })

  } catch (error) {
    console.error('Settings creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    )
  }
}