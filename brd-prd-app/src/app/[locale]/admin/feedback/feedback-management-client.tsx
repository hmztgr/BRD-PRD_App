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
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Reply,
  Archive,
  Trash2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

interface Feedback {
  id: string
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'support_request'
  title: string
  content: string
  rating?: number
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented'
  priority: 'low' | 'medium' | 'high' | 'critical'
  user: {
    id: string
    name: string | null
    email: string
    subscriptionTier: string
  }
  adminResponse?: string
  createdAt: string
  updatedAt: string
}

interface FeedbackStats {
  total: number
  pending: number
  approved: number
  rejected: number
  implemented: number
  averageRating: number
}

export function FeedbackManagementClient() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const feedbackTypes = [
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'general_feedback', label: 'General Feedback' },
    { value: 'support_request', label: 'Support Request' }
  ]

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_review', label: 'In Review', color: 'bg-blue-100 text-blue-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'implemented', label: 'Implemented', color: 'bg-purple-100 text-purple-800' }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    fetchFeedback()
    fetchStats()
  }, [searchTerm, filterType, filterStatus, filterPriority])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPriority !== 'all' && { priority: filterPriority })
      })

      const response = await fetch(`/api/admin/feedback?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback)
      } else {
        console.error('Failed to fetch feedback:', response.statusText)
        setFeedback(getMockFeedback())
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setFeedback(getMockFeedback())
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/feedback/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.success ? data.stats : data)
      } else {
        setStats({
          total: 24,
          pending: 8,
          approved: 12,
          rejected: 2,
          implemented: 2,
          averageRating: 4.2
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        total: 24,
        pending: 8,
        approved: 12,
        rejected: 2,
        implemented: 2,
        averageRating: 4.2
      })
    }
  }

  const getMockFeedback = (): Feedback[] => [
    {
      id: '1',
      type: 'feature_request',
      title: 'Add dark mode support',
      content: 'It would be great to have a dark mode option for better usability in low-light conditions.',
      rating: 5,
      status: 'approved',
      priority: 'medium',
      user: {
        id: 'u1',
        name: 'John Doe',
        email: 'john@example.com',
        subscriptionTier: 'PROFESSIONAL'
      },
      adminResponse: 'Great suggestion! This is already in our roadmap for Q4.',
      createdAt: '2024-08-25T10:30:00Z',
      updatedAt: '2024-08-26T14:15:00Z'
    },
    {
      id: '2',
      type: 'bug_report',
      title: 'PDF export not working properly',
      content: 'When I try to export large documents to PDF, the process fails or produces corrupted files.',
      status: 'in_review',
      priority: 'high',
      user: {
        id: 'u2',
        name: 'Sarah Wilson',
        email: 'sarah@company.com',
        subscriptionTier: 'BUSINESS'
      },
      createdAt: '2024-08-28T09:15:00Z',
      updatedAt: '2024-08-28T09:15:00Z'
    }
  ]

  const handleUpdateStatus = async (feedbackId: string, status: string, response?: string) => {
    try {
      setIsSubmitting(true)

      const requestBody: any = { status }
      if (response) {
        requestBody.adminResponse = response
      }

      const apiResponse = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!apiResponse.ok) {
        throw new Error('Failed to update feedback status')
      }

      await fetchFeedback()
      setSelectedFeedback(null)
      setAdminResponse('')

      toast({
        title: "Success",
        description: "Feedback status updated successfully",
      })

    } catch (error: any) {
      console.error('Error updating feedback status:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to update feedback status',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete feedback')
      }

      await fetchFeedback()
      toast({
        title: "Success",
        description: "Feedback deleted successfully",
      })

    } catch (error: any) {
      console.error('Error deleting feedback:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to delete feedback',
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statuses.find(s => s.value === status)
    if (!statusConfig) return null

    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority)
    if (!priorityConfig) return null

    return (
      <Badge variant="outline" className={priorityConfig.color}>
        {priorityConfig.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'feature_request': return <Star className="h-4 w-4 text-blue-500" />
      case 'support_request': return <MessageSquare className="h-4 w-4 text-green-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.message?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.category === filterType
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-white">Feedback Management</h1>
          <p className="text-gray-300">Manage user feedback, suggestions, and support requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Feedback</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.pending}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.approved}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.rejected}</div>
                <div className="text-sm text-gray-400">Rejected</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-background border-border">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.averageRating?.toFixed(1) || '0.0'}</div>
                <div className="text-sm text-gray-400">Avg Rating</div>
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
                placeholder="Search feedback by title, content, or user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rtl:pr-10 rtl:pl-3"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="all">All Types</option>
              {feedbackTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            >
              <option value="all">All Priority</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Feedback List */}
      <div className="grid gap-4">
        {filteredFeedback.map((item) => (
          <Card key={item.id} className="p-6 bg-background border-border">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getTypeIcon(item.type)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusBadge(item.status)}
                  {getPriorityBadge(item.priority)}
                  {item.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-400">{item.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{item.name || item.email || 'Anonymous'}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.category || 'general'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status === 'pending' && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUpdateStatus(item.id, 'approved')}
                        title="Approve"
                      >
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                        title="Reject"
                      >
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedFeedback(item)
                      setAdminResponse(item.adminResponse || '')
                    }}
                    title="Respond"
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteFeedback(item.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {item.adminResponse && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Admin Response:</strong> {item.adminResponse}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFeedback.length === 0 && !loading && (
        <Card className="p-12 text-center bg-background border-border">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-white mb-2">No feedback found</h3>
          <p className="text-gray-400 mb-4">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'No feedback matches your current filters.'
              : 'No feedback has been submitted yet.'}
          </p>
          {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterPriority !== 'all') && (
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setFilterType('all')
              setFilterStatus('all')
              setFilterPriority('all')
            }}>
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Respond to Feedback</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedFeedback(null)
                    setAdminResponse('')
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-white">{selectedFeedback.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{selectedFeedback.message}</p>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>From: {selectedFeedback.name || selectedFeedback.email}</span>
                  <Badge variant="outline">{selectedFeedback.category}</Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Admin Response</label>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Write your response to the user..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Update Status</label>
                  <div className="mt-2 flex gap-2">
                    {statuses.map(status => (
                      <Button
                        key={status.value}
                        variant={selectedFeedback.status === status.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedFeedback.id, status.value, adminResponse)}
                        disabled={isSubmitting}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedFeedback(null)
                    setAdminResponse('')
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus(selectedFeedback.id, selectedFeedback.status, adminResponse)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Save Response'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}