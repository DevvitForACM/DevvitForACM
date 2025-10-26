import { Request, Response } from 'express';
import { createOrGetUserFromReddit } from '../services/auth.service';

export async function redditCallback(req: Request, res: Response) {
  console.log('🚀 AUTH CONTROLLER: Reddit callback endpoint hit');
  console.log('📋 AUTH CONTROLLER: Query params:', req.query);
  console.log('📋 AUTH CONTROLLER: Headers:', req.headers);
  
  const { code, state } = req.query;
  
  if (!code || typeof code !== 'string') {
    console.error('❌ AUTH CONTROLLER: Missing or invalid authorization code');
    return res.status(400).json({ 
      error: 'Missing authorization code',
      message: 'This endpoint expects a Reddit OAuth callback with a code parameter.',
      receivedParams: req.query
    });
  }

  console.log(`🔍 AUTH CONTROLLER: Reddit callback received - Code: ${code.substring(0, 10)}..., State: ${state}`);

  try {
    console.log('🔄 AUTH CONTROLLER: Calling createOrGetUserFromReddit...');
    const result = await createOrGetUserFromReddit(code);
    console.log('✅ AUTH CONTROLLER: Reddit authentication successful for user:', result.redditUid);
    
    // Return JWT to frontend. For web flow, you might redirect with token in query or set a cookie.
    const response = {
      success: true,
      ...result,
      message: 'Authentication successful'
    };
    console.log('📤 AUTH CONTROLLER: Sending response:', { ...response, jwt: 'JWT_TOKEN_HIDDEN' });
    return res.json(response);
  } catch (err: any) {
    console.error('❌ AUTH CONTROLLER: Reddit authentication failed:', err.message);
    console.error('❌ AUTH CONTROLLER: Full error:', err);
    return res.status(500).json({ 
      error: err.message || 'Auth failed',
      success: false
    });
  }
}

export async function redditAuthStatus(_req: Request, res: Response) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = process.env.REDDIT_REDIRECT_URI;
  const hasCredentials = !!(clientId && process.env.REDDIT_CLIENT_SECRET && redirectUri);
  
  return res.json({
    service: 'Reddit OAuth Backend (Redis)',
    status: 'running',
    port: process.env.PORT || 3000,
    timestamp: new Date().toISOString(),
    config: {
      hasRedditCredentials: hasCredentials,
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'Not set',
      redirectUri: redirectUri || 'Not set',
      redisEnabled: true
    },
    endpoints: {
      callback: '/auth/reddit/callback?code=AUTHORIZATION_CODE',
      status: '/auth/status',
      health: '/health'
    },
    message: hasCredentials 
      ? 'Ready to handle Reddit OAuth callbacks with Redis backend' 
      : 'Missing Reddit OAuth credentials in .env file'
  });
}