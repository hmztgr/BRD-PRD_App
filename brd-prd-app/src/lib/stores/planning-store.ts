import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PlanningStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  substeps?: PlanningStep[]
  completedAt?: Date
  notes?: string
}

export interface ResearchFinding {
  id: string
  title: string
  description: string
  category: string
  source?: string
  confidence: 'low' | 'medium' | 'high'
  createdAt: Date
  tags?: string[]
}

export interface GeneratedDocument {
  id: string
  name: string
  type: string
  status: 'generating' | 'completed' | 'failed'
  downloadUrl?: string
  previewUrl?: string
  generatedAt: Date
  metadata?: {
    pages?: number
    size?: number
    format?: string
  }
}

export interface PlanningSession {
  id: string
  name: string
  country: string
  businessType?: string
  status: 'active' | 'completed' | 'archived'
  createdAt: Date
  updatedAt: Date
  steps: PlanningStep[]
  researchFindings: ResearchFinding[]
  generatedDocuments: GeneratedDocument[]
  chatHistory: ChatMessage[]
  metadata?: {
    totalSteps?: number
    completedSteps?: number
    progress?: number
    estimatedCompletion?: Date
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    id: string
    name: string
    type: string
    url: string
  }[]
}

export interface PlanningStore {
  // Session management
  currentSession: PlanningSession | null
  sessions: Record<string, PlanningSession>
  
  // Actions
  createSession: (name: string, country: string, businessType?: string) => string
  updateSession: (sessionId: string, updates: Partial<PlanningSession>) => void
  deleteSession: (sessionId: string) => void
  setCurrentSession: (sessionId: string | null) => void
  
  // Steps management
  addStep: (sessionId: string, step: Omit<PlanningStep, 'id'>) => void
  updateStep: (sessionId: string, stepId: string, updates: Partial<PlanningStep>) => void
  completeStep: (sessionId: string, stepId: string, notes?: string) => void
  
  // Research findings
  addResearchFinding: (sessionId: string, finding: Omit<ResearchFinding, 'id' | 'createdAt'>) => void
  updateResearchFinding: (sessionId: string, findingId: string, updates: Partial<ResearchFinding>) => void
  deleteResearchFinding: (sessionId: string, findingId: string) => void
  
  // Document generation
  addGeneratedDocument: (sessionId: string, document: Omit<GeneratedDocument, 'id' | 'generatedAt'>) => void
  updateGeneratedDocument: (sessionId: string, documentId: string, updates: Partial<GeneratedDocument>) => void
  deleteGeneratedDocument: (sessionId: string, documentId: string) => void
  
  // Chat history
  addChatMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChatHistory: (sessionId: string) => void
  
  // Utilities
  getSessionProgress: (sessionId: string) => number
  getActiveResearch: (sessionId: string) => ResearchFinding[]
  getPendingSteps: (sessionId: string) => PlanningStep[]
}

