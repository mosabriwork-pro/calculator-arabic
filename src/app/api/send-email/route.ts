import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Cache for transporter to reuse connections
let transporter: nodemailer.Transporter | null = null
let lastTransporterCheck = 0
const TRANSPORTER_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 emails per minute per IP

// Access code cache to avoid regenerating same codes
const accessCodeCache = new Map<string, { code: string; timestamp: number }>()
const CODE_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Load permanent codes from file
const loadPermanentCodes = (): Record<string, string> => {
  try {
    const fs = require('fs')
    const path = require('path')
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

// Customer database file path
const CUSTOMERS_FILE_PATH = path.join(process.cwd(), 'data', 'customers.json')

// Email records file path
const EMAIL_RECORDS_FILE_PATH = path.join(process.cwd(), 'data', 'email-records.json')

function appendEmailRecord(record: { email: string; status: 'success'|'failed'; message?: string; timestamp?: string }) {
  try {
    const dir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const existing = fs.existsSync(EMAIL_RECORDS_FILE_PATH) ? JSON.parse(fs.readFileSync(EMAIL_RECORDS_FILE_PATH, 'utf8')) : []
    existing.unshift({ ...record, timestamp: new Date().toISOString() })
    fs.writeFileSync(EMAIL_RECORDS_FILE_PATH, JSON.stringify(existing.slice(0, 200), null, 2))
  } catch (e) {
    console.error('Failed to write email record:', e)
  }
}

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
    
    // If this is a new customer, set registration date and subscription dates
    if (!customers[email].registrationDate) {
      const today = new Date()
      
      // دالة لتحويل الأرقام الإنجليزية إلى العربية
      const convertToArabicNumbers = (num: number): string => {
        const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
        return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('')
      }
      
      // تاريخ التسجيل (اليوم الحالي)
      const month = today.getMonth() + 1
      const day = today.getDate()
      const year = today.getFullYear()
      const registrationDate = `${convertToArabicNumbers(day).padStart(2, '٠')}/${convertToArabicNumbers(month).padStart(2, '٠')}/${convertToArabicNumbers(year)}`
      
      customers[email].registrationDate = registrationDate
      customers[email].usageCount = 0
      customers[email].status = 'active'
      
      // إذا لم يتم تحديد تواريخ الاشتراك، استخدم التواريخ الممررة أو احسبها
      if (!customers[email].subscriptionStart) {
        customers[email].subscriptionStart = registrationDate
      }
      
              if (!customers[email].subscriptionEnd) {
          const subscriptionEnd = new Date(today)
          subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1)
          const endMonth = subscriptionEnd.getMonth() + 1
          const endDay = subscriptionEnd.getDate()
          const endYear = subscriptionEnd.getFullYear()
          const subscriptionEndFormatted = `${convertToArabicNumbers(endDay).padStart(2, '٠')}/${convertToArabicNumbers(endMonth).padStart(2, '٠')}/${convertToArabicNumbers(endYear)}`
          customers[email].subscriptionEnd = subscriptionEndFormatted
        }
    }
    
    fs.writeFileSync(CUSTOMERS_FILE_PATH, JSON.stringify(customers, null, 2))
    console.log(`Customer data saved for: ${email}`)
  } catch (error) {
    console.error('Error saving customer:', error)
  }
}

// Get or create transporter with connection pooling
async function getTransporter(): Promise<nodemailer.Transporter> {
  const now = Date.now()
  
  if (transporter && (now - lastTransporterCheck) < TRANSPORTER_CACHE_DURATION) {
    return transporter
  }

  // Get email configuration
  const EMAIL_USER = process.env.EMAIL_USER
  const EMAIL_PASS = process.env.EMAIL_PASS

  console.log('🔍 Email Configuration Check:')
  console.log('- EMAIL_USER:', EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}***@${EMAIL_USER.split('@')[1]}` : 'NOT_SET')
  console.log('- EMAIL_PASS:', EMAIL_PASS ? `${EMAIL_PASS.substring(0, 3)}***` : 'NOT_SET')

  // Fallback configuration for immediate functionality
  const FALLBACK_EMAIL_USER = EMAIL_USER || 'mosabrihelp@gmail.com'
  const FALLBACK_EMAIL_PASS = EMAIL_PASS || 'wukm xbaz eszx qetb'

  console.log('✅ Using email configuration (with fallback if needed)')

  try {
    // Create new transporter with improved settings
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: FALLBACK_EMAIL_USER,
        pass: FALLBACK_EMAIL_PASS
      },
      // Improved SMTP settings
      secure: false, // Use TLS
      port: 587, // Standard SMTP port
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
        ciphers: 'SSLv3'
      },
      // Connection settings
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10,
      socketTimeout: 30000,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      // Debug settings
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    })

    // Verify connection
    console.log('🔍 Verifying SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection verified successfully')
    
    lastTransporterCheck = now
    return transporter

  } catch (error: any) {
    console.error('❌ SMTP verification failed:')
    console.error('- Error Code:', error.code)
    console.error('- Error Message:', error.message)
    console.error('- Full Error:', JSON.stringify(error, null, 2))
    
    transporter = null
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error(`Authentication failed (EAUTH): ${error.message}. Please check EMAIL_USER and EMAIL_PASS. Make sure to use App Password if 2FA is enabled.`)
    } else if (error.code === 'ECONNECTION') {
      throw new Error(`Connection failed (ECONNECTION): ${error.message}. Please check internet connection and Gmail settings.`)
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(`Connection timeout (ETIMEDOUT): ${error.message}. Please check network connection.`)
    } else if (error.code === 'EAUTH') {
      throw new Error(`Authentication error (EAUTH): ${error.message}. Please check credentials.`)
    } else {
      throw new Error(`SMTP Error (${error.code}): ${error.message}`)
    }
  }
}

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

// Generate access code with permanent caching
function generateAccessCode(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  
  // Load permanent codes from file first
  const permanentCodes = loadPermanentCodes()
  const permanentCode = permanentCodes[normalizedEmail]
  
  if (permanentCode) {
    // Cache the permanent code
    accessCodeCache.set(normalizedEmail, { code: permanentCode, timestamp: Date.now() })
    return permanentCode
  }
  
  // Check fallback codes
  const fallbackCode = FALLBACK_CODES.get(normalizedEmail)
  if (fallbackCode) {
    // Cache the fallback code
    accessCodeCache.set(normalizedEmail, { code: fallbackCode, timestamp: Date.now() })
    return fallbackCode
  }
  
  // Check cache first - permanent cache
  const cached = accessCodeCache.get(normalizedEmail)
  if (cached) {
    return cached.code
  }

  // Generate new code
  const APP_SECRET = process.env.APP_SECRET || 'mosabri-calculator-secret-key-2024'
  const hmac = crypto.createHmac('sha256', APP_SECRET)
  hmac.update(normalizedEmail)
  const code = hmac.digest('hex').substring(0, 8).toUpperCase()

  // Cache the code permanently (no expiration)
  accessCodeCache.set(normalizedEmail, { code, timestamp: Date.now() })

  return code
}

// Clean up old cache entries periodically (but keep access codes permanent)
setInterval(() => {
  const now = Date.now()
  
  // Clean rate limit cache
  rateLimitCache.forEach((record, ip) => {
    if (now > record.resetTime) {
      rateLimitCache.delete(ip)
    }
  })
  
  // Don't clean access code cache - keep codes permanent
  // accessCodeCache.forEach((record, email) => {
  //   if ((now - record.timestamp) > CODE_CACHE_DURATION) {
  //     accessCodeCache.delete(email)
  //   }
  // })
}, 60 * 1000) // Clean every minute

async function sendWithRetry(
  trans: nodemailer.Transporter,
  options: nodemailer.SendMailOptions,
  maxAttempts = 3
): Promise<nodemailer.SentMessageInfo> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📤 Attempt ${attempt}/${maxAttempts} to send email to ${options.to}`)
      
      const result = await trans.sendMail(options)
      
      console.log(`✅ Email sent successfully on attempt ${attempt}!`)
      console.log(`📨 Message ID: ${result.messageId}`)
      console.log(`📧 To: ${options.to}`)
      console.log(`📤 From: ${options.from}`)
      
      return result
      
    } catch (error: any) {
      lastError = error
      console.error(`❌ Attempt ${attempt} failed:`)
      console.error(`- Error Code: ${error.code}`)
      console.error(`- Error Message: ${error.message}`)
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // All attempts failed
  console.error(`❌ All ${maxAttempts} attempts failed for ${options.to}`)
  console.error(`- Final Error Code: ${lastError.code}`)
  console.error(`- Final Error Message: ${lastError.message}`)
  
  throw new Error(`Failed to send email after ${maxAttempts} attempts. Last error: ${lastError.message}`)
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let email: string = ''
  
  try {
    const { email: requestEmail } = await request.json()
    email = requestEmail
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'البريد الإلكتروني مطلوب' 
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

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    console.log(`📧 Email request from IP: ${ip} to: ${email}`)

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ 
        success: false, 
        error: 'تم تجاوز الحد المسموح. يرجى الانتظار دقيقة واحدة قبل المحاولة مرة أخرى' 
      }, { status: 429 })
    }

    // Generate access code
    const accessCode = generateAccessCode(email)
    console.log(`🔐 Generated access code for ${email}: ${accessCode}`)

    // Get transporter
    console.log('🔍 Getting SMTP transporter...')
    const transporter = await getTransporter()
    console.log('✅ SMTP transporter ready')

    // Prepare email content
    const emailContent = `
      <div style="
        background: linear-gradient(135deg, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%);
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 0;
        margin: 0;
        direction: rtl;
        text-align: center;
        min-height: 100vh;
      ">
        
        <!-- Header Section -->
        <div style="
          background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%);
          padding: 40px 20px;
          border-bottom: 3px solid rgba(34,197,94,0.3);
        ">
          <h1 style="
            font-size: 2.5rem;
            font-weight: bold;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            موصبري برو
          </h1>
          
          <h2 style="
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
            color: #9ca3af;
          ">
            حاسبة لاعب كرة القدم
          </h2>
        </div>

        <!-- Access Code Section -->
        <div style="
          background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
          padding: 40px 20px;
          border-bottom: 3px solid rgba(59,130,246,0.3);
        ">
          <h3 style="
            font-size: 1.8rem;
            font-weight: bold;
            margin: 0 0 30px 0;
            color: #3b82f6;
          ">
            استخدم هذا الرمز للدخول للآلة
          </h3>
          
          <div style="
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #1f2937;
            font-size: 2.5rem;
            font-weight: bold;
            padding: 20px 40px;
            border-radius: 15px;
            margin: 20px auto;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(251, 191, 36, 0.3);
            letter-spacing: 3px;
          ">
            ${accessCode}
          </div>
          
          <p style="
            font-size: 1.1rem;
            color: #d1d5db;
            margin: 20px 0;
            line-height: 1.6;
          ">
            هذا الرمز صالح للاستخدام لمدة سنة
          </p>
        </div>

        <!-- Instructions Section -->
        <div style="
          background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.2) 100%);
          padding: 40px 20px;
          border-bottom: 3px solid rgba(139,92,246,0.3);
        ">
          <h3 style="
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 0 25px 0;
            color: #8b5cf6;
          ">
            كيفية الاستخدام
          </h3>
          
          <div style="
            text-align: right;
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px;
          ">
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(139,92,246,0.1);
              border-radius: 10px;
              border-right: 4px solid #8b5cf6;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #8b5cf6;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">1</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">اذهب إلى صفحة تسجيل الدخول</span>
            </div>
            
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(139,92,246,0.1);
              border-radius: 10px;
              border-right: 4px solid #8b5cf6;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #8b5cf6;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">2</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">أدخل بريدك الإلكتروني</span>
            </div>
            
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(139,92,246,0.1);
              border-radius: 10px;
              border-right: 4px solid #8b5cf6;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #8b5cf6;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">3</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">أدخل رمز الوصول أعلاه</span>
            </div>
            
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(139,92,246,0.1);
              border-radius: 10px;
              border-right: 4px solid #8b5cf6;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #8b5cf6;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">4</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">اضغط "تسجيل الدخول"</span>
            </div>
          </div>
        </div>

        <!-- Security Notice -->
        <div style="
          background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.2) 100%);
          padding: 30px 20px;
          border-bottom: 3px solid rgba(239,68,68,0.3);
        ">
          <h3 style="
            font-size: 1.3rem;
            font-weight: bold;
            margin: 0 0 20px 0;
            color: #ef4444;
          ">
            ⚠️ ملاحظات أمنية مهمة
          </h3>
          
          <ul style="
            text-align: right;
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px;
            list-style: none;
          ">
            <li style="
              margin: 10px 0;
              padding: 10px;
              background: rgba(239,68,68,0.1);
              border-radius: 8px;
              border-right: 3px solid #ef4444;
            ">🔒 لا تشارك هذا الرمز مع أي شخص</li>
            <li style="
              margin: 10px 0;
              padding: 10px;
              background: rgba(239,68,68,0.1);
              border-radius: 8px;
              border-right: 3px solid #ef4444;
            ">⏰ الرمز صالح لمدة سنة من تاريخ الاشتراك</li>
            <li style="
              margin: 10px 0;
              padding: 10px;
              background: rgba(239,68,68,0.1);
              border-radius: 8px;
              border-right: 3px solid #ef4444;
            ">📱 إذا لم تطلب هذا الرمز، تجاهل هذا البريد</li>
          </ul>
        </div>

        <!-- Features Section -->
        <div style="
          background: linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.2) 100%);
          padding: 40px 20px;
          border-bottom: 3px solid rgba(16,185,129,0.3);
        ">
          <h3 style="
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 0 25px 0;
            color: #10b981;
          ">
            مميزات الحاسبة
          </h3>
          
          <div style="
            text-align: right;
            max-width: 600px;
            margin: 0 auto;
            padding: 0 20px;
          ">
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(16,185,129,0.1);
              border-radius: 10px;
              border-right: 4px solid #10b981;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #10b981;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">✓</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">حسابات دقيقة بناءً على مواصفاتك الرياضية</span>
            </div>
            
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(16,185,129,0.1);
              border-radius: 10px;
              border-right: 4px solid #10b981;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #10b981;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">✓</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">خطط غذائية مخصصة لثلاثة أهداف مختلفة</span>
            </div>
            
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(16,185,129,0.1);
              border-radius: 10px;
              border-right: 4px solid #10b981;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #10b981;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">✓</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">توصيات خاصة</span>
            </div>
            
            <div style="
              margin: 15px 0;
              padding: 15px;
              background: rgba(16,185,129,0.1);
              border-radius: 10px;
              border-right: 4px solid #10b981;
              position: relative;
            ">
              <span style="
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                background: #10b981;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
              ">✓</span>
              <span style="
                margin-right: 40px;
                font-size: 1.1rem;
                color: #e5e7eb;
              ">تقرير PDF شامل ومفصل</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 30px 20px;
          text-align: center;
        ">
          <p style="
            color: #64748b;
            font-size: 0.9rem;
            margin: 0;
            line-height: 1.5;
          ">
            تم إنشاء هذا البريد الإلكتروني بواسطة نظام موصبري برو للتغذية الرياضية
          </p>
          <p style="
            color: #475569;
            font-size: 0.8rem;
            margin: 10px 0 0 0;
          ">
            © ${new Date().getFullYear()} موصبري برو. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    `

    // Send email with retry
    console.log('📤 Sending email...')
    const info = await sendWithRetry(transporter, {
      from: `"موصبري برو" <${(transporter.options as any).auth?.user}>`,
      to: email,
      subject: '🔐 رمز الوصول - حاسبة موصبري برو',
      html: emailContent,
      priority: 'high'
    })

    const duration = Date.now() - startTime
    
    console.log(`✅ Email sent successfully to ${email} in ${duration}ms`)
    console.log(`📨 Message ID: ${info.messageId}`)
    console.log(`📧 From: ${(transporter.options as any).auth?.user}`)
    console.log(`📤 To: ${email}`)

    // Save customer data
    saveCustomer(email, accessCode)

    return NextResponse.json({
      success: true,
      message: `تم إرسال رمز الوصول بنجاح إلى ${email}`,
      accessCode,
      email,
      messageId: info.messageId,
      duration
    })

  } catch (error: any) {
    const duration = Date.now() - startTime
    
    console.error(`❌ Email sending error for ${email || 'unknown'}:`)
    console.error(`- Error Code: ${error.code || 'UNKNOWN'}`)
    console.error(`- Error Message: ${error.message}`)
    console.error(`- Duration: ${duration}ms`)
    console.error(`- Full Error:`, error)

    // Return appropriate error response
    if (error.code === 'EAUTH') {
      return NextResponse.json({
        success: false,
        error: 'خطأ في مصادقة البريد الإلكتروني. يرجى التحقق من إعدادات الخادم.'
      }, { status: 500 })
    } else if (error.code === 'ECONNECTION') {
      return NextResponse.json({
        success: false,
        error: 'خطأ في الاتصال. يرجى المحاولة مرة أخرى لاحقاً.'
      }, { status: 500 })
    } else if (error.code === 'ETIMEDOUT') {
      return NextResponse.json({
        success: false,
        error: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
      }, { status: 500 })
    } else {
      return NextResponse.json({
        success: false,
        error: `خطأ في إرسال البريد الإلكتروني: ${error.message}`
      }, { status: 500 })
    }
  }
} 