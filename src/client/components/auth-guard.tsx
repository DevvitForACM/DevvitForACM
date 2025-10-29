import React, { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoading(false);
    };

    const initAuth = async () => {
      const currentUser = await authService.checkAuthStatus();

      if (!currentUser?.isAuthenticated) {
        try {
          await authService.startAuthentication();
        } catch (error) {
          console.error('Auto-authentication failed:', error);
          setIsLoading(false);
        }
      }
    };

    authService.onAuthChange(handleAuthChange);
    initAuth();

    return () => {
      authService.removeAuthListener(handleAuthChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
