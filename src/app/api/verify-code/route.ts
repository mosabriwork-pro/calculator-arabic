import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Cache for verification results
const verificationCache = new Map<string, { isValid: boolean; timestamp: number }>()
const VERIFICATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Customer database file path
const CUSTOMERS_FILE_PATH = path.join(process.cwd(), 'data', 'customers.json')

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load customers from persistent storage
const loadCustomers = (): Record<string, any> => {
  try {
    ensureDataDirectory()
    if (fs.existsSync(CUSTOMERS_FILE_PATH)) {
      const data = fs.readFileSync(CUSTOMERS_FILE_PATH, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading customers:', error)
  }
  return {}
}

// Save customers to persistent storage
const saveCustomer = (email: string, customerData: any) => {
  try {
    ensureDataDirectory()
    const customers = loadCustomers()
    
    // Update or add customer
    customers[email] = {
      ...customers[email],
      ...customerData,
      email,
      lastActivity: new Date().toLocaleString('ar-SA'),
      lastUpdated: new Date().toISOString()
    }
    
    // If this is a new customer, set registration date
    if (!customers[email].registrationDate) {
      customers[email].registrationDate = new Date().toLocaleString('ar-SA')
      customers[email].usageCount = 0
      customers[email].status = 'active'
    }
    
    // Increment usage count for successful login
    customers[email].usageCount = (customers[email].usageCount || 0) + 1
    
    fs.writeFileSync(CUSTOMERS_FILE_PATH, JSON.stringify(customers, null, 2))
    console.log(`Customer data saved for: ${email}`)
  } catch (error) {
    console.error('Error saving customer:', error)
  }
}

// Load permanent codes from file
const loadPermanentCodes = (): Record<string, string> => {
  try {
    const codesFilePath = path.join(process.cwd(), 'data', 'permanent-codes.json')
    
    if (fs.existsSync(codesFilePath)) {
      const data = fs.readFileSync(codesFilePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading permanent codes:', error)
  }
  return {}
}

// Pre-defined permanent access codes for specific emails (fallback)
const FALLBACK_CODES = new Map<string, string>([
  ['aassaassaaee.2001@icloud.com', 'BE24EC7A'],
  ['talal200265@gmail.com', '556ED13B'],
])

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 verifications per minute per IP

// Clean up old cache entries periodically (but keep verification results permanent)
setInterval(() => {
  const now = Date.now()
  
  // Don't clean verification cache - keep results permanent
  // verificationCache.forEach((record, key) => {
  //   if ((now - record.timestamp) > VERIFICATION_CACHE_DURATION) {
  //     verificationCache.delete(key)
  //   }
  // })
  
  // Clean rate limit cache
  rateLimitCache.forEach((record, ip) => {
    if (now > record.resetTime) {
      rateLimitCache.delete(ip)
    }
  })
}, 60 * 1000) // Clean every minute

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitCache.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// Generate expected code for verification
function generateExpectedCode(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  
  // Load permanent codes from file first
  const permanentCodes = loadPermanentCodes()
  const permanentCode = permanentCodes[normalizedEmail]
  
  if (permanentCode) {
    return permanentCode
  }
  
  // Check fallback codes
  const fallbackCode = FALLBACK_CODES.get(normalizedEmail)
  if (fallbackCode) {
    return fallbackCode
  }
  
  // Generate code using HMAC
  const APP_SECRET = process.env.APP_SECRET || 'mosabri-calculator-secret-key-2024'
  const hmac = crypto.createHmac('sha256', APP_SECRET)
  hmac.update(normalizedEmail)
  return hmac.digest('hex').substring(0, 8).toUpperCase()
}

// Verify code with permanent caching
function verifyCode(email: string, code: string): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  const cacheKey = `${normalizedEmail}:${code}`
  
  // Check cache first - permanent cache
  const cached = verificationCache.get(cacheKey)
  if (cached) {
    return cached.isValid
  }

  // Generate expected code
  const expectedCode = generateExpectedCode(email)
  const isValid = code === expectedCode

  // Cache the result permanently (no expiration)
  verificationCache.set(cacheKey, {
    isValid,
    timestamp: Date.now()
  })

  return isValid
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { email, code } = await request.json()
    
    if (!email || !code) {
      return NextResponse.json({ 
        success: false, 
        error: 'البريد الإلكتروني والرمز مطلوبان' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'صيغة البريد الإلكتروني غير صحيحة' 
      }, { status: 400 })
    }

    // Validate code format
    if (!/^[A-F0-9]{8}$/.test(code)) {
      return NextResponse.json({ 
        success: false, 
        error: 'صيغة الرمز غير صحيحة' 
      }, { status: 400 })
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    console.log(`Verification request from IP: ${ip}`)

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ 
        success: false, 
        error: 'تم تجاوز الحد المسموح. يرجى الانتظار دقيقة واحدة قبل المحاولة مرة أخرى' 
      }, { status: 429 })
    }

    // Verify the code
    const isValid = verifyCode(email, code)

    const duration = Date.now() - startTime
    
    console.log(`Code verification for ${email}: ${isValid ? 'valid' : 'invalid'} in ${duration}ms`)

    if (isValid) {
      // Record successful login to persistent storage
      saveCustomer(email, { 
        lastLogin: new Date().toLocaleString('ar-SA')
      })
      return NextResponse.json({
        success: true,
        isValid: true,
        message: 'تم التحقق من الرمز بنجاح',
        duration
      })
    } else {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: 'الرمز غير صحيح',
        duration
      }, { status: 401 })
    }

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('Code verification error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في التحقق من الرمز. يرجى المحاولة مرة أخرى',
      duration
    }, { status: 500 })
  }
} 