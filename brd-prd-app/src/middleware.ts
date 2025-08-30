import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const pathname = request.nextUrl.pathname
  
  // Create response
  const response = NextResponse.next()
  
  // Set CSP headers based on environment
  const isDev = process.env.NODE_ENV === 'development'
  
  // Development CSP - more permissive to allow hot reloading and dev tools
  const devCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-scripts.com *.vercel.app localhost:* ws: wss:",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com data:",
    "img-src 'self' data: blob: *.googleapis.com *.vercel.app",
    "connect-src 'self' *.openai.com *.googleapis.com vitals.vercel-insights.com *.supabase.co ws: wss: localhost:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
  
  // Production CSP - strict security without unsafe-eval
  const prodCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' *.vercel-scripts.com *.vercel.app",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com data:",
    "img-src 'self' data: blob: *.googleapis.com *.vercel.app",
    "connect-src 'self' *.openai.com *.googleapis.com vitals.vercel-insights.com *.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
  
  // Apply appropriate CSP
  const csp = isDev ? devCSP : prodCSP
  
  // Set security headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Additional security headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }
  
  return response
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api/auth (auth routes should not be subject to CSP restrictions)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}