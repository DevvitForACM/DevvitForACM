import { settings } from '@devvit/web/server';

// Async helper to read Devvit settings with fallback to env var. Exported for callers
// that want to consult Devvit settings at runtime. This function is async but
// we avoid using top-level await so this module remains compatible with CJS builds.
export async function getConfigValue(settingKey: string, envVar: string): Promise<string> {
  try {
    const settingValue = await settings.get(settingKey);
    if (settingValue !== undefined && settingValue !== null) return String(settingValue);
  } catch (error) {
    console.warn(`Failed to get setting ${settingKey}:`, error);
  }

  const proc: any = (globalThis as any).process;
  return (proc && proc.env && proc.env[envVar]) ? String(proc.env[envVar]) : '';
}

// Synchronous exports derived from process.env so other modules can import them
// without requiring top-level await. If you need Devvit settings, call getConfigValue().
const proc: any = (globalThis as any).process;
export const FIREBASE_API_KEY = (proc && proc.env && proc.env.FIREBASE_API_KEY) || '';
export const FIREBASE_AUTH_DOMAIN = (proc && proc.env && proc.env.FIREBASE_AUTH_DOMAIN) || '';
export const FIREBASE_PROJECT_ID = (proc && proc.env && proc.env.FIREBASE_PROJECT_ID) || '';
export const FIREBASE_STORAGE_BUCKET = (proc && proc.env && proc.env.FIREBASE_STORAGE_BUCKET) || '';
export const FIREBASE_MESSAGING_SENDER_ID = (proc && proc.env && proc.env.FIREBASE_MESSAGING_SENDER_ID) || '';
export const FIREBASE_APP_ID = (proc && proc.env && proc.env.FIREBASE_APP_ID) || '';
export const FIREBASE_MEASUREMENT_ID = (proc && proc.env && proc.env.FIREBASE_MEASUREMENT_ID) || '';
export const FIREBASE_DATABASE_URL = (proc && proc.env && proc.env.FIREBASE_DATABASE_URL) || '';
export const FIREBASE_CLIENT_EMAIL = (proc && proc.env && proc.env.FIREBASE_CLIENT_EMAIL) || '';
export const FIREBASE_PRIVATE_KEY = ((proc && proc.env && proc.env.FIREBASE_PRIVATE_KEY) || '').replace(/\\n/g, '\n');

export const REDDIT_CLIENT_ID = (proc && proc.env && proc.env.REDDIT_CLIENT_ID) || '';
export const REDDIT_CLIENT_SECRET = (proc && proc.env && proc.env.REDDIT_CLIENT_SECRET) || '';
export const REDDIT_REDIRECT_URI = (proc && proc.env && proc.env.REDDIT_REDIRECT_URI) || '';

export const JWT_SECRET = (proc && proc.env && proc.env.JWT_SECRET) || '';
export const DEVVIT_SUBREDDIT = (proc && proc.env && proc.env.DEVVIT_SUBREDDIT) || '';
export const PORT = (proc && proc.env && proc.env.PORT) || '3000';

// export const JWT_SECRET_new = settings.get('jwtSecret') || '';
// console.log('JWT_SECRET_new:', JWT_SECRET_new);
