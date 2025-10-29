import { Request, Response, NextFunction } from 'express';
import { verifyServerJwt } from '../services/auth.service.redis';
import { context as devvitContext, reddit as devvitReddit } from '@devvit/web/server';

export interface UserPayload {
  uid: string;
  username: string;
}

export interface AuthedRequest extends Request {
  user?: UserPayload | undefined;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  console.log('[requireAuth] Starting auth check...');

  // 1) Prefer Devvit context
  if (devvitContext && devvitContext.userId) {
    const ctxAny = devvitContext as any;
    const usernameFromCtx = typeof ctxAny?.username === 'string' ? ctxAny.username : undefined;
    console.log('[requireAuth] Using Devvit context auth', {
      userId: devvitContext.userId,
      username: usernameFromCtx,
    });
    req.user = {
      uid: devvitContext.userId,
      username: usernameFromCtx || 'anonymous',
    };
    return next();
  }

  // 2) Fall back to Reddit helper
  try {
    if (devvitReddit && typeof devvitReddit.getCurrentUsername === 'function') {
      const username = await devvitReddit.getCurrentUsername();
      if (username) {
        console.log('[requireAuth] Using reddit.getCurrentUsername() auth', { username });
        req.user = { uid: `reddit:${username}`, username };
        return next();
      }
    }
  } catch (e) {
    console.warn('[requireAuth] reddit.getCurrentUsername() failed:', e);
  }

  // 3) Development fallback (last resort only)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment) {
    console.warn('[requireAuth] Dev fallback engaged: using test user');
    req.user = { uid: 'test-user-dev', username: 'DevUser' };
    return next();
  }

  // 4) JWT Bearer token fallback
  console.log('[requireAuth] Falling back to JWT auth');
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('[requireAuth] No authorization header found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.slice('Bearer '.length);
  const payload = await verifyServerJwt(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  if (typeof payload.uid !== 'string' || typeof payload.username !== 'string') {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  req.user = { uid: payload.uid, username: payload.username };
  next();
}
