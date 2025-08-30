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
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Trash2
} from 'lucide-react'

interface Feedback {
  id: string
  name: string
  email: string
  rating: number
  category: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  isPublic: boolean
  createdAt: string
  adminResponse?: string
}

export function FeedbackClient() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminResponse, setAdminResponse] = useState('')

  useEffect(() => {
    fetchFeedback()
  }, [searchTerm, filterStatus])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      })

      const response = await fetch(`/api/feedback?admin=true&${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
      } else {
        console.error('Failed to fetch feedback:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, status: 'approved' | 'rejected', isPublic?: boolean) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          isPublic: isPublic ?? (status === 'approved'),
          adminResponse: adminResponse || undefined
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Feedback ${status} successfully`,
        })
        fetchFeedback()
        setSelectedFeedback(null)
        setAdminResponse('')
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || 'Failed to update feedback',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      toast({
        title: "Error",
        description: 'Failed to update feedback',
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const pendingCount = feedback.filter(f => f.status === 'pending').length
  const approvedCount = feedback.filter(f => f.status === 'approved').length
  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-foreground">Feedback Management</h1>
          <p className="text-muted-foreground">
            Review and manage user feedback and testimonials
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-yellow-600 mt-1">
                Awaiting moderation
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-3xl font-bold text-foreground">{approvedCount}</p>
              <p className="text-sm text-green-600 mt-1">
                Live testimonials
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
              <p className="text-3xl font-bold text-foreground">{averageRating}</p>
              <div className="flex items-center mt-1">
                {getStarRating(Math.round(parseFloat(averageRating)))}
              </div>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Feedback List */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Feedback Items</h3>
          
          {feedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedback found
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <div className="flex items-center">
                        {getStarRating(item.rating)}
                      </div>
                      {getStatusBadge(item.status)}
                      {item.isPublic && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.email}</p>
                    <p className="text-sm text-foreground mb-2">"{item.message}"</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()} • Category: {item.category}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {item.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, 'approved', true)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, 'rejected', false)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(item)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Feedback Details</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFeedback(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{selectedFeedback.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedFeedback.email}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStarRating(selectedFeedback.rating)}
                  <span className="text-sm font-medium">({selectedFeedback.rating}/5)</span>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Message:</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedFeedback.message}</p>
                </div>
                
                <div>
                  <label className="font-medium mb-2 block">Admin Response (Optional):</label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add a response to this feedback..."
                    className="w-full p-3 border border-border rounded-md bg-background"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'approved', true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Publish
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'rejected', false)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}