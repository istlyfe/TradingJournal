import { NextRequest, NextResponse } from 'next/server';

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
  const { pathname } = request.nextUrl;
  
  // Check for auth cookie/token
  const isAuthenticated = request.cookies.has('isAuthenticated');
  
  // Allow access to public routes regardless of auth status
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated) {
    // Create a URL for the login page
    const loginUrl = new URL('/login', request.url);
    
    // Redirect unauthenticated users to login
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public image files)
     * - fonts/ (public font files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
}; 