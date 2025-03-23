'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, refreshAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if on a public route
    const isPublicRoute = ['/login', '/signup', '/forgot-password'].includes(pathname);
    
    // If not a public route and not authenticated, redirect to login
    if (!loading && !user && !isPublicRoute) {
      // Try to refresh token first
      const attemptRefresh = async () => {
        const refreshed = await refreshAuth();
        if (!refreshed) {
          // If refresh fails, redirect to login
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      };
      
      attemptRefresh();
    }
  }, [user, loading, pathname, router, refreshAuth]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if on a protected route and user is not authenticated
  const isPublicRoute = ['/login', '/signup', '/forgot-password'].includes(pathname);
  if (!isPublicRoute && !user) {
    // Return null or a minimal loading state while redirecting
    return null;
  }

  // If authenticated or on a public route, render children
  return <>{children}</>;
}; 