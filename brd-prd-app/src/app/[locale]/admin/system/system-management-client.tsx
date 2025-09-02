'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Server, 
  Database, 
  Shield, 
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  RefreshCw,
  Activity,
  Users,
  FileText,
  Clock
} from 'lucide-react'
import { useApiRequest } from '@/hooks/useApiRequest'

interface SystemAnalytics {
  overview: {
    totalDocuments: number
    totalTemplates: number
    totalConversations: number
    totalMessages: number
    totalTokensUsed: number
    totalOperations: number
    successRate: number
  }
  usage: {
    byOperation: Array<{
      operation: string
      tokens: number
      count: number
    }>
    byAiModel: Array<{
      model: string
      tokens: number
      count: number
    }>
    dailyTrends: Array<{
      date: string
      tokens: number
      operations: number
    }>
    peakHours: Array<{
      hour: number
      operations: number
    }>
  }
  documents: {
    byType: Array<{
      type: string
      count: number
    }>
  }
  storage: {
    byTable: Array<{
      tableName: string
      sizeBytes: number
      rowCount: number
      sizeMB: number
    }>
  }
  support: {
    feedback: Array<{
      status: string
      count: number
    }>
    contactRequests: Array<{
      status: string
      count: number
    }>
    supportTickets: Array<{
      status: string
      count: number
    }>
  }
  topUsers: Array<{
    id: string
    name: string
    email: string
    subscriptionTier: string
    documentCount: number
  }>
}

export function SystemManagementClient() {
  const [period, setPeriod] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  
  const { data: systemData, loading, error, refetch } = useApiRequest<SystemAnalytics>(
    `/api/admin/analytics/system?period=${period}`
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return XCircle
      default: return Monitor
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600' 
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error loading system data: {error}</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Management</h1>
          <p className="text-muted-foreground mt-1">Monitor system health and performance</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-background"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {systemData?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Documents</p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{systemData.overview.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Generated documents</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total Operations</p>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{systemData.overview.totalOperations}</div>
              <p className="text-xs text-muted-foreground">API operations</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Success Rate</p>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{systemData.overview.successRate}%</div>
              <p className="text-xs text-muted-foreground">System reliability</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Tokens Used</p>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{(systemData.overview.totalTokensUsed / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">AI tokens consumed</p>
            </div>
          </Card>
        </div>
      )}

      {/* Storage and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Storage */}
        {systemData?.storage && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Database Storage</h3>
              <div className="space-y-3">
                {systemData.storage.byTable.slice(0, 5).map((table) => (
                  <div key={table.tableName} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{table.tableName}</p>
                      <p className="text-xs text-muted-foreground">{table.rowCount} rows</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatBytes(table.sizeBytes)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* AI Model Usage */}
        {systemData?.usage && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">AI Model Usage</h3>
              <div className="space-y-3">
                {systemData.usage.byAiModel.slice(0, 5).map((model) => (
                  <div key={model.model} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{model.model || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{model.count} operations</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{(model.tokens / 1000).toFixed(1)}K tokens</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Top Users */}
      {systemData?.topUsers && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Users</h3>
            <div className="space-y-3">
              {systemData.topUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.subscriptionTier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{user.documentCount}</p>
                    <p className="text-xs text-muted-foreground">documents</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}