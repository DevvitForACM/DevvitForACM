import fetch from 'node-fetch';
import { adminDb, safeAdminAuth } from './firebase-admin.service';
import jwt from 'jsonwebtoken';

// Helper lookup to accept either SNAKE_CASE or camelCase environment keys
function firstEnv(...names: string[]) {
  for (const n of names) {
    if (typeof process.env[n] !== 'undefined' && process.env[n] !== '') return process.env[n];
  }
  return undefined;
}

// Read JWT secret from environment. Do not fall back to a hardcoded value in production.
const JWT_SECRET = firstEnv('JWT_SECRET', 'jwtSecret');
if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set in environment. Server JWT operations will fail without it.');
}
const REDDIT_CLIENT_ID = firstEnv('REDDIT_CLIENT_ID', 'redditClientId');
const REDDIT_CLIENT_SECRET = firstEnv('REDDIT_CLIENT_SECRET', 'redditClientSecret');
const REDDIT_REDIRECT_URI = firstEnv('REDDIT_REDIRECT_URI', 'redditRedirectUri');

if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_REDIRECT_URI) {
  console.error('⚠️  Missing Reddit OAuth credentials:');
  console.error('   REDDIT_CLIENT_ID:', REDDIT_CLIENT_ID ? '✓ Set' : '❌ Missing');
  console.error('   REDDIT_CLIENT_SECRET:', REDDIT_CLIENT_SECRET ? '✓ Set' : '❌ Missing');
  console.error('   REDDIT_REDIRECT_URI:', REDDIT_REDIRECT_URI ? '✓ Set' : '❌ Missing');
  console.error('   Please check your .env file');
}

export interface AuthResult {
  jwt: string;
  firebaseUid: string;
}

interface RedditUser {
  name?: string;
  id?: string;
  icon_img?: string;
  snoovatar_img?: string;
  email?: string;
}

async function exchangeRedditCode(code: string): Promise<{ access_token: string; [k: string]: unknown }> {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_REDIRECT_URI) {
    throw new Error('Reddit OAuth credentials not configured. Please check your .env file.');
  }

  // Reddit requires Basic auth with client_id:client_secret
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
  return json as { access_token: string; [k: string]: unknown };
}

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

export async function createOrGetUserFromReddit(code: string): Promise<AuthResult> {
  const tokenData = await exchangeRedditCode(code);
  const accessToken: string = String(tokenData.access_token);
  const redditUser = await fetchRedditUser(accessToken);

  // Extract Reddit user details
  const username = String(redditUser.name ?? '');
  const redditId = String(redditUser.id ?? '');
  const email = redditUser.email ?? ''; // Reddit may not always return email
  const icon = redditUser.icon_img || redditUser.snoovatar_img || ''; // Fallback to snoovatar if icon_img is empty

  // Use admin SDK to create or fetch a Firebase user.
  const uid = `reddit:${redditId}`;

  try {
    await safeAdminAuth().getUser(uid);
    console.log('✅ Found existing Firebase user:', uid);
  } catch {
    try {
      const result = await safeAdminAuth().createUser({
        uid,
        displayName: username,
        email: email || undefined,
        photoURL: icon || undefined,
      });
      console.log('✅ Created Firebase user:', result.uid || uid);
    } catch (createErr) {
      console.warn('⚠️  Could not create Firebase user (test mode):', (createErr as Error).message);
    }
  }

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

  // Store profile in Realtime DB under /users/{uid}
  const profile = {
    username,
    icon,
    email,
    role: 'user' as const,
    createdAt,
  };

  try {
    await adminDb.ref(`/users/${uid}`).set(profile);
    console.log('✅ Stored user profile in database');
  } catch (dbErr) {
    console.warn('⚠️  Could not store user profile (test mode):', (dbErr as Error).message);
  }

  // Issue server JWT for API access
  if (!JWT_SECRET) {
    throw new Error('JWT secret not configured. Cannot sign token.');
  }

  const token = jwt.sign({ uid, username }, JWT_SECRET, { expiresIn: '7d' });

  return { jwt: token, firebaseUid: uid };
}

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
