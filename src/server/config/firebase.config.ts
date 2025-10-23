// Helper to lookup environment variables by multiple aliases. This allows
// the server to accept either uppercase/SNAKE_CASE names or camelCase names
// (used in the Devvit `devvit.json` settings) without forcing a change to
// the hosting configuration immediately.
import {
  FIREBASE_API_KEY as VAR_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN as VAR_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID as VAR_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET as VAR_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID as VAR_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID as VAR_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID as VAR_FIREBASE_MEASUREMENT_ID,
  FIREBASE_DATABASE_URL as VAR_FIREBASE_DATABASE_URL,
} from '../variables';


function firstEnv(...names: string[]) {
  for (const n of names) {
    if (typeof process.env[n] !== 'undefined' && process.env[n] !== '') return process.env[n];
  }
  return undefined;
}



const envMap: Record<string, string[]> = {
  FIREBASE_API_KEY: ['FIREBASE_API_KEY', 'firebaseApiKey'],
  FIREBASE_AUTH_DOMAIN: ['FIREBASE_AUTH_DOMAIN', 'firebaseAuthDomain'],
  FIREBASE_PROJECT_ID: ['FIREBASE_PROJECT_ID', 'firebaseProjectId'],
  FIREBASE_STORAGE_BUCKET: ['FIREBASE_STORAGE_BUCKET', 'firebaseStorageBucket'],
  FIREBASE_MESSAGING_SENDER_ID: ['FIREBASE_MESSAGING_SENDER_ID', 'firebaseMessagingSenderId'],
  FIREBASE_APP_ID: ['FIREBASE_APP_ID', 'firebaseAppId'],
  FIREBASE_MEASUREMENT_ID: ['FIREBASE_MEASUREMENT_ID', 'firebaseMeasurementId'],
  FIREBASE_DATABASE_URL: ['FIREBASE_DATABASE_URL', 'firebaseDatabaseUrl'],
};

const missingVars = Object.entries(envMap)
  .filter(([_key, aliases]) => {
    const val = firstEnv(...aliases);
    if (val) return false;
    // fall back to variables.ts values
    const key = aliases[0];
    switch (key) {
      case 'FIREBASE_API_KEY': return !VAR_FIREBASE_API_KEY;
      case 'FIREBASE_AUTH_DOMAIN': return !VAR_FIREBASE_AUTH_DOMAIN;
      case 'FIREBASE_PROJECT_ID': return !VAR_FIREBASE_PROJECT_ID;
      case 'FIREBASE_STORAGE_BUCKET': return !VAR_FIREBASE_STORAGE_BUCKET;
      case 'FIREBASE_MESSAGING_SENDER_ID': return !VAR_FIREBASE_MESSAGING_SENDER_ID;
      case 'FIREBASE_APP_ID': return !VAR_FIREBASE_APP_ID;
      case 'FIREBASE_MEASUREMENT_ID': return !VAR_FIREBASE_MEASUREMENT_ID;
      case 'FIREBASE_DATABASE_URL': return !VAR_FIREBASE_DATABASE_URL;
      default: return true;
    }
  })
  .map(([key]) => key);
if (missingVars.length > 0) {
  console.warn('⚠️  Missing Firebase environment variables:', missingVars.join(', '));
  console.warn('   Some Firebase features may not work properly.');
}

const measurementId = firstEnv(...(envMap.FIREBASE_MEASUREMENT_ID as string[])) || VAR_FIREBASE_MEASUREMENT_ID;

export const firebaseConfig = {
  apiKey: firstEnv(...envMap.FIREBASE_API_KEY as string[]) || VAR_FIREBASE_API_KEY || 'fake-api-key',
  authDomain: firstEnv(...envMap.FIREBASE_AUTH_DOMAIN as string[]) || VAR_FIREBASE_AUTH_DOMAIN || 'fake-project.firebaseapp.com',
  projectId: firstEnv(...envMap.FIREBASE_PROJECT_ID as string[]) || VAR_FIREBASE_PROJECT_ID || 'fake-project',
  storageBucket: firstEnv(...envMap.FIREBASE_STORAGE_BUCKET as string[]) || VAR_FIREBASE_STORAGE_BUCKET || 'fake-project.appspot.com',
  messagingSenderId: firstEnv(...envMap.FIREBASE_MESSAGING_SENDER_ID as string[]) || VAR_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: firstEnv(...envMap.FIREBASE_APP_ID as string[]) || VAR_FIREBASE_APP_ID || '1:123456789:web:fake',
  ...(measurementId ? { measurementId } : {})
};
