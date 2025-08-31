'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { 
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  FileText,
  Settings,
  Upload,
  Download,
  Eye,
  EyeOff,
  Zap,
  Clock
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

interface ContentStats {
  totalTemplates: number
  activeTemplates: number
  totalUsage: number
  popularTemplate: string
}

export function ContentManagementClient() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<ContentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    content: '',
    isActive: true
  })

  const categories = ['BRD', 'PRD', 'Technical Specs', 'User Stories', 'Test Plans', 'Requirements']

  useEffect(() => {
    fetchTemplates()
    fetchStats()
  }, [searchTerm, filterCategory, filterStatus])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      })

      const response = await fetch(`/api/admin/content/templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      } else {
        console.error('Failed to fetch templates:', response.statusText)
        // Fallback to mock data
        setTemplates(getMockTemplates())
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates(getMockTemplates())
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/content/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Fallback to mock stats
        setStats({
          totalTemplates: 12,
          activeTemplates: 10,
          totalUsage: 1847,
          popularTemplate: 'Basic PRD Template'
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        totalTemplates: 12,
        activeTemplates: 10,
        totalUsage: 1847,
        popularTemplate: 'Basic PRD Template'
      })
    }
  }

  const getMockTemplates = (): Template[] => [
    {
      id: '1',
      name: 'Basic PRD Template',
      description: 'Standard product requirements document template',
      category: 'PRD',
      content: '# Product Requirements Document\n\n## Overview\n[Product overview content]',
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
      content: '# Business Requirements Document\n\n## Business Context\n[Business context content]',
      isActive: true,
      usageCount: 387,
      createdAt: '2024-02-10T09:45:00Z',
      updatedAt: '2024-08-18T11:20:00Z'
    }
  ]

  const handleCreateTemplate = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/admin/content/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      await fetchTemplates()
      setShowCreateModal(false)
      setFormData({
        name: '',
        description: '',
        category: '',
        content: '',
        isActive: true
      })

      toast({
        title: "Success",
        description: "Template created successfully",
      })

    } catch (error: any) {
      console.error('Error creating template:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to create template',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTemplate = async (id: string, updates: any) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/content/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update template')
      }

      await fetchTemplates()
      setEditingTemplate(null)

      toast({
        title: "Success",
        description: "Template updated successfully",
      })

    } catch (error: any) {
      console.error('Error updating template:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to update template',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/content/templates/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      await fetchTemplates()
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })

    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to delete template',
        variant: "destructive",
      })
    }
  }

  const toggleTemplateStatus = async (template: Template) => {
    await handleUpdateTemplate(template.id, {
      isActive: !template.isActive
    })
  }

  const getCategoryBadge = (category: string) => {
    const colors: { [key: string]: string } = {
      'BRD': 'bg-blue-100 text-blue-800',
      'PRD': 'bg-green-100 text-green-800',
      'Technical Specs': 'bg-purple-100 text-purple-800',
      'User Stories': 'bg-orange-100 text-orange-800',
      'Test Plans': 'bg-red-100 text-red-800',
      'Requirements': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    )
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' ? template.isActive : !template.isActive)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-gray-300">Manage document templates and content generation settings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          New Template
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalTemplates}</div>
                <div className="text-sm text-gray-400">Total Templates</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.activeTemplates}</div>
                <div className="text-sm text-gray-400">Active Templates</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalUsage}</div>
                <div className="text-sm text-gray-400">Total Usage</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-sm font-semibold text-white truncate">{stats.popularTemplate}</div>
                <div className="text-sm text-gray-400">Most Popular</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-6 bg-background border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search templates by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rtl:pr-10 rtl:pl-3"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6 bg-background border-border">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getCategoryBadge(template.category)}
                  {template.isActive ? (
                    <Eye className="h-4 w-4 text-green-500" title="Active" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-500" title="Inactive" />
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Used {template.usageCount} times
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template)
                      setFormData({
                        name: template.name,
                        description: template.description,
                        category: template.category,
                        content: template.content,
                        isActive: template.isActive
                      })
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleTemplateStatus(template)}
                    title={template.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {template.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && !loading && (
        <Card className="p-12 text-center bg-background border-border">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
          <p className="text-gray-400 mb-4">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'No templates match your current filters.' 
              : 'Get started by creating your first template.'}
          </p>
          <div className="space-x-2">
            {(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setFilterCategory('all')
                setFilterStatus('all')
              }}>
                Clear Filters
              </Button>
            )}
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingTemplate(null)
                    setFormData({
                      name: '',
                      description: '',
                      category: '',
                      content: '',
                      isActive: true
                    })
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Template name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Description *</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the template"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-400">Content *</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Template content in markdown format..."
                  rows={10}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-400">
                  Template is active and available for use
                </label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingTemplate(null)
                    setFormData({
                      name: '',
                      description: '',
                      category: '',
                      content: '',
                      isActive: true
                    })
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={editingTemplate 
                    ? () => handleUpdateTemplate(editingTemplate.id, formData)
                    : handleCreateTemplate
                  }
                  disabled={isSubmitting || !formData.name || !formData.category || !formData.content}
                >
                  {isSubmitting ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}