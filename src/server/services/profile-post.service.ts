/**
 * Profile Post Service
 * Posts to a user's profile using their OAuth token (scope: submit).
 */

import fetch from 'node-fetch';
import { RedisService } from './redis.service';

export interface UserTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch seconds
  scope?: string;
  token_type?: string; // usually 'bearer'
}

const UA = 'acm-devvit-profile-post/1.0 by app';

async function loadTokens(redis: RedisService, userId: string): Promise<UserTokens | null> {
  const data = await redis.hGetAll(`users:${userId}:oauth`);
  if (!data) return null;
  const out: UserTokens = { access_token: data.access_token || '' };
  if (data.refresh_token) out.refresh_token = data.refresh_token;
  const exp = data.expires_at ? Number(data.expires_at) : undefined;
  if (typeof exp === 'number' && !Number.isNaN(exp)) out.expires_at = exp;
  if (data.scope) out.scope = data.scope;
  if (data.token_type) out.token_type = data.token_type as any;
  return out;
}

async function saveTokens(redis: RedisService, userId: string, tokens: UserTokens): Promise<void> {
  await redis.hSetAll(`users:${userId}:oauth`, {
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token || '',
    expires_at: tokens.expires_at ? String(tokens.expires_at) : '',
    scope: tokens.scope || '',
    token_type: tokens.token_type || 'bearer',
  });
}

async function refreshAccessToken(tokens: UserTokens): Promise<UserTokens> {
  if (!tokens.refresh_token) throw new Error('No refresh_token stored');
  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
  });

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${txt}`);
  }

  const json = await res.json() as { access_token: string; expires_in?: number; token_type?: string; scope?: string };
  const now = Math.floor(Date.now() / 1000);
  const refreshed: UserTokens = { access_token: json.access_token };
  if (tokens.refresh_token) refreshed.refresh_token = tokens.refresh_token;
  if (json.token_type) refreshed.token_type = json.token_type;
  if (json.scope || tokens.scope) refreshed.scope = (json.scope ?? tokens.scope)!;
  const exp = json.expires_in ? now + json.expires_in : tokens.expires_at;
  if (typeof exp === 'number') refreshed.expires_at = exp;
  return refreshed;
}

export async function submitProfilePost(
  redis: RedisService,
  userId: string,
  username: string,
  title: string,
  text: string
): Promise<{ id: string }> {
  let tokens = await loadTokens(redis, userId);
  if (!tokens) throw new Error('User not linked: missing OAuth tokens (submit scope)');

  const doSubmit = async (accessToken: string) => {
    const form = new URLSearchParams({
      api_type: 'json',
      kind: 'self',
      sr: `u_${username}`,
      title,
      text,
      sendreplies: 'true',
      resubmit: 'true',
    });

    const res = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      body: form.toString(),
    });

    const json = await res.json() as any;
    if (!res.ok || (json && json.json && Array.isArray(json.json.errors) && json.json.errors.length)) {
      const err = JSON.stringify(json);
      throw new Error(`Submit failed: ${res.status} ${err}`);
    }

    const id = json?.json?.data?.id ?? json?.json?.data?.name ?? '';
    if (!id) throw new Error('No post id returned');
    return { id };
  };

  // Try with current token
  try {
    return await doSubmit(tokens.access_token);
  } catch (e: any) {
    // Refresh on auth errors and retry once
    const msg = String(e?.message || e);
    if (msg.includes('invalid_grant') || msg.includes('401')) {
      tokens = await refreshAccessToken(tokens);
      await saveTokens(redis, userId, tokens);
      return await doSubmit(tokens.access_token);
    }
    throw e;
  }
}
