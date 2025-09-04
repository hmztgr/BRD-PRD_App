/**
 * Multi-Tab State Management Hook
 * Phase 5: Centralized state management with persistence
 */

import { useReducer, useCallback, useRef, useEffect } from 'react'
import { 
  GlobalState, 
  StateAction, 
  TabType, 
  TabStates,
  ProjectState,
  UIState,
  SaveStatePayload,
  Message,
  ResearchQuery,
  UploadedFile,
  Milestone,
  GenerationTask,
  NotificationItem,
  TabActivityInfo
} from '@/types/tab-states'

// Initial state factory
const createInitialState = (projectId?: string): GlobalState => ({
  project: {
    id: projectId || null,
    status: 'active',
    stage: 'initial',
    confidence: 0,
    totalTokens: 0,
    lastActivity: new Date().toISOString()
  },
  tabStates: {
    chat: {
      messages: [],
      conversationId: null,
      isLoading: false,
      hasUnsavedChanges: false,
      lastActivity: new Date().toISOString()
    },
    research: {
      activeQueries: [],
      results: [],
      isProcessing: false,
      hasNewResults: false,
      lastUpdate: new Date().toISOString(),
      totalQueries: 0,
      completedQueries: 0
    },
    upload: {
      files: [],
      processingStatus: [],
      isUploading: false,
      hasNewUploads: false,
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0
    },
    progress: {
      milestones: [],
      overallProgress: 0,
      currentPhase: 'Planning',
      isUpdating: false,
      hasUpdates: false,
      completedMilestones: 0,
      totalMilestones: 0
    },
    generate: {
      queue: [],
      completed: [],
      isGenerating: false,
      hasNewCompletions: false,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    }
  },
  uiState: {
    activeTab: 'chat',
    mode: 'advanced',
    sidebarCollapsed: false,
    notifications: [],
    hasUnsavedChanges: false,
    autoSaveEnabled: true,
    autoSaveInterval: 30000 // 30 seconds
  },
  isInitialized: false,
  isLoading: false
})

// State reducer
function multiTabStateReducer(state: GlobalState, action: StateAction): GlobalState {
  switch (action.type) {
    case 'INITIALIZE_STATE':
      return {
        ...action.payload,
        isInitialized: true,
        isLoading: false
      }

    case 'UPDATE_PROJECT':
      return {
        ...state,
        project: {
          ...state.project,
          ...action.payload,
          lastActivity: new Date().toISOString()
        },
        uiState: {
          ...state.uiState,
          hasUnsavedChanges: true
        }
      }

    case 'UPDATE_TAB_STATE':
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tab]: {
            ...state.tabStates[action.payload.tab],
            ...action.payload.state
          }
        },
        uiState: {
          ...state.uiState,
          hasUnsavedChanges: true
        }
      }

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          activeTab: action.payload
        }
      }

    case 'ADD_MESSAGE':
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          chat: {
            ...state.tabStates.chat,
            messages: [...state.tabStates.chat.messages, action.payload.message],
            hasUnsavedChanges: true,
            lastActivity: new Date().toISOString()
          }
        },
        uiState: {
          ...state.uiState,
          hasUnsavedChanges: true
        }
      }

    case 'ADD_RESEARCH_QUERY':
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          research: {
            ...state.tabStates.research,
            activeQueries: [...state.tabStates.research.activeQueries, action.payload.query],
            totalQueries: state.tabStates.research.totalQueries + 1,
            isProcessing: true,
            lastUpdate: new Date().toISOString()
          }
        }
      }

    case 'UPDATE_RESEARCH_QUERY':
      const updatedQueries = state.tabStates.research.activeQueries.map(query =>
        query.id === action.payload.queryId 
          ? { ...query, ...action.payload.update }
          : query
      )
      const completedCount = updatedQueries.filter(q => q.status === 'completed').length
      
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          research: {
            ...state.tabStates.research,
            activeQueries: updatedQueries,
            completedQueries: completedCount,
            isProcessing: updatedQueries.some(q => q.status === 'in_progress'),
            hasNewResults: action.payload.update.status === 'completed',
            lastUpdate: new Date().toISOString()
          }
        }
      }

    case 'ADD_FILE':
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          upload: {
            ...state.tabStates.upload,
            files: [...state.tabStates.upload.files, action.payload.file],
            totalFiles: state.tabStates.upload.totalFiles + 1,
            isUploading: action.payload.file.status === 'uploading',
            hasNewUploads: true
          }
        }
      }

    case 'UPDATE_FILE_STATUS':
      const updatedFiles = state.tabStates.upload.files.map(file =>
        file.id === action.payload.fileId
          ? { ...file, ...action.payload.status }
          : file
      )
      const completedFiles = updatedFiles.filter(f => f.status === 'ready').length
      const failedFiles = updatedFiles.filter(f => f.status === 'error').length

      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          upload: {
            ...state.tabStates.upload,
            files: updatedFiles,
            completedFiles,
            failedFiles,
            isUploading: updatedFiles.some(f => f.status === 'uploading' || f.status === 'processing')
          }
        }
      }

    case 'ADD_MILESTONE':
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          progress: {
            ...state.tabStates.progress,
            milestones: [...state.tabStates.progress.milestones, action.payload.milestone],
            totalMilestones: state.tabStates.progress.totalMilestones + 1,
            hasUpdates: true
          }
        }
      }

    case 'UPDATE_MILESTONE':
      const updatedMilestones = state.tabStates.progress.milestones.map(milestone =>
        milestone.id === action.payload.milestoneId
          ? { ...milestone, ...action.payload.update }
          : milestone
      )
      const completedMilestones = updatedMilestones.filter(m => m.status === 'completed').length
      const overallProgress = updatedMilestones.length > 0 
        ? Math.round((completedMilestones / updatedMilestones.length) * 100)
        : 0

      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          progress: {
            ...state.tabStates.progress,
            milestones: updatedMilestones,
            completedMilestones,
            overallProgress,
            hasUpdates: true
          }
        }
      }

    case 'ADD_GENERATION_TASK':
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          generate: {
            ...state.tabStates.generate,
            queue: [...state.tabStates.generate.queue, action.payload.task],
            totalTasks: state.tabStates.generate.totalTasks + 1,
            isGenerating: true
          }
        }
      }

    case 'UPDATE_GENERATION_TASK':
      const updatedTasks = state.tabStates.generate.queue.map(task =>
        task.id === action.payload.taskId
          ? { ...task, ...action.payload.update }
          : task
      )
      
      const completedTasks = [...state.tabStates.generate.completed]
      const queuedTasks = updatedTasks.filter(task => task.status !== 'completed' && task.status !== 'failed')
      
      // Move completed tasks to completed array
      updatedTasks.forEach(task => {
        if ((task.status === 'completed' || task.status === 'failed') &&
            !completedTasks.find(ct => ct.id === task.id)) {
          completedTasks.push(task)
        }
      })

      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          generate: {
            ...state.tabStates.generate,
            queue: queuedTasks,
            completed: completedTasks,
            completedTasks: completedTasks.filter(t => t.status === 'completed').length,
            failedTasks: completedTasks.filter(t => t.status === 'failed').length,
            isGenerating: queuedTasks.some(t => t.status === 'generating'),
            hasNewCompletions: action.payload.update.status === 'completed'
          }
        }
      }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          notifications: [action.payload.notification, ...state.uiState.notifications]
        }
      }

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          notifications: state.uiState.notifications.map(notification =>
            notification.id === action.payload.notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        }
      }

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          notifications: action.payload.tabSource
            ? state.uiState.notifications.filter(n => n.tabSource !== action.payload.tabSource)
            : []
        }
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload || undefined,
        isLoading: false
      }

    case 'MARK_SAVED':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          hasUnsavedChanges: false,
          lastSaved: action.payload.timestamp.toISOString()
        }
      }

    default:
      return state
  }
}

export function useMultiTabState(projectId?: string) {
  const [state, dispatch] = useReducer(multiTabStateReducer, createInitialState(projectId))
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    if (state.uiState.autoSaveEnabled && state.uiState.hasUnsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveState()
      }, state.uiState.autoSaveInterval)
    }
  }, [state.uiState.autoSaveEnabled, state.uiState.hasUnsavedChanges, state.uiState.autoSaveInterval])

  // Effect to trigger auto-save when state changes
  useEffect(() => {
    if (state.isInitialized && state.uiState.hasUnsavedChanges) {
      scheduleAutoSave()
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [state.uiState.hasUnsavedChanges, scheduleAutoSave])

  // State management actions
  const actions = {
    // Project actions
    updateProject: useCallback((update: Partial<ProjectState>) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: update })
    }, []),

    // Tab navigation
    setActiveTab: useCallback((tab: TabType) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
    }, []),

    // Chat actions
    addMessage: useCallback((message: Message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: { message } })
    }, []),

    // Research actions
    addResearchQuery: useCallback((query: ResearchQuery) => {
      dispatch({ type: 'ADD_RESEARCH_QUERY', payload: { query } })
    }, []),

    updateResearchQuery: useCallback((queryId: string, update: Partial<ResearchQuery>) => {
      dispatch({ type: 'UPDATE_RESEARCH_QUERY', payload: { queryId, update } })
    }, []),

    // Upload actions
    addFile: useCallback((file: UploadedFile) => {
      dispatch({ type: 'ADD_FILE', payload: { file } })
    }, []),

    updateFileStatus: useCallback((fileId: string, status: Partial<UploadedFile>) => {
      dispatch({ type: 'UPDATE_FILE_STATUS', payload: { fileId, status } })
    }, []),

    // Progress actions
    addMilestone: useCallback((milestone: Milestone) => {
      dispatch({ type: 'ADD_MILESTONE', payload: { milestone } })
    }, []),

    updateMilestone: useCallback((milestoneId: string, update: Partial<Milestone>) => {
      dispatch({ type: 'UPDATE_MILESTONE', payload: { milestoneId, update } })
    }, []),

    // Generation actions
    addGenerationTask: useCallback((task: GenerationTask) => {
      dispatch({ type: 'ADD_GENERATION_TASK', payload: { task } })
    }, []),

    updateGenerationTask: useCallback((taskId: string, update: Partial<GenerationTask>) => {
      dispatch({ type: 'UPDATE_GENERATION_TASK', payload: { taskId, update } })
    }, []),

    // Notification actions
    addNotification: useCallback((notification: NotificationItem) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { notification } })
    }, []),

    markNotificationRead: useCallback((notificationId: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId } })
    }, []),

    clearNotifications: useCallback((tabSource?: TabType) => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: { tabSource } })
    }, []),

    // Utility actions
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, [])
  }

  // State persistence
  const saveState = useCallback(async () => {
    if (!state.project.id) return

    try {
      const payload: SaveStatePayload = {
        project: state.project,
        tabStates: state.tabStates,
        uiState: {
          activeTab: state.uiState.activeTab,
          mode: state.uiState.mode
        },
        timestamp: new Date().toISOString()
      }

      const response = await fetch(`/api/projects/${state.project.id}/session/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        dispatch({ type: 'MARK_SAVED', payload: { timestamp: new Date() } })
        actions.addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Progress Saved',
          message: 'All tab states have been saved successfully',
          tabSource: state.uiState.activeTab,
          isRead: false,
          createdAt: new Date().toISOString()
        })
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      console.error('Failed to save state:', error)
      actions.addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save progress. Please try again.',
        tabSource: state.uiState.activeTab,
        isRead: false,
        createdAt: new Date().toISOString()
      })
    }
  }, [state, actions])

  const resumeState = useCallback(async (projectId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await fetch(`/api/projects/${projectId}/session/resume`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.sessionState) {
          dispatch({ type: 'INITIALIZE_STATE', payload: {
            ...createInitialState(projectId),
            project: data.sessionState.project || createInitialState(projectId).project,
            tabStates: {
              ...createInitialState(projectId).tabStates,
              ...data.sessionState.tabStates
            },
            uiState: {
              ...createInitialState(projectId).uiState,
              ...data.sessionState.uiState
            }
          }})
        }
      }
    } catch (error) {
      console.error('Failed to resume state:', error)
      actions.setError('Failed to resume session state')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [actions])

  // Computed values
  const getTabActivityInfo = useCallback((tab: TabType): TabActivityInfo => {
    const tabState = state.tabStates[tab]
    
    switch (tab) {
      case 'chat':
        return {
          tab,
          hasActivity: tabState.messages.length > 0,
          activityCount: tabState.messages.length,
          lastActivity: tabState.lastActivity,
          status: tabState.isLoading ? 'processing' : 'idle'
        }
      
      case 'research':
        return {
          tab,
          hasActivity: tabState.hasNewResults,
          activityCount: tabState.activeQueries.length,
          lastActivity: tabState.lastUpdate,
          status: tabState.isProcessing ? 'processing' : 'idle'
        }
        
      case 'upload':
        return {
          tab,
          hasActivity: tabState.hasNewUploads,
          activityCount: tabState.totalFiles,
          lastActivity: new Date().toISOString(),
          status: tabState.isUploading ? 'processing' : 'idle'
        }
        
      case 'progress':
        return {
          tab,
          hasActivity: tabState.hasUpdates,
          activityCount: tabState.completedMilestones,
          lastActivity: new Date().toISOString(),
          status: tabState.isUpdating ? 'processing' : 'idle'
        }
        
      case 'generate':
        return {
          tab,
          hasActivity: tabState.hasNewCompletions,
          activityCount: tabState.completedTasks,
          lastActivity: new Date().toISOString(),
          status: tabState.isGenerating ? 'processing' : 'idle'
        }
        
      default:
        return {
          tab,
          hasActivity: false,
          activityCount: 0,
          lastActivity: new Date().toISOString(),
          status: 'idle'
        }
    }
  }, [state.tabStates])

  return {
    state,
    actions,
    saveState,
    resumeState,
    getTabActivityInfo
  }
}