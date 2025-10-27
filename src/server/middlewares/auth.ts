import { Request, Response, NextFunction } from 'express';
import { verifyServerJwt } from '../services/auth.service.redis';

// Dynamic import of context - only available in Devvit runtime
let devvitContext: any = null;
try {
  const devvitWeb = require('@devvit/web/server');
  devvitContext = devvitWeb.context;
} catch (err) {
  // Not in Devvit context
}

export interface UserPayload {
  uid: string;
  username: string;
}

export interface AuthedRequest extends Request {
  user?: UserPayload | undefined;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  console.log('[requireAuth] Starting auth check...');

  // Try Devvit context first (automatically provided by Devvit Web)
  if (devvitContext) {
    console.log('[requireAuth] Context available:', {
      hasContext: !!devvitContext,
      userId: devvitContext.userId,
      username: devvitContext.username,
      contextKeys: Object.keys(devvitContext)
    });

    if (devvitContext.userId) {
      console.log('[requireAuth] Using Devvit context auth');
      req.user = {
        uid: devvitContext.userId,
        username: devvitContext.username || 'anonymous'
      };
      return next();
    }
  } else {
    console.log('[requireAuth] Devvit context not available');
  }

  // In standalone/development mode, use a test user
  const isDevelopment = process.env.NODE_ENV !== 'production' && !devvitContext;
  if (isDevelopment) {
    console.log('[requireAuth] Development mode - using test user');
    req.user = {
      uid: 'test-user-dev',
      username: 'DevUser'
    };
    return next();
  }

  // Fallback to JWT auth for external/standalone requests
  console.log('[requireAuth] Falling back to JWT auth');
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('[requireAuth] No authorization header found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.slice('Bearer '.length);
  const payload = await verifyServerJwt(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  // validate shape
  if (typeof payload.uid !== 'string' || typeof payload.username !== 'string') {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  req.user = { uid: payload.uid, username: payload.username };
  next();
}
