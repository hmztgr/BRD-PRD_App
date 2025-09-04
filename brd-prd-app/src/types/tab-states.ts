/**
 * Centralized State Management for Multi-Tab Persistence
 * Phase 5: Implementation of comprehensive tab state interfaces
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date | string
  metadata?: Record<string, any>
}

export interface ResearchQuery {
  id: string
  type: 'competitor' | 'market' | 'regulatory' | 'trend'
  query: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  confidence?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date | string
  completedAt?: Date | string
  results?: any[]
}

export interface ResearchResult {
  id: string
  queryId: string
  type: string
  title: string
  summary: string
  confidence: number
  sources?: string[]
  data?: Record<string, any>
  createdAt: Date | string
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  url?: string
  metadata?: Record<string, any>
  progress?: number
  createdAt: Date | string
}

export interface ProcessingStatus {
  fileId: string
  stage: 'upload' | 'scan' | 'extract' | 'analyze' | 'complete'
  progress: number
  message?: string
  error?: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  progress: number
  dependencies?: string[]
  dueDate?: Date | string
  completedAt?: Date | string
}

export interface GenerationTask {
  id: string
  type: 'brd' | 'prd' | 'business_plan' | 'feasibility' | 'pitch_deck'
  title: string
  status: 'queued' | 'generating' | 'completed' | 'failed'
  progress: number
  priority: number
  estimatedTime?: number
  createdAt: Date | string
  completedAt?: Date | string
  result?: {
    content: string
    metadata?: Record<string, any>
  }
}

export interface NotificationItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  tabSource: TabType
  isRead: boolean
  createdAt: Date | string
  expiresAt?: Date | string
}

export type TabType = 'chat' | 'research' | 'upload' | 'progress' | 'generate'

export interface ChatTabState {
  messages: Message[]
  conversationId: string | null
  isLoading: boolean
  hasUnsavedChanges: boolean
  lastActivity: Date | string
  sessionData?: Record<string, any>
}

export interface ResearchTabState {
  activeQueries: ResearchQuery[]
  results: ResearchResult[]
  isProcessing: boolean
  hasNewResults: boolean
  lastUpdate: Date | string
  totalQueries: number
  completedQueries: number
}

export interface UploadTabState {
  files: UploadedFile[]
  processingStatus: ProcessingStatus[]
  isUploading: boolean
  hasNewUploads: boolean
  totalFiles: number
  completedFiles: number
  failedFiles: number
}

export interface ProgressTabState {
  milestones: Milestone[]
  overallProgress: number
  currentPhase: string
  isUpdating: boolean
  hasUpdates: boolean
  completedMilestones: number
  totalMilestones: number
}

export interface GenerateTabState {
  queue: GenerationTask[]
  completed: GenerationTask[]
  isGenerating: boolean
  hasNewCompletions: boolean
  totalTasks: number
  completedTasks: number
  failedTasks: number
  estimatedTimeRemaining?: number
}

export interface TabStates {
  chat: ChatTabState
  research: ResearchTabState
  upload: UploadTabState
  progress: ProgressTabState
  generate: GenerateTabState
}

export interface UIState {
  activeTab: TabType
  mode: 'standard' | 'advanced'
  sidebarCollapsed: boolean
  notifications: NotificationItem[]
  hasUnsavedChanges: boolean
  lastSaved?: Date | string
  autoSaveEnabled: boolean
  autoSaveInterval: number
}

export interface ProjectState {
  id: string | null
  name?: string
  description?: string
  industry?: string
  country?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  stage: 'initial' | 'research' | 'analysis' | 'generation'
  confidence: number
  totalTokens: number
  lastActivity: Date | string
  metadata?: Record<string, any>
}

export interface GlobalState {
  project: ProjectState
  tabStates: TabStates
  uiState: UIState
  isInitialized: boolean
  isLoading: boolean
  error?: string
}

// State Management Actions
export type StateAction = 
  | { type: 'INITIALIZE_STATE'; payload: GlobalState }
  | { type: 'UPDATE_PROJECT'; payload: Partial<ProjectState> }
  | { type: 'UPDATE_TAB_STATE'; payload: { tab: TabType; state: Partial<TabStates[TabType]> } }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'ADD_MESSAGE'; payload: { message: Message } }
  | { type: 'ADD_RESEARCH_QUERY'; payload: { query: ResearchQuery } }
  | { type: 'UPDATE_RESEARCH_QUERY'; payload: { queryId: string; update: Partial<ResearchQuery> } }
  | { type: 'ADD_FILE'; payload: { file: UploadedFile } }
  | { type: 'UPDATE_FILE_STATUS'; payload: { fileId: string; status: Partial<UploadedFile> } }
  | { type: 'ADD_MILESTONE'; payload: { milestone: Milestone } }
  | { type: 'UPDATE_MILESTONE'; payload: { milestoneId: string; update: Partial<Milestone> } }
  | { type: 'ADD_GENERATION_TASK'; payload: { task: GenerationTask } }
  | { type: 'UPDATE_GENERATION_TASK'; payload: { taskId: string; update: Partial<GenerationTask> } }
  | { type: 'ADD_NOTIFICATION'; payload: { notification: NotificationItem } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { notificationId: string } }
  | { type: 'CLEAR_NOTIFICATIONS'; payload: { tabSource?: TabType } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'MARK_SAVED'; payload: { timestamp: Date } }

// Helper Types
export interface TabActivityInfo {
  tab: TabType
  hasActivity: boolean
  activityCount: number
  lastActivity: Date | string
  status: 'idle' | 'active' | 'processing' | 'error'
}

export interface SaveStatePayload {
  project: ProjectState
  tabStates: TabStates
  uiState: Pick<UIState, 'activeTab' | 'mode'>
  timestamp: Date | string
}

export interface ResumeStatePayload {
  project: ProjectState
  tabStates: Partial<TabStates>
  uiState: Partial<UIState>
  timestamp: Date | string
}