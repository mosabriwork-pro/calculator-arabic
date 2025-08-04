// Performance optimization utilities

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache for calculations
const calculationCache = new Map<string, { result: any; timestamp: number; ttl: number }>()

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

// Clean up old cache entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  
  // Clean API cache
  apiCache.forEach((value, key) => {
    if ((now - value.timestamp) > value.ttl) {
      apiCache.delete(key)
    }
  })
  
  // Clean calculation cache
  calculationCache.forEach((value, key) => {
    if ((now - value.timestamp) > value.ttl) {
      calculationCache.delete(key)
    }
  })
  
  // Clean rate limit cache
  rateLimitCache.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitCache.delete(key)
    }
  })
}, 5 * 60 * 1000)

// API caching function
export function cacheApiResponse(key: string, data: any, ttl: number = 5 * 60 * 1000) {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// Get cached API response
export function getCachedApiResponse(key: string): any | null {
  const cached = apiCache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if ((now - cached.timestamp) > cached.ttl) {
    apiCache.delete(key)
    return null
  }
  
  return cached.data
}

// Calculation caching function
export function cacheCalculation(key: string, result: any, ttl: number = 10 * 60 * 1000) {
  calculationCache.set(key, {
    result,
    timestamp: Date.now(),
    ttl
  })
}

// Get cached calculation
export function getCachedCalculation(key: string): any | null {
  const cached = calculationCache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if ((now - cached.timestamp) > cached.ttl) {
    calculationCache.delete(key)
    return null
  }
  
  return cached.result
}

// Rate limiting function
export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitCache.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitCache.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Performance measurement utility
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`)
  return result
}

// Async performance measurement utility
export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`)
  return result
}

// Memory usage utility
export function getMemoryUsage(): { used: number; total: number; percentage: number } {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
    }
  }
  
  return { used: 0, total: 0, percentage: 0 }
}

// Cache statistics
export function getCacheStats() {
  return {
    apiCacheSize: apiCache.size,
    calculationCacheSize: calculationCache.size,
    rateLimitCacheSize: rateLimitCache.size,
    memoryUsage: getMemoryUsage()
  }
} 