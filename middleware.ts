import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

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

export default withAuth(
  function middleware(req: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (isPublicRoute(path)) return true;
        return !!token;
      },
    },
    pages: { signIn: '/login' },
  }
);

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trades/:path*',
    '/journal/:path*',
    '/analytics/:path*',
    '/accounts/:path*',
    '/settings/:path*',
  ],
}; 