import axios from 'axios';
import jwt from 'jsonwebtoken';
import { redis } from './redis.service';
import { settings } from '@devvit/web/server';

// Load configuration from Devvit settings with fallbacks
async function loadConfig() {
  try {
    const [jwtSecret, clientId, clientSecret, redirectUri] = await Promise.all([
      settings.get<string>('JWT_SECRET').catch(() => null),
      settings.get<string>('REDDIT_CLIENT_ID').catch(() => null),
      settings.get<string>('REDDIT_CLIENT_SECRET').catch(() => null),
      settings.get<string>('REDDIT_REDIRECT_URI').catch(() => null),
    ]);

    return {
      JWT_SECRET: jwtSecret || process.env.JWT_SECRET || 'dev-secret-at-least-32-characters-long-for-testing',
      REDDIT_CLIENT_ID: clientId || process.env.REDDIT_CLIENT_ID,
      REDDIT_CLIENT_SECRET: clientSecret || process.env.REDDIT_CLIENT_SECRET,
      REDDIT_REDIRECT_URI: redirectUri || process.env.REDDIT_REDIRECT_URI,
    };
  } catch (error) {
    console.warn('⚠️  Could not load Devvit settings, using environment variables');
    return {
      JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-at-least-32-characters-long-for-testing',
      REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
      REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
      REDDIT_REDIRECT_URI: process.env.REDDIT_REDIRECT_URI,
    };
  }
}

export interface AuthResult {
  jwt: string;
  redditUid: string;
}

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface RedditUser {
  name?: string;
  id?: string;
  icon_img?: string;
  snoovatar_img?: string;
  email?: string;
}

async function exchangeRedditCode(code: string): Promise<RedditTokenResponse> {
  console.log('🔐 AUTH: Exchanging Reddit code for access token...');
  const config = await loadConfig();

  if (!config.REDDIT_CLIENT_ID || !config.REDDIT_CLIENT_SECRET || !config.REDDIT_REDIRECT_URI) {
    console.error('❌ AUTH: Reddit OAuth credentials not configured');
    throw new Error('Reddit OAuth credentials not configured. Please set them in Devvit settings or environment variables.');
  }

  console.log('🔐 AUTH: Using client ID:', config.REDDIT_CLIENT_ID?.substring(0, 8) + '...');

  const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.REDDIT_REDIRECT_URI,
  });

  const response = await axios.post(tokenUrl, data, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${config.REDDIT_CLIENT_ID}:${config.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'devvit-reddit-oauth/0.1 by dev',
    },
  });

  if (response.status !== 200) {
    console.error('❌ AUTH: Reddit token exchange failed:', response.status, response.statusText);
    throw new Error(`Reddit token exchange failed: ${response.status} ${response.statusText}`);
  }

  console.log('✅ AUTH: Successfully received access token from Reddit');
  return response.data as RedditTokenResponse;
}

async function fetchRedditUser(accessToken: string): Promise<RedditUser> {
  const response = await axios.get('https://oauth.reddit.com/api/v1/me', {
    headers: {
      'Authorization': `bearer ${accessToken}`,
      'User-Agent': 'devvit-reddit-oauth/0.1 by dev',
    },
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch reddit user');
  }

  return response.data as RedditUser;
}

export async function createOrGetUserFromReddit(code: string): Promise<AuthResult> {
  console.log('🔐 AUTH: Starting Reddit OAuth flow with code:', code.substring(0, 10) + '...');

  const tokenData = await exchangeRedditCode(code);
  console.log('🔐 AUTH: Successfully exchanged code for access token');

  const accessToken = tokenData.access_token;
  const redditUser = await fetchRedditUser(accessToken);
  console.log('🔐 AUTH: Fetched Reddit user:', redditUser.name);

  // Extract Reddit user details
  const username = String(redditUser.name ?? '');
  const redditId = String(redditUser.id ?? ''); // This will be like "t2_..."
  const email = redditUser.email ?? '';
  const icon = redditUser.icon_img || redditUser.snoovatar_img || '';

  // Create unique user ID
  const uid = `reddit:${redditId}`;

  // Format createdAt as human-readable (Asia/Kolkata)
  const createdAt = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Store user profile in Redis
  const profile = {
    username,
    icon,
    email,
    role: 'user',
    createdAt,
    redditId,
  };

  try {
    // Store user profile in Redis hash
    await redis.hSet(`user:${uid}`, profile);
    console.log('✅ AUTH: Stored user profile in Redis for uid:', uid);
  } catch (dbErr) {
    console.warn('⚠️  AUTH: Could not store user profile:', (dbErr as Error).message);
  }

  const token = await createServerJwt(uid, username);
  console.log('🔐 AUTH: Created JWT token for user:', username);

  return { jwt: token, redditUid: uid };
}

export async function createServerJwt(uid: string, username: string): Promise<string> {
  const config = await loadConfig();

  if (!config.JWT_SECRET) {
    throw new Error('JWT secret not configured. Cannot sign token.');
  }
  console.log("hacked details")
  return jwt.sign({ uid, username }, config.JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyServerJwt(token: string): Promise<{ uid: string; username: string } | null> {
  try {
    console.log('🔐 AUTH: Verifying JWT token...');
    const config = await loadConfig();

    if (!config.JWT_SECRET) {
      console.warn('⚠️  AUTH: No JWT secret configured');
      return null;
    }

    const payload = jwt.verify(token, config.JWT_SECRET) as { uid?: string; username?: string };

    if (!payload || typeof payload.uid !== 'string' || typeof payload.username !== 'string') {
      console.warn('⚠️  AUTH: Invalid JWT payload');
      return null;
    }

    console.log('✅ AUTH: JWT verified for user:', payload.username);
    return { uid: payload.uid, username: payload.username };
  } catch (error) {
    console.warn('⚠️  AUTH: JWT verification failed:', (error as Error).message);
    return null;
  }
}

export async function getUserProfile(uid: string): Promise<any | null> {
  try {
    const keys = await redis.hKeys(`user:${uid}`);
    if (keys.length === 0) return null;
    const profile: any = {};
    for (const key of keys) {
      profile[key] = await redis.hGet(`user:${uid}`, key);
    }
    return profile;
  } catch {
    return null;
  }
}