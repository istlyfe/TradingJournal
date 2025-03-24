'use client';

import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Always render children without checking authentication
  return <>{children}</>;
}; 