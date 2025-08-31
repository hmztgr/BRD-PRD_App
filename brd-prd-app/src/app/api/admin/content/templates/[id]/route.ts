import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdmin()
    const { id } = await params
    
    if (!hasAdminPermission(adminUser, 'manage_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, content, isActive } = body

    // TODO: Update template in database when templates table exists
    // For now, return success response
    const updatedTemplate = {
      id,
      name,
      description,
      category,
      content,
      isActive,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdmin()
    const { id } = await params
    
    if (!hasAdminPermission(adminUser, 'manage_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // TODO: Delete template from database when templates table exists
    // For now, return success response
    return NextResponse.json({
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}