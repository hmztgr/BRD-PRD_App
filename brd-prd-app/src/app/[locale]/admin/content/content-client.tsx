'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { 
  Search,
  Filter,
  FileText,
  Mail,
  Settings,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Globe,
  Languages
} from 'lucide-react'

interface ContentItem {
  id: string
  type: 'template' | 'email' | 'notification' | 'page'
  title: string
  content: string
  language: string
  status: 'active' | 'draft'
  lastModified: string
  category: string
}

export function ContentClient() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    language: 'en',
    status: 'draft',
    category: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Mock data - in real implementation, this would fetch from API
  const mockContent: ContentItem[] = [
    {
      id: '1',
      type: 'template',
      title: 'Business Report Template',
      content: 'Executive Summary\n\n[Brief overview of key findings]\n\nAnalysis\n\n[Detailed analysis sections]',
      language: 'en',
      status: 'active',
      lastModified: new Date().toISOString(),
      category: 'Documents'
    },
    {
      id: '2',
      type: 'email',
      title: 'Welcome Email',
      content: 'Welcome to Smart Business Docs! Your account has been created successfully.',
      language: 'en',
      status: 'active',
      lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: 'Notifications'
    },
    {
      id: '3',
      type: 'template',
      title: 'نموذج التقرير التجاري',
      content: 'الملخص التنفيذي\n\n[نظرة عامة موجزة عن النتائج الرئيسية]\n\nالتحليل\n\n[أقسام التحليل المفصل]',
      language: 'ar',
      status: 'active',
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Documents'
    },
    {
      id: '4',
      type: 'notification',
      title: 'Subscription Expired Notice',
      content: 'Your subscription has expired. Please renew to continue using our services.',
      language: 'en',
      status: 'active',
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'System'
    }
  ]

  useEffect(() => {
    // Simulate API call
    setLoading(true)
    setTimeout(() => {
      setContent(mockContent)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      template: { color: 'text-blue-600 border-blue-600', icon: FileText },
      email: { color: 'text-green-600 border-green-600', icon: Mail },
      notification: { color: 'text-orange-600 border-orange-600', icon: Settings },
      page: { color: 'text-purple-600 border-purple-600', icon: Globe }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.template
    const IconComponent = config.icon
    
    return (
      <Badge variant="outline" className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {type}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
      : <Badge variant="outline" className="text-gray-600 border-gray-600">Draft</Badge>
  }

  const getLanguageBadge = (language: string) => {
    return (
      <Badge variant="outline" className="text-purple-600 border-purple-600">
        <Languages className="h-3 w-3 mr-1" />
        {language.toUpperCase()}
      </Badge>
    )
  }

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item)
    setEditForm({
      title: item.title,
      content: item.content,
      language: item.language,
      status: item.status,
      category: item.category
    })
  }

  const handleSave = () => {
    if (editingItem) {
      const updatedContent = content.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...editForm, lastModified: new Date().toISOString() }
          : item
      )
      setContent(updatedContent)
      setEditingItem(null)
      toast({
        title: "Success",
        description: "Content updated successfully",
      })
    }
  }

  const handleDelete = (id: string) => {
    const updatedContent = content.filter(item => item.id !== id)
    setContent(updatedContent)
    toast({
      title: "Success",
      description: "Content deleted successfully",
    })
  }

  const handleCreate = () => {
    const newItem: ContentItem = {
      id: Date.now().toString(),
      type: 'template',
      title: editForm.title,
      content: editForm.content,
      language: editForm.language,
      status: editForm.status as 'active' | 'draft',
      lastModified: new Date().toISOString(),
      category: editForm.category
    }
    
    setContent([newItem, ...content])
    setShowCreateModal(false)
    setEditForm({ title: '', content: '', language: 'en', status: 'draft', category: '' })
    
    toast({
      title: "Success",
      description: "Content created successfully",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground">
            Manage templates, emails, notifications, and system content
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Templates</p>
              <p className="text-3xl font-bold text-foreground">
                {content.filter(c => c.type === 'template').length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email Templates</p>
              <p className="text-3xl font-bold text-foreground">
                {content.filter(c => c.type === 'email').length}
              </p>
            </div>
            <Mail className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notifications</p>
              <p className="text-3xl font-bold text-foreground">
                {content.filter(c => c.type === 'notification').length}
              </p>
            </div>
            <Settings className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Items</p>
              <p className="text-3xl font-bold text-foreground">
                {content.filter(c => c.status === 'active').length}
              </p>
            </div>
            <Globe className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">All Types</option>
          <option value="template">Templates</option>
          <option value="email">Email Templates</option>
          <option value="notification">Notifications</option>
          <option value="page">Pages</option>
        </select>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContent.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {getTypeBadge(item.type)}
                  {getStatusBadge(item.status)}
                  {getLanguageBadge(item.language)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.content}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Category: {item.category}</span>
                  <span>Modified: {new Date(item.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEdit(item)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first content item'}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </Card>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Content</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingItem(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select 
                    value={editForm.language}
                    onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  className="w-full h-64 p-3 border border-border rounded-md bg-background font-mono text-sm"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Content</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Enter content title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    placeholder="e.g., Documents, System"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select 
                    value={editForm.language}
                    onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  placeholder="Enter your content here..."
                  className="w-full h-64 p-3 border border-border rounded-md bg-background font-mono text-sm"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}