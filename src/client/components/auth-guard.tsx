import React, { useState, useEffect } from 'react';
import { authService, type UserProfile } from '../services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const handleAuthChange = (newUser: UserProfile | null) => {
      setUser(newUser);
      setIsLoading(false);
    };

    authService.onAuthChange(handleAuthChange);

    return () => {
      authService.removeAuthListener(handleAuthChange);
    };
  }, []);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await authService.startAuthentication();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user?.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md w-full mx-4 border border-white/20">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754a1.754 1.754 0 0 1-1.754-1.754l-.043-.089c-.676.24-1.386.427-2.126.427-.741 0-1.45-.188-2.126-.427l-.043.089c0 .968-.786 1.754-1.754 1.754-.968 0-1.754-.786-1.754-1.754 0-.968.786-1.754 1.754-1.754.477 0 .898.182 1.207.491 1.207-.883 2.878-1.43 4.744-1.488l.842-3.556-2.69.567a1.25 1.25 0 0 1-2.498-.056c0-.688.562-1.249 1.25-1.249z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to the Game!
              </h1>
              <p className="text-gray-300 mb-6">
                Please authenticate with Reddit to start playing and save your
                progress.
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754a1.754 1.754 0 0 1-1.754-1.754l-.043-.089c-.676.24-1.386.427-2.126.427-.741 0-1.45-.188-2.126-.427l-.043.089c0 .968-.786 1.754-1.754 1.754-.968 0-1.754-.786-1.754-1.754 0-.968.786-1.754 1.754-1.754.477 0 .898.182 1.207.491 1.207-.883 2.878-1.43 4.744-1.488l.842-3.556-2.69.567a1.25 1.25 0 0 1-2.498-.056c0-.688.562-1.249 1.25-1.249z" />
                  </svg>
                  Login with Reddit
                </div>
              )}
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Your Reddit credentials are used to create your game profile and
              save your progress securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* User Profile Bar */}
      <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg flex items-center space-x-3">
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

      {/* Game Content */}
      {children}
    </div>
  );
}
