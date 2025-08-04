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

  // Verify credentials first
  const EMAIL_USER = process.env.EMAIL_USER
  const EMAIL_PASS = process.env.EMAIL_PASS

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('Missing environment variables: { EMAIL_USER: false, EMAIL_PASS: false }')
    throw new Error('Email configuration missing')
  }

  // Create new transporter with optimized settings
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Limit concurrent connections
    maxMessages: 100, // Messages per connection
    rateLimit: 10, // Messages per second
    socketTimeout: 30000, // 30 seconds
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000, // 30 seconds
    debug: false, // Disable debug in production
    logger: false // Disable logger in production
  })

  // Verify connection
  try {
    await transporter.verify()
    console.log('SMTP connection verified successfully')
    lastTransporterCheck = now
  } catch (error) {
    console.error('SMTP verification failed:', error)
    transporter = null
    throw error
  }

  return transporter
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

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { email } = await request.json()
    
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
    
    console.log(`Email request from IP: ${ip}`)

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ 
        success: false, 
        error: 'تم تجاوز الحد المسموح. يرجى الانتظار دقيقة واحدة قبل المحاولة مرة أخرى' 
      }, { status: 429 })
    }

    // Generate access code
    const accessCode = generateAccessCode(email)

    // Get transporter
    const transporter = await getTransporter()

    // Prepare email content
    const emailContent = `
      <div style="
        background: linear-gradient(135deg, #1a472a 0%, #0f2e1a 50%, #0a1f12 100%);
        color: white;
        font-family: Arial, sans-serif;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        direction: rtl;
      ">
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #fbbf24;
        ">⚽ حاسبة موصبري المتقدمة</div>
        
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 25px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          خطتك الغذائية الاحترافية كلاعب كرة قدم
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          مرحباً بك في حاسبة موصبري المتقدمة للتغذية الرياضية
        </p>
        
        <div style="
          background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.2) 100%);
          padding: 25px;
          border-radius: 15px;
          border: 2px solid rgba(34,197,94,0.3);
          margin-bottom: 30px;
        ">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #22c55e;">كيفية الدخول</h2>
          <div style="text-align: right; font-size: 14px; line-height: 1.8;">
            <div style="margin-bottom: 10px;">1️⃣ اذهب إلى <a href="http://localhost:3000/login" style="color: #22c55e; text-decoration: none; font-weight: bold;">صفحة تسجيل الدخول</a></div>
            <div style="margin-bottom: 10px;">2️⃣ أدخل بريدك الإلكتروني: <strong>${email}</strong></div>
            <div style="margin-bottom: 10px;">3️⃣ أدخل رمز الوصول: <strong style="font-size: 18px; color: #fbbf24;">${accessCode}</strong></div>
            <div style="margin-bottom: 10px;">4️⃣ اضغط "تسجيل الدخول" واستمتع بخطتك الغذائية المخصصة</div>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.2) 100%);
          padding: 20px;
          border-radius: 15px;
          border: 2px solid rgba(59,130,246,0.3);
          margin-bottom: 30px;
        ">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #3b82f6;">مميزات حاسبة موصبري</h3>
          <div style="text-align: right; font-size: 13px; line-height: 1.6;">
            <div style="margin-bottom: 5px;">• حسابات دقيقة بناءً على عمرك ووزنك وطولك</div>
            <div style="margin-bottom: 5px;">• خطط غذائية مخصصة لثلاثة أهداف مختلفة</div>
            <div style="margin-bottom: 5px;">• توصيات خاصة بمركزك في الملعب</div>
            <div style="margin-bottom: 5px;">• تقرير PDF شامل ومفصل</div>
          </div>
        </div>
        
        <div style="
          background: rgba(255,255,255,0.05);
          padding: 15px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          color: #9ca3af;
        ">
          تم إرسال هذه الرسالة من فريق دعم موصبري
        </div>
      </div>
    `

    // Send email with optimized settings
    const mailOptions = {
      from: `"حاسبة موصبري" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'رمز الوصول - حاسبة موصبري المتقدمة',
      html: emailContent,
      priority: 'high' as const
    }

    await transporter.sendMail(mailOptions)

    // Record customer activity
    const today = new Date()
    
    // دالة لتحويل الأرقام الإنجليزية إلى العربية
    const convertToArabicNumbers = (num: number): string => {
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
      return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('')
    }
    
    // تاريخ بداية الاشتراك (اليوم الحالي)
    const month = today.getMonth() + 1
    const day = today.getDate()
    const year = today.getFullYear()
    const subscriptionStart = `${convertToArabicNumbers(day).padStart(2, '٠')}/${convertToArabicNumbers(month).padStart(2, '٠')}/${convertToArabicNumbers(year)}`
    
    // تاريخ نهاية الاشتراك (بعد سنة)
    const subscriptionEnd = new Date(today)
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1)
    const endMonth = subscriptionEnd.getMonth() + 1
    const endDay = subscriptionEnd.getDate()
    const endYear = subscriptionEnd.getFullYear()
    const subscriptionEndFormatted = `${convertToArabicNumbers(endDay).padStart(2, '٠')}/${convertToArabicNumbers(endMonth).padStart(2, '٠')}/${convertToArabicNumbers(endYear)}`
    
    saveCustomer(email, {
      lastActivity: new Date().toLocaleString('ar-SA'),
      lastUpdated: new Date().toISOString(),
      accessCodeSent: true,
      accessCode: accessCode,
      email,
      subscriptionStart: subscriptionStart,
      subscriptionEnd: subscriptionEndFormatted,
      isExpired: false
    })

    const duration = Date.now() - startTime
    
    console.log(`Email sent successfully to ${email} in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز الوصول بنجاح',
      accessCode,
      duration
    })

  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('Email sending error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى',
      duration
    }, { status: 500 })
  }
} 