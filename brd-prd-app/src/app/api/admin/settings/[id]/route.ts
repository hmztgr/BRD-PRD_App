import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { value } = body

    if (!value && value !== '') {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      )
    }

    // TODO: Replace with actual database query when Settings model is created
    // const setting = await prisma.setting.findUnique({
    //   where: { id }
    // })

    // Mock setting lookup for now
    const mockSettings = {
      '1': { key: 'OPENAI_API_KEY', category: 'api', isSecret: true },
      '2': { key: 'GEMINI_API_KEY', category: 'api', isSecret: true },
      '3': { key: 'STRIPE_PUBLIC_KEY', category: 'api', isSecret: false },
      '4': { key: 'MAILJET_API_KEY', category: 'email', isSecret: true },
      '5': { key: 'MAILJET_SECRET_KEY', category: 'email', isSecret: true },
      '6': { key: 'EMAIL_FROM', category: 'email', isSecret: false },
      '7': { key: 'DEFAULT_LANGUAGE', category: 'system', isSecret: false },
      '8': { key: 'MAX_DOCUMENT_SIZE_MB', category: 'system', isSecret: false },
      '9': { key: 'RATE_LIMIT_PER_MINUTE', category: 'system', isSecret: false },
      '10': { key: 'SESSION_TIMEOUT_MINUTES', category: 'security', isSecret: false },
      '11': { key: 'ENABLE_2FA', category: 'security', isSecret: false },
      '12': { key: 'ENABLE_ADVANCED_MODE', category: 'features', isSecret: false }
    }

    const setting = mockSettings[id as keyof typeof mockSettings]
    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    // Check permissions based on setting category
    const canEdit = checkSettingPermission(adminUser.role, setting.category)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this setting' },
        { status: 403 }
      )
    }

    // Validate value based on setting type
    const validationError = validateSettingValue(setting.key, value)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // TODO: Implement database update when Settings model is created
    // const updatedSetting = await prisma.setting.update({
    //   where: { id },
    //   data: {
    //     value,
    //     lastUpdated: new Date(),
    //     updatedBy: adminUser.email
    //   }
    // })

    // For critical settings (API keys, etc.), we would need to:
    // 1. Encrypt the value before storing
    // 2. Update environment variables if needed
    // 3. Trigger application reload if necessary

    // Mock response for now
    const updatedSetting = {
      id,
      key: setting.key,
      value: setting.isSecret ? '****************************' : value,
      category: setting.category,
      isSecret: setting.isSecret,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminUser.email
    }

    return NextResponse.json({
      success: true,
      setting: updatedSetting,
      message: 'Setting updated successfully'
    })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin access with system permission
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    }

    // Only SUPER_ADMIN can delete settings
    if (adminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { id } = await params

    // TODO: Implement database deletion when Settings model is created
    // await prisma.setting.delete({
    //   where: { id }
    // })

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully'
    })

  } catch (error) {
    console.error('Settings deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    )
  }
}

// Helper function to check if admin can edit specific setting categories
function checkSettingPermission(adminRole: string, category: string): boolean {
  if (adminRole === 'SUPER_ADMIN') {
    return true // Super admin can edit everything
  }

  if (adminRole === 'SUB_ADMIN') {
    // Sub admins can edit non-critical settings
    return ['system', 'features'].includes(category)
  }

  return false
}

// Helper function to validate setting values
function validateSettingValue(key: string, value: string): string | null {
  switch (key) {
    case 'DEFAULT_LANGUAGE':
      if (!['en', 'ar'].includes(value)) {
        return 'Default language must be "en" or "ar"'
      }
      break
      
    case 'MAX_DOCUMENT_SIZE_MB':
      const size = parseInt(value)
      if (isNaN(size) || size < 1 || size > 100) {
        return 'Document size must be between 1 and 100 MB'
      }
      break
      
    case 'RATE_LIMIT_PER_MINUTE':
      const rate = parseInt(value)
      if (isNaN(rate) || rate < 1 || rate > 1000) {
        return 'Rate limit must be between 1 and 1000 requests per minute'
      }
      break
      
    case 'SESSION_TIMEOUT_MINUTES':
      const timeout = parseInt(value)
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        return 'Session timeout must be between 5 and 1440 minutes'
      }
      break
      
    case 'ENABLE_2FA':
    case 'ENABLE_ADVANCED_MODE':
      if (!['true', 'false'].includes(value.toLowerCase())) {
        return 'Value must be "true" or "false"'
      }
      break
      
    case 'EMAIL_FROM':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Invalid email address format'
      }
      break
      
    case 'OPENAI_API_KEY':
      if (!value.startsWith('sk-proj-') && !value.startsWith('sk-')) {
        return 'Invalid OpenAI API key format'
      }
      break
      
    case 'STRIPE_PUBLIC_KEY':
      if (!value.startsWith('pk_test_') && !value.startsWith('pk_live_')) {
        return 'Invalid Stripe public key format'
      }
      break
  }

  // General validation
  if (value.length > 1000) {
    return 'Value is too long (maximum 1000 characters)'
  }

  return null
}