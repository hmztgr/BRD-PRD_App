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