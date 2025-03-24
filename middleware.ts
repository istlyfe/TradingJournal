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
  // Always continue with the request without checking auth
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