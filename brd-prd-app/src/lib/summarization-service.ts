import { GoogleGenerativeAI } from '@google/generative-ai'
import { countTokens, calculateMessageSplit, CONTEXT_CONFIG } from './token-utils'

interface Message {
  id: string
  role: string
  content: string
  createdAt: Date
  tokenCount?: number
}

interface SummarizationResult {
  summary: string
  originalTokens: number
  summaryTokens: number
  messageRange: string
  compressionRatio: number
}

interface ConversationContext {
  activeMessages: Message[]
  summaries: ConversationSummary[]
  totalActiveTokens: number
  needsSummarization: boolean
}

interface ConversationSummary {
  id: string
  summary: string
  originalTokens: number
  summaryTokens: number
  messageRange: string
  createdAt: Date
}

/**
 * Conversation Summarization Service
 * Handles intelligent summarization of long conversations using AI
 */
export class ConversationSummarizationService {
  private genAI: GoogleGenerativeAI
  
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for summarization service')
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  
  /**
   * Generate summary for a group of messages
   */
  async summarizeMessages(
    messages: Message[],
    projectContext?: {
      name: string
      industry?: string
      stage: string
    }
  ): Promise<SummarizationResult> {
    if (messages.length === 0) {
      throw new Error('No messages to summarize')
    }
    
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    // Calculate original token count
    const originalTokens = messages.reduce((total, msg) => 
      total + (msg.tokenCount || countTokens(msg.content)), 0
    )
    
    // Create context-aware prompt
    const systemPrompt = this.buildSummarizationPrompt(projectContext)
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n')
    
    const prompt = `${systemPrompt}\n\nConversation to summarize:\n${conversationText}`
    
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const summary = response.text()
      
      const summaryTokens = countTokens(summary)
      const compressionRatio = originalTokens > 0 ? summaryTokens / originalTokens : 0
      
      // Create message range description
      const startTime = messages[0]?.createdAt
      const endTime = messages[messages.length - 1]?.createdAt
      const messageRange = `Messages 1-${messages.length} (${this.formatDateRange(startTime, endTime)})`
      
      return {
        summary,
        originalTokens,
        summaryTokens,
        messageRange,
        compressionRatio
      }
      
    } catch (error) {
      console.error('Summarization error:', error)
      
      // Fallback: create simple summary
      return this.createFallbackSummary(messages)
    }
  }
  
  /**
   * Manage conversation context - decide what to keep vs summarize
   */
  async manageConversationContext(
    projectId: string,
    messages: Message[],
    userTier: 'FREE' | 'HOBBY' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE',
    existingSummaries: ConversationSummary[] = []
  ): Promise<ConversationContext> {
    // Calculate token split
    const { messagesToKeep, messagesToSummarize, keepTokens, summarizeTokens } = 
      calculateMessageSplit(messages, userTier)
    
    const needsSummarization = messagesToSummarize.length > 0
    
    let updatedSummaries = [...existingSummaries]
    
    // If we have messages to summarize, create a new summary
    if (needsSummarization) {
      try {
        const summaryResult = await this.summarizeMessages(messagesToSummarize)
        
        // Add the new summary to our collection
        const newSummary: ConversationSummary = {
          id: `summary_${Date.now()}`,
          summary: summaryResult.summary,
          originalTokens: summaryResult.originalTokens,
          summaryTokens: summaryResult.summaryTokens,
          messageRange: summaryResult.messageRange,
          createdAt: new Date()
        }
        
        updatedSummaries.push(newSummary)
        
      } catch (error) {
        console.error('Failed to create summary:', error)
        // Continue without summarization if AI fails
      }
    }
    
    return {
      activeMessages: messagesToKeep,
      summaries: updatedSummaries,
      totalActiveTokens: keepTokens,
      needsSummarization
    }
  }
  
  /**
   * Create context for AI that includes summaries + active messages
   */
  buildAIContext(context: ConversationContext): string {
    let fullContext = ''
    
    // Add summaries first (oldest to newest)
    if (context.summaries.length > 0) {
      fullContext += '=== CONVERSATION SUMMARY ===\n'
      fullContext += 'Previous conversation highlights:\n\n'
      
      context.summaries.forEach((summary, index) => {
        fullContext += `${index + 1}. ${summary.messageRange}:\n${summary.summary}\n\n`
      })
      
      fullContext += '=== RECENT CONVERSATION ===\n'
    }
    
    // Add active messages (oldest to newest)
    context.activeMessages.forEach(msg => {
      const speaker = msg.role === 'user' ? 'User' : 'AI Assistant'
      fullContext += `${speaker}: ${msg.content}\n\n`
    })
    
    return fullContext.trim()
  }
  
  /**
   * Get conversation stats for display
   */
  getContextStats(context: ConversationContext): {
    totalMessages: number
    activeMess�ages: number
    summaries: number
    totalTokens: number
    compressionSavings: number
  } {
    const summaryTokens = context.summaries.reduce((total, s) => total + s.summaryTokens, 0)
    const originalSummaryTokens = context.summaries.reduce((total, s) => total + s.originalTokens, 0)
    
    return {
      totalMessages: context.activeMessages.length + 
                    context.summaries.reduce((total, s) => {
                      // Estimate messages from range description
                      const match = s.messageRange.match(/Messages \d+-(\d+)/)
                      return total + (match ? parseInt(match[1]) : 0)
                    }, 0),
      activeMessages: context.activeMessages.length,
      summaries: context.summaries.length,
      totalTokens: context.totalActiveTokens + summaryTokens,
      compressionSavings: originalSummaryTokens - summaryTokens
    }
  }
  
  private buildSummarizationPrompt(projectContext?: {
    name: string
    industry?: string
    stage: string
  }): string {
    let prompt = `You are an AI assistant that creates concise, accurate summaries of business planning conversations. 

Your task is to summarize the key points, decisions, and progress from the conversation while preserving important context for future reference.

Focus on:
- Key business insights and decisions made
- Important questions asked and answered
- Requirements, features, and specifications discussed
- Any concerns or challenges identified
- Progress made toward goals

Keep the summary concise but comprehensive, aiming for ${CONTEXT_CONFIG.SUMMARY_TARGET_TOKENS} tokens or less.`

    if (projectContext) {
      prompt += `\n\nProject Context:
- Project Name: ${projectContext.name}
- Industry: ${projectContext.industry || 'Not specified'}
- Current Stage: ${projectContext.stage}

Focus your summary on progress relevant to this ${projectContext.industry || 'business'} project.`
    }
    
    return prompt
  }
  
  private createFallbackSummary(messages: Message[]): SummarizationResult {
    const originalTokens = messages.reduce((total, msg) => 
      total + (msg.tokenCount || countTokens(msg.content)), 0
    )
    
    // Simple extractive summary - take first and last messages
    const firstMsg = messages[0]
    const lastMsg = messages[messages.length - 1]
    
    let summary = `Conversation summary (${messages.length} messages):\n\n`
    
    if (firstMsg) {
      summary += `Started with: "${firstMsg.content.substring(0, 100)}..."\n\n`
    }
    
    if (lastMsg && lastMsg.id !== firstMsg?.id) {
      summary += `Recent: "${lastMsg.content.substring(0, 100)}..."\n\n`
    }
    
    summary += `Total messages exchanged: ${messages.length}`
    
    const summaryTokens = countTokens(summary)
    const startTime = messages[0]?.createdAt
    const endTime = messages[messages.length - 1]?.createdAt
    
    return {
      summary,
      originalTokens,
      summaryTokens,
      messageRange: `Messages 1-${messages.length} (${this.formatDateRange(startTime, endTime)})`,
      compressionRatio: summaryTokens / originalTokens
    }
  }
  
  private formatDateRange(start: Date, end: Date): string {
    if (!start || !end) return 'Unknown time range'
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    
    const startStr = start.toLocaleDateString('en-US', options)
    const endStr = end.toLocaleDateString('en-US', options)
    
    // If same day, just show time range
    if (start.toDateString() === end.toDateString()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    }
    
    return `${startStr} - ${endStr}`
  }
}