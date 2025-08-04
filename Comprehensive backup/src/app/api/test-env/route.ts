import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      
      // المتغيرات الأساسية
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      
      // متغيرات الدومين
      domain: process.env.NEXT_PUBLIC_DOMAIN,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      
      // متغيرات الأمان
      customKey: process.env.CUSTOM_KEY ? '✅ موجود' : '❌ غير موجود',
      
      // متغيرات البريد الإلكتروني
      emailHost: process.env.EMAIL_HOST,
      emailPort: process.env.EMAIL_PORT,
      emailUser: process.env.EMAIL_USER ? '✅ موجود' : '❌ غير موجود',
      emailPass: process.env.EMAIL_PASS ? '✅ موجود' : '❌ غير موجود',
      emailFrom: process.env.EMAIL_FROM,
      
      // متغيرات إضافية
      appName: process.env.NEXT_PUBLIC_APP_NAME,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      
      // قاعدة البيانات
      databaseUrl: process.env.DATABASE_URL ? '✅ موجود' : '❌ غير موجود',
      
      // معلومات النظام
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 