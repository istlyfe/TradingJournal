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
  // Get the pathname from the URL
  const path = request.nextUrl.pathname;
  
  // Check if the path is a protected API route
  const isApiRoute = path.startsWith('/api/');
  const isAuthRoute = path.startsWith('/api/auth');
  const isProtectedRoute = isApiRoute && !isAuthRoute;
  
  // Check if the path is a protected page
  const isProtectedPage = 
    path.startsWith('/dashboard') || 
    path.startsWith('/trades') || 
    path.startsWith('/journal') || 
    path.startsWith('/analytics') || 
    path.startsWith('/accounts') || 
    path.startsWith('/settings');

  // If it's not a protected route or page, continue
  if (!isProtectedRoute && !isProtectedPage) {
    return NextResponse.next();
  }

  // Get the token from the cookies
  const token = request.cookies.get('accessToken')?.value;

  // If there's no token, redirect to login
  if (!token) {
    // For API routes, return unauthorized
    if (isProtectedRoute) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the token
  const decoded = verifyToken(token);

  // If token is invalid, redirect to login
  if (!decoded) {
    // For API routes, return unauthorized
    if (isProtectedRoute) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Continue with the request
  return NextResponse.next();
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