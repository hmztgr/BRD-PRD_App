/**
 * Enhanced Document Client with Phase 5 Centralized State Management
 * Integrates MultiTabProvider and advanced state management
 */

'use client'

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Upload, 
  FileText, 
  Map, 
  Search, 
  FileStack,
  ToggleLeft,
  Zap,
  RefreshCw,
  TrendingUp,
  Bell,
  Save,
  Pause,
  CheckCircle,
  Loader2
} from 'lucide-react'

// Import centralized state management
import { MultiTabProvider, useMultiTabContext, useUIState, useProjectActions, useNotifications } from '@/contexts/MultiTabContext'

// Import components
import { EnhancedChatInterface } from '@/components/chat/enhanced-chat-interface'
import { ChatInterface } from '@/components/chat/chat-interface'
import { DocumentUploader } from '@/components/document/document-uploader'
import { GeneratedFilesSidebar } from '@/components/document/generated-files-sidebar'
import { UploadedFilesSidebar } from '@/components/document/uploaded-files-sidebar'
import { ProgressRoadmap } from '@/components/planning/progress-roadmap'
import { DataGatheringPanel } from '@/components/research/data-gathering-panel'
import { MultiDocumentGenerator } from '@/components/document/multi-document-generator'

interface EnhancedDocumentClientProps {
  userName: string
  locale: string
  translations: {
    backToDashboard: string
    createNewDocument: string
    standardDescription: string
    advancedDescription: string
    planningChat: string
    uploadDocs: string
    research: string
    progress: string
    generate: string
  }
  isRTL: boolean
}

type GenerationMode = 'standard' | 'advanced'

// Tab Activity Badge Component
function TabActivityBadge({ tabType }: { tabType: any }) {
  const context = useMultiTabContext()
  const activityInfo = context.getTabActivityInfo(tabType)
  
  if (!activityInfo.hasActivity || activityInfo.activityCount === 0) {
    return null
  }
  
  return (
    <Badge 
      variant="secondary" 
      className={`ml-2 ${activityInfo.status === 'processing' ? 'bg-blue-500 text-white animate-pulse' : 'bg-green-500 text-white'}`}
    >
      {activityInfo.activityCount}
    </Badge>
  )
}

// Notification Center Component  
function NotificationCenter() {
  const { notifications, unreadCount, markNotificationRead, clearNotifications } = useNotifications()
  
  if (notifications.length === 0) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.slice(0, 3).map(notification => (
        <div 
          key={notification.id}
          className={`p-3 rounded-lg shadow-lg border ${
            notification.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' :
            notification.type === 'error' ? 'bg-red-900 border-red-700 text-red-100' :
            notification.type === 'warning' ? 'bg-yellow-900 border-yellow-700 text-yellow-100' :
            'bg-blue-900 border-blue-700 text-blue-100'
          } cursor-pointer transition-all hover:shadow-md`}
          onClick={() => markNotificationRead(notification.id)}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-xs mt-1 opacity-80">{notification.message}</p>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2"></div>
            )}
          </div>
        </div>
      ))}
      
      {notifications.length > 3 && (
        <div className="text-center">
          <button 
            onClick={() => clearNotifications()}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  )
}

// Auto-save status indicator component
function AutoSaveIndicator() {
  const { hasUnsavedChanges, isLoading } = useProjectActions()
  const context = useMultiTabContext()
  const lastSaved = context.state.uiState.lastSaved
  
  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-blue-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Saving...
      </div>
    )
  }
  
  if (!hasUnsavedChanges && lastSaved) {
    return (
      <div className="flex items-center text-sm text-green-400">
        <CheckCircle className="w-4 h-4 mr-2" />
        All changes saved
      </div>
    )
  }
  
  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center text-sm text-yellow-400">
        <RefreshCw className="w-4 h-4 mr-2" />
        Auto-saving...
      </div>
    )
  }
  
  return null
}

// Save Progress Button Component (now optional manual save)
function SaveProgressButton() {
  const { saveState, hasUnsavedChanges, isLoading } = useProjectActions()
  
  return (
    <Button
      onClick={saveState}
      disabled={!hasUnsavedChanges || isLoading}
      variant="outline"
      size="sm"
      className={hasUnsavedChanges ? 'border-green-500 text-green-600' : 'opacity-50'}
      title={hasUnsavedChanges ? 'Force save now' : 'All changes are saved'}
    >
      <Save className="w-4 h-4 mr-2" />
      {hasUnsavedChanges ? 'Save Now' : 'Saved'}
    </Button>
  )
}

// Main Document Client Component (wrapped in provider)
function DocumentClientContent({
  userName,
  locale,
  translations: t,
  isRTL
}: EnhancedDocumentClientProps) {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const router = useRouter()
  
  // Use centralized state management
  const { state, updateProject, resumeState } = useMultiTabContext()
  const { activeTab, mode, setActiveTab } = useUIState()
  const { notifications } = useNotifications()

  // Initialize from URL params and resume state
  useEffect(() => {
    const modeFromUrl = searchParams?.get('mode') as GenerationMode
    const projectFromUrl = searchParams?.get('projectId') || searchParams?.get('project')
    
    if (projectFromUrl && !state.isInitialized) {
      // Resume state from server if project exists
      resumeState(projectFromUrl).then(() => {
        // Update mode if specified in URL
        if (modeFromUrl && (modeFromUrl === 'standard' || modeFromUrl === 'advanced')) {
          updateProject({ metadata: { ...state.project.metadata, mode: modeFromUrl } })
        }
      })
    } else if (modeFromUrl) {
      updateProject({ metadata: { ...state.project.metadata, mode: modeFromUrl } })
    }
  }, [searchParams, session, state.isInitialized])

  // Handle research finding selection
  const handleFindingSelect = (finding: any) => {
    console.log('Finding selected:', finding)
    
    // Switch to progress tab to show the selected finding
    setActiveTab('progress')
    
    // Add notification for finding selection
    const notificationContext = useMultiTabContext()
    notificationContext.addNotification({
      id: Date.now().toString(),
      type: 'success',
      title: 'Research Finding Added',
      message: `"${finding.title}" has been added to your project insights`,
      tabSource: 'research',
      isRead: false,
      createdAt: new Date().toISOString()
    })
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Notification Center */}
      <NotificationCenter />
      
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="text-gray-400 hover:text-white mb-4 inline-flex items-center"
            >
              ← {t.backToDashboard}
            </button>
            
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{t.createNewDocument}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="flex items-center border-gray-600 text-gray-300">
                    <Zap className="w-3 h-3 mr-1" />
                    Advanced Mode (Beta)
                  </Badge>
                  <p className="text-gray-400 text-sm">
                    Advanced business planning with intelligent data gathering
                  </p>
                </div>
              </div>
              
              {/* Mode Switch - could implement mode switching here */}
              <Button variant="outline" size="sm">
                <ToggleLeft className="w-4 h-4 mr-2" />
                Switch to Standard
              </Button>
            </div>
          </div>
          
          {/* Auto-save Status & Manual Save */}
          <div className="flex items-center space-x-4">
            <AutoSaveIndicator />
            <div className="flex items-center space-x-2">
              <SaveProgressButton />
              <Button variant="outline" size="sm">
                <Pause className="w-4 h-4 mr-2" />
                Pause Session
              </Button>
            </div>
            
            {/* Notification Badge */}
            {notifications.filter(n => !n.isRead).length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {notifications.filter(n => !n.isRead).length}
                </Badge>
              </div>
            )}
            
            <div className="text-sm text-gray-400">
              🇸🇦 Saudi Arabia
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 overflow-hidden">
          <GeneratedFilesSidebar onDocumentReady={() => {}} />
        </div>

        {/* Main Tab Area */}
        <div className="flex-1 flex flex-col bg-black">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Tab List */}
            <div className="bg-gray-900 border-b border-gray-700 px-6">
              <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                <TabsTrigger value="chat" className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t.planningChat}
                  <TabActivityBadge tabType="chat" />
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  {t.uploadDocs}
                  <TabActivityBadge tabType="upload" />
                </TabsTrigger>
                <TabsTrigger value="research" className="flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  {t.research}
                  <TabActivityBadge tabType="research" />
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t.progress}
                  <TabActivityBadge tabType="progress" />
                </TabsTrigger>
                <TabsTrigger value="generate" className="flex items-center">
                  <FileStack className="w-4 h-4 mr-2" />
                  {t.generate}
                  <TabActivityBadge tabType="generate" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content - Always mounted, CSS visibility control */}
            <div className="flex-1 relative">
              {/* Planning Chat Tab */}
              <div className={`absolute inset-0 h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                <EnhancedChatInterface
                  userName={userName}
                  onDocumentReady={handleFindingSelect}
                  sessionId={state.project.id}
                  locale={locale}
                  mode="advanced"
                  projectId={state.project.id}
                />
              </div>

              {/* Upload Docs Tab */}
              <div className={`absolute inset-0 h-full overflow-auto ${activeTab === 'upload' ? 'block' : 'hidden'}`}>
                <div className="p-6 space-y-6">
                  <DocumentUploader onFilesUploaded={() => {}} />
                  <UploadedFilesSidebar />
                </div>
              </div>

              {/* Research Tab */}
              <div className={`absolute inset-0 h-full overflow-auto ${activeTab === 'research' ? 'block' : 'hidden'}`}>
                <div className="p-6">
                  <DataGatheringPanel
                    onFindingSelect={handleFindingSelect}
                    locale={locale}
                    selectedFindings={[]}
                  />
                </div>
              </div>

              {/* Progress Tab */}
              <div className={`absolute inset-0 h-full overflow-auto ${activeTab === 'progress' ? 'block' : 'hidden'}`}>
                <div className="p-6">
                  <ProgressRoadmap
                    sessionId={state.project.id || 'default'}
                    locale={locale}
                    onStepClick={(step) => console.log('Step clicked:', step)}
                    onExportRoadmap={() => console.log('Export roadmap')}
                  />
                </div>
              </div>

              {/* Generate Tab */}
              <div className={`absolute inset-0 h-full overflow-auto ${activeTab === 'generate' ? 'block' : 'hidden'}`}>
                <div className="p-6">
                  <MultiDocumentGenerator
                    sessionId={state.project.id || 'default'}
                    onDocumentReady={() => {}}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Main wrapper component with Provider  
export default function EnhancedDocumentClient(props: EnhancedDocumentClientProps) {
  const searchParams = useSearchParams()
  const projectId = searchParams?.get('projectId') || searchParams?.get('project')

  return (
    <MultiTabProvider projectId={projectId || undefined}>
      <DocumentClientContent {...props} />
    </MultiTabProvider>
  )
}