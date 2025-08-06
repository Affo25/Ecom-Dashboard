'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../app/login/page';
import AdminLayout from '../components/AdminLayout';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Wait for auth context to finish loading
    if (isLoading) {
      return;
    }

    // Stop checking once we have the auth status
    setIsChecking(false);

    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router]);

  // Show loading screen while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-indigo-600 rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-2">Authenticating...</div>
          <div className="text-sm text-gray-600">Please wait while we verify your credentials</div>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page without any layout
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If authenticated, show the protected content with admin layout (sidebar, header, footer)
  return <AdminLayout>{children}</AdminLayout>;
};

export default AuthGuard;