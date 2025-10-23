import { Router } from 'express';
import { redditCallback, redditAuthStatus } from '../controllers/auth.controller';
import { requireAuth, AuthedRequest } from '../middlewares/auth';
import { Response } from 'express';
import { settings } from '@devvit/web/server';

const router = Router();
let newvar;

router.post('/api/some-endpoint', async (req, res) => {
  async function newtime() {
newvar = await settings.get('redditClientId');
  console.log('Newvar from settings:', newvar);
}
newtime();
});
console.log('Newvar outside route:', newvar);

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
