import { encoding_for_model } from 'tiktoken'

// Token limits based on user tier
export const TIER_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxActiveTokens: 4000,
    summarizeThreshold: 3000
  },
  HOBBY: {
    maxProjects: 10,
    maxActiveTokens: 6000,
    summarizeThreshold: 4500
  },
  PROFESSIONAL: {
    maxProjects: 20,
    maxActiveTokens: 8000,
    summarizeThreshold: 6000
  },
  BUSINESS: {
    maxProjects: 50,
    maxActiveTokens: 12000,
    summarizeThreshold: 9000
  },
  ENTERPRISE: {
    maxProjects: 999,
    maxActiveTokens: 16000,
    summarizeThreshold: 12000
  }
}

// Context management configuration
export const CONTEXT_CONFIG = {
  MIN_MESSAGES_TO_KEEP: 10,      // Always keep last 10 messages
  SUMMARY_TARGET_TOKENS: 1500,   // Target tokens for summary
  BUFFER_TOKENS: 500,            // Buffer to avoid frequent summarization
  DEFAULT_MODEL: 'gpt-3.5-turbo' as const
}

/**
 * Count tokens in text using tiktoken for accurate GPT model token counting
 */
export function countTokens(text: string, model: string = CONTEXT_CONFIG.DEFAULT_MODEL): number {
  try {
    const encoder = encoding_for_model(model as any)
    const tokens = encoder.encode(text)
    encoder.free() // Clean up memory
    return tokens.length
  } catch (error) {
    console.error('Token counting error:', error)
    // Fallback: rough estimation (1 token ≈ 4 characters for English text)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Count tokens for multiple messages
 */
export function countMessagesTokens(messages: Array<{content: string, role: string}>): number {
  return messages.reduce((total, message) => {
    // Add extra tokens for role and formatting (ChatML format overhead)
    const contentTokens = countTokens(message.content)
    const roleTokens = countTokens(message.role) + 4 // <|im_start|>, role, <|im_end|> overhead
    return total + contentTokens + roleTokens
  }, 0)
}

/**
 * Determine if conversation needs summarization based on token count
 */
export function shouldSummarize(
  totalTokens: number,
  userTier: keyof typeof TIER_LIMITS,
  messageCount: number
): boolean {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS.FREE
  
  // Never summarize if we have fewer than minimum messages
  if (messageCount <= CONTEXT_CONFIG.MIN_MESSAGES_TO_KEEP) {
    return false
  }
  
  // Summarize if we exceed the threshold
  return totalTokens >= limits.summarizeThreshold
}

/**
 * Calculate how many messages to keep vs summarize
 */
export function calculateMessageSplit(
  messages: Array<{content: string, role: string, id: string}>,
  userTier: keyof typeof TIER_LIMITS
): {
  messagesToKeep: Array<{content: string, role: string, id: string}>,
  messagesToSummarize: Array<{content: string, role: string, id: string}>,
  keepTokens: number,
  summarizeTokens: number
} {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS.FREE
  const maxActiveTokens = limits.maxActiveTokens
  
  let keepTokens = 0
  const messagesToKeep: Array<{content: string, role: string, id: string}> = []
  const messagesToSummarize: Array<{content: string, role: string, id: string}> = []
  
  // Work backwards from newest messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const messageTokens = countTokens(message.content) + countTokens(message.role) + 4
    
    // Keep message if:
    // 1. We haven't reached token limit
    // 2. OR we haven't kept minimum messages yet
    if (keepTokens + messageTokens <= maxActiveTokens || 
        messagesToKeep.length < CONTEXT_CONFIG.MIN_MESSAGES_TO_KEEP) {
      messagesToKeep.unshift(message)
      keepTokens += messageTokens
    } else {
      // Add to summarize pile
      messagesToSummarize.unshift(message)
    }
  }
  
  const summarizeTokens = countMessagesTokens(messagesToSummarize)
  
  return {
    messagesToKeep,
    messagesToSummarize,
    keepTokens,
    summarizeTokens
  }
}

/**
 * Estimate token savings from summarization
 */
export function estimateTokenSavings(
  originalTokens: number,
  targetSummaryTokens: number = CONTEXT_CONFIG.SUMMARY_TARGET_TOKENS
): {
  savedTokens: number,
  compressionRatio: number,
  estimatedCostSaving: number // Rough USD estimate
} {
  const savedTokens = Math.max(0, originalTokens - targetSummaryTokens)
  const compressionRatio = originalTokens > 0 ? targetSummaryTokens / originalTokens : 0
  
  // Rough cost estimation (GPT-3.5-turbo pricing: ~$0.0015 per 1K tokens)
  const estimatedCostSaving = (savedTokens / 1000) * 0.0015
  
  return {
    savedTokens,
    compressionRatio,
    estimatedCostSaving
  }
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`
  } else if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`
  } else {
    return `${(tokens / 1000000).toFixed(1)}M tokens`
  }
}

/**
 * Get token usage percentage for progress bars
 */
export function getTokenUsagePercentage(
  usedTokens: number,
  userTier: keyof typeof TIER_LIMITS
): number {
  const limits = TIER_LIMITS[userTier] || TIER_LIMITS.FREE
  return Math.min(100, (usedTokens / limits.maxActiveTokens) * 100)
}

/**
 * Check if user is approaching token limits
 */
export function getTokenUsageStatus(
  usedTokens: number,
  userTier: keyof typeof TIER_LIMITS
): 'safe' | 'warning' | 'critical' {
  const percentage = getTokenUsagePercentage(usedTokens, userTier)
  
  if (percentage >= 90) return 'critical'
  if (percentage >= 75) return 'warning'
  return 'safe'
}