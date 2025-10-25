import axios from 'axios';
import jwt from 'jsonwebtoken';
import { redis } from './redis.service';

// Read JWT secret from environment
let JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
  } else {
    JWT_SECRET = 'dev-secret-at-least-32-characters-long';
    console.warn('⚠️  Using hardcoded JWT secret for development. Set JWT_SECRET in your environment for production.');
  }
}

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_REDIRECT_URI = process.env.REDDIT_REDIRECT_URI;

if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_REDIRECT_URI) {
  console.error('⚠️  Missing Reddit OAuth credentials:');
  console.error('   REDDIT_CLIENT_ID:', REDDIT_CLIENT_ID ? '✓ Set' : '❌ Missing');
  console.error('   REDDIT_CLIENT_SECRET:', REDDIT_CLIENT_SECRET ? '✓ Set' : '❌ Missing');
  console.error('   REDDIT_REDIRECT_URI:', REDDIT_REDIRECT_URI ? '✓ Set' : '❌ Missing');
  console.error('   Please check your .env file');
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
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_REDIRECT_URI) {
    throw new Error('Reddit OAuth credentials not configured. Please check your .env file.');
  }

  const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
  
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDDIT_REDIRECT_URI,
  });

  const response = await axios.post(tokenUrl, data, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'devvit-reddit-oauth/0.1 by dev',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Reddit token exchange failed: ${response.status} ${response.statusText}`);
  }

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
  // Step 1: Exchange code for access_token
  const tokenData = await exchangeRedditCode(code);
  const accessToken = tokenData.access_token;
  
  // Step 2: Get Reddit user info using access_token
  const redditUser = await fetchRedditUser(accessToken);

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
    console.log('✅ Stored user profile in Redis');
  } catch (dbErr) {
    console.warn('⚠️  Could not store user profile:', (dbErr as Error).message);
  }

  // Step 3: Create JWT token
  const token = createServerJwt(uid, username);

  return { jwt: token, redditUid: uid };
}

export function createServerJwt(uid: string, username: string): string {
  if (!JWT_SECRET) {
    throw new Error('JWT secret not configured. Cannot sign token.');
  }

  return jwt.sign({ uid, username }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyServerJwt(token: string): Promise<{ uid: string; username: string } | null> {
  try {
    if (!JWT_SECRET) return null;
    
    const payload = jwt.verify(token, JWT_SECRET) as { uid?: string; username?: string };
    
    if (!payload || typeof payload.uid !== 'string' || typeof payload.username !== 'string') {
      return null;
    }
    
    return { uid: payload.uid, username: payload.username };
  } catch {
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