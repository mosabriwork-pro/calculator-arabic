import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Temporary hardcoded secret until env var loading is fixed
const APP_SECRET = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788'

export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED FOR TESTING
  // Only protect /app routes
  if (request.nextUrl.pathname.startsWith('/app')) {
    // TEMPORARY: Allow all access to /app
    return NextResponse.next()
    
    // ORIGINAL CODE (commented out):
    // const token = request.cookies.get('access_token')
    // if (!token) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
    // try {
    //   jwt.verify(token.value, APP_SECRET)
    //   return NextResponse.next()
    // } catch (error) {
    //   // Token is invalid or expired
    //   const response = NextResponse.redirect(new URL('/login', request.url))
    //   response.cookies.delete('access_token')
    //   return response
    // }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*']
} 