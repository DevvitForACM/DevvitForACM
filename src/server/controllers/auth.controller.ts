import { Request, Response } from 'express';
import { createOrGetUserFromReddit } from '../services/auth.service';
import { REDDIT_CLIENT_ID, REDDIT_REDIRECT_URI, PORT } from '../variables';
import { settings } from '@devvit/web/server';

export async function redditCallback(req: Request, res: Response) {
  const { code, state } = req.query;
  
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ 
      error: 'Missing authorization code',
      message: 'This endpoint expects a Reddit OAuth callback with a code parameter.',
      receivedParams: req.query
    });
  }

  console.log(`🔍 Reddit callback received - Code: ${code.substring(0, 10)}..., State: ${state}`);

  try {
    const result = await createOrGetUserFromReddit(code);
    console.log('✅ Reddit authentication successful for user:', result.firebaseUid);
    // Return JWT to frontend. For web flow, you might redirect with token in query or set a cookie.
    return res.json({
      success: true,
      ...result,
      message: 'Authentication successful'
    });
  } catch (err: any) {
    console.error('❌ Reddit authentication failed:', err.message);
    return res.status(500).json({ 
      error: err.message || 'Auth failed',
      success: false
    });
  }
}

export async function redditAuthStatus(_req: Request, res: Response) {
  const clientId = REDDIT_CLIENT_ID;
  const redirectUri = REDDIT_REDIRECT_URI;
  const newvar = await settings.get('redditClientId');
  console.log('Newvar from settings:', newvar);

  // Note: REDDIT_CLIENT_SECRET is still read from process.env in auth.service; keep that behavior there
  const hasCredentials = !!(clientId && process.env.REDDIT_CLIENT_SECRET && redirectUri);
  
  return res.json({
    service: 'Reddit OAuth Backend',
    status: 'running',
  port: PORT || 3000,
    timestamp: new Date().toISOString(),
    config: {
      hasRedditCredentials: hasCredentials,
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'Not set',
      redirectUri: redirectUri || 'Not set'
    },
    endpoints: {
      callback: '/auth/reddit/callback?code=AUTHORIZATION_CODE',
      status: '/auth/status',
      health: '/health'
    },
    message: hasCredentials 
      ? 'Ready to handle Reddit OAuth callbacks' 
      : 'Missing Reddit OAuth credentials in .env file'
  });
}
