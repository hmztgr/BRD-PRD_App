import { useEffect, useRef, useState } from 'react'

interface ApiRequestOptions {
  cacheTime?: number
  retryAttempts?: number
  retryDelay?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  error?: string
}

// Global cache to prevent duplicate requests across components
const requestCache = new Map<string, CacheEntry<any>>()
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Custom hook for API requests with deduplication and caching
 * Prevents multiple requests to same endpoint and caches responses
 */
export function useApiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
) {
  const {
    cacheTime = 5000, // 5 seconds default cache
    retryAttempts = 1,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Prevent duplicate requests in React StrictMode
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller

    const fetchData = async () => {
      // Return early if component is already unmounted
      if (controller.signal.aborted) {
        return
      }

      try {
        // Check cache first
        const cachedEntry = requestCache.get(url)
        if (cachedEntry && Date.now() - cachedEntry.timestamp < cacheTime) {
          if (!controller.signal.aborted) {
            console.log(`[API Cache] Using cached data for ${url}`)
            setData(cachedEntry.data)
            setLoading(false)
          }
          return
        }

        // Set loading state
        if (!controller.signal.aborted) {
          setLoading(true)
          setError(null)
        }

        // Check if request is already pending
        if (pendingRequests.has(url)) {
          console.log(`[API Dedup] Reusing pending request for ${url}`)
          const result = await pendingRequests.get(url)
          if (!controller.signal.aborted) {
            setData(result)
            setLoading(false)
          }
          return
        }

        // Create new request
        console.log(`[API Request] Making new request to ${url}`)
        const requestPromise = makeRequestWithRetry(url, controller.signal, retryAttempts, retryDelay)
        pendingRequests.set(url, requestPromise)

        const result = await requestPromise
        
        // Cache the result
        requestCache.set(url, {
          data: result,
          timestamp: Date.now()
        })

        // Remove from pending requests
        pendingRequests.delete(url)

        if (!controller.signal.aborted) {
          setData(result)
          setLoading(false)
        }

      } catch (err) {
        pendingRequests.delete(url)
        
        if (!controller.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Request failed'
          // Only log actual errors, not aborted requests
          if (errorMessage !== 'Request aborted') {
            console.error(`[API Error] ${url}:`, errorMessage)
          }
          setError(errorMessage)
          setLoading(false)
        }
      }
    }

    // Small delay to avoid race conditions in React StrictMode
    const timeoutId = setTimeout(fetchData, 10)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [url, cacheTime, retryAttempts, retryDelay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const refetch = () => {
    // Clear cache for this URL and refetch
    requestCache.delete(url)
    pendingRequests.delete(url)
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const requestPromise = makeRequestWithRetry(url, controller.signal, retryAttempts, retryDelay)
        const result = await requestPromise
        
        requestCache.set(url, {
          data: result,
          timestamp: Date.now()
        })

        if (!controller.signal.aborted) {
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Request failed'
          setError(errorMessage)
          setLoading(false)
        }
      }
    }

    fetchData()
  }

  return { data, loading, error, refetch }
}

async function makeRequestWithRetry(
  url: string,
  signal: AbortSignal,
  maxRetries: number,
  delay: number
): Promise<any> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { signal })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
      
    } catch (error) {
      lastError = error as Error
      
      // Don't retry if aborted
      if (signal.aborted) {
        throw new Error('Request aborted')
      }
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break
      }
      
      console.log(`[API Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Clear all cached requests (useful for logout or data refresh)
 */
export function clearApiCache() {
  requestCache.clear()
  pendingRequests.clear()
  console.log('[API Cache] Cleared all cached requests')
}

/**
 * Clear cache for specific URL
 */
export function clearApiCacheForUrl(url: string) {
  requestCache.delete(url)
  pendingRequests.delete(url)
  console.log(`[API Cache] Cleared cache for ${url}`)
}

/**
 * Get cache statistics for debugging
 */
export function getApiCacheStats() {
  return {
    cachedEntries: requestCache.size,
    pendingRequests: pendingRequests.size,
    cacheKeys: Array.from(requestCache.keys()),
    pendingKeys: Array.from(pendingRequests.keys())
  }
}