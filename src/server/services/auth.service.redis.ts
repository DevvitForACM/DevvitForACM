/**
 * Auth Service - Redis Version
 * 
 * Handles Reddit OAuth authentication and user management using Redis storage.
 * Replaces Firebase Admin Auth with Reddit's native Redis storage.
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { RedisService } from './redis.service';

// Read JWT secret from environment
let JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
  } else {
    JWT_SECRET = 'dev-secret';
    console.warn('Using hardcoded JWT secret for development. Set JWT_SECRET in your environment for production.');
  }
}

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_REDIRECT_URI = process.env.REDDIT_REDIRECT_URI;

if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_REDIRECT_URI) {
  console.error('Missing Reddit OAuth credentials:');
  console.error('   REDDIT_CLIENT_ID:', REDDIT_CLIENT_ID ? 'Set' : 'Missing');
  console.error('   REDDIT_CLIENT_SECRET:', REDDIT_CLIENT_SECRET ? 'Set' : 'Missing');
  console.error('   REDDIT_REDIRECT_URI:', REDDIT_REDIRECT_URI ? 'Set' : 'Missing');
  console.error('   Please check your .env file');
}

export interface AuthResult {
  jwt: string;
  userId: string; // Changed from firebaseUid to userId
}

interface RedditUser {
  name?: string;
  id?: string;
  icon_img?: string;
  snoovatar_img?: string;
  email?: string;
}

interface UserProfile {
  username: string;
  email: string;
  icon: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
}

/**
 * Exchange Reddit authorization code for access token
 */
async function exchangeRedditCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string; [k: string]: unknown }> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_REDIRECT_URI) {
    throw new Error('Reddit OAuth credentials not configured. Please check your .env file.');
  }

  const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDDIT_REDIRECT_URI!,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'devvit-reddit-oauth/0.1 by dev',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Reddit token exchange failed: ${res.status} ${txt}`);
  }

  const json = await res.json();
  return json as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string; [k: string]: unknown };
}

/**
 * Fetch Reddit user information using access token
 */
async function fetchRedditUser(accessToken: string): Promise<RedditUser> {
  const res = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `bearer ${accessToken}`,
      'User-Agent': 'devvit-reddit-oauth/0.1 by dev',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reddit user');
  }

  return (await res.json()) as RedditUser;
}

/**
 * Create or get user from Reddit OAuth, storing profile in Redis
 */
export async function createOrGetUserFromReddit(
  code: string,
  redisService: RedisService
): Promise<AuthResult> {
  const tokenData = await exchangeRedditCode(code);
  const accessToken: string = String(tokenData.access_token);
  const redditUser = await fetchRedditUser(accessToken);

  // Extract Reddit user details
  const username = String(redditUser.name ?? '');
  const redditId = String(redditUser.id ?? '');
  const email = redditUser.email ?? '';
  const icon = redditUser.icon_img || redditUser.snoovatar_img || '';

  // Create user ID (consistent with previous format)
  const userId = `reddit:${redditId}`;

  // Check if user exists in Redis
  const existingUser = await redisService.hGetAll(`users:${userId}`);

  if (existingUser) {
    console.log('Found existing user in Redis:', userId);
  } else {
    // Create new user profile
    const createdAt = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const profile: UserProfile = {
      username,
      icon,
      email,
      role: 'user',
      createdAt,
    };

    try {
      // Store user profile in Redis with 30-day TTL (GDPR compliance)
      await redisService.hSetAll(
        `users:${userId}`,
        {
          username: profile.username,
          icon: profile.icon,
          email: profile.email,
          role: profile.role,
          createdAt: profile.createdAt,
        },
        30 * 24 * 60 * 60 // 30 days in seconds
      );

      console.log('Created new user in Redis:', userId);
    } catch (dbErr) {
      console.error('Could not store user profile in Redis:', (dbErr as Error).message);
      throw dbErr;
    }
  }

  // Store OAuth tokens for posting to profile
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = tokenData.expires_in ? now + Number(tokenData.expires_in) : undefined;
    await redisService.hSetAll(`users:${userId}:oauth`, {
      access_token: accessToken,
      refresh_token: tokenData.refresh_token ? String(tokenData.refresh_token) : '',
      scope: tokenData.scope ? String(tokenData.scope) : '',
      token_type: tokenData.token_type ? String(tokenData.token_type) : 'bearer',
      expires_at: expiresAt ? String(expiresAt) : '',
    });
  } catch (e) {
    console.warn('Failed storing OAuth tokens for user:', userId, e);
  }

  // Issue server JWT for API access
  if (!JWT_SECRET) {
    throw new Error('JWT secret not configured. Cannot sign token.');
  }

  const token = jwt.sign({ uid: userId, username }, JWT_SECRET, { expiresIn: '7d' });

  return { jwt: token, userId };
}

/**
 * Verify server JWT token
 */
export async function verifyServerJwt(token: string): Promise<{ uid: string; username: string } | null> {
  try {
    if (!JWT_SECRET) return null;
    const payload = jwt.verify(token, JWT_SECRET) as { uid?: string; username?: string };
    if (!payload || typeof payload.uid !== 'string' || typeof payload.username !== 'string') return null;
    return { uid: payload.uid, username: payload.username };
  } catch {
    return null;
  }
}

/**
 * Get user profile from Redis
 */
export async function getUserProfile(
  userId: string,
  redisService: RedisService
): Promise<UserProfile | null> {
  const userData = await redisService.hGetAll(`users:${userId}`);

  if (!userData) {
    return null;
  }

  return {
    username: userData.username || '',
    email: userData.email || '',
    icon: userData.icon || '',
    role: (userData.role as 'user' | 'admin' | 'moderator') || 'user',
    createdAt: userData.createdAt || '',
  };
}

/**
 * Update user profile in Redis
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
  redisService: RedisService
): Promise<void> {
  const key = `users:${userId}`;

  // Check if user exists
  const exists = await redisService.exists(key);
  if (!exists) {
    throw new Error(`User ${userId} not found`);
  }

  // Convert updates to string record
  const stringUpdates: Record<string, string> = {};
  for (const [field, value] of Object.entries(updates)) {
    if (value !== undefined) {
      stringUpdates[field] = String(value);
    }
  }

  // Update individual fields
  for (const [field, value] of Object.entries(stringUpdates)) {
    await redisService.hSet(key, field, value);
  }

  console.log(`Updated user profile for ${userId}`);
}

/**
 * Delete user from Redis (GDPR compliance)
 */
export async function deleteUser(
  userId: string,
  redisService: RedisService
): Promise<void> {
  await redisService.del(`users:${userId}`);
  console.log(`Deleted user ${userId} from Redis`);
}

/**
 * List all users (for admin purposes)
 * Note: This requires scanning keys, which can be slow. Use with caution.
 */
export async function listUsers(
  _redisService: RedisService,
  _pattern: string = 'users:*'
): Promise<string[]> {
  // Note: Devvit Redis doesn't support SCAN, so this would need to be
  // implemented differently (e.g., maintain a set of user IDs)
  console.warn('listUsers not fully implemented - requires user ID tracking');
  return [];
}
