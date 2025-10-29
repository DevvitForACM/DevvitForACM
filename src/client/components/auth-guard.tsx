import React, { useState, useEffect } from 'react';
import { authService, UserProfile } from '@/services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const handleAuthChange = (u: UserProfile | null) => {
      setUser(u);
      setIsLoading(false);
    };

    const initAuth = async () => {
      const currentUser = await authService.checkAuthStatus();
      setUser(currentUser);

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

  return (
    <div className="relative">
      <AuthGuardContent user={user}>{children}</AuthGuardContent>
    </div>
  );
}

// Component that hides profile bar on specific routes
function AuthGuardContent({
  user,
  children,
}: {
  user: UserProfile | null;
  children: React.ReactNode;
}) {
  void user;
  return (
    <>
      <style>{`
        /* Hide auth profile bar on /create and /play routes */
        body[data-route="/create"] .auth-profile-bar,
        body[data-route="/play"] .auth-profile-bar {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
