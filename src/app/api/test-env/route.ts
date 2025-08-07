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

    // Test database connection
    let databaseConnection = false
    let databaseError = null
    try {
      if (databaseUrl) {
        const { Client } = require('pg')
        const client = new Client({ connectionString: databaseUrl })
        await client.connect()
        await client.query('SELECT NOW()')
        await client.end()
        databaseConnection = true
      }
    } catch (error: any) {
      databaseError = error.message
    }

    // Check all required variables
    const requiredVariables = {
      EMAIL_USER: emailUser ? 'SET' : 'MISSING',
      EMAIL_PASS: emailPass ? 'SET' : 'MISSING',
      APP_SECRET: appSecret ? 'SET' : 'MISSING',
      DATABASE_URL: databaseUrl ? 'SET' : 'MISSING',
      ADMIN_PASSWORD: adminPassword ? 'SET' : 'MISSING',
      NODE_ENV: nodeEnv || 'development',
      PORT: port || '3000',
      NEXT_PUBLIC_DOMAIN: domain || 'NOT_SET'
    }

    const missingVariables = Object.entries(requiredVariables)
      .filter(([key, value]) => value === 'MISSING')
      .map(([key]) => key)

    const systemStatus = {
      email: emailConfigComplete ? 'READY' : 'NOT_CONFIGURED',
      database: databaseConnection ? 'CONNECTED' : 'NOT_CONNECTED',
      nodemailer: nodemailerAvailable ? 'AVAILABLE' : 'NOT_AVAILABLE',
      overall: emailConfigComplete && databaseConnection && nodemailerAvailable ? 'HEALTHY' : 'ISSUES_DETECTED'
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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
      databaseConfiguration: {
        isConnected: databaseConnection,
        error: databaseError
      },
      systemStatus,
      missingVariables,
      recommendations: {
        ifEmailConfigIncomplete: 'يرجى إضافة EMAIL_USER و EMAIL_PASS في متغيرات البيئة على Railway',
        ifNodemailerNotAvailable: 'يرجى تثبيت nodemailer: npm install nodemailer @types/nodemailer',
        ifDatabaseNotConnected: 'يرجى التحقق من DATABASE_URL في متغيرات البيئة',
        ifVariablesMissing: `المتغيرات المفقودة: ${missingVariables.join(', ')}`
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 