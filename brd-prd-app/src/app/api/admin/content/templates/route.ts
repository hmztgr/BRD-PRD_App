import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hasAdminPermission } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'manage_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    // Since templates table might not exist yet, return mock data
    // TODO: Replace with real database queries when templates table is created
    const mockTemplates = [
      {
        id: '1',
        name: 'Basic PRD Template',
        description: 'Standard product requirements document template',
        category: 'PRD',
        content: '# Product Requirements Document\n\n## Overview\n[Product overview content]\n\n## Goals\n[Product goals]\n\n## Features\n[Feature descriptions]',
        isActive: true,
        usageCount: 542,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-08-20T14:15:00Z'
      },
      {
        id: '2',
        name: 'Technical BRD Template',
        description: 'Business requirements document for technical projects',
        category: 'BRD',
        content: '# Business Requirements Document\n\n## Business Context\n[Business context content]\n\n## Requirements\n[Business requirements]\n\n## Acceptance Criteria\n[Criteria details]',
        isActive: true,
        usageCount: 387,
        createdAt: '2024-02-10T09:45:00Z',
        updatedAt: '2024-08-18T11:20:00Z'
      },
      {
        id: '3',
        name: 'User Stories Template',
        description: 'Template for writing user stories',
        category: 'User Stories',
        content: '# User Stories\n\n## Epic: [Epic Name]\n\n### User Story 1\nAs a [user type]\nI want [functionality]\nSo that [benefit]\n\n**Acceptance Criteria:**\n- [ ] Criteria 1\n- [ ] Criteria 2',
        isActive: false,
        usageCount: 156,
        createdAt: '2024-03-05T14:20:00Z',
        updatedAt: '2024-07-30T09:10:00Z'
      }
    ]

    // Apply filters to mock data
    let filteredTemplates = mockTemplates
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
      )
    }
    
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(template => template.category === category)
    }
    
    if (status && status !== 'all') {
      const isActive = status === 'active'
      filteredTemplates = filteredTemplates.filter(template => template.isActive === isActive)
    }

    return NextResponse.json({
      templates: filteredTemplates,
      total: filteredTemplates.length
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()
    
    if (!hasAdminPermission(adminUser, 'manage_content')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, content, isActive } = body

    // Validate required fields
    if (!name || !category || !content) {
      return NextResponse.json(
        { error: 'Name, category, and content are required' },
        { status: 400 }
      )
    }

    // TODO: Create template in database when templates table exists
    // For now, return success response with mock data
    const newTemplate = {
      id: Date.now().toString(),
      name,
      description: description || '',
      category,
      content,
      isActive: isActive !== undefined ? isActive : true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json(
      { message: 'Template created successfully', template: newTemplate },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}