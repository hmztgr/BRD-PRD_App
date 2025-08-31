'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Users, 
  Shield, 
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Search
} from 'lucide-react'

// Mock data types
interface ActivityLog {
  id: string
  timestamp: string
  user: string
  action: string
  details: string
  type: 'info' | 'warning' | 'error' | 'success'
  ip?: string
}

const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: '2025-08-31 20:45:12',
    user: 'admin@smartdocs.ai',
    action: 'User Login',
    details: 'Admin user logged in successfully',
    type: 'success',
    ip: '192.168.1.100'
  },
  {
    id: '2',
    timestamp: '2025-08-31 20:30:45',
    user: 'user@example.com',
    action: 'Document Created',
    details: 'Created new BRD document: "E-commerce Platform"',
    type: 'info'
  },
  {
    id: '3',
    timestamp: '2025-08-31 20:15:33',
    user: 'admin@smartdocs.ai',
    action: 'System Setting Changed',
    details: 'Updated database connection parameters',
    type: 'warning',
    ip: '192.168.1.100'
  },
  {
    id: '4',
    timestamp: '2025-08-31 19:55:21',
    user: 'test@example.com',
    action: 'Failed Login Attempt',
    details: 'Multiple failed login attempts detected',
    type: 'error',
    ip: '203.0.113.45'
  }
]

export function ActivityManagementClient() {
  const [logs, setLogs] = useState<ActivityLog[]>(mockActivityLogs)
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return Activity
      case 'warning': return AlertTriangle
      case 'error': return Shield
      default: return Users
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">Monitor system activity and user actions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-semibold">2,847</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold">156</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-semibold">23</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-semibold">7</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'info', 'success', 'warning', 'error'].map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type as any)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Activity Logs */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const Icon = getTypeIcon(log.type)
            return (
              <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className={`p-2 rounded-lg ${getTypeColor(log.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{log.action}</h3>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span>User: {log.user}</span>
                    {log.ip && (
                      <>
                        <span className="mx-2">•</span>
                        <span>IP: {log.ip}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}