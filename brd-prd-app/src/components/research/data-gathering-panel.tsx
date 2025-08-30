'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Brain,
  Globe,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  X,
  ExternalLink
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ResearchRequest {
  id: string
  type: ResearchType
  query: string
  status: 'pending' | 'researching' | 'completed' | 'error'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  completedAt?: Date
  estimatedDuration?: string
  findings?: ResearchFinding[]
  confidence?: number
  sources?: string[]
  error?: string
}

type ResearchType = 
  | 'market-analysis'
  | 'competitor-research'
  | 'regulatory-compliance'
  | 'financial-benchmarks'
  | 'industry-trends'
  | 'customer-insights'
  | 'technology-research'
  | 'legal-requirements'
  | 'cultural-analysis'
  | 'custom'

interface ResearchFinding {
  id: string
  title: string
  summary: string
  details: string
  confidence: number
  sources: string[]
  tags: string[]
  relevanceScore: number
  lastUpdated: Date
}

interface DataGatheringPanelProps {
  sessionId: string
  country?: string
  industry?: string
  businessType?: string
  className?: string
  locale?: string
  onResearchComplete?: (request: ResearchRequest) => void
  onFindingSelect?: (finding: ResearchFinding) => void
}

// Mock data for development
const mockResearchRequests: ResearchRequest[] = [
  {
    id: 'req-1',
    type: 'market-analysis',
    query: 'Saudi Arabia healthcare device market size and growth potential',
    status: 'completed',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 30 * 60 * 1000),
    estimatedDuration: '15-20 minutes',
    confidence: 87,
    sources: ['Ministry of Health KSA', 'McKinsey Healthcare Report', 'Frost & Sullivan'],
    findings: [
      {
        id: 'finding-1',
        title: 'Saudi Healthcare Market Growth',
        summary: 'Saudi healthcare market expected to grow at 6.8% CAGR through 2025',
        details: 'The Saudi Arabian healthcare market is experiencing robust growth driven by Vision 2030 initiatives and increasing healthcare spending...',
        confidence: 89,
        sources: ['Ministry of Health KSA', 'Vision 2030 Report'],
        tags: ['market-size', 'growth-rate', 'vision-2030'],
        relevanceScore: 95,
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000)
      }
    ]
  },
  {
    id: 'req-2',
    type: 'regulatory-compliance',
    query: 'SFDA medical device registration requirements',
    status: 'researching',
    priority: 'critical',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    estimatedDuration: '10-15 minutes',
    confidence: 0
  },
  {
    id: 'req-3',
    type: 'competitor-research',
    query: 'Temperature measurement device competitors in Saudi market',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    estimatedDuration: '20-25 minutes'
  }
]

const translations = {
  en: {
    title: 'Research Assistant',
    subtitle: 'Intelligent data gathering for your business planning',
    newResearch: 'New Research',
    activeResearch: 'Active Research',
    completedResearch: 'Completed Research',
    allFindings: 'All Findings',
    startNewResearch: 'Start New Research',
    researchQuery: 'What do you need to research?',
    researchType: 'Research Type',
    priority: 'Priority',
    submit: 'Start Research',
    cancel: 'Cancel',
    refresh: 'Refresh',
    viewDetails: 'View Details',
    download: 'Download',
    confidence: 'Confidence',
    sources: 'Sources',
    findings: 'Findings',
    relevance: 'Relevance',
    duration: 'Duration',
    status: 'Status',
    researching: 'Researching...',
    completed: 'Completed',
    pending: 'Pending',
    error: 'Error',
    retryResearch: 'Retry Research',
    noResearch: 'No research requests yet',
    startResearchDesc: 'Begin by requesting research on any topic you need for your business planning',
    researchTypes: {
      'market-analysis': 'Market Analysis',
      'competitor-research': 'Competitor Research',
      'regulatory-compliance': 'Regulatory Compliance',
      'financial-benchmarks': 'Financial Benchmarks',
      'industry-trends': 'Industry Trends',
      'customer-insights': 'Customer Insights',
      'technology-research': 'Technology Research',
      'legal-requirements': 'Legal Requirements',
      'cultural-analysis': 'Cultural Analysis',
      'custom': 'Custom Research'
    },
    priorities: {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    }
  },
  ar: {
    title: 'مساعد البحث',
    subtitle: 'جمع البيانات الذكي لتخطيط مشروعك',
    newResearch: 'بحث جديد',
    activeResearch: 'البحث النشط',
    completedResearch: 'البحث المكتمل',
    allFindings: 'جميع النتائج',
    startNewResearch: 'بدء بحث جديد',
    researchQuery: 'ما الذي تحتاج إلى البحث عنه؟',
    researchType: 'نوع البحث',
    priority: 'الأولوية',
    submit: 'بدء البحث',
    cancel: 'إلغاء',
    refresh: 'تحديث',
    viewDetails: 'عرض التفاصيل',
    download: 'تحميل',
    confidence: 'مستوى الثقة',
    sources: 'المصادر',
    findings: 'النتائج',
    relevance: 'الصلة',
    duration: 'المدة',
    status: 'الحالة',
    researching: 'جاري البحث...',
    completed: 'مكتمل',
    pending: 'في الانتظار',
    error: 'خطأ',
    retryResearch: 'إعادة المحاولة',
    noResearch: 'لا توجد طلبات بحث بعد',
    startResearchDesc: 'ابدأ بطلب البحث في أي موضوع تحتاجه لتخطيط مشروعك',
    researchTypes: {
      'market-analysis': 'تحليل السوق',
      'competitor-research': 'بحث المنافسين',
      'regulatory-compliance': 'الامتثال التنظيمي',
      'financial-benchmarks': 'المعايير المالية',
      'industry-trends': 'اتجاهات الصناعة',
      'customer-insights': 'رؤى العملاء',
      'technology-research': 'البحث التقني',
      'legal-requirements': 'المتطلبات القانونية',
      'cultural-analysis': 'التحليل الثقافي',
      'custom': 'بحث مخصص'
    },
    priorities: {
      'low': 'منخفض',
      'medium': 'متوسط',
      'high': 'عالي',
      'critical': 'حرج'
    }
  }
}

export function DataGatheringPanel({
  sessionId,
  country = 'saudi-arabia',
  industry,
  businessType,
  className,
  locale = 'en',
  onResearchComplete,
  onFindingSelect
}: DataGatheringPanelProps) {
  const [researchRequests, setResearchRequests] = useState<ResearchRequest[]>(mockResearchRequests)
  const [isLoading, setIsLoading] = useState(false)
  const [showNewResearchForm, setShowNewResearchForm] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  
  // New research form state
  const [newQuery, setNewQuery] = useState('')
  const [newType, setNewType] = useState<ResearchType>('market-analysis')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  // Filter requests by status
  const activeRequests = researchRequests.filter(req => 
    req.status === 'pending' || req.status === 'researching'
  )
  const completedRequests = researchRequests.filter(req => 
    req.status === 'completed' || req.status === 'error'
  )

  // Fetch research requests
  useEffect(() => {
    if (sessionId) {
      fetchResearchRequests()
    }
  }, [sessionId])

  const fetchResearchRequests = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/research/requests?sessionId=${sessionId}`)
      // const data = await response.json()
      // setResearchRequests(data.requests)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error fetching research requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const submitResearchRequest = async () => {
    if (!newQuery.trim()) return

    const newRequest: ResearchRequest = {
      id: `req-${Date.now()}`,
      type: newType,
      query: newQuery,
      status: 'pending',
      priority: newPriority,
      createdAt: new Date(),
      estimatedDuration: '10-20 minutes'
    }

    setResearchRequests(prev => [newRequest, ...prev])
    setShowNewResearchForm(false)
    setNewQuery('')
    setActiveTab('active')

    // Start research process
    try {
      // Update status to researching
      setResearchRequests(prev => prev.map(req => 
        req.id === newRequest.id ? { ...req, status: 'researching' } : req
      ))

      // TODO: Replace with actual API call
      const response = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          query: newRequest.query,
          type: newRequest.type,
          country,
          industry,
          businessType,
          priority: newRequest.priority
        })
      })

      if (!response.ok) {
        throw new Error('Research request failed')
      }

      const result = await response.json()
      
      // Update with completed research
      setResearchRequests(prev => prev.map(req => 
        req.id === newRequest.id 
          ? { 
              ...req, 
              status: 'completed',
              completedAt: new Date(),
              findings: result.findings,
              confidence: result.confidence,
              sources: result.sources
            } 
          : req
      ))

      onResearchComplete?.(newRequest)

    } catch (error) {
      console.error('Research error:', error)
      setResearchRequests(prev => prev.map(req => 
        req.id === newRequest.id 
          ? { ...req, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } 
          : req
      ))
    }
  }

  const retryResearch = async (requestId: string) => {
    setResearchRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'researching', error: undefined } : req
    ))
    // TODO: Implement retry logic
  }

  const getStatusIcon = (status: ResearchRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'researching':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: ResearchRequest['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderNewResearchForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Plus className="h-5 w-5" />
            {t.startNewResearch}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewResearchForm(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>
            {t.researchQuery}
          </label>
          <Textarea
            placeholder={
              locale === 'ar' 
                ? 'مثال: حجم السوق السعودي لأجهزة قياس الحرارة الطبية'
                : 'Example: Saudi Arabia medical thermometer market size and trends'
            }
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            className={isRTL ? 'text-right' : ''}
            dir={isRTL ? 'rtl' : 'ltr'}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>
              {t.researchType}
            </label>
            <select 
              value={newType}
              onChange={(e) => setNewType(e.target.value as ResearchType)}
              className={`w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-white dark:text-gray-100 border-gray-300 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {Object.entries(t.researchTypes).map(([key, label]) => (
                <option key={key} value={key} className="bg-white dark:bg-gray-800 text-white dark:text-gray-100">{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>
              {t.priority}
            </label>
            <select 
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className={`w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-white dark:text-gray-100 border-gray-300 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {Object.entries(t.priorities).map(([key, label]) => (
                <option key={key} value={key} className="bg-white dark:bg-gray-800 text-white dark:text-gray-100">{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button 
            onClick={submitResearchRequest}
            disabled={!newQuery.trim()}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            {t.submit}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowNewResearchForm(false)}
          >
            {t.cancel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderResearchRequest = (request: ResearchRequest) => (
    <Card key={request.id} className="mb-4">
      <CardContent className="p-4">
        <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 space-y-2 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {getStatusIcon(request.status)}
              <Badge variant="outline" className={getPriorityColor(request.priority)}>
                {t.priorities[request.priority]}
              </Badge>
              <Badge variant="secondary">
                {t.researchTypes[request.type]}
              </Badge>
            </div>
            <p className="font-medium">{request.query}</p>
            {request.status === 'researching' && (
              <div className="space-y-1">
                <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-3 w-3" />
                  <span>{request.estimatedDuration}</span>
                </div>
                <Progress value={Math.random() * 100} className="w-full" />
              </div>
            )}
            {request.status === 'completed' && (
              <div className="space-y-2">
                <div className={`flex items-center gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Brain className="h-3 w-3" />
                    {t.confidence}: {request.confidence}%
                  </span>
                  <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <FileText className="h-3 w-3" />
                    {request.findings?.length || 0} {t.findings}
                  </span>
                </div>
                {request.findings && request.findings.length > 0 && (
                  <div className="space-y-1">
                    {request.findings.slice(0, 2).map((finding) => (
                      <div
                        key={finding.id}
                        className={`p-2 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50 ${isRTL ? 'text-right' : ''}`}
                        onClick={() => onFindingSelect?.(finding)}
                      >
                        <p className="font-medium">{finding.title}</p>
                        <p className="text-muted-foreground line-clamp-2">{finding.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {request.status === 'error' && request.error && (
              <div className={`p-2 bg-red-50 text-red-700 rounded text-sm ${isRTL ? 'text-right' : ''}`}>
                {request.error}
              </div>
            )}
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {request.status === 'completed' && (
              <>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                  {t.viewDetails}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  {t.download}
                </Button>
              </>
            )}
            {request.status === 'error' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => retryResearch(request.id)}
              >
                <RefreshCw className="h-4 w-4" />
                {t.retryResearch}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={`${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Brain className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewResearchForm(!showNewResearchForm)}
              >
                <Plus className="h-4 w-4" />
                {t.newResearch}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchResearchRequests}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t.refresh}
              </Button>
            </div>
          </div>
          <p className={`text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
            {t.subtitle}
          </p>
        </CardHeader>

        <CardContent>
          {showNewResearchForm && renderNewResearchForm()}

          {researchRequests.length === 0 ? (
            <div className={`text-center py-8 ${isRTL ? 'text-right' : ''}`}>
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t.noResearch}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.startResearchDesc}</p>
              <Button 
                variant="outline" 
                onClick={() => setShowNewResearchForm(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.startNewResearch}
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full grid-cols-3 ${isRTL ? 'rtl' : ''}`}>
                <TabsTrigger value="active">
                  {t.activeResearch} ({activeRequests.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  {t.completedResearch} ({completedRequests.length})
                </TabsTrigger>
                <TabsTrigger value="findings">
                  {t.allFindings}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4">
                {activeRequests.length === 0 ? (
                  <div className={`text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                    No active research requests
                  </div>
                ) : (
                  activeRequests.map(renderResearchRequest)
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                {completedRequests.length === 0 ? (
                  <div className={`text-center py-8 text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                    No completed research yet
                  </div>
                ) : (
                  completedRequests.map(renderResearchRequest)
                )}
              </TabsContent>

              <TabsContent value="findings" className="mt-4">
                <div className="space-y-3">
                  {researchRequests
                    .filter(req => req.findings && req.findings.length > 0)
                    .flatMap(req => req.findings!)
                    .sort((a, b) => b.relevanceScore - a.relevanceScore)
                    .map((finding) => (
                      <Card 
                        key={finding.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onFindingSelect?.(finding)}
                      >
                        <CardContent className="p-4">
                          <div className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <h4 className="font-medium">{finding.title}</h4>
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Badge variant="outline">
                                  {finding.confidence}% {t.confidence}
                                </Badge>
                                <Badge variant="secondary">
                                  {finding.relevanceScore}% {t.relevance}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{finding.summary}</p>
                            <div className={`flex flex-wrap gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              {finding.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}