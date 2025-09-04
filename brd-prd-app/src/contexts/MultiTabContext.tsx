/**
 * Multi-Tab State Context Provider
 * Phase 5: Task 5.3 - Pass state management functions to child components
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useMultiTabState } from '@/hooks/useMultiTabState'
import { 
  GlobalState, 
  TabType, 
  ProjectState,
  Message,
  ResearchQuery,
  UploadedFile,
  Milestone,
  GenerationTask,
  NotificationItem,
  TabActivityInfo
} from '@/types/tab-states'

interface MultiTabContextType {
  // State
  state: GlobalState
  
  // Project actions
  updateProject: (update: Partial<ProjectState>) => void
  
  // Tab navigation
  setActiveTab: (tab: TabType) => void
  
  // Chat actions
  addMessage: (message: Message) => void
  
  // Research actions
  addResearchQuery: (query: ResearchQuery) => void
  updateResearchQuery: (queryId: string, update: Partial<ResearchQuery>) => void
  
  // Upload actions
  addFile: (file: UploadedFile) => void
  updateFileStatus: (fileId: string, status: Partial<UploadedFile>) => void
  
  // Progress actions
  addMilestone: (milestone: Milestone) => void
  updateMilestone: (milestoneId: string, update: Partial<Milestone>) => void
  
  // Generation actions
  addGenerationTask: (task: GenerationTask) => void
  updateGenerationTask: (taskId: string, update: Partial<GenerationTask>) => void
  
  // Notification actions
  addNotification: (notification: NotificationItem) => void
  markNotificationRead: (notificationId: string) => void
  clearNotifications: (tabSource?: TabType) => void
  
  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // State persistence
  saveState: () => Promise<void>
  resumeState: (projectId: string) => Promise<void>
  
  // Computed values
  getTabActivityInfo: (tab: TabType) => TabActivityInfo
}

const MultiTabContext = createContext<MultiTabContextType | undefined>(undefined)

interface MultiTabProviderProps {
  children: ReactNode
  projectId?: string
}

export function MultiTabProvider({ children, projectId }: MultiTabProviderProps) {
  const { state, actions, saveState, resumeState, getTabActivityInfo } = useMultiTabState(projectId)

  const contextValue: MultiTabContextType = {
    state,
    ...actions,
    saveState,
    resumeState,
    getTabActivityInfo
  }

  return (
    <MultiTabContext.Provider value={contextValue}>
      {children}
    </MultiTabContext.Provider>
  )
}

export function useMultiTabContext(): MultiTabContextType {
  const context = useContext(MultiTabContext)
  if (!context) {
    throw new Error('useMultiTabContext must be used within a MultiTabProvider')
  }
  return context
}

// Additional hook for tab-specific state access
export function useTabState<T extends TabType>(tabType: T) {
  const context = useMultiTabContext()
  
  return {
    tabState: context.state.tabStates[tabType],
    activityInfo: context.getTabActivityInfo(tabType),
    isActive: context.state.uiState.activeTab === tabType,
    setActive: () => context.setActiveTab(tabType)
  }
}

// Hook for project-specific actions
export function useProjectActions() {
  const context = useMultiTabContext()
  
  return {
    project: context.state.project,
    updateProject: context.updateProject,
    saveState: context.saveState,
    resumeState: context.resumeState,
    isLoading: context.state.isLoading,
    hasUnsavedChanges: context.state.uiState.hasUnsavedChanges,
    lastSaved: context.state.uiState.lastSaved
  }
}

// Hook for notifications
export function useNotifications() {
  const context = useMultiTabContext()
  
  return {
    notifications: context.state.uiState.notifications,
    addNotification: context.addNotification,
    markNotificationRead: context.markNotificationRead,
    clearNotifications: context.clearNotifications,
    unreadCount: context.state.uiState.notifications.filter(n => !n.isRead).length
  }
}

// Hook for UI state management
export function useUIState() {
  const context = useMultiTabContext()
  
  return {
    activeTab: context.state.uiState.activeTab,
    mode: context.state.uiState.mode,
    sidebarCollapsed: context.state.uiState.sidebarCollapsed,
    setActiveTab: context.setActiveTab,
    hasUnsavedChanges: context.state.uiState.hasUnsavedChanges,
    autoSaveEnabled: context.state.uiState.autoSaveEnabled
  }
}