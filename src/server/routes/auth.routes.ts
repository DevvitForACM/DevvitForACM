import { Router } from 'express';
import { redditCallback, redditAuthStatus } from '../controllers/auth.controller';
import { requireAuth, AuthedRequest } from '../middlewares/auth';
import { Response } from 'express';

const router = Router();

// GET /auth/reddit/callback?code=... (with OAuth code)
router.get('/reddit/callback', redditCallback);

// GET /auth/reddit/status (without code - for testing)
router.get('/reddit/status', redditAuthStatus);

// GET /auth/status (general auth status)
router.get('/status', redditAuthStatus);

router.get('/me', requireAuth, (req: AuthedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,   // payload from JWT
    message: 'Authenticated user info'
  });
});

export default router;
