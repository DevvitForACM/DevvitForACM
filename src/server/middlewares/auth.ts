import { Request, Response, NextFunction } from 'express';
import { verifyServerJwt } from '../services/auth.service';

export interface UserPayload {
  uid: string;
  username: string;
}

export interface AuthedRequest extends Request {
  user?: UserPayload | undefined;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
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
