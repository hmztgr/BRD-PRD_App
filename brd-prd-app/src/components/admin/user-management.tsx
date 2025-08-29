'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  CreditCard,
  Activity,
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react'
import { Icons } from '@/components/ui/icons'

interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  subscriptionTier: string
  subscriptionStatus: string
  tokensUsed: number
  tokensLimit: number
  role: string
  lastActive?: Date
  isActive: boolean
}

interface UserFilters {
  search: string
  subscriptionTier: string
  role: string
  status: string
  emailVerified: string
}

interface UserManagementProps {
  adminPermissions: string[]
}

export function UserManagement({ adminPermissions }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    subscriptionTier: '',
    role: '',
    status: '',
    emailVerified: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  const itemsPerPage = 25

  const hasPermission = (permission: string) => {
    return adminPermissions.includes(permission) || adminPermissions.includes('manage_users')
  }

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      })

      const response = await fetch(`/api/admin/users?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalUsers(data.totalUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return
    
    if (!confirm(`Are you sure you want to ${action} ${selectedUsers.length} user(s)?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      })

      if (!response.ok) throw new Error(`Failed to ${action} users`)
      
      await fetchUsers()
      setSelectedUsers([])
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to perform bulk action'}`)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error(`Failed to ${action} user`)
      
      await fetchUsers()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to perform action'}`)
    }
  }

  const getSubscriptionColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'business': return 'bg-blue-100 text-blue-800'
      case 'professional': return 'bg-green-100 text-green-800'
      case 'hobby': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, userIds: selectedUsers })
      })

      if (!response.ok) throw new Error('Failed to export users')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">
            Manage {totalUsers.toLocaleString()} registered users
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasPermission('manage_users') && (
            <>
              <Button variant="outline" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Enter user name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter email address" />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tier">Subscription Tier</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="hobby">Hobby</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select
              value={filters.subscriptionTier}
              onValueChange={(value) => handleFilterChange('subscriptionTier', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="hobby">Hobby</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.role}
              onValueChange={(value) => handleFilterChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.emailVerified}
              onValueChange={(value) => handleFilterChange('emailVerified', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Email Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Email Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && hasPermission('manage_users') && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')}>
                  <Ban className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('send_email')}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({totalUsers.toLocaleString()})</CardTitle>
            {loading && (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error: {error}</p>
              <Button onClick={fetchUsers} className="mt-2" variant="outline">
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No users found with current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4">
                      <Checkbox 
                        checked={selectedUsers.length === users.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Subscription</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Usage</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name || 'No name'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getSubscriptionColor(user.subscriptionTier)}>
                          {user.subscriptionTier}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {user.subscriptionStatus}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {user.emailVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {user.tokensUsed.toLocaleString()} / {user.tokensLimit.toLocaleString()}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((user.tokensUsed / user.tokensLimit) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsUserModalOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {hasPermission('manage_users') && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUserAction(user.id, user.isActive ? 'suspend' : 'activate')}
                              >
                                {user.isActive ? (
                                  <Ban className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} • {totalUsers.toLocaleString()} total users
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and edit user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={selectedUser.name || ''} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={selectedUser.email} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select value={selectedUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subscription Tier</Label>
                  <Select value={selectedUser.subscriptionTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="hobby">Hobby</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Admin Notes</Label>
                <Textarea placeholder="Add notes about this user..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}