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
  Database,
  Mail,
  CreditCard,
  Globe,
  Users,
  Bell,
  Key,
  Server,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface SystemSettings {
  general: {
    siteName: string
    siteUrl: string
    adminEmail: string
    supportEmail: string
    defaultLanguage: string
    timezone: string
  }
  features: {
    registrationEnabled: boolean
    emailVerificationRequired: boolean
    maintenanceMode: boolean
    analyticsEnabled: boolean
  }
  limits: {
    maxUsersPerPlan: number
    maxDocumentsPerUser: number
    maxTokensPerUser: number
    rateLimitPerHour: number
  }
  integrations: {
    stripeEnabled: boolean
    emailServiceEnabled: boolean
    backupEnabled: boolean
    loggingLevel: string
  }
}

export function SettingsClient() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'Smart Business Docs AI',
      siteUrl: 'https://smart-business-docs-ai.com',
      adminEmail: 'admin@smartdocs.ai',
      supportEmail: 'support@smartdocs.ai',
      defaultLanguage: 'en',
      timezone: 'UTC'
    },
    features: {
      registrationEnabled: true,
      emailVerificationRequired: false,
      maintenanceMode: false,
      analyticsEnabled: true
    },
    limits: {
      maxUsersPerPlan: 10000,
      maxDocumentsPerUser: 50,
      maxTokensPerUser: 10000,
      rateLimitPerHour: 100
    },
    integrations: {
      stripeEnabled: true,
      emailServiceEnabled: true,
      backupEnabled: true,
      loggingLevel: 'info'
    }
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    // Simulate loading settings
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'features', label: 'Features', icon: Shield },
    { id: 'limits', label: 'Limits', icon: Server },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="lg:col-span-3 h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {settings.features.maintenanceMode && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Maintenance Mode
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    General Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Site Name</label>
                      <Input
                        value={settings.general.siteName}
                        onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Site URL</label>
                      <Input
                        value={settings.general.siteUrl}
                        onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Admin Email</label>
                      <Input
                        type="email"
                        value={settings.general.adminEmail}
                        onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Support Email</label>
                      <Input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Language</label>
                      <select
                        value={settings.general.defaultLanguage}
                        onChange={(e) => handleInputChange('general', 'defaultLanguage', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Timezone</label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Riyadh">Riyadh</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Settings */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Feature Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.features).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm text-muted-foreground">
                            {key === 'registrationEnabled' && 'Allow new users to register accounts'}
                            {key === 'emailVerificationRequired' && 'Require email verification for new accounts'}
                            {key === 'maintenanceMode' && 'Put the site in maintenance mode'}
                            {key === 'analyticsEnabled' && 'Enable usage analytics and tracking'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleInputChange('features', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Limit Settings */}
            {activeTab === 'limits' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    System Limits
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings.limits).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => handleInputChange('limits', key, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Integration Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Integrations
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Boolean integrations */}
                    {Object.entries(settings.integrations).filter(([key]) => typeof settings.integrations[key as keyof typeof settings.integrations] === 'boolean').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {key === 'stripeEnabled' && <CreditCard className="h-5 w-5 text-blue-500" />}
                          {key === 'emailServiceEnabled' && <Mail className="h-5 w-5 text-green-500" />}
                          {key === 'backupEnabled' && <Database className="h-5 w-5 text-purple-500" />}
                          <div>
                            <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-sm text-muted-foreground">
                              {key === 'stripeEnabled' && 'Enable Stripe payment processing'}
                              {key === 'emailServiceEnabled' && 'Enable email notifications and services'}
                              {key === 'backupEnabled' && 'Enable automatic database backups'}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => handleInputChange('integrations', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                    
                    {/* Logging Level */}
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Key className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Logging Level</p>
                          <p className="text-sm text-muted-foreground">Set the system logging verbosity</p>
                        </div>
                      </div>
                      <select
                        value={settings.integrations.loggingLevel}
                        onChange={(e) => handleInputChange('integrations', 'loggingLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}