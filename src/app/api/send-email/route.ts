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
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>رمز الوصول - حاسبة موصبري برو</title>
        <style>
          /* Reset styles for email clients */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333 !important;
            background-color: #ffffff !important;
            direction: rtl;
            padding: 20px;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #ffffff !important;
            padding: 30px 20px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #ffffff !important;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
            color: #ffffff !important;
          }
          
          .content {
            padding: 30px 20px;
            background-color: #ffffff;
          }
          
          .code-section {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          
          .access-code {
            font-size: 32px;
            font-weight: bold;
            color: #1a472a !important;
            letter-spacing: 2px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          
          .validity-info {
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          
          .validity-info p {
            color: #1976d2 !important;
            font-weight: 600;
            margin: 0;
          }
          
          .instructions {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .instructions h3 {
            color: #1a472a !important;
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
          }
          
          .step {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .step-number {
            background-color: #22c55e;
            color: #ffffff !important;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            flex-shrink: 0;
          }
          
          .step-text {
            color: #333333 !important;
            font-size: 16px;
            flex: 1;
          }
          
          .login-link {
            color: #2563eb !important;
            text-decoration: underline;
            font-weight: 600;
          }
          
          .features {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .features h3 {
            color: #0c4a6e !important;
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
          }
          
          .feature-list {
            list-style: none;
            padding: 0;
          }
          
          .feature-list li {
            color: #0c4a6e !important;
            padding: 8px 0;
            padding-right: 25px;
            position: relative;
          }
          
          .feature-list li:before {
            content: "•";
            color: #0ea5e9;
            font-weight: bold;
            font-size: 20px;
            position: absolute;
            right: 0;
            top: 5px;
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer p {
            color: #6c757d !important;
            font-size: 14px;
            margin: 0;
          }
          
          /* Mobile responsive */
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .container {
              margin: 0;
            }
            
            .header {
              padding: 20px 15px;
            }
            
            .content {
              padding: 20px 15px;
            }
            
            .access-code {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 رمز الوصول</h1>
            <p>مرحباً بك في حاسبة موصبري برو للتغذية الرياضية</p>
          </div>
          
          <div class="content">
            <div class="code-section">
              <h2 style="color: #1a472a !important; margin-bottom: 15px;">رمز الوصول الخاص بك</h2>
              <div class="access-code">${accessCode}</div>
              <p style="color: #6c757d !important; font-size: 14px;">استخدم هذا الرمز لتسجيل الدخول إلى الحاسبة</p>
            </div>
            
            <div class="validity-info">
              <p>⏰ الرمز صالح لمدة سنة من تاريخ الاشتراك</p>
            </div>
            
            <div class="instructions">
              <h3>كيفية الاستخدام</h3>
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-text">
                  <a href="https://calculator-arabic.railway.app/login" class="login-link">اذهب إلى صفحة تسجيل الدخول</a>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-text">أدخل بريدك الإلكتروني</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-text">أدخل رمز الوصول أعلاه</div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div class="step-text">اضغط "تسجيل الدخول"</div>
              </div>
            </div>
            
            <div class="features">
              <h3>مميزات الحاسبة</h3>
              <ul class="feature-list">
                <li>حسابات دقيقة بناءً على مواصفاتك الرياضية</li>
                <li>خطط غذائية مخصصة لثلاثة أهداف مختلفة</li>
                <li>توصيات خاصة</li>
                <li>تقرير PDF شامل ومفصل</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>تم إرسال هذا البريد بواسطة نظام موصبري برو للتغذية الرياضية</p>
            <p>إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد</p>
          </div>
        </div>
      </body>
      </html>
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