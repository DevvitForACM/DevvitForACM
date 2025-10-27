import { useEffect, useState } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ userId: string } | null>(null);

  useEffect(() => {
    // Dynamically import context to ensure it's available at runtime
    const getContext = async () => {
      try {
        const { context } = await import('@devvit/web/client');
        const authToken = context.authToken;
        const userId = context.userId;

        // eslint-disable-next-line no-console
        console.log('[useAuth] Context:', { 
          hasAuthToken: !!authToken, 
          authTokenLength: authToken?.length,
          userId, 
          contextKeys: Object.keys(context) 
        });

        if (authToken && userId) {
          setToken(authToken);
          setUser({ userId });
        } else {
          console.warn('[useAuth] No auth token or userId in context');
        }
      } catch (error) {
        console.error('[useAuth] Failed to load context:', error);
      }
    };

    getContext();
  }, []);

  return { token, user };
}
