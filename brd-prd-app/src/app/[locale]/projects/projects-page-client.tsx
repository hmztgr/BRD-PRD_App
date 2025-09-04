'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Archive,
  Trash2,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  industry?: string
  country?: string
  status: string
  stage: string
  confidence: number
  totalTokens: number
  lastActivity: string
  createdAt: string
  updatedAt: string
  counts: {
    documents: number
    files: number
    conversations: number
    researchRequests: number
  }
  recentDocuments: Array<{ id: string; type: string; createdAt: string }>
  recentFiles: Array<{ id: string; fileType: string; createdAt: string }>
  hasActiveResearch: boolean
}

interface ProjectLimits {
  current: number
  max: number
  canCreate: boolean
}

interface ProjectsPageClientProps {
  locale: string
  userTier: string
  projectLimits: ProjectLimits
}

export default function ProjectsPageClient({ 
  locale, 
  userTier, 
  projectLimits 
}: ProjectsPageClientProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('lastActivity')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  })

  // Create project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    industry: '',
    country: 'saudi-arabia'
  })

  // Delete project state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive')
  const [deleting, setDeleting] = useState(false)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '12',
        status: statusFilter,
        sortBy,
        sortOrder: 'desc'
      })

      if (industryFilter !== 'all') {
        params.set('industry', industryFilter)
      }

      const response = await fetch(`/api/projects?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProjects(data.projects)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [pagination.page, statusFilter, industryFilter, sortBy])

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return

    try {
      setCreating(true)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateDialog(false)
        setNewProject({ name: '', description: '', industry: '', country: 'saudi-arabia' })
        // Redirect to Advanced Mode with the new project
        router.push(`/${locale}/documents/new?mode=advanced&projectId=${data.project.id}`)
      } else {
        alert(data.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      setDeleting(true)
      
      const params = new URLSearchParams()
      if (deleteMode === 'permanent') {
        params.set('permanent', 'true')
      }

      const response = await fetch(`/api/projects/${projectToDelete.id}?${params}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove project from local state
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
        setProjectToDelete(null)
        
        // Show success message based on delete mode
        if (deleteMode === 'permanent') {
          alert('Project permanently deleted')
        } else {
          alert('Project archived successfully')
        }
        
        // Refresh projects list to get updated counts
        fetchProjects()
      } else {
        alert(data.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'paused': return 'secondary'
      case 'completed': return 'outline'
      case 'archived': return 'outline'
      default: return 'default'
    }
  }

  const getProgressColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-blue-500'
    if (confidence >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffDays > 0) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
    } else if (diffHours > 0) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else {
      return 'Just now'
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your business document projects and planning sessions
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {projectLimits.current} / {projectLimits.max === 999 ? '∞' : projectLimits.max} projects
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!projectLimits.canCreate}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Start a new business document project with AI-powered planning
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Food Delivery App, E-commerce Store"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your project idea..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select 
                        value={newProject.industry} 
                        onValueChange={(value) => setNewProject(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="retail">Retail & E-commerce</SelectItem>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="real-estate">Real Estate</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="country">Country/Region</Label>
                      <Select 
                        value={newProject.country} 
                        onValueChange={(value) => setNewProject(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saudi-arabia">🇸🇦 Saudi Arabia</SelectItem>
                          <SelectItem value="uae">🇦🇪 UAE</SelectItem>
                          <SelectItem value="global">🌍 Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateProject}
                      disabled={!newProject.name.trim() || creating}
                    >
                      {creating ? (
                        <>
                          <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastActivity">Recent Activity</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {projects.length === 0 
                ? 'Create your first project to start building professional business documents'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {projects.length === 0 && projectLimits.canCreate && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  locale={locale}
                  viewMode={viewMode}
                  onUpdate={fetchProjects}
                  onDelete={(project, deleteMode) => {
                    setProjectToDelete(project)
                    setDeleteMode(deleteMode)
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!projectToDelete} 
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMode === 'permanent' ? 'Delete Project Permanently' : 'Archive Project'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'permanent' 
                ? `Are you sure you want to permanently delete "${projectToDelete?.name}"? This action cannot be undone and will remove all project data, conversations, and generated documents.`
                : `Are you sure you want to archive "${projectToDelete?.name}"? You can restore it later from the archived projects section.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className={deleteMode === 'permanent' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {deleting ? (
                <>
                  <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                  {deleteMode === 'permanent' ? 'Deleting...' : 'Archiving...'}
                </>
              ) : (
                deleteMode === 'permanent' ? 'Delete Permanently' : 'Archive Project'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProjectCard({ 
  project, 
  locale, 
  viewMode, 
  onUpdate,
  onDelete
}: { 
  project: Project
  locale: string
  viewMode: 'grid' | 'list'
  onUpdate: () => void
  onDelete: (project: Project, deleteMode: 'archive' | 'permanent') => void
}) {
  const router = useRouter()

  const handleContinueProject = () => {
    router.push(`/${locale}/documents/new?mode=advanced&projectId=${project.id}`)
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status}
                </Badge>
                {project.hasActiveResearch && (
                  <Badge variant="secondary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Research Active
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 truncate">
                {project.description || 'No description provided'}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {project.counts.documents} docs
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatLastActivity(project.lastActivity)}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {project.confidence}% confidence
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleContinueProject}
              >
                <Play className="h-4 w-4 mr-1" />
                Continue
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDelete(project, 'archive')}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(project, 'permanent')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 truncate">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {project.description || 'No description provided'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
              {project.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDelete(project, 'archive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(project, 'permanent')}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">Progress</span>
              <span className="font-medium">{project.confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.confidence)}`}
                style={{ width: `${project.confidence}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{project.counts.documents} documents</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>{project.counts.conversations} sessions</span>
            </div>
          </div>
          
          {/* Industry and Activity */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{project.industry || 'General'}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatLastActivity(project.lastActivity)}
            </span>
          </div>
          
          {/* Action Button */}
          <Button 
            className="w-full"
            onClick={handleContinueProject}
          >
            <Play className="h-4 w-4 mr-2" />
            Continue Project
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case 'active': return 'default'
    case 'paused': return 'secondary'  
    case 'completed': return 'outline'
    case 'archived': return 'outline'
    default: return 'default'
  }
}

function getProgressColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-500'
  if (confidence >= 60) return 'bg-blue-500' 
  if (confidence >= 40) return 'bg-yellow-500'
  return 'bg-gray-400'
}

function formatLastActivity(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else {
    return 'Just now'
  }
}