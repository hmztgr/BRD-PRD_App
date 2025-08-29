import { User, Document, Template } from '@prisma/client'

export interface UserWithDetails extends User {
  documents?: Document[]
  _count?: {
    documents: number
    referrals: number
  }
}

export interface DocumentWithUser extends Document {
  user: User
}

export interface TemplateWithCreator extends Template {
  creator?: User
}

export type SubscriptionTier = 'free' | 'professional' | 'business' | 'enterprise'

export type DocumentType = 'brd' | 'prd' | 'technical' | 'project_management'

export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'archived'

export interface TokenUsage {
  used: number
  limit: number
  percentage: number
}

export interface GenerationRequest {
  type: DocumentType
  title: string
  description: string
  language: 'en' | 'ar'
  industry?: string
  template?: string
}

export interface GenerationResponse {
  content: string
  tokensUsed: number
  generationTime: number
  aiModel: string
}

export interface ReferralReward {
  id: string
  type: 'signup' | 'subscription' | 'upgrade' | 'social_follow'
  tokens: number
  description: string
  claimed: boolean
  createdAt: Date
}

// Admin API Types
export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  adminPermissions: string[]
}

export interface AdminUserResponse extends User {
  _count: {
    documents: number
    referrals: number
    usageHistory?: number
    payments?: number
  }
  usageHistory?: Array<{
    id: string
    date: Date
    tokensUsed: number
    operation: string
    aiModel: string | null
    success: boolean
  }>
  payments?: Array<{
    id: string
    amount: number
    currency: string
    status: string
    createdAt: Date
  }>
}

export interface AdminUsersListResponse {
  users: Array<{
    id: string
    name: string | null
    email: string
    emailVerified: Date | null
    role: string
    subscriptionTier: string
    subscriptionStatus: string
    tokensUsed: number
    tokensLimit: number
    createdAt: Date
    updatedAt: Date
    companyName: string | null
    industry: string | null
    language: string
    _count: {
      documents: number
      referrals: number
    }
  }>
  pagination: PaginationResponse
}

export interface PaginationResponse {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Analytics Types
export interface UserAnalyticsResponse {
  overview: {
    totalUsers: number
    activeUsers: number
    verifiedUsers: number
    unverifiedUsers: number
  }
  registrations: Array<{
    date: string
    count: number
  }>
  subscriptionDistribution: Array<{
    tier: string
    count: number
  }>
  roleDistribution: Array<{
    role: string
    count: number
  }>
  topIndustries: Array<{
    industry: string | null
    count: number
  }>
  languageDistribution: Array<{
    language: string
    count: number
  }>
  retention: Array<{
    cohort: string
    totalUsers: number
    retainedUsers: number
    retentionRate: number
  }>
}

export interface SubscriptionAnalyticsResponse {
  overview: {
    totalMRR: number
    totalRevenue: number
    totalPayments: number
    failedPayments: number
    arpu: number
    activeSubscribers: number
  }
  mrrByTier: { [key: string]: number }
  subscriptionDistribution: Array<{
    tier: string
    status: string
    count: number
  }>
  revenueOverTime: Array<{
    date: string
    amount: number
    count: number
  }>
  subscriptionTransitions: Array<{
    fromTier: string
    toTier: string
    count: number
  }>
  churnAnalysis: Array<{
    tier: string
    count: number
  }>
  subscriptionDurations: Array<{
    tier: string
    avgDays: number
    minDays: number
    maxDays: number
  }>
  conversionFunnel: Array<{
    cohort: string
    totalSignups: number
    convertedToPaid: number
    conversionRate: number
  }>
}

export interface SystemAnalyticsResponse {
  overview: {
    totalDocuments: number
    totalTemplates: number
    totalConversations: number
    totalMessages: number
    totalTokensUsed: number
    totalOperations: number
    successRate: number
  }
  usage: {
    byOperation: Array<{
      operation: string
      tokens: number
      count: number
    }>
    byAiModel: Array<{
      model: string | null
      tokens: number
      count: number
    }>
    dailyTrends: Array<{
      date: string
      tokens: number
      operations: number
    }>
    peakHours: Array<{
      hour: number
      operations: number
    }>
  }
  documents: {
    byType: Array<{
      type: string
      count: number
    }>
  }
  storage: {
    byTable: Array<{
      tableName: string
      sizeBytes: number
      rowCount: number
      sizeMB: number
    }>
  }
  support: {
    feedback: Array<{
      status: string
      count: number
    }>
    contactRequests: Array<{
      status: string
      count: number
    }>
    supportTickets: Array<{
      status: string
      count: number
    }>
  }
  referrals: {
    byType: Array<{
      type: string
      tokens: number
      count: number
    }>
  }
  topUsers: Array<{
    id: string
    name: string | null
    email: string
    subscriptionTier: string
    documentCount: number
  }>
}

export interface AdminActivityResponse {
  activities: Array<{
    id: string
    action: string
    targetId: string | null
    details: any
    createdAt: Date
    admin: {
      id: string
      name: string | null
      email: string
      role: string
    }
  }>
  pagination: PaginationResponse
  summary: {
    byAction: Array<{
      action: string
      count: number
    }>
    byAdmin: Array<{
      adminId: string
      admin: {
        id: string
        name: string | null
        email: string
        role: string
      } | null
      activityCount: number
    }>
    trends: Array<{
      date: string
      count: number
    }>
  }
  permissions: {
    canViewAllActivities: boolean
  }
}

export interface AdminActionRequest {
  action: 'suspend' | 'activate' | 'change_role' | 'set_permissions' | 'reset_tokens' | 'adjust_tokens' | 'verify_email'
  reason?: string
  newRole?: 'user' | 'admin' | 'super_admin'
  permissions?: string[]
  tokensLimit?: number
}

export interface AdminActionResponse {
  success: boolean
  message: string
  user: {
    id: string
    email: string
    role: string
    subscriptionStatus: string
    tokensUsed: number
    tokensLimit: number
    emailVerified: Date | null
  }
}