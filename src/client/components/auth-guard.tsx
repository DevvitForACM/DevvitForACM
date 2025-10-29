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

  return (
    <div className="relative">
      {/* User Profile Bar or Login Button */}
      {(
        user?.isAuthenticated ? (
          <div className="auth-profile-bar fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="text-sm font-semibold">{user.username}</div>
                <div className="text-xs text-gray-400">Authenticated</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-profile-bar fixed top-4 right-4 z-50">
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754a1.754 1.754 0 0 1-1.754-1.754l-.043-.089c-.676.24-1.386.427-2.126.427-.741 0-1.45-.188-2.126-.427l-.043.089c0 .968-.786 1.754-1.754 1.754-.968 0-1.754-.786-1.754-1.754 0-.968.786-1.754 1.754-1.754.477 0 .898.182 1.207.491 1.207-.883 2.878-1.43 4.744-1.488l.842-3.556-2.69.567a1.25 1.25 0 0 1-2.498-.056c0-.688.562-1.249 1.25-1.249z" />
                  </svg>
                  <span>Login with Reddit</span>
                </>
              )}
            </button>
          </div>
        )
      )}

      {/* Game Content */}
      <AuthGuardContent user={user}>{children}</AuthGuardContent>
    </div>
  );
}

// Component that hides profile bar on specific routes
function AuthGuardContent({ user, children }: { user: UserProfile | null; children: React.ReactNode }) {
  void user;
  // This will only be rendered inside the Router, so we can safely use routing hooks
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
