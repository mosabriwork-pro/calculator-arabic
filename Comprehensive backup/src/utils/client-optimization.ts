// Client-side optimization utilities

// Image optimization
export function optimizeImageUrl(url: string, width: number = 800, quality: number = 80): string {
  // Add image optimization parameters
  const params = new URLSearchParams()
  params.append('w', width.toString())
  params.append('q', quality.toString())
  params.append('f', 'auto') // Auto format
  params.append('fit', 'max') // Maintain aspect ratio
  
  return `${url}?${params.toString()}`
}

// Lazy loading utility
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  options: { threshold?: number; rootMargin?: string } = {}
): () => Promise<T> {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  return async (): Promise<T> => {
    if (cached) return cached
    if (loading) return loading

    loading = loader()
    cached = await loading
    loading = null

    return cached
  }
}

// Virtual scrolling utility
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export interface VirtualScrollResult {
  startIndex: number
  endIndex: number
  offsetY: number
  totalHeight: number
}

export function calculateVirtualScroll(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5 } = options
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    totalHeight: totalItems * itemHeight
  }
}

// Debounce utility with TypeScript support
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// Throttle utility with TypeScript support
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

// Memory management
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

// Performance monitoring
export class PerformanceTracker {
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()

  startTimer(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }

  recordMetric(name: string, duration: number): void {
    const existing = this.metrics.get(name)
    
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.avgTime = existing.totalTime / existing.count
    } else {
      this.metrics.set(name, {
        count: 1,
        totalTime: duration,
        avgTime: duration
      })
    }
  }

  getMetrics() {
    const result: any = {}
    this.metrics.forEach((value, key) => {
      result[key] = {
        ...value,
        avgTime: Math.round(value.avgTime * 100) / 100
      }
    })
    return result
  }

  reset(): void {
    this.metrics.clear()
  }
}

// Global performance tracker
export const performanceTracker = new PerformanceTracker()

// Resource preloading
export function preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    } else if (type === 'script') {
      const script = document.createElement('script')
      script.onload = () => resolve()
      script.onerror = reject
      script.src = url
      document.head.appendChild(script)
    } else if (type === 'style') {
      const link = document.createElement('link')
      link.onload = () => resolve()
      link.onerror = reject
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    }
  })
}

// Intersection Observer utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  })
}

// Resize Observer utility
export function createResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void
): ResizeObserver {
  return new ResizeObserver(callback)
}

// Network status monitoring
export class NetworkMonitor {
  private isOnline: boolean = navigator.onLine
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    window.addEventListener('online', () => this.updateStatus(true))
    window.addEventListener('offline', () => this.updateStatus(false))
  }

  private updateStatus(online: boolean): void {
    this.isOnline = online
    this.listeners.forEach(listener => listener(online))
  }

  addListener(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getStatus(): boolean {
    return this.isOnline
  }
}

// Global network monitor
export const networkMonitor = new NetworkMonitor()

// Cache management
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if ((now - cached.timestamp) > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  getSize(): number {
    return this.cache.size
  }
}

// Global cache manager
export const cacheManager = new CacheManager()

// Auto-cleanup cache every 5 minutes
setInterval(() => {
  cacheManager.clear() // Use public method instead of accessing private cache
}, 5 * 60 * 1000)

// Bundle size optimization
export function createCodeSplittingLoader<T>(
  importFn: () => Promise<T>,
  fallback?: T
): () => Promise<T> {
  let cached: T | null = null
  let loading: Promise<T> | null = null

  return async (): Promise<T> => {
    if (cached) return cached
    if (loading) return loading

    try {
      loading = importFn()
      cached = await loading
      loading = null
      return cached
    } catch (error) {
      loading = null
      if (fallback) return fallback
      throw error
    }
  }
}

// Performance optimization for React components
export function withPerformanceTracking<T extends React.ComponentType<any>>(
  Component: T,
  name?: string
): T {
  const displayName = name || Component.displayName || Component.name || 'Unknown'
  
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const startTime = performance.now()
    
    React.useEffect(() => {
      const duration = performance.now() - startTime
      performanceTracker.recordMetric(`${displayName}_render`, duration)
    })
    
    return React.createElement(Component, { ...props, ref })
  })
  
  WrappedComponent.displayName = `withPerformanceTracking(${displayName})`
  
  return WrappedComponent as unknown as T
}

// Export React for the HOC
import React from 'react' 