'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { 
  Settings,
  Shield,
  Key,
  Globe,
  Mail,
  Database,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit,
  X
} from 'lucide-react'

interface SettingsManagementClientProps {
  locale: string
}

interface SystemSetting {
  id: string
  key: string
  value: string
  category: 'api' | 'email' | 'system' | 'security' | 'features'
  description: string
  isSecret: boolean
  isEditable: boolean
  lastUpdated: string
  updatedBy: string
}

interface PermissionTemplate {
  id: string
  name: string
  description: string
  permissions: string[]
}

export function SettingsManagementClient({ locale }: SettingsManagementClientProps) {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSettings, setEditingSettings] = useState<{ [key: string]: string }>({})
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'email' | 'security' | 'permissions'>('general')
  const [isSaving, setIsSaving] = useState(false)

  // Mock data for initial implementation
  const mockSettings: SystemSetting[] = [
    // API Settings
    {
      id: '1',
      key: 'OPENAI_API_KEY',
      value: 'sk-proj-****************************',
      category: 'api',
      description: 'OpenAI API key for AI document generation',
      isSecret: true,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '2',
      key: 'GEMINI_API_KEY',
      value: '****************************',
      category: 'api',
      description: 'Google Gemini API key for fallback AI generation',
      isSecret: true,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '3',
      key: 'STRIPE_PUBLIC_KEY',
      value: 'pk_test_****************************',
      category: 'api',
      description: 'Stripe public key for payment processing',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    // Email Settings
    {
      id: '4',
      key: 'MAILJET_API_KEY',
      value: '****************************',
      category: 'email',
      description: 'Mailjet API key for email notifications',
      isSecret: true,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '5',
      key: 'MAILJET_SECRET_KEY',
      value: '****************************',
      category: 'email',
      description: 'Mailjet secret key for email authentication',
      isSecret: true,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '6',
      key: 'EMAIL_FROM',
      value: 'noreply@smartbusinessdocs.ai',
      category: 'email',
      description: 'Default sender email address',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    // System Settings
    {
      id: '7',
      key: 'DEFAULT_LANGUAGE',
      value: 'en',
      category: 'system',
      description: 'Default language for new users (en/ar)',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '8',
      key: 'MAX_DOCUMENT_SIZE_MB',
      value: '10',
      category: 'system',
      description: 'Maximum document upload size in MB',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '9',
      key: 'RATE_LIMIT_PER_MINUTE',
      value: '60',
      category: 'system',
      description: 'API rate limit per minute per user',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    // Security Settings
    {
      id: '10',
      key: 'SESSION_TIMEOUT_MINUTES',
      value: '60',
      category: 'security',
      description: 'User session timeout in minutes',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    {
      id: '11',
      key: 'ENABLE_2FA',
      value: 'false',
      category: 'security',
      description: 'Enable two-factor authentication',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    },
    // Feature Flags
    {
      id: '12',
      key: 'ENABLE_ADVANCED_MODE',
      value: 'true',
      category: 'features',
      description: 'Enable advanced document generation mode',
      isSecret: false,
      isEditable: true,
      lastUpdated: '2025-01-28T10:30:00Z',
      updatedBy: 'admin@example.com'
    }
  ]

  const mockPermissionTemplates: PermissionTemplate[] = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: ['manage_users', 'manage_feedback', 'manage_content', 'manage_subscriptions', 'view_analytics', 'manage_system']
    },
    {
      id: '2',
      name: 'Content Manager',
      description: 'Manage content and view analytics',
      permissions: ['manage_content', 'view_analytics']
    },
    {
      id: '3',
      name: 'Support Admin',
      description: 'Handle user support and feedback',
      permissions: ['manage_feedback', 'manage_users', 'view_analytics']
    },
    {
      id: '4',
      name: 'Finance Admin',
      description: 'Manage subscriptions and view financial data',
      permissions: ['manage_subscriptions', 'view_analytics']
    }
  ]

  useEffect(() => {
    fetchSettings()
    fetchPermissionTemplates()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || mockSettings)
      } else {
        // Use mock data if API not ready
        setSettings(mockSettings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings(mockSettings)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissionTemplates = async () => {
    try {
      const response = await fetch('/api/admin/settings/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissionTemplates(data.templates || mockPermissionTemplates)
      } else {
        setPermissionTemplates(mockPermissionTemplates)
      }
    } catch (error) {
      console.error('Error fetching permission templates:', error)
      setPermissionTemplates(mockPermissionTemplates)
    }
  }

  const handleEditSetting = (settingId: string, currentValue: string) => {
    setEditingSettings({ ...editingSettings, [settingId]: currentValue })
  }

  const handleCancelEdit = (settingId: string) => {
    const newEditingSettings = { ...editingSettings }
    delete newEditingSettings[settingId]
    setEditingSettings(newEditingSettings)
  }

  const handleSaveSetting = async (setting: SystemSetting) => {
    const newValue = editingSettings[setting.id]
    if (!newValue || newValue === setting.value) {
      handleCancelEdit(setting.id)
      return
    }

    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/admin/settings/${setting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue })
      })

      if (!response.ok) {
        throw new Error('Failed to update setting')
      }

      // Update local state
      setSettings(settings.map(s => 
        s.id === setting.id 
          ? { ...s, value: newValue, lastUpdated: new Date().toISOString() }
          : s
      ))

      handleCancelEdit(setting.id)

      toast({
        title: "Success",
        description: `${setting.key} updated successfully`,
      })

    } catch (error: any) {
      console.error('Error updating setting:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to update setting',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSecretVisibility = (settingId: string) => {
    setShowSecrets({ ...showSecrets, [settingId]: !showSecrets[settingId] })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api': return <Key className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'system': return <Settings className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'features': return <Zap className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getFilteredSettings = () => {
    if (activeTab === 'general') {
      return settings.filter(s => s.category === 'system' || s.category === 'features')
    }
    if (activeTab === 'permissions') {
      return []
    }
    return settings.filter(s => s.category === activeTab)
  }

  const formatValue = (setting: SystemSetting) => {
    if (!setting.isSecret || showSecrets[setting.id]) {
      return editingSettings[setting.id] !== undefined ? editingSettings[setting.id] : setting.value
    }
    return '••••••••••••••••••••'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
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
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-gray-300">Manage application configuration and permissions</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload Settings
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'general', label: 'General', icon: Settings },
          { id: 'api', label: 'API Keys', icon: Key },
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'permissions', label: 'Permissions', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Settings Content */}
      {activeTab === 'permissions' ? (
        // Permission Templates
        <div className="grid gap-4">
          {permissionTemplates.map((template) => (
            <Card key={template.id} className="p-6 bg-background border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary">
                        {perm.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Settings List
        <div className="grid gap-4">
          {getFilteredSettings().map((setting) => (
            <Card key={setting.id} className="p-6 bg-background border-border">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(setting.category)}
                      <h3 className="font-semibold text-white">{setting.key}</h3>
                      {setting.isSecret && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Secret
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{setting.description}</p>
                  </div>
                  {setting.isEditable && (
                    <div className="flex items-center space-x-2">
                      {editingSettings[setting.id] !== undefined ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveSetting(setting)}
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelEdit(setting.id)}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSetting(setting.id, setting.value)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    {editingSettings[setting.id] !== undefined ? (
                      <Input
                        type={setting.isSecret && !showSecrets[setting.id] ? 'password' : 'text'}
                        value={editingSettings[setting.id]}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          [setting.id]: e.target.value
                        })}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-800 rounded-md">
                        <code className="text-sm text-gray-300">
                          {formatValue(setting)}
                        </code>
                      </div>
                    )}
                  </div>
                  {setting.isSecret && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleSecretVisibility(setting.id)}
                    >
                      {showSecrets[setting.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last updated: {new Date(setting.lastUpdated).toLocaleString()}</span>
                  <span>By: {setting.updatedBy}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Warning Card */}
      <Card className="p-6 bg-yellow-900/20 border-yellow-600/50">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-yellow-500">Important Notice</h4>
            <p className="text-sm text-gray-300">
              Changes to API keys and critical settings may require application restart. 
              Always test changes in development environment first.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}