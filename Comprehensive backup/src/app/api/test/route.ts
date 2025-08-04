import { NextResponse } from 'next/server'

export async function GET() {
  const APP_SECRET = process.env.APP_SECRET
  
  if (!APP_SECRET) {
    return NextResponse.json({ 
      error: 'APP_SECRET not found',
      envVars: Object.keys(process.env).filter(key => key.includes('APP'))
    })
  }
  
  return NextResponse.json({ 
    success: true,
    secretLength: APP_SECRET.length,
    secretStart: APP_SECRET.substring(0, 8) + '...'
  })
} 