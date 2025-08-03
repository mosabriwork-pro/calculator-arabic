import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Path to the permanent codes file
const CODES_FILE_PATH = path.join(process.cwd(), 'data', 'permanent-codes.json')

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(CODES_FILE_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load permanent codes from file
const loadPermanentCodes = (): Record<string, string> => {
  try {
    ensureDataDirectory()
    if (fs.existsSync(CODES_FILE_PATH)) {
      const data = fs.readFileSync(CODES_FILE_PATH, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading permanent codes:', error)
  }
  return {}
}

// Save permanent codes to file
const savePermanentCodes = (codes: Record<string, string>) => {
  try {
    ensureDataDirectory()
    fs.writeFileSync(CODES_FILE_PATH, JSON.stringify(codes, null, 2))
    return true
  } catch (error) {
    console.error('Error saving permanent codes:', error)
    return false
  }
}

// GET - Retrieve all permanent codes
export async function GET() {
  try {
    const codes = loadPermanentCodes()
    return NextResponse.json({
      success: true,
      codes,
      count: Object.keys(codes).length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'خطأ في تحميل الرموز الثابتة'
    }, { status: 500 })
  }
}

// POST - Add new permanent code
export async function POST(request: NextRequest) {
  try {
    const { email, code, adminPassword } = await request.json()
    
    // Verify admin password
    if (adminPassword !== 'admin123') {
      return NextResponse.json({
        success: false,
        error: 'كلمة مرور المدير غير صحيحة'
      }, { status: 401 })
    }
    
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
    
    // Validate code format (8 characters, alphanumeric)
    if (!/^[A-F0-9]{8}$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: 'الرمز يجب أن يكون 8 أحرف (أرقام وحروف كبيرة)'
      }, { status: 400 })
    }
    
    const normalizedEmail = email.trim().toLowerCase()
    const codes = loadPermanentCodes()
    
    // Check if email already exists
    if (codes[normalizedEmail]) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني موجود بالفعل'
      }, { status: 409 })
    }
    
    // Add new code
    codes[normalizedEmail] = code
    
    // Save to file
    if (savePermanentCodes(codes)) {
      return NextResponse.json({
        success: true,
        message: 'تم إضافة الرمز الثابت بنجاح',
        email: normalizedEmail,
        code,
        totalCodes: Object.keys(codes).length
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'خطأ في حفظ الرمز'
      }, { status: 500 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'خطأ في إضافة الرمز'
    }, { status: 500 })
  }
}

// DELETE - Remove permanent code
export async function DELETE(request: NextRequest) {
  try {
    const { email, adminPassword } = await request.json()
    
    // Verify admin password
    if (adminPassword !== 'admin123') {
      return NextResponse.json({
        success: false,
        error: 'كلمة مرور المدير غير صحيحة'
      }, { status: 401 })
    }
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني مطلوب'
      }, { status: 400 })
    }
    
    const normalizedEmail = email.trim().toLowerCase()
    const codes = loadPermanentCodes()
    
    if (!codes[normalizedEmail]) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني غير موجود'
      }, { status: 404 })
    }
    
    // Remove code
    delete codes[normalizedEmail]
    
    // Save to file
    if (savePermanentCodes(codes)) {
      return NextResponse.json({
        success: true,
        message: 'تم حذف الرمز الثابت بنجاح',
        email: normalizedEmail,
        totalCodes: Object.keys(codes).length
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'خطأ في حذف الرمز'
      }, { status: 500 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'خطأ في حذف الرمز'
    }, { status: 500 })
  }
} 