import createIntlMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ar'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Always use locale prefix - this should handle redirects automatically
  localePrefix: 'always'
});

const authMiddleware = withAuth(
  // Note: this callback is only invoked if the `authorized` callback returns `true`
  function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Extract the pathname without locale prefix
        const pathname = req.nextUrl.pathname;
        const locale = pathname.split('/')[1];
        const pathWithoutLocale = pathname.replace(`/${locale}`, '');
        
        // Protected routes that require authentication
        const protectedRoutes = ['/dashboard', '/documents', '/profile', '/settings'];
        
        // Check if current path is protected
        const isProtectedRoute = protectedRoutes.some(route => 
          pathWithoutLocale.startsWith(route)
        );
        
        // Allow access if not a protected route or if user is authenticated
        return !isProtectedRoute || !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Always run intl middleware first to handle locale redirects
  const response = intlMiddleware(req);
  
  // If intl middleware returned a redirect, return it
  if (response && response.status >= 300 && response.status < 400) {
    return response;
  }
  
  // Check if pathname starts with a valid locale for auth checking
  const supportedLocales = ['en', 'ar'];
  const locale = pathname.split('/')[1];
  const hasValidLocale = supportedLocales.includes(locale);
  
  if (hasValidLocale) {
    // Extract path without locale for route checking
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    
    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/documents', '/profile', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route => 
      pathWithoutLocale.startsWith(route)
    );
    
    // Use auth middleware for protected routes
    if (isProtectedRoute) {
      return authMiddleware(req);
    }
  }
  
  // Return the intl middleware response for all other cases
  return response || intlMiddleware(req);
}

export const config = {
  // Match all pages except API routes, static files, and next internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};