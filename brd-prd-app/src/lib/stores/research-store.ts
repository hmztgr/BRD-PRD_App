import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ResearchRequest {
  id: string
  sessionId: string
  title: string
  description: string
  category: 'market_analysis' | 'competitor_research' | 'regulatory' | 'financial' | 'technical' | 'custom'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  progress: number
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  assignedTo?: string
  tags?: string[]
  sources?: string[]
  findings: ResearchFinding[]
  metadata?: {
    estimatedHours?: number
    actualHours?: number
    confidence?: number
    methodology?: string
  }
}

export interface ResearchFinding {
  id: string
  requestId: string
  title: string
  content: string
  source: string
  sourceUrl?: string
  credibility: 'low' | 'medium' | 'high'
  relevance: 'low' | 'medium' | 'high'
  foundAt: Date
  tags?: string[]
  attachments?: {
    id: string
    name: string
    url: string
    type: string
  }[]
  notes?: string
}

export interface ResearchTemplate {
  id: string
  name: string
  description: string
  category: string
  questions: string[]
  sources: string[]
  methodology?: string
  estimatedHours?: number
  isPublic: boolean
  createdBy: string
  createdAt: Date
  usageCount: number
}

export interface ResearchStore {
  // Requests management
  requests: Record<string, ResearchRequest>
  
  // Templates
  templates: Record<string, ResearchTemplate>
  
  // Current active research
  activeRequestId: string | null
  
  // Actions
  createRequest: (request: Omit<ResearchRequest, 'id' | 'createdAt' | 'updatedAt' | 'findings'>) => string
  updateRequest: (requestId: string, updates: Partial<ResearchRequest>) => void
  deleteRequest: (requestId: string) => void
  setActiveRequest: (requestId: string | null) => void
  
  // Findings management
  addFinding: (requestId: string, finding: Omit<ResearchFinding, 'id' | 'foundAt'>) => void
  updateFinding: (requestId: string, findingId: string, updates: Partial<ResearchFinding>) => void
  deleteFinding: (requestId: string, findingId: string) => void
  
  // Templates
  createTemplate: (template: Omit<ResearchTemplate, 'id' | 'createdAt' | 'usageCount'>) => string
  updateTemplate: (templateId: string, updates: Partial<ResearchTemplate>) => void
  deleteTemplate: (templateId: string) => void
  useTemplate: (templateId: string) => void
  
  // Utilities
  getRequestsBySession: (sessionId: string) => ResearchRequest[]
  getActiveRequests: () => ResearchRequest[]
  getCompletedRequests: () => ResearchRequest[]
  getFindingsByRequest: (requestId: string) => ResearchFinding[]
  getRecentFindings: (limit?: number) => ResearchFinding[]
  getPublicTemplates: () => ResearchTemplate[]
  
  // Analytics
  getResearchStats: (sessionId?: string) => {
    totalRequests: number
    completedRequests: number
    pendingRequests: number
    totalFindings: number
    averageCompletionTime: number
  }
}

