'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="outline" className="text-red-600 border-red-600">Super Admin</Badge>
      case 'admin':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Admin</Badge>
      default:
        return <Badge variant="outline" className="text-blue-600 border-blue-600">User</Badge>
    }
  }

  const getTierBadge = (tier: string, status: string) => {
    if (status !== 'active') {
      return <Badge variant="outline" className="text-gray-500 border-gray-500">Inactive</Badge>
    }
    
    switch (tier) {
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>
      case 'business':
        return <Badge className="bg-green-100 text-green-800">Business</Badge>
      case 'professional':
        return <Badge className="bg-blue-100 text-blue-800">Professional</Badge>
      case 'hobby':
        return <Badge className="bg-yellow-100 text-yellow-800">Hobby</Badge>
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and monitor user accounts and subscriptions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const usagePercent = getUsagePercentage(user.tokensUsed, user.tokensLimit)
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
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
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
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
                          <div className="text-sm text-gray-900">
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
                        <span className="text-sm text-gray-900">
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.subscriptionStatus === 'active' && u.subscriptionTier !== 'free').length}
          </div>
          <div className="text-sm text-gray-500">Paying Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.emailVerified).length}
          </div>
          <div className="text-sm text-gray-500">Verified Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role !== 'user').length}
          </div>
          <div className="text-sm text-gray-500">Admin Users</div>
        </Card>
      </div>
    </div>
  )
}