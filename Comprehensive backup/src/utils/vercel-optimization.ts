// Vercel-specific optimizations for better performance
import { NextRequest } from 'next/server'

// Vercel environment detection
export const isVercel = process.env.VERCEL === '1'
export const isProduction = process.env.NODE_ENV === 'production'

// Vercel-specific timeout settings
export const VERCEL_TIMEOUT = 8000 // 8 seconds (safe margin from 10s limit)
export const VERCEL_MEMORY_LIMIT = 1024 * 1024 * 1024 // 1GB

// Memory usage monitoring for Vercel
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    }
  }
  return null
}

// Check if we're approaching Vercel limits
export function checkVercelLimits() {
  const memory = getMemoryUsage()
  if (!memory) return { safe: true, warnings: [] }

  const warnings = []
  let safe = true

  // Memory warnings
  if (memory.heapUsed > 800) { // 800MB
    warnings.push('High memory usage detected')
    safe = false
  }

  if (memory.rss > 900) { // 900MB
    warnings.push('Approaching Vercel memory limit')
    safe = false
  }

  return { safe, warnings, memory }
}

// Optimized email sending for Vercel
export async function sendEmailOptimized(email: string, accessCode: string) {
  const startTime = Date.now()
  
  // Check memory before sending
  const memoryCheck = checkVercelLimits()
  if (!memoryCheck.safe) {
    console.warn('Memory warnings before email send:', memoryCheck.warnings)
  }

  try {
    // Use a more Vercel-friendly approach
    const emailService = {
      // For Vercel, consider using external services like:
      // - SendGrid
      // - Resend
      // - Mailgun
      // Instead of direct SMTP
      
      // For now, we'll optimize the existing SMTP approach
      timeout: VERCEL_TIMEOUT,
      retries: 2,
      pool: true,
      maxConnections: 3, // Reduced for Vercel
      rateLimit: 5 // Reduced for Vercel
    }

    // Simulate email sending with timeout protection
    const emailPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Email timeout - Vercel limit reached'))
      }, VERCEL_TIMEOUT)

      // Your existing email logic here
      // This is a placeholder - replace with actual email sending
      setTimeout(() => {
        clearTimeout(timeout)
        resolve({ success: true, email, accessCode })
      }, 1000) // Simulated 1 second
    })

    const result = await emailPromise
    const duration = Date.now() - startTime

    return {
      success: true,
      duration,
      memory: getMemoryUsage()
    }

  } catch (error) {
    const duration = Date.now() - startTime
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      memory: getMemoryUsage()
    }
  }
}

// Request optimization for Vercel
export function optimizeRequest(request: NextRequest) {
  return {
    // Add Vercel-specific headers
    headers: {
      'x-vercel-deployment': process.env.VERCEL_DEPLOYMENT_ID || 'local',
      'x-vercel-environment': process.env.VERCEL_ENV || 'development',
      'x-memory-usage': JSON.stringify(getMemoryUsage())
    },
    
    // Optimize for Vercel's cold starts
    warmup: isVercel && !isProduction,
    
    // Add timeout protection
    timeout: VERCEL_TIMEOUT
  }
}

// Performance monitoring for Vercel
export class VercelPerformanceMonitor {
  private static instance: VercelPerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): VercelPerformanceMonitor {
    if (!VercelPerformanceMonitor.instance) {
      VercelPerformanceMonitor.instance = new VercelPerformanceMonitor()
    }
    return VercelPerformanceMonitor.instance
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)

    // Keep only last 100 values
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift()
    }
  }

  getMetrics() {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((values, name) => {
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      result[name] = {
        average: Math.round(avg),
        min: Math.round(min),
        max: Math.round(max),
        count: values.length
      }
    })

    return result
  }

  getVercelHealth() {
    const memory = getMemoryUsage()
    const metrics = this.getMetrics()
    
    return {
      memory,
      metrics,
      limits: checkVercelLimits(),
      environment: {
        isVercel,
        isProduction,
        timeout: VERCEL_TIMEOUT,
        memoryLimit: VERCEL_MEMORY_LIMIT
      }
    }
  }
}

// Export singleton instance
export const vercelMonitor = VercelPerformanceMonitor.getInstance() 