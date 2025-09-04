'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  TrendingUp
} from 'lucide-react'

// Import our enhanced components
import { EnhancedChatInterface } from '@/components/chat/enhanced-chat-interface'
import { ChatInterface } from '@/components/chat/chat-interface'
import { DocumentUploader } from '@/components/document/document-uploader'
import { GeneratedFilesSidebar } from '@/components/document/generated-files-sidebar'
import { UploadedFilesSidebar } from '@/components/document/uploaded-files-sidebar'
import { ProgressRoadmap } from '@/components/planning/progress-roadmap'
import { DataGatheringPanel } from '@/components/research/data-gathering-panel'
import { MultiDocumentGenerator } from '@/components/document/multi-document-generator'

interface NewDocumentClientProps {
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

export function NewDocumentClient({
  userName,
  locale,
  translations: t,
  isRTL
}: NewDocumentClientProps) {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<GenerationMode>('standard')
  const [userSubscription, setUserSubscription] = useState<string>('free')
  const [activeTab, setActiveTab] = useState('chat')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [, setUploadedFiles] = useState<unknown[]>([])
  const [generatedDocuments, setGeneratedDocuments] = useState<unknown[]>([])
  const [selectedFindings, setSelectedFindings] = useState<any[]>([])
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)

  // Initialize from URL params and fetch user subscription
  useEffect(() => {
    const modeFromUrl = searchParams?.get('mode') as GenerationMode
    if (modeFromUrl && (modeFromUrl === 'standard' || modeFromUrl === 'advanced')) {
      setMode(modeFromUrl)
    }
    
    // Get project ID from URL if exists (check both 'projectId' and 'project' parameters)
    const projectFromUrl = searchParams?.get('projectId') || searchParams?.get('project')
    if (projectFromUrl) {
      setProjectId(projectFromUrl)
    }
    
    // Generate or get session ID
    setSessionId(`session-${Date.now()}`)
    
    // Fetch user subscription status
    if (session?.user?.id) {
      fetchUserSubscription()
    }
  }, [searchParams, session])

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        console.log('Subscription data:', data) // Debug log
        setUserSubscription(data.subscription?.tier || 'free')
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    }
  }

  // Handle file uploads
  const handleFilesUploaded = (files: unknown[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  // Show toast message helper function
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 4000)
  }

  // Handle research finding selection
  const handleFindingSelect = (finding: any) => {
    console.log('Finding selected:', finding)
    setSelectedFinding(finding)
    
    // Add to selected findings if not already selected
    if (!selectedFindings.find(f => f.id === finding.id)) {
      setSelectedFindings(prev => [...prev, finding])
    }
    
    // Switch to progress tab to show the selected finding
    setActiveTab('roadmap')
    
    // Show elegant toast notification
    setToastMessage(`✅ Research finding "${finding.title}" has been added to your project insights and will be used in document generation.`)
    setShowToast(true)
    
    // Hide toast after 4 seconds
    setTimeout(() => {
      setShowToast(false)
    }, 4000)
  }

  // Handle document generation completion
  const handleDocumentReady = (document: unknown) => {
    setGeneratedDocuments(prev => [...prev, document])
  }


  // Mode toggle with subscription validation
  const toggleMode = () => {
    const newMode = mode === 'standard' ? 'advanced' : 'standard'
    
    // Check if trying to switch to advanced mode
    if (newMode === 'advanced') {
      // Check subscription tier - only professional+ can access advanced mode
      const allowedTiers = ['professional', 'business', 'enterprise']
      if (!allowedTiers.includes(userSubscription.toLowerCase())) {
        // Redirect to pricing page with upgrade message
        alert('Advanced mode requires a Professional subscription or higher. Please upgrade to access advanced planning features.')
        router.push(`/${locale}/pricing?upgrade=advanced`)
        return
      }
    }
    
    setMode(newMode)
    // Update URL without reload
    const url = new URL(window.location.href)
    url.searchParams.set('mode', newMode)
    window.history.replaceState({}, '', url.toString())
  }

  // Render standard mode layout (with advanced UI but simple logic)
  const renderStandardMode = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b ${isRTL ? 'text-right' : ''}`}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h1 className="text-3xl font-bold">{t.createNewDocument}</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Standard Mode
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t.standardDescription}
            </p>
          </div>
          <Button variant="outline" onClick={toggleMode} className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            Switch to Advanced
          </Button>
        </div>
      </div>

      {/* Tabbed Content - Same UI as Advanced Mode */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t.planningChat}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t.uploadDocs}
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {t.research}
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t.progress}
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t.generate}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {/* Chat Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'chat' ? 'block' : 'hidden'}`}
            >
              <div className="p-6 h-full">
                <ChatInterface 
                  userName={userName} 
                  locale={locale}
                />
              </div>
            </div>

            {/* Upload Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'upload' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <DocumentUploader
                  onFilesUploaded={handleFilesUploaded}
                  locale={locale}
                />
              </div>
            </div>

            {/* Research Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'research' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Research</h3>
                  <p className="text-muted-foreground mb-6">
                    Intelligent market research and data gathering is available in Advanced Mode.
                  </p>
                  <Button onClick={toggleMode} className="flex items-center gap-2 mx-auto">
                    <Zap className="h-4 w-4" />
                    Upgrade to Advanced Mode
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'roadmap' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Selected Research Insights</h3>
                  {selectedFindings.length > 0 ? (
                    <div className="space-y-3">
                      {selectedFindings.map((finding, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h4 className="font-medium">{finding.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{finding.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No research insights selected yet. Upload documents or use advanced research to gather insights.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'generate' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <MultiDocumentGenerator
                  sessionId={sessionId || undefined}
                  locale={locale}
                  onGenerationComplete={(suite) => {
                    console.log('Suite generated:', suite)
                    setGeneratedDocuments(prev => [...prev, ...suite.generatedDocuments])
                  }}
                  onDocumentReady={handleDocumentReady}
                />
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )

  // Render advanced mode layout
  const renderAdvancedMode = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-6 border-b ${isRTL ? 'text-right' : ''}`}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h1 className="text-3xl font-bold">{t.createNewDocument}</h1>
              <Badge variant="default" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Advanced Mode (Beta)
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t.advancedDescription}
            </p>
          </div>
          <Button variant="outline" onClick={toggleMode} className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            Switch to Standard
          </Button>
        </div>
      </div>

      {/* Advanced Layout with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className={`px-6 pt-4 ${isRTL ? 'text-right' : ''}`}>
            <TabsList className={`grid w-full grid-cols-5 ${isRTL ? 'rtl' : ''}`}>
              <TabsTrigger value="chat" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MessageSquare className="h-4 w-4" />
                Planning Chat
              </TabsTrigger>
              <TabsTrigger value="upload" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Upload className="h-4 w-4" />
                Upload Docs
              </TabsTrigger>
              <TabsTrigger value="research" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Search className="h-4 w-4" />
                Research
              </TabsTrigger>
              <TabsTrigger value="roadmap" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Map className="h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="generate" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileStack className="h-4 w-4" />
                Generate
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {/* Planning Chat Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}
            >
              <div className="h-full flex">
                {/* Main Chat Area */}
                <div className="flex-1 p-6 flex flex-col min-h-0">
                  <EnhancedChatInterface
                    userName={userName}
                    locale={locale}
                    mode="advanced"
                    projectId={projectId}
                  />
                </div>

                {/* Right Sidebar - Files */}
                <div className="w-80 border-l flex flex-col">
                  <div className="flex-1 p-4 overflow-hidden">
                    <div className="space-y-4 h-full">
                      <div className="flex-1">
                        <GeneratedFilesSidebar
                          sessionId={sessionId || undefined}
                          locale={locale}
                          onDocumentSelect={(doc) => console.log('Selected doc:', doc)}
                          onDocumentDownload={(doc) => console.log('Download doc:', doc)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full ${activeTab === 'upload' ? 'block' : 'hidden'}`}
            >
              <div className="h-full flex">
                <div className="flex-1 p-6">
                  <DocumentUploader
                    onFilesUploaded={handleFilesUploaded}
                    locale={locale}
                  />
                </div>
                <div className="w-80 border-l">
                  <UploadedFilesSidebar
                    sessionId={sessionId || undefined}
                    locale={locale}
                    onFileSelect={(file) => console.log('Selected file:', file)}
                    onFileDelete={(fileId) => console.log('Delete file:', fileId)}
                  />
                </div>
              </div>
            </div>

            {/* Research Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'research' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <DataGatheringPanel
                  sessionId={sessionId || 'default'}
                  locale={locale}
                  onResearchComplete={(request) => console.log('Research complete:', request)}
                  onFindingSelect={handleFindingSelect}
                />
              </div>
            </div>

            {/* Progress Roadmap Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'roadmap' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <ProgressRoadmap
                  sessionId={sessionId || 'default'}
                  locale={locale}
                  onStepClick={(step) => console.log('Step clicked:', step)}
                  onMilestoneClick={(milestone) => console.log('Milestone clicked:', milestone)}
                  onExportRoadmap={() => console.log('Export roadmap')}
                />
              </div>
            </div>

            {/* Multi-Document Generation Tab - Always mounted, CSS visibility control */}
            <div 
              className={`absolute inset-0 h-full overflow-auto ${activeTab === 'generate' ? 'block' : 'hidden'}`}
            >
              <div className="p-6">
                <MultiDocumentGenerator
                  sessionId={sessionId || undefined}
                  locale={locale}
                  onGenerationComplete={(suite) => {
                    console.log('Suite generated:', suite)
                    setGeneratedDocuments(prev => [...prev, ...suite.generatedDocuments])
                  }}
                  onDocumentReady={handleDocumentReady}
                />
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-120px)]" dir={isRTL ? 'rtl' : 'ltr'}>
      {mode === 'standard' ? renderStandardMode() : renderAdvancedMode()}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <div className="flex-1 text-sm">
              {toastMessage}
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="text-white hover:text-green-200 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}