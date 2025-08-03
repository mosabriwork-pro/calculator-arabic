import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { cookies } from 'next/headers'

// Temporary hardcoded secret until env var loading is fixed
const APP_SECRET = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788'

function generateAccessCode(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  const hmac = crypto.createHmac('sha256', APP_SECRET)
  hmac.update(normalizedEmail)
  return hmac.digest('hex').substring(0, 8).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني ورمز الوصول مطلوبان' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    
    // Generate expected code
    const expectedCode = generateAccessCode(normalizedEmail)
    
    // Compare codes case-insensitively
    if (code.trim().toUpperCase() !== expectedCode) {
      return NextResponse.json(
        { error: 'رمز الوصول غير صحيح' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { email: normalizedEmail },
      APP_SECRET,
      { expiresIn: '30d' }
    )

    // Set HttpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
} 