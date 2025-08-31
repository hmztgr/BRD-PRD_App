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
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  subscriptionTier: string
  subscriptionStatus: string
  emailVerified: boolean
  tokensUsed: number
  tokensLimit: number
  createdAt: string
  lastActive?: string
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<User>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'user',
    subscriptionTier: 'FREE',
    tokensLimit: 10000
  })

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, filterRole, filterStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { subscriptionTier: filterStatus })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Transform the API response to match our expected format
        const transformedUsers = data.users.map((user: any) => ({
          ...user,
          emailVerified: !!user.emailVerified,
          subscriptionStatus: user.subscriptionStatus || 'active',
          lastActive: user.updatedAt
        }))
        setUsers(transformedUsers)
      } else {
        console.error('Failed to fetch users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // SAFE Implementation - Phase 1.1: Edit User Handler
  const handleEditUser = async (userId: string, userData: any) => {
    try {
      setIsSubmitting(true)
      
      // Use existing API endpoint - DO NOT MODIFY
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...userData })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }
      
      // Update UI state
      await fetchUsers() // Refresh user list
      setEditingUser(null) // Close edit modal
      setEditFormData({}) // Clear form
      
      // Show success notification
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to update user',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      tokensLimit: user.tokensLimit
    })
  }

  // Handle sending email to user
  const handleSendEmail = async (user: User) => {
    try {
      // For now, open email client with pre-filled recipient
      // In production, this would open a modal or use an email API
      window.location.href = `mailto:${user.email}?subject=Message from Admin&body=Hello ${user.name || 'User'},`;
      
      toast({
        title: "Email Client Opened",
        description: `Opening email client for ${user.email}`,
      })
    } catch (error: any) {
      console.error('Error opening email client:', error)
      toast({
        title: "Error",
        description: "Failed to open email client",
        variant: "destructive",
      })
    }
  }

  // Handle user suspension/activation
  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend'
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} user`)
      }
      
      await fetchUsers() // Refresh user list
      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      })
      
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user`,
        variant: "destructive",
      })
    }
  }

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
      
      await fetchUsers() // Refresh user list
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to delete user',
        variant: "destructive",
      })
    }
  }

  // Handle users export
  const handleExportUsers = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { subscriptionTier: filterStatus })
      })

      const response = await fetch(`/api/admin/users/export?${params}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to export users')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Users exported successfully",
      })

    } catch (error: any) {
      console.error('Error exporting users:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to export users',
        variant: "destructive",
      })
    }
  }

  // SAFE Implementation - Phase 1.2: Create User Handler
  const handleCreateUser = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate required fields
      if (!createFormData.email) {
        throw new Error('Email is required')
      }
      
      // Use existing API endpoint - DO NOT MODIFY
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createFormData,
          password: 'TempPassword123!' // Temporary password - user will need to reset
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }
      
      // Update UI state
      await fetchUsers() // Refresh user list
      setShowCreateModal(false) // Close modal
      setCreateFormData({ // Reset form
        name: '',
        email: '',
        role: 'user',
        subscriptionTier: 'FREE',
        tokensLimit: 10000
      })
      
      // Show success notification
      toast({
        title: "Success",
        description: "User created successfully. They will receive an email to set their password.",
      })
      
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to create user',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="outline" className="text-red-600 border-red-600">Super Admin</Badge>
      case 'admin':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Admin</Badge>
      case 'account_manager':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Account Manager</Badge>
      default:
        return <Badge variant="outline" className="text-blue-600 border-blue-600">User</Badge>
    }
  }

  const getTierBadge = (tier: string, status: string) => {
    // Show suspended status prominently
    if (status === 'suspended') {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="destructive" className="bg-red-600 text-white">SUSPENDED</Badge>
          <Badge variant="outline" className="text-gray-400 border-gray-400 text-xs">
            {tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()}
          </Badge>
        </div>
      )
    }
    
    if (status !== 'active') {
      return <Badge variant="outline" className="text-gray-500 border-gray-500">Inactive</Badge>
    }
    
    switch (tier) {
      case 'enterprise':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">Enterprise</Badge>
      case 'business':
        return <Badge variant="outline" className="text-green-600 border-green-600">Business</Badge>
      case 'professional':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Professional</Badge>
      case 'hobby':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Hobby</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.subscriptionStatus === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-300">Manage and monitor user accounts and subscriptions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 bg-background border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rtl:pr-10 rtl:pl-3"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleExportUsers}>
              <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card className="bg-background border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-gray-700">
              {filteredUsers.map((user) => {
                const usagePercent = getUsagePercentage(user.tokensUsed, user.tokensLimit)
                
                return (
                  <tr key={user.id} className={`hover:bg-gray-800 ${user.subscriptionStatus === 'suspended' ? 'bg-red-900/10 border-l-4 border-red-600' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getTierBadge(user.subscriptionTier, user.subscriptionStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-sm text-white">
                            {user.tokensUsed.toLocaleString()} / {user.tokensLimit.toLocaleString()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                usagePercent > 90 ? 'bg-red-500' : 
                                usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {user.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-white">
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditUser(user)}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSendEmail(user)}
                          title="Send email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSuspendUser(user.id, user.subscriptionStatus)}
                          title={user.subscriptionStatus === 'suspended' ? 'Activate' : 'Suspend'}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              No users found matching your filters.
            </div>
            <Button variant="outline" onClick={() => {
              setSearchTerm('')
              setFilterRole('all')
              setFilterStatus('all')
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Edit User</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setEditingUser(null)
                    setEditFormData({})
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-400">Name</label>
                  <Input
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="User name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <Input
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="Email address"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Role</label>
                  <select
                    value={editFormData.role || 'user'}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="account_manager">Account Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Subscription Tier</label>
                  <select
                    value={editFormData.subscriptionTier || 'FREE'}
                    onChange={(e) => setEditFormData({...editFormData, subscriptionTier: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="FREE">Free</option>
                    <option value="HOBBY">Hobby</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Token Limit</label>
                  <Input
                    type="number"
                    value={editFormData.tokensLimit || 0}
                    onChange={(e) => setEditFormData({...editFormData, tokensLimit: parseInt(e.target.value)})}
                    placeholder="Token limit"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditingUser(null)
                    setEditFormData({})
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleEditUser(editingUser.id, editFormData)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-background border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Create New User</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateFormData({
                      name: '',
                      email: '',
                      role: 'user',
                      subscriptionTier: 'FREE',
                      tokensLimit: 10000
                    })
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-400">Name *</label>
                  <Input
                    value={createFormData.name || ''}
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                    placeholder="User name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Email *</label>
                  <Input
                    type="email"
                    value={createFormData.email || ''}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    placeholder="Email address"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Role</label>
                  <select
                    value={createFormData.role || 'user'}
                    onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="account_manager">Account Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Subscription Tier</label>
                  <select
                    value={createFormData.subscriptionTier || 'FREE'}
                    onChange={(e) => setCreateFormData({...createFormData, subscriptionTier: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="FREE">Free</option>
                    <option value="HOBBY">Hobby</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Token Limit</label>
                  <Input
                    type="number"
                    value={createFormData.tokensLimit || 10000}
                    onChange={(e) => setCreateFormData({...createFormData, tokensLimit: parseInt(e.target.value)})}
                    placeholder="Token limit"
                    className="mt-1"
                  />
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  * User will receive an email to set their password
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateFormData({
                      name: '',
                      email: '',
                      role: 'user',
                      subscriptionTier: 'FREE',
                      tokensLimit: 10000
                    })
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={isSubmitting || !createFormData.email}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background border-border">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </Card>
        <Card className="p-4 bg-background border-border">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.subscriptionStatus === 'active' && u.subscriptionTier !== 'free').length}
          </div>
          <div className="text-sm text-gray-400">Paying Users</div>
        </Card>
        <Card className="p-4 bg-background border-border">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.emailVerified).length}
          </div>
          <div className="text-sm text-gray-400">Verified Users</div>
        </Card>
        <Card className="p-4 bg-background border-border">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role !== 'user').length}
          </div>
          <div className="text-sm text-gray-400">Admin Users</div>
        </Card>
      </div>
    </div>
  )
}