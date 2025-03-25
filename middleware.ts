import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Define routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

// Check if a path matches any of the public routes
const isPublicRoute = (path: string) => {
  return publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
};

export function middleware(request: NextRequest) {
  // Bypass all authentication for now
  return NextResponse.next();
  
  /* Authentication disabled for testing
  const path = request.nextUrl.pathname;
  
  // Allow public routes without authentication
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }
  
  // Skip auth checking for API routes during development
  if (process.env.NODE_ENV === 'development' && path.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for access token
  const accessToken = request.cookies.get('accessToken')?.value;
  
  // If no token and not on a public route, redirect to login
  if (!accessToken && !isPublicRoute(path)) {
    // Store the original URL to redirect back after login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }
  
  // Continue with request if token exists
  return NextResponse.next();
  */
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trades/:path*',
    '/journal/:path*',
    '/analytics/:path*',
    '/accounts/:path*',
    '/settings/:path*',
    '/api/:path*',
  ],
}; 