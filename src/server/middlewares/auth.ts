import { Request, Response, NextFunction } from 'express';
import { verifyServerJwt } from '../services/auth.service';

export interface AuthedRequest extends Request {
  user?: { uid: string; username: string } | any;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = auth.slice('Bearer '.length);
  const payload = await verifyServerJwt(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  req.user = payload;
  return next();
}
