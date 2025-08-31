'use client'

import { useState, useEffect } from 'react'
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
  RefreshCw
} from 'lucide-react'

// Mock data types
interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  uptime: string
  lastRestart: string
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'warning' | 'error'
  description: string
  lastChecked: string
}

const mockSystemMetrics: SystemMetrics = {
  cpu: 23.5,
  memory: 67.2,
  disk: 45.8,
  network: 12.3,
  uptime: '7d 14h 32m',
  lastRestart: '2025-08-24 06:00:00'
}

const mockServiceStatus: ServiceStatus[] = [
  {
    name: 'Database Connection',
    status: 'healthy',
    description: 'PostgreSQL connection pool optimal',
    lastChecked: '2025-08-31 21:10:00'
  },
  {
    name: 'Authentication Service',
    status: 'healthy',
    description: 'NextAuth running normally',
    lastChecked: '2025-08-31 21:09:45'
  },
  {
    name: 'File Storage',
    status: 'warning',
    description: '78% capacity - cleanup recommended',
    lastChecked: '2025-08-31 21:09:30'
  },
  {
    name: 'Email Service',
    status: 'healthy',
    description: 'Mailjet API responding normally',
    lastChecked: '2025-08-31 21:09:15'
  },
  {
    name: 'AI Integration',
    status: 'healthy',
    description: 'OpenAI & Gemini APIs operational',
    lastChecked: '2025-08-31 21:09:00'
  },
  {
    name: 'Payment Processing',
    status: 'healthy',
    description: 'Stripe webhook active',
    lastChecked: '2025-08-31 21:08:45'
  }
]

export function SystemManagementClient() {
  const [metrics, setMetrics] = useState<SystemMetrics>(mockSystemMetrics)
  const [services, setServices] = useState<ServiceStatus[]>(mockServiceStatus)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
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
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getMetricColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
          <p className="text-gray-600 mt-1">Monitor system health and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-semibold">{metrics.uptime}</p>
            </div>
            <Server className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Services Healthy</p>
              <p className="text-2xl font-semibold text-green-600">
                {services.filter(s => s.status === 'healthy').length}/{services.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {services.filter(s => s.status === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Restart</p>
              <p className="text-sm font-medium">{metrics.lastRestart}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Resource Usage */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Resource Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'CPU Usage', value: metrics.cpu, icon: Cpu },
            { label: 'Memory Usage', value: metrics.memory, icon: MemoryStick },
            { label: 'Disk Usage', value: metrics.disk, icon: HardDrive },
            { label: 'Network I/O', value: metrics.network, icon: Network }
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="space-y-3">
                <div className="flex items-center">
                  <Icon className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{metric.value}%</span>
                    <span className="text-gray-500">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getMetricColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Service Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Service Status</h2>
        <div className="space-y-4">
          {services.map((service, index) => {
            const Icon = getStatusIcon(service.status)
            return (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(service.status)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    service.status === 'healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : service.status === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {service.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Last checked: {service.lastChecked}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Database Health */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Connection Pool</p>
            <p className="text-2xl font-semibold">15/200</p>
            <p className="text-xs text-green-600">7.5% utilization</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Average Query Time</p>
            <p className="text-2xl font-semibold">45ms</p>
            <p className="text-xs text-green-600">Optimal</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Active Connections</p>
            <p className="text-2xl font-semibold">8</p>
            <p className="text-xs text-blue-600">Normal load</p>
          </div>
        </div>
      </Card>
    </div>
  )
}