import createIntlMiddleware from 'next-intl/middleware';
import { withAuth } from 'next-auth/middleware';
import { NextRequest } from 'next/server';
import { adminMiddleware, ADMIN_ROUTES } from '@/lib/admin-middleware';

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
      signIn: '/en/auth/signin',
    },
  }
);

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Check if pathname starts with a valid locale for auth checking
  const supportedLocales = ['en', 'ar'];
  const locale = pathname.split('/')[1];
  const hasValidLocale = supportedLocales.includes(locale);
  
  if (hasValidLocale) {
    // Extract path without locale for route checking
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    
    // Check for admin routes first
    const isAdminRoute = pathWithoutLocale.startsWith('/admin');
    if (isAdminRoute) {
      // Find the specific admin route and its required permission
      const adminRoute = Object.values(ADMIN_ROUTES).find(route => 
        pathWithoutLocale.startsWith(route.path)
      );
      
      const requiredPermission = adminRoute?.permission;
      const adminAuthResult = await adminMiddleware(req, requiredPermission);
      
      if (adminAuthResult) {
        return adminAuthResult;
      }
      
      // If admin auth passes, still apply intl middleware for locale handling
      return intlMiddleware(req);
    }
    
    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/documents', '/profile', '/settings'];
    const isProtectedRoute = protectedRoutes.some(route => 
      pathWithoutLocale.startsWith(route)
    );
    
    // Use auth middleware for protected routes
    if (isProtectedRoute) {
      return (authMiddleware as any)(req);
    }
  }
  
  // For all other cases, use intl middleware
  return intlMiddleware(req);
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