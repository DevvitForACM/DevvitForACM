// Helper to lookup environment variables by multiple aliases. This allows
// the server to accept either uppercase/SNAKE_CASE names or camelCase names
// (used in the Devvit `devvit.json` settings) without forcing a change to
// the hosting configuration immediately.
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
  .filter(([_key, aliases]) => !firstEnv(...aliases))
  .map(([key]) => key);
if (missingVars.length > 0) {
  console.warn('⚠️  Missing Firebase environment variables:', missingVars.join(', '));
  console.warn('   Some Firebase features may not work properly.');
}

const measurementId = firstEnv(...(envMap.FIREBASE_MEASUREMENT_ID as string[]));

export const firebaseConfig = {
  apiKey: firstEnv(...envMap.FIREBASE_API_KEY as string[]) || 'fake-api-key',
  authDomain: firstEnv(...envMap.FIREBASE_AUTH_DOMAIN as string[]) || 'fake-project.firebaseapp.com',
  projectId: firstEnv(...envMap.FIREBASE_PROJECT_ID as string[]) || 'fake-project',
  storageBucket: firstEnv(...envMap.FIREBASE_STORAGE_BUCKET as string[]) || 'fake-project.appspot.com',
  messagingSenderId: firstEnv(...envMap.FIREBASE_MESSAGING_SENDER_ID as string[]) || '123456789',
  appId: firstEnv(...envMap.FIREBASE_APP_ID as string[]) || '1:123456789:web:fake',
  ...(measurementId ? { measurementId } : {})
};