export const usePlanningStore = create<PlanningStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: {},

      createSession: (name: string, country: string, businessType?: string) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newSession: PlanningSession = {
          id: sessionId,
          name,
          country,
          businessType,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          steps: [],
          researchFindings: [],
          generatedDocuments: [],
          chatHistory: [],
          metadata: {
            totalSteps: 0,
            completedSteps: 0,
            progress: 0
          }
        }

        set(state => ({
          sessions: {
            ...state.sessions,
            [sessionId]: newSession
          },
          currentSession: newSession
        }))

        return sessionId
      },

      updateSession: (sessionId: string, updates: Partial<PlanningSession>) => {
        set(state => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              ...updates,
              updatedAt: new Date()
            }
          },
          currentSession: state.currentSession?.id === sessionId 
            ? { ...state.currentSession, ...updates, updatedAt: new Date() }
            : state.currentSession
        }))
      },

      deleteSession: (sessionId: string) => {
        set(state => {
          const { [sessionId]: deleted, ...remainingSessions } = state.sessions
          return {
            sessions: remainingSessions,
            currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
          }
        })
      },

      setCurrentSession: (sessionId: string | null) => {
        set(state => ({
          currentSession: sessionId ? state.sessions[sessionId] || null : null
        }))
      },

      addStep: (sessionId: string, step: Omit<PlanningStep, 'id'>) => {
        const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newStep: PlanningStep = {
          ...step,
          id: stepId
        }

        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSteps = [...session.steps, newStep]
          const updatedSession = {
            ...session,
            steps: updatedSteps,
            updatedAt: new Date(),
            metadata: {
              ...session.metadata,
              totalSteps: updatedSteps.length,
              progress: get().getSessionProgress(sessionId)
            }
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      updateStep: (sessionId: string, stepId: string, updates: Partial<PlanningStep>) => {
        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSteps = session.steps.map(step =>
            step.id === stepId ? { ...step, ...updates } : step
          )
          
          const updatedSession = {
            ...session,
            steps: updatedSteps,
            updatedAt: new Date(),
            metadata: {
              ...session.metadata,
              completedSteps: updatedSteps.filter(s => s.status === 'completed').length,
              progress: get().getSessionProgress(sessionId)
            }
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      completeStep: (sessionId: string, stepId: string, notes?: string) => {
        get().updateStep(sessionId, stepId, {
          status: 'completed',
          completedAt: new Date(),
          notes
        })
      },

      addResearchFinding: (sessionId: string, finding: Omit<ResearchFinding, 'id' | 'createdAt'>) => {
        const findingId = `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newFinding: ResearchFinding = {
          ...finding,
          id: findingId,
          createdAt: new Date()
        }

        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSession = {
            ...session,
            researchFindings: [...session.researchFindings, newFinding],
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      updateResearchFinding: (sessionId: string, findingId: string, updates: Partial<ResearchFinding>) => {
        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedFindings = session.researchFindings.map(finding =>
            finding.id === findingId ? { ...finding, ...updates } : finding
          )
          
          const updatedSession = {
            ...session,
            researchFindings: updatedFindings,
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      deleteResearchFinding: (sessionId: string, findingId: string) => {
        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSession = {
            ...session,
            researchFindings: session.researchFindings.filter(f => f.id !== findingId),
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      addGeneratedDocument: (sessionId: string, document: Omit<GeneratedDocument, 'id' | 'generatedAt'>) => {
        const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newDocument: GeneratedDocument = {
          ...document,
          id: documentId,
          generatedAt: new Date()
        }

        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSession = {
            ...session,
            generatedDocuments: [...session.generatedDocuments, newDocument],
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      updateGeneratedDocument: (sessionId: string, documentId: string, updates: Partial<GeneratedDocument>) => {
        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedDocuments = session.generatedDocuments.map(doc =>
            doc.id === documentId ? { ...doc, ...updates } : doc
          )
          
          const updatedSession = {
            ...session,
            generatedDocuments: updatedDocuments,
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      deleteGeneratedDocument: (sessionId: string, documentId: string) => {
        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSession = {
            ...session,
            generatedDocuments: session.generatedDocuments.filter(d => d.id !== documentId),
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      addChatMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newMessage: ChatMessage = {
          ...message,
          id: messageId,
          timestamp: new Date()
        }

        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSession = {
            ...session,
            chatHistory: [...session.chatHistory, newMessage],
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      clearChatHistory: (sessionId: string) => {
        set(state => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const updatedSession = {
            ...session,
            chatHistory: [],
            updatedAt: new Date()
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: updatedSession
            },
            currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession
          }
        })
      },

      getSessionProgress: (sessionId: string): number => {
        const session = get().sessions[sessionId]
        if (!session || session.steps.length === 0) return 0
        
        const completedSteps = session.steps.filter(step => step.status === 'completed').length
        return Math.round((completedSteps / session.steps.length) * 100)
      },

      getActiveResearch: (sessionId: string): ResearchFinding[] => {
        const session = get().sessions[sessionId]
        if (!session) return []
        
        // Return recent findings (last 30 days) sorted by creation date
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        return session.researchFindings
          .filter(finding => finding.createdAt >= thirtyDaysAgo)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      },

      getPendingSteps: (sessionId: string): PlanningStep[] => {
        const session = get().sessions[sessionId]
        if (!session) return []
        
        return session.steps.filter(step => 
          step.status === 'pending' || step.status === 'in_progress'
        )
      }
    }),
    {
      name: 'planning-sessions',
      version: 1
    }
  )
)