import fetch from 'node-fetch';
import { admin, adminDb, safeAdminAuth } from './firebase-admin.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
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
  firebaseUid: string;
}

async function exchangeRedditCode(code: string) {
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
  return json; // contains access_token
}

async function fetchRedditUser(accessToken: string) {
  const res = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `bearer ${accessToken}`,
      'User-Agent': 'devvit-reddit-oauth/0.1 by dev',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reddit user');
  }

  return await res.json();
}

export async function createOrGetUserFromReddit(code: string): Promise<AuthResult> {
  const tokenData: any = await exchangeRedditCode(code);
  const accessToken: string = tokenData.access_token;
  const redditUser: any = await fetchRedditUser(accessToken);

  // redditUser has fields like name, id
  const username = String(redditUser.name);
  const redditId = String(redditUser.id);

  // Use admin SDK to create or fetch a Firebase user. We'll use a uid prefixed with "reddit:" to avoid collisions.
  const uid = `reddit:${redditId}`;

  try {
    await safeAdminAuth().getUser(uid);
    console.log('✅ Found existing Firebase user:', uid);
  } catch (err: any) {
    try {
      const result = await safeAdminAuth().createUser({
        uid,
        displayName: username,
      });
      console.log('✅ Created Firebase user:', result.uid || uid);
    } catch (createErr: any) {
      console.warn('⚠️  Could not create Firebase user (test mode):', createErr.message);
    }
  }

  // Store profile in Realtime DB under /users/{uid}
  const profile = {
    username,
    provider: 'reddit',
    redditId,
    createdAt: new Date().toISOString(),
  };

  try {
    await adminDb.ref(`/users/${uid}`).set(profile);
    console.log('✅ Stored user profile in database');
  } catch (dbErr: any) {
    console.warn('⚠️  Could not store user profile (test mode):', dbErr.message);
  }

  // Issue server JWT for API access
  const token = jwt.sign({ uid, username }, JWT_SECRET, { expiresIn: '7d' });

  return { jwt: token, firebaseUid: uid };
}

export async function verifyServerJwt(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch (err: any) {
    return null;
  }
}