export const useResearchStore = create<ResearchStore>()(
  persist(
    (set, get) => ({
      requests: {},
      templates: {},
      activeRequestId: null,

      createRequest: (request: Omit<ResearchRequest, 'id' | 'createdAt' | 'updatedAt' | 'findings'>) => {
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newRequest: ResearchRequest = {
          ...request,
          id: requestId,
          createdAt: new Date(),
          updatedAt: new Date(),
          findings: []
        }

        set(state => ({
          requests: {
            ...state.requests,
            [requestId]: newRequest
          },
          activeRequestId: requestId
        }))

        return requestId
      },

      updateRequest: (requestId: string, updates: Partial<ResearchRequest>) => {
        set(state => ({
          requests: {
            ...state.requests,
            [requestId]: {
              ...state.requests[requestId],
              ...updates,
              updatedAt: new Date()
            }
          }
        }))
      },

      deleteRequest: (requestId: string) => {
        set(state => {
          const { [requestId]: deleted, ...remainingRequests } = state.requests
          return {
            requests: remainingRequests,
            activeRequestId: state.activeRequestId === requestId ? null : state.activeRequestId
          }
        })
      },

      setActiveRequest: (requestId: string | null) => {
        set(() => ({
          activeRequestId: requestId
        }))
      },

      addFinding: (requestId: string, finding: Omit<ResearchFinding, 'id' | 'foundAt'>) => {
        const findingId = `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newFinding: ResearchFinding = {
          ...finding,
          id: findingId,
          foundAt: new Date()
        }

        set(state => {
          const request = state.requests[requestId]
          if (!request) return state

          const updatedRequest = {
            ...request,
            findings: [...request.findings, newFinding],
            updatedAt: new Date(),
            ...(finding.relevance === 'high' && { progress: Math.min(100, request.progress + 10) })
          }

          return {
            requests: {
              ...state.requests,
              [requestId]: updatedRequest
            }
          }
        })
      },

      updateFinding: (requestId: string, findingId: string, updates: Partial<ResearchFinding>) => {
        set(state => {
          const request = state.requests[requestId]
          if (!request) return state

          const updatedFindings = request.findings.map(finding =>
            finding.id === findingId ? { ...finding, ...updates } : finding
          )

          return {
            requests: {
              ...state.requests,
              [requestId]: {
                ...request,
                findings: updatedFindings,
                updatedAt: new Date()
              }
            }
          }
        })
      },

      deleteFinding: (requestId: string, findingId: string) => {
        set(state => {
          const request = state.requests[requestId]
          if (!request) return state

          return {
            requests: {
              ...state.requests,
              [requestId]: {
                ...request,
                findings: request.findings.filter(f => f.id !== findingId),
                updatedAt: new Date()
              }
            }
          }
        })
      },

      createTemplate: (template: Omit<ResearchTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
        const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newTemplate: ResearchTemplate = {
          ...template,
          id: templateId,
          createdAt: new Date(),
          usageCount: 0
        }

        set(state => ({
          templates: {
            ...state.templates,
            [templateId]: newTemplate
          }
        }))

        return templateId
      },

      updateTemplate: (templateId: string, updates: Partial<ResearchTemplate>) => {
        set(state => ({
          templates: {
            ...state.templates,
            [templateId]: {
              ...state.templates[templateId],
              ...updates
            }
          }
        }))
      },

      deleteTemplate: (templateId: string) => {
        set(state => {
          const { [templateId]: deleted, ...remainingTemplates } = state.templates
          return {
            templates: remainingTemplates
          }
        })
      },

      useTemplate: (templateId: string) => {
        set(state => ({
          templates: {
            ...state.templates,
            [templateId]: {
              ...state.templates[templateId],
              usageCount: state.templates[templateId].usageCount + 1
            }
          }
        }))
      },

      getRequestsBySession: (sessionId: string): ResearchRequest[] => {
        const requests = get().requests
        return Object.values(requests)
          .filter(request => request.sessionId === sessionId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      },

      getActiveRequests: (): ResearchRequest[] => {
        const requests = get().requests
        return Object.values(requests)
          .filter(request => request.status === 'pending' || request.status === 'in_progress')
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      },

      getCompletedRequests: (): ResearchRequest[] => {
        const requests = get().requests
        return Object.values(requests)
          .filter(request => request.status === 'completed')
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      },

      getFindingsByRequest: (requestId: string): ResearchFinding[] => {
        const request = get().requests[requestId]
        if (!request) return []
        
        return request.findings.sort((a, b) => b.foundAt.getTime() - a.foundAt.getTime())
      },

      getRecentFindings: (limit: number = 10): ResearchFinding[] => {
        const requests = get().requests
        const allFindings: ResearchFinding[] = []
        
        Object.values(requests).forEach(request => {
          allFindings.push(...request.findings)
        })
        
        return allFindings
          .sort((a, b) => b.foundAt.getTime() - a.foundAt.getTime())
          .slice(0, limit)
      },

      getPublicTemplates: (): ResearchTemplate[] => {
        const templates = get().templates
        return Object.values(templates)
          .filter(template => template.isPublic)
          .sort((a, b) => b.usageCount - a.usageCount)
      },

      getResearchStats: (sessionId?: string) => {
        const requests = get().requests
        const filteredRequests = sessionId 
          ? Object.values(requests).filter(req => req.sessionId === sessionId)
          : Object.values(requests)

        const totalRequests = filteredRequests.length
        const completedRequests = filteredRequests.filter(req => req.status === 'completed').length
        const pendingRequests = filteredRequests.filter(req => 
          req.status === 'pending' || req.status === 'in_progress'
        ).length

        const totalFindings = filteredRequests.reduce((total, req) => total + req.findings.length, 0)

        // Calculate average completion time (in hours)
        const completedWithTimes = filteredRequests.filter(req => 
          req.status === 'completed' && req.metadata?.actualHours
        )
        const averageCompletionTime = completedWithTimes.length > 0
          ? completedWithTimes.reduce((sum, req) => sum + (req.metadata?.actualHours || 0), 0) / completedWithTimes.length
          : 0

        return {
          totalRequests,
          completedRequests,
          pendingRequests,
          totalFindings,
          averageCompletionTime: Math.round(averageCompletionTime * 10) / 10
        }
      }
    }),
    {
      name: 'research-data',
      version: 1
    }
  )
)