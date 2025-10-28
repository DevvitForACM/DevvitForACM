import React, { useState, useEffect } from 'react';
import { authService, type UserProfile } from '@/services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastClass, setToastClass] = useState('animate-fade-in');

  useEffect(() => {
    const handleAuthChange = (newUser: UserProfile | null) => {
      setUser(newUser);
      setIsLoading(false);
      
      // Show toast when user successfully logs in
      if (newUser?.isAuthenticated) {
        setShowToast(true);
        setToastClass('animate-fade-in');
        
        // Start fade out after 2.5 seconds
        setTimeout(() => {
          setToastClass('animate-fade-out');
        }, 2500);
        
        // Hide toast after fade out completes
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }
    };

    const initAuth = async () => {
      // Check if already authenticated
      const currentUser = await authService.checkAuthStatus();
      
      // If not authenticated, automatically start authentication
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Retro Gaming Toast Notification */}
      {showToast && user?.isAuthenticated && (
        <div 
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 ${toastClass}`}
          style={{
            background: '#4CAF50',
            border: 'none',
            boxShadow: 'inset 3px 3px 0 #66BB6A, inset -3px -3px 0 #2E7D32, 4px 4px 0 #1B5E20',
            fontFamily: '"Courier New", monospace',
            imageRendering: 'pixelated',
          }}
        >
          <div 
            className="px-6 py-3 text-white font-bold text-lg tracking-wider flex items-center space-x-3"
            style={{
              textShadow: '2px 2px 0 #1B5E20',
              filter: 'contrast(1.2)',
            }}
          >
            <div className="text-xl animate-pulse">🎮</div>
            <div>
              LOGGED IN AS <span className="text-yellow-300 drop-shadow-lg">{user.username.toUpperCase()}</span>
            </div>
          </div>
          {/* Pixel highlight effects */}
          <div 
            className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"
            style={{ imageRendering: 'pixelated' }}
          ></div>
          <div 
            className="absolute top-0 left-0 w-1 h-full bg-white opacity-30"
            style={{ imageRendering: 'pixelated' }}
          ></div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity duration-100"></div>
        </div>
      )}

      {/* Game Content */}
      {children}
    </>
  );
}
