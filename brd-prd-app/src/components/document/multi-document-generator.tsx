'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileStack,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Package,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DocumentTemplate {
  id: string
  name: string
  description: string
  type: 'BRD' | 'PRD' | 'business-plan' | 'technical-spec' | 'case-study' | 'financial' | 'pitch-deck'
  estimatedPages: number
  estimatedDuration: string
  dependencies: string[]
  required: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'business' | 'technical' | 'financial' | 'marketing'
}

interface DocumentSuite {
  id: string
  name: string
  description: string
  templates: DocumentTemplate[]
  status: 'draft' | 'generating' | 'completed' | 'error'
  progress: number
  createdAt: Date
  estimatedCompletion?: Date
  completedAt?: Date
  totalPages: number
  generatedDocuments: GeneratedDocument[]
}

interface GeneratedDocument {
  id: string
  templateId: string
  name: string
  type: DocumentTemplate['type']
  status: 'pending' | 'generating' | 'completed' | 'error'
  progress: number
  content?: string
  pages: number
  size: number
  downloadUrl?: string
  previewUrl?: string
  error?: string
  generatedAt?: Date
}

interface MultiDocumentGeneratorProps {
  sessionId?: string
  planningData?: any
  businessType?: string
  industry?: string
  country?: string
  className?: string
  locale?: string
  onGenerationComplete?: (suite: DocumentSuite) => void
  onDocumentReady?: (document: GeneratedDocument) => void
}

// Pre-defined document suites
const documentSuites: Record<string, DocumentSuite> = {
  'startup-essentials': {
    id: 'startup-essentials',
    name: 'Startup Essentials Package',
    description: 'Complete documentation package for new startups',
    status: 'draft',
    progress: 0,
    createdAt: new Date(),
    totalPages: 0,
    generatedDocuments: [],
    templates: [
      {
        id: 'brd-template',
        name: 'Business Requirements Document',
        description: 'Comprehensive business requirements and objectives',
        type: 'BRD',
        estimatedPages: 15,
        estimatedDuration: '8-12 minutes',
        dependencies: [],
        required: true,
        priority: 'critical',
        category: 'business'
      },
      {
        id: 'prd-template',
        name: 'Product Requirements Document',
        description: 'Detailed product specifications and features',
        type: 'PRD',
        estimatedPages: 20,
        estimatedDuration: '10-15 minutes',
        dependencies: ['brd-template'],
        required: true,
        priority: 'high',
        category: 'business'
      },
      {
        id: 'business-plan',
        name: 'Business Plan',
        description: 'Complete business strategy and execution plan',
        type: 'business-plan',
        estimatedPages: 35,
        estimatedDuration: '20-25 minutes',
        dependencies: ['brd-template'],
        required: true,
        priority: 'high',
        category: 'business'
      },
      {
        id: 'financial-projections',
        name: 'Financial Projections',
        description: 'Revenue, cost, and profitability forecasts',
        type: 'financial',
        estimatedPages: 12,
        estimatedDuration: '8-10 minutes',
        dependencies: ['business-plan'],
        required: true,
        priority: 'medium',
        category: 'financial'
      }
    ]
  },
  'tech-product': {
    id: 'tech-product',
    name: 'Technology Product Suite',
    description: 'Documentation package for technology products',
    status: 'draft',
    progress: 0,
    createdAt: new Date(),
    totalPages: 0,
    generatedDocuments: [],
    templates: [
      {
        id: 'prd-tech',
        name: 'Product Requirements Document',
        description: 'Technical product specifications',
        type: 'PRD',
        estimatedPages: 25,
        estimatedDuration: '12-18 minutes',
        dependencies: [],
        required: true,
        priority: 'critical',
        category: 'technical'
      },
      {
        id: 'technical-spec',
        name: 'Technical Architecture',
        description: 'System architecture and technical design',
        type: 'technical-spec',
        estimatedPages: 30,
        estimatedDuration: '15-20 minutes',
        dependencies: ['prd-tech'],
        required: true,
        priority: 'high',
        category: 'technical'
      },
      {
        id: 'case-study',
        name: 'Market Case Study',
        description: 'Market analysis and competitive positioning',
        type: 'case-study',
        estimatedPages: 18,
        estimatedDuration: '10-12 minutes',
        dependencies: [],
        required: false,
        priority: 'medium',
        category: 'marketing'
      }
    ]
  },
  'investor-ready': {
    id: 'investor-ready',
    name: 'Investor-Ready Package',
    description: 'Complete documentation for investor presentations',
    status: 'draft',
    progress: 0,
    createdAt: new Date(),
    totalPages: 0,
    generatedDocuments: [],
    templates: [
      {
        id: 'pitch-deck',
        name: 'Investor Pitch Deck',
        description: 'Compelling investor presentation',
        type: 'pitch-deck',
        estimatedPages: 15,
        estimatedDuration: '8-10 minutes',
        dependencies: [],
        required: true,
        priority: 'critical',
        category: 'marketing'
      },
      {
        id: 'business-plan-investor',
        name: 'Executive Business Plan',
        description: 'Investor-focused business plan',
        type: 'business-plan',
        estimatedPages: 25,
        estimatedDuration: '15-20 minutes',
        dependencies: [],
        required: true,
        priority: 'critical',
        category: 'business'
      },
      {
        id: 'financial-detailed',
        name: 'Detailed Financial Model',
        description: 'Comprehensive financial projections and analysis',
        type: 'financial',
        estimatedPages: 20,
        estimatedDuration: '12-15 minutes',
        dependencies: ['business-plan-investor'],
        required: true,
        priority: 'high',
        category: 'financial'
      }
    ]
  }
}

const translations = {
  en: {
    title: 'Multi-Document Generator',
    subtitle: 'Generate comprehensive document suites for your business',
    selectSuite: 'Select Document Suite',
    customSuite: 'Custom Suite',
    generateSuite: 'Generate Suite',
    pauseGeneration: 'Pause Generation',
    resumeGeneration: 'Resume Generation',
    downloadSuite: 'Download Suite',
    viewDocument: 'View Document',
    overview: 'Overview',
    documents: 'Documents',
    settings: 'Settings',
    totalDocuments: 'Total Documents',
    estimatedTime: 'Estimated Time',
    totalPages: 'Total Pages',
    progress: 'Progress',
    status: 'Status',
    generating: 'Generating...',
    completed: 'Completed',
    pending: 'Pending',
    error: 'Error',
    draft: 'Draft',
    required: 'Required',
    optional: 'Optional',
    dependencies: 'Dependencies',
    category: 'Category',
    priority: 'Priority',
    noSuiteSelected: 'No suite selected',
    selectSuitePrompt: 'Choose a document suite to get started',
    generationInProgress: 'Generation in progress...',
    allDocumentsReady: 'All documents are ready for download',
    startGeneration: 'Start Generation',
    retryGeneration: 'Retry Generation'
  },
  ar: {
    title: 'منشئ المستندات المتعددة',
    subtitle: 'إنشاء مجموعات مستندات شاملة لمشروعك',
    selectSuite: 'اختيار مجموعة المستندات',
    customSuite: 'مجموعة مخصصة',
    generateSuite: 'إنشاء المجموعة',
    pauseGeneration: 'إيقاف الإنشاء مؤقتاً',
    resumeGeneration: 'استئناف الإنشاء',
    downloadSuite: 'تحميل المجموعة',
    viewDocument: 'عرض المستند',
    overview: 'نظرة عامة',
    documents: 'المستندات',
    settings: 'الإعدادات',
    totalDocuments: 'إجمالي المستندات',
    estimatedTime: 'الوقت المقدر',
    totalPages: 'إجمالي الصفحات',
    progress: 'التقدم',
    status: 'الحالة',
    generating: 'جاري الإنشاء...',
    completed: 'مكتمل',
    pending: 'في الانتظار',
    error: 'خطأ',
    draft: 'مسودة',
    required: 'مطلوب',
    optional: 'اختياري',
    dependencies: 'التبعيات',
    category: 'الفئة',
    priority: 'الأولوية',
    noSuiteSelected: 'لم يتم اختيار مجموعة',
    selectSuitePrompt: 'اختر مجموعة مستندات للبدء',
    generationInProgress: 'جاري الإنشاء...',
    allDocumentsReady: 'جميع المستندات جاهزة للتحميل',
    startGeneration: 'بدء الإنشاء',
    retryGeneration: 'إعادة المحاولة'
  }
}

