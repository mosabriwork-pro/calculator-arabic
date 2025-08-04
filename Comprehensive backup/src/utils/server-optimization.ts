// Server optimization utilities for high user loads

import { NextRequest } from 'next/server'

// Connection pooling for database-like operations
class ConnectionPool {
  private connections: any[] = []
  private maxConnections: number
  private inUse: Set<any> = new Set()

  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections
  }

  async getConnection(): Promise<any> {
    // Return existing available connection
    const available = this.connections.find(conn => !this.inUse.has(conn))
    if (available) {
      this.inUse.add(available)
      return available
    }

    // Create new connection if under limit
    if (this.connections.length < this.maxConnections) {
      const newConnection = await this.createConnection()
      this.connections.push(newConnection)
      this.inUse.add(newConnection)
      return newConnection
    }

    // Wait for connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.connections.find(conn => !this.inUse.has(conn))
        if (available) {
          clearInterval(checkInterval)
          this.inUse.add(available)
          resolve(available)
        }
      }, 100)
    })
  }

  releaseConnection(connection: any): void {
    this.inUse.delete(connection)
  }

  private async createConnection(): Promise<any> {
    // Simulate connection creation
    return new Promise(resolve => {
      setTimeout(() => resolve({ id: Date.now() }), 50)
    })
  }
}

// Global connection pool
export const connectionPool = new ConnectionPool(20)

// Request queue for high load management
class RequestQueue {
  private queue: Array<{ id: string; priority: number; execute: () => Promise<any> }> = []
  private processing = false
  private maxConcurrent = 5
  private activeRequests = 0

  async add<T>(
    id: string,
    priority: number,
    execute: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        priority,
        execute: async () => {
          try {
            const result = await execute()
            resolve(result)
            return result
          } catch (error) {
            reject(error)
            throw error
          }
        }
      })

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return
    }

    this.processing = true

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority)
      
      const request = this.queue.shift()
      if (request) {
        this.activeRequests++
        
        request.execute().finally(() => {
          this.activeRequests--
          this.processQueue()
        })
      }
    }

    this.processing = false
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    }
  }
}

// Global request queue
export const requestQueue = new RequestQueue()

// Enhanced rate limiting with IP tracking
class EnhancedRateLimiter {
  private limits = new Map<string, { count: number; resetTime: number; blocked: boolean }>()
  private blockedIPs = new Set<string>()

  checkLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60 * 1000,
    blockDuration: number = 5 * 60 * 1000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    
    // Check if IP is blocked
    if (this.blockedIPs.has(identifier)) {
      return { allowed: false, remaining: 0, resetTime: now + blockDuration }
    }

    const record = this.limits.get(identifier)

    if (!record || now > record.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
        blocked: false
      })
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }

    if (record.count >= maxRequests) {
      // Block the IP temporarily
      record.blocked = true
      this.blockedIPs.add(identifier)
      
      // Remove from blocked list after block duration
      setTimeout(() => {
        this.blockedIPs.delete(identifier)
        const currentRecord = this.limits.get(identifier)
        if (currentRecord) {
          currentRecord.blocked = false
        }
      }, blockDuration)

      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
  }

  getStats() {
    return {
      activeLimits: this.limits.size,
      blockedIPs: this.blockedIPs.size
    }
  }
}

// Global rate limiter
export const enhancedRateLimiter = new EnhancedRateLimiter()

// Request context for tracking
export interface RequestContext {
  id: string
  ip: string
  startTime: number
  userAgent: string
  priority: number
}

// Extract request context
export function extractRequestContext(request: NextRequest): RequestContext {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return {
    id: `${ip}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ip,
    startTime: Date.now(),
    userAgent,
    priority: 1 // Default priority
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number; minTime: number; maxTime: number }> = new Map()

  recordMetric(name: string, duration: number): void {
    const existing = this.metrics.get(name)
    
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.avgTime = existing.totalTime / existing.count
      existing.minTime = Math.min(existing.minTime, duration)
      existing.maxTime = Math.max(existing.maxTime, duration)
    } else {
      this.metrics.set(name, {
        count: 1,
        totalTime: duration,
        avgTime: duration,
        minTime: duration,
        maxTime: duration
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

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// Memory management utilities
export function getServerMemoryUsage(): { used: number; total: number; percentage: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage()
    return {
      used: Math.round(memory.heapUsed / 1024 / 1024),
      total: Math.round(memory.heapTotal / 1024 / 1024),
      percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
    }
  }
  
  return { used: 0, total: 0, percentage: 0 }
}

// System health check
export function getSystemHealth() {
  return {
    memory: getServerMemoryUsage(),
    requestQueue: requestQueue.getStats(),
    rateLimiter: enhancedRateLimiter.getStats(),
    performance: performanceMonitor.getMetrics()
  }
}

// Optimized request handler wrapper
export function withOptimization<T>(
  handler: (request: NextRequest, context: RequestContext) => Promise<T>,
  options: {
    priority?: number
    useQueue?: boolean
    useConnectionPool?: boolean
    rateLimit?: { maxRequests: number; windowMs: number }
  } = {}
) {
  return async (request: NextRequest): Promise<T> => {
    const context = extractRequestContext(request)
    context.priority = options.priority || 1

    // Check rate limit
    if (options.rateLimit) {
      const rateLimitResult = enhancedRateLimiter.checkLimit(
        context.ip,
        options.rateLimit.maxRequests,
        options.rateLimit.windowMs
      )
      
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.resetTime / 1000)} seconds.`)
      }
    }

    const startTime = Date.now()

    try {
      let result: T

      if (options.useQueue) {
        // Use request queue for high load
        result = await requestQueue.add(
          context.id,
          context.priority,
          async () => {
            if (options.useConnectionPool) {
              const connection = await connectionPool.getConnection()
              try {
                return await handler(request, context)
              } finally {
                connectionPool.releaseConnection(connection)
              }
            } else {
              return await handler(request, context)
            }
          }
        )
      } else {
        // Direct execution
        if (options.useConnectionPool) {
          const connection = await connectionPool.getConnection()
          try {
            result = await handler(request, context)
          } finally {
            connectionPool.releaseConnection(connection)
          }
        } else {
          result = await handler(request, context)
        }
      }

      const duration = Date.now() - startTime
      performanceMonitor.recordMetric(handler.name || 'unknown', duration)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      performanceMonitor.recordMetric(`${handler.name || 'unknown'}_error`, duration)
      throw error
    }
  }
} 