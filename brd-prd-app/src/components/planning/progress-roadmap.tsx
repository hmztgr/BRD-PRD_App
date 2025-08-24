'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressStepper, StepStatus } from '@/components/ui/progress-stepper'
import { 
  Map, 
  Target, 
  RefreshCw, 
  FileText, 
  Download,
  Eye,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PlanningRoadmapData {
  sessionId: string
  businessIdea: string
  country: string
  industry: string
  currentPhase: string
  overallProgress: number
  phases: PlanningPhase[]
  milestones: Milestone[]
  estimatedCompletion: Date
  lastUpdated: Date
}

interface PlanningPhase {
  id: string
  name: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  startedAt?: Date
  completedAt?: Date
  estimatedDuration: string
  steps: PlanningStep[]
}

interface PlanningStep {
  id: string
  phaseId: string
  name: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  type: 'research' | 'analysis' | 'documentation' | 'validation'
  completedAt?: Date
  estimatedDuration: string
  outputs?: string[]
  dependencies?: string[]
}

interface Milestone {
  id: string
  name: string
  description: string
  dueDate: Date
  status: 'pending' | 'completed' | 'overdue'
  completedAt?: Date
  deliverables: string[]
}

interface ProgressRoadmapProps {
  sessionId: string
  className?: string
  locale?: string
  onStepClick?: (step: PlanningStep) => void
  onMilestoneClick?: (milestone: Milestone) => void
  onExportRoadmap?: () => void
}

// Mock data for development
const mockRoadmapData: PlanningRoadmapData = {
  sessionId: 'session-123',
  businessIdea: 'AI-powered temperature measurement device for healthcare',
  country: 'saudi-arabia',
  industry: 'healthcare-technology',
  currentPhase: 'market-research',
  overallProgress: 35,
  estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  lastUpdated: new Date(),
  phases: [
    {
      id: 'business-concept',
      name: 'Business Concept Development',
      description: 'Define and refine the core business concept',
      status: 'completed',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      estimatedDuration: '2-3 days',
      steps: [
        {
          id: 'concept-definition',
          phaseId: 'business-concept',
          name: 'Concept Definition',
          description: 'Define the core business concept and value proposition',
          status: 'completed',
          type: 'analysis',
          completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          estimatedDuration: '1 day',
          outputs: ['Business Concept Document']
        },
        {
          id: 'target-market-identification',
          phaseId: 'business-concept',
          name: 'Target Market Identification',
          description: 'Identify primary and secondary target markets',
          status: 'completed',
          type: 'research',
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          estimatedDuration: '1-2 days',
          outputs: ['Market Segmentation Analysis']
        }
      ]
    },
    {
      id: 'market-research',
      name: 'Market Research & Analysis',
      description: 'Comprehensive market research and competitive analysis',
      status: 'active',
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      estimatedDuration: '7-10 days',
      steps: [
        {
          id: 'saudi-market-research',
          phaseId: 'market-research',
          name: 'Saudi Healthcare Market Research',
          description: 'Research Saudi healthcare market size, trends, and regulations',
          status: 'completed',
          type: 'research',
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          estimatedDuration: '2-3 days',
          outputs: ['Saudi Healthcare Market Report']
        },
        {
          id: 'competitor-analysis',
          phaseId: 'market-research',
          name: 'Competitor Analysis',
          description: 'Analyze existing competitors and their market positioning',
          status: 'active',
          type: 'analysis',
          estimatedDuration: '2-3 days',
          outputs: ['Competitive Analysis Report']
        },
        {
          id: 'regulatory-research',
          phaseId: 'market-research',
          name: 'Saudi Regulatory Research',
          description: 'Research SFDA and other regulatory requirements',
          status: 'pending',
          type: 'research',
          estimatedDuration: '2-3 days',
          outputs: ['Regulatory Compliance Guide'],
          dependencies: ['competitor-analysis']
        }
      ]
    },
    {
      id: 'business-planning',
      name: 'Business Planning & Documentation',
      description: 'Create comprehensive business plan and supporting documents',
      status: 'pending',
      estimatedDuration: '10-14 days',
      steps: [
        {
          id: 'brd-creation',
          phaseId: 'business-planning',
          name: 'BRD Creation',
          description: 'Create comprehensive Business Requirements Document',
          status: 'pending',
          type: 'documentation',
          estimatedDuration: '3-4 days',
          outputs: ['Business Requirements Document'],
          dependencies: ['regulatory-research']
        },
        {
          id: 'prd-creation',
          phaseId: 'business-planning',
          name: 'PRD Creation',
          description: 'Create detailed Product Requirements Document',
          status: 'pending',
          type: 'documentation',
          estimatedDuration: '3-4 days',
          outputs: ['Product Requirements Document'],
          dependencies: ['brd-creation']
        }
      ]
    }
  ],
  milestones: [
    {
      id: 'concept-validation',
      name: 'Concept Validation Complete',
      description: 'Business concept validated and documented',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'completed',
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deliverables: ['Business Concept Document', 'Market Segmentation Analysis']
    },
    {
      id: 'market-research-complete',
      name: 'Market Research Complete',
      description: 'Comprehensive market research and analysis finished',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'pending',
      deliverables: ['Market Research Report', 'Competitive Analysis', 'Regulatory Guide']
    },
    {
      id: 'documentation-complete',
      name: 'Business Documentation Complete',
      description: 'All required business documents created',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'pending',
      deliverables: ['BRD', 'PRD', 'Business Plan', 'Financial Projections']
    }
  ]
}

const translations = {
  en: {
    title: 'Planning Roadmap',
    subtitle: 'Track your business planning progress',
    overallProgress: 'Overall Progress',
    currentPhase: 'Current Phase',
    estimatedCompletion: 'Est. Completion',
    lastUpdated: 'Last Updated',
    phases: 'Phases',
    milestones: 'Milestones',
    businessIdea: 'Business Idea',
    country: 'Target Country',
    industry: 'Industry',
    refresh: 'Refresh',
    exportRoadmap: 'Export Roadmap',
    viewDetails: 'View Details',
    dueDate: 'Due Date',
    completed: 'Completed',
    pending: 'Pending',
    active: 'Active',
    overdue: 'Overdue',
    deliverables: 'Deliverables',
    noData: 'No roadmap data available',
    startPlanning: 'Start your business planning session to see progress here'
  },
  ar: {
    title: 'خارطة طريق التخطيط',
    subtitle: 'تتبع تقدم تخطيط مشروعك',
    overallProgress: 'التقدم الإجمالي',
    currentPhase: 'المرحلة الحالية',
    estimatedCompletion: 'الإنجاز المتوقع',
    lastUpdated: 'آخر تحديث',
    phases: 'المراحل',
    milestones: 'المعالم',
    businessIdea: 'فكرة المشروع',
    country: 'البلد المستهدف',
    industry: 'الصناعة',
    refresh: 'تحديث',
    exportRoadmap: 'تصدير خارطة الطريق',
    viewDetails: 'عرض التفاصيل',
    dueDate: 'تاريخ الاستحقاق',
    completed: 'مكتمل',
    pending: 'في الانتظار',
    active: 'نشط',
    overdue: 'متأخر',
    deliverables: 'المخرجات',
    noData: 'لا توجد بيانات خارطة طريق متاحة',
    startPlanning: 'ابدأ جلسة تخطيط مشروعك لرؤية التقدم هنا'
  }
}

export function ProgressRoadmap({
  sessionId,
  className,
  locale = 'en',
  onStepClick,
  onMilestoneClick,
  onExportRoadmap
}: ProgressRoadmapProps) {
  const [roadmapData, setRoadmapData] = useState<PlanningRoadmapData | null>(mockRoadmapData)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'phases' | 'milestones'>('phases')
  
  const t = translations[locale as keyof typeof translations] || translations.en
  const isRTL = locale === 'ar'

  // Fetch roadmap data
  useEffect(() => {
    if (sessionId) {
      fetchRoadmapData()
    }
  }, [sessionId])

  const fetchRoadmapData = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/planning/roadmap?sessionId=${sessionId}`)
      // const data = await response.json()
      // setRoadmapData(data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error fetching roadmap data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const convertPhasesToSteps = (phases: PlanningPhase[]): StepStatus[] => {
    return phases.map(phase => ({
      id: phase.id,
      title: phase.name,
      description: phase.description,
      status: phase.status,
      completedAt: phase.completedAt,
      estimatedDuration: phase.estimatedDuration,
      substeps: phase.steps.map(step => ({
        id: step.id,
        title: step.name,
        description: step.description,
        status: step.status,
        completedAt: step.completedAt,
        estimatedDuration: step.estimatedDuration
      }))
    }))
  }

  const getCountryFlag = (country: string) => {
    switch (country) {
      case 'saudi-arabia': return '🇸🇦'
      case 'uae': return '🇦🇪'
      case 'kuwait': return '🇰🇼'
      case 'qatar': return '🇶🇦'
      case 'bahrain': return '🇧🇭'
      case 'oman': return '🇴🇲'
      default: return '🌍'
    }
  }

  const getMilestoneStatus = (milestone: Milestone) => {
    if (milestone.status === 'completed') return 'completed'
    if (milestone.dueDate < new Date()) return 'overdue'
    return 'pending'
  }

  if (!roadmapData) {
    return (
      <Card className={`${className} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <p className={`text-muted-foreground text-center ${isRTL ? 'text-right' : ''}`}>
            {t.noData}
          </p>
          <p className={`text-sm text-muted-foreground text-center mt-1 ${isRTL ? 'text-right' : ''}`}>
            {t.startPlanning}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`${className} space-y-6`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Map className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRoadmapData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t.refresh}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportRoadmap}
              >
                <Download className="h-4 w-4" />
                {t.exportRoadmap}
              </Button>
            </div>
          </div>
          <p className={`text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
            {t.subtitle}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Project Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-xs font-medium text-muted-foreground">{t.businessIdea}</p>
              <p className="text-sm">{roadmapData.businessIdea}</p>
            </div>
            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-xs font-medium text-muted-foreground">{t.country}</p>
              <p className="text-sm flex items-center gap-1">
                <span>{getCountryFlag(roadmapData.country)}</span>
                <span>{roadmapData.country.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </p>
            </div>
            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-xs font-medium text-muted-foreground">{t.industry}</p>
              <p className="text-sm">{roadmapData.industry.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-xs font-medium text-muted-foreground">{t.lastUpdated}</p>
              <p className="text-sm">{formatDistanceToNow(roadmapData.lastUpdated, { addSuffix: true })}</p>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 bg-muted/50 rounded-lg ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t.overallProgress}</span>
              </div>
              <div className="text-2xl font-bold text-primary">{roadmapData.overallProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${roadmapData.overallProgress}%` }}
                />
              </div>
            </div>

            <div className={`p-3 bg-muted/50 rounded-lg ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{t.currentPhase}</span>
              </div>
              <div className="text-sm font-medium text-blue-600">
                {roadmapData.phases.find(p => p.status === 'active')?.name || 'Not Started'}
              </div>
              <Badge variant="outline" className="mt-1">
                {roadmapData.phases.find(p => p.status === 'active')?.status || 'pending'}
              </Badge>
            </div>

            <div className={`p-3 bg-muted/50 rounded-lg ${isRTL ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{t.estimatedCompletion}</span>
              </div>
              <div className="text-sm font-medium text-green-600">
                {roadmapData.estimatedCompletion.toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ({formatDistanceToNow(roadmapData.estimatedCompletion, { addSuffix: true })})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className={`flex border-b ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'phases'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('phases')}
        >
          {t.phases}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'milestones'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('milestones')}
        >
          {t.milestones}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'phases' ? (
        <Card>
          <CardContent className="p-6">
            <ProgressStepper
              steps={convertPhasesToSteps(roadmapData.phases)}
              orientation="vertical"
              showDescription={true}
              showProgress={false}
              locale={locale}
              onStepClick={(step) => {
                const phase = roadmapData.phases.find(p => p.id === step.id)
                if (phase && onStepClick) {
                  // Find the first step of the phase or active step
                  const stepToSelect = phase.steps.find(s => s.status === 'active') || phase.steps[0]
                  if (stepToSelect) {
                    onStepClick(stepToSelect)
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmapData.milestones.map((milestone) => (
            <Card 
              key={milestone.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                getMilestoneStatus(milestone) === 'overdue' ? 'border-red-200' : ''
              }`}
              onClick={() => onMilestoneClick?.(milestone)}
            >
              <CardContent className="p-4">
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`space-y-2 flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className={`h-5 w-5 ${
                        milestone.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                      }`} />
                      <h4 className="font-medium">{milestone.name}</h4>
                      <Badge 
                        variant={
                          getMilestoneStatus(milestone) === 'completed' ? 'default' :
                          getMilestoneStatus(milestone) === 'overdue' ? 'destructive' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {getMilestoneStatus(milestone) === 'completed' && t.completed}
                        {getMilestoneStatus(milestone) === 'overdue' && t.overdue}
                        {getMilestoneStatus(milestone) === 'pending' && t.pending}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                    <div className={`text-xs text-muted-foreground space-y-1 ${isRTL ? 'text-right' : ''}`}>
                      <p>
                        {t.dueDate}: {milestone.dueDate.toLocaleDateString()}
                        {milestone.completedAt && (
                          <span className="text-green-600 ml-2">
                            (Completed: {milestone.completedAt.toLocaleDateString()})
                          </span>
                        )}
                      </p>
                      <div>
                        <span className="font-medium">{t.deliverables}: </span>
                        {milestone.deliverables.join(', ')}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                    {t.viewDetails}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}