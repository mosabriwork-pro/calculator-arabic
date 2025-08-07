import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const appSecret = process.env.APP_SECRET
    const databaseUrl = process.env.DATABASE_URL
    const adminPassword = process.env.ADMIN_PASSWORD
    const nodeEnv = process.env.NODE_ENV
    const port = process.env.PORT
    const domain = process.env.NEXT_PUBLIC_DOMAIN

    // Check if email configuration is complete
    const emailConfigComplete = !!(emailUser && emailPass)
    const emailUserLength = emailUser ? emailUser.length : 0
    const emailPassLength = emailPass ? emailPass.length : 0

    // Test nodemailer import
    let nodemailerAvailable = false
    let nodemailerError = null
    try {
      const nodemailer = require('nodemailer')
      nodemailerAvailable = true
    } catch (error: any) {
      nodemailerError = error.message
    }

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: nodeEnv,
        PORT: port,
        NEXT_PUBLIC_DOMAIN: domain,
        EMAIL_USER: emailUser ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1]}` : 'NOT_SET',
        EMAIL_PASS: emailPass ? `${emailPass.substring(0, 3)}***` : 'NOT_SET',
        APP_SECRET: appSecret ? 'SET' : 'NOT_SET',
        DATABASE_URL: databaseUrl ? 'SET' : 'NOT_SET',
        ADMIN_PASSWORD: adminPassword ? 'SET' : 'NOT_SET'
      },
      emailConfiguration: {
        isComplete: emailConfigComplete,
        userLength: emailUserLength,
        passLength: emailPassLength,
        nodemailerAvailable,
        nodemailerError
      },
      recommendations: {
        ifEmailConfigIncomplete: 'يرجى إضافة EMAIL_USER و EMAIL_PASS في متغيرات البيئة على Railway',
        ifNodemailerNotAvailable: 'يرجى تثبيت nodemailer: npm install nodemailer @types/nodemailer'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 