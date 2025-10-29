import { useEffect, useState } from 'react';

// Client should not access Devvit auth token directly.
// Use our server endpoint which reads Reddit user from Devvit context.
export function useAuth() {
  const [user, setUser] = useState<{ username: string; uid: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data?.success && data?.user) {
          setUser({ username: data.user.username, uid: data.user.uid });
        } else {
          setUser(null);
        }
      } catch (e) {
         
        console.warn('[useAuth] Failed to fetch auth:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { user, loading };
}