export function MultiDocumentGenerator({
  sessionId,
  planningData,
  businessType,
  industry,
  country = 'saudi-arabia',
  className,
  locale = 'en',
  onGenerationComplete,
  onDocumentReady
}: MultiDocumentGeneratorProps) {
  const [selectedSuite, setSelectedSuite] = useState<DocumentSuite | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [generationProgress, setGenerationProgress] = useState(0)
  
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  // Calculate suite totals
  const calculateSuiteTotals = (suite: DocumentSuite) => {
    const totalPages = suite.templates.reduce((sum, template) => sum + template.estimatedPages, 0)
    const totalDocuments = suite.templates.length
    const requiredDocuments = suite.templates.filter(t => t.required).length
    
    return { totalPages, totalDocuments, requiredDocuments }
  }

  // Get document status icon
  const getStatusIcon = (status: GeneratedDocument['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'generating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: DocumentTemplate['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Start generation process
  const startGeneration = async () => {
    if (!selectedSuite || !sessionId) return

    setIsGenerating(true)
    setGenerationProgress(0)
    
    // Initialize generated documents
    const generatedDocs: GeneratedDocument[] = selectedSuite.templates.map(template => ({
      id: `doc-${template.id}`,
      templateId: template.id,
      name: template.name,
      type: template.type,
      status: 'pending',
      progress: 0,
      pages: template.estimatedPages,
      size: 0
    }))

    const updatedSuite: DocumentSuite = {
      ...selectedSuite,
      status: 'generating',
      generatedDocuments: generatedDocs
    }
    
    setSelectedSuite(updatedSuite)

    try {
      // Generate documents sequentially based on dependencies
      for (let i = 0; i < selectedSuite.templates.length; i++) {
        if (isPaused) break

        const template = selectedSuite.templates[i]
        
        // Update document status to generating
        setSelectedSuite(prev => prev ? {
          ...prev,
          generatedDocuments: prev.generatedDocuments.map(doc =>
            doc.templateId === template.id
              ? { ...doc, status: 'generating', progress: 0 }
              : doc
          )
        } : null)

        // Simulate document generation
        const response = await fetch('/api/documents/generate-multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            templateId: template.id,
            templateType: template.type,
            planningData,
            country,
            industry,
            businessType
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to generate ${template.name}`)
        }

        const result = await response.json()

        // Update document status to completed
        setSelectedSuite(prev => prev ? {
          ...prev,
          generatedDocuments: prev.generatedDocuments.map(doc =>
            doc.templateId === template.id
              ? {
                  ...doc,
                  status: 'completed',
                  progress: 100,
                  content: result.content,
                  size: result.size,
                  downloadUrl: result.downloadUrl,
                  previewUrl: result.previewUrl,
                  generatedAt: new Date()
                }
              : doc
          )
        } : null)

        // Update overall progress
        setGenerationProgress(((i + 1) / selectedSuite.templates.length) * 100)
        
        // Notify parent component
        if (onDocumentReady) {
          const generatedDoc = generatedDocs.find(d => d.templateId === template.id)
          if (generatedDoc) {
            onDocumentReady({
              ...generatedDoc,
              status: 'completed',
              content: result.content,
              downloadUrl: result.downloadUrl
            })
          }
        }
      }

      // Mark suite as completed
      if (!isPaused) {
        const completedSuite: DocumentSuite = {
          ...updatedSuite,
          status: 'completed',
          progress: 100,
          completedAt: new Date()
        }
        setSelectedSuite(completedSuite)
        onGenerationComplete?.(completedSuite)
      }

    } catch (error) {
      console.error('Generation error:', error)
      setSelectedSuite(prev => prev ? { ...prev, status: 'error' } : null)
    } finally {
      setIsGenerating(false)
    }
  }

  // Pause/Resume generation
  const toggleGeneration = () => {
    setIsPaused(!isPaused)
  }

  // Download entire suite
  const downloadSuite = async () => {
    if (!selectedSuite || selectedSuite.status !== 'completed') return

    try {
      const response = await fetch('/api/documents/download-suite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suiteId: selectedSuite.id,
          documentIds: selectedSuite.generatedDocuments.map(d => d.id)
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedSuite.name}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const renderSuiteSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.values(documentSuites).map((suite) => {
        const { totalPages, totalDocuments, requiredDocuments } = calculateSuiteTotals(suite)
        
        return (
          <Card
            key={suite.id}
            className={`cursor-pointer hover:shadow-lg transition-all ${
              selectedSuite?.id === suite.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedSuite(suite)}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className="h-5 w-5" />
                {suite.name}
              </CardTitle>
              <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {suite.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`grid grid-cols-2 gap-4 text-sm ${isRTL ? 'text-right' : ''}`}>
                  <div>
                    <span className="font-medium">{t.totalDocuments}</span>
                    <p className="text-muted-foreground">{totalDocuments}</p>
                  </div>
                  <div>
                    <span className="font-medium">{t.totalPages}</span>
                    <p className="text-muted-foreground">{totalPages}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {suite.templates.slice(0, 3).map((template) => (
                    <div key={template.id} className={`flex items-center gap-2 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Badge variant={template.required ? 'default' : 'outline'} className="text-xs">
                        {template.required ? t.required : t.optional}
                      </Badge>
                      <span className="truncate">{template.name}</span>
                    </div>
                  ))}
                  {suite.templates.length > 3 && (
                    <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                      +{suite.templates.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderSuiteOverview = () => {
    if (!selectedSuite) return null

    const { totalPages, totalDocuments, requiredDocuments } = calculateSuiteTotals(selectedSuite)
    const completedDocs = selectedSuite.generatedDocuments.filter(d => d.status === 'completed').length
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className={`p-4 text-center ${isRTL ? 'text-right' : ''}`}>
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <p className="text-sm text-muted-foreground">{t.totalDocuments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className={`p-4 text-center ${isRTL ? 'text-right' : ''}`}>
              <div className="text-2xl font-bold">{totalPages}</div>
              <p className="text-sm text-muted-foreground">{t.totalPages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className={`p-4 text-center ${isRTL ? 'text-right' : ''}`}>
              <div className="text-2xl font-bold">{Math.round(generationProgress)}%</div>
              <p className="text-sm text-muted-foreground">{t.progress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className={`p-4 text-center ${isRTL ? 'text-right' : ''}`}>
              <div className="text-2xl font-bold">
                {completedDocs}/{totalDocuments}
              </div>
              <p className="text-sm text-muted-foreground">{t.completed}</p>
            </CardContent>
          </Card>
        </div>

        {selectedSuite.status === 'generating' && (
          <Card>
            <CardContent className="p-4">
              <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm font-medium">{t.generationInProgress}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {selectedSuite.status === 'draft' && (
            <Button onClick={startGeneration} disabled={isGenerating}>
              <Play className="h-4 w-4 mr-2" />
              {t.startGeneration}
            </Button>
          )}
          {selectedSuite.status === 'generating' && (
            <Button onClick={toggleGeneration} variant="outline">
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t.resumeGeneration}
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  {t.pauseGeneration}
                </>
              )}
            </Button>
          )}
          {selectedSuite.status === 'completed' && (
            <Button onClick={downloadSuite}>
              <Download className="h-4 w-4 mr-2" />
              {t.downloadSuite}
            </Button>
          )}
          {selectedSuite.status === 'error' && (
            <Button onClick={startGeneration} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.retryGeneration}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderDocumentsList = () => {
    if (!selectedSuite) return null

    return (
      <div className="space-y-4">
        {selectedSuite.templates.map((template) => {
          const generatedDoc = selectedSuite.generatedDocuments.find(d => d.templateId === template.id)
          
          return (
            <Card key={template.id}>
              <CardContent className="p-4">
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`space-y-2 flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {generatedDoc && getStatusIcon(generatedDoc.status)}
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={template.required ? 'default' : 'outline'}>
                        {template.required ? t.required : t.optional}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(template.priority)}>
                        {t.priority}: {template.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-xs ${isRTL ? 'text-right' : ''}`}>
                      <div>
                        <span className="font-medium">{t.estimatedTime}</span>
                        <p className="text-muted-foreground">{template.estimatedDuration}</p>
                      </div>
                      <div>
                        <span className="font-medium">Pages</span>
                        <p className="text-muted-foreground">{template.estimatedPages}</p>
                      </div>
                      <div>
                        <span className="font-medium">{t.category}</span>
                        <p className="text-muted-foreground">{template.category}</p>
                      </div>
                      <div>
                        <span className="font-medium">{t.status}</span>
                        <p className="text-muted-foreground">
                          {generatedDoc ? 
                            (generatedDoc.status === 'completed' ? t.completed :
                             generatedDoc.status === 'generating' ? t.generating :
                             generatedDoc.status === 'error' ? t.error : t.pending)
                            : t.draft}
                        </p>
                      </div>
                    </div>

                    {generatedDoc?.status === 'generating' && (
                      <Progress value={generatedDoc.progress} className="w-full" />
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {generatedDoc?.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          {t.viewDocument}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`${className} space-y-6`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileStack className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <p className={`text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
            {t.subtitle}
          </p>
        </CardHeader>
        <CardContent>
          {!selectedSuite ? (
            <div className="space-y-6">
              <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
                <h3 className="text-lg font-medium mb-2">{t.selectSuite}</h3>
                <p className="text-muted-foreground">{t.selectSuitePrompt}</p>
              </div>
              {renderSuiteSelection()}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full grid-cols-3 ${isRTL ? 'rtl' : ''}`}>
                <TabsTrigger value="overview">{t.overview}</TabsTrigger>
                <TabsTrigger value="documents">{t.documents}</TabsTrigger>
                <TabsTrigger value="settings">{t.settings}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                {renderSuiteOverview()}
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                {renderDocumentsList()}
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <div className={`text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                  <Settings className="h-12 w-12 mx-auto mb-4" />
                  <p>Document suite settings coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}