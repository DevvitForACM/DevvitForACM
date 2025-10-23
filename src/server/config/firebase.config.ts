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
  FIREBASE_CLIENT_EMAIL: ['FIREBASE_CLIENT_EMAIL', 'firebaseClientEmail'],
  FIREBASE_PRIVATE_KEY: ['FIREBASE_PRIVATE_KEY', 'firebasePrivateKey'],
};

// Separate client-side and admin-side required variables
const clientRequiredVars = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'];
const adminRequiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_DATABASE_URL', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];

const missingClientVars = clientRequiredVars.filter(key => !firstEnv(...(envMap[key] as string[])));
const missingAdminVars = adminRequiredVars.filter(key => !firstEnv(...(envMap[key] as string[])));

if (missingClientVars.length > 0) {
  console.warn('⚠️  Missing Firebase client environment variables:', missingClientVars.join(', '));
  console.warn('   Client-side Firebase features may not work properly.');
}

if (missingAdminVars.length > 0) {
  console.warn('⚠️  Missing Firebase Admin environment variables:', missingAdminVars.join(', '));
  console.warn('   Server-side admin operations may not work properly.');
}

const measurementId = firstEnv(...(envMap.FIREBASE_MEASUREMENT_ID as string[]));
const databaseURL = firstEnv(...(envMap.FIREBASE_DATABASE_URL as string[]));

export const firebaseConfig = {
  apiKey: firstEnv(...envMap.FIREBASE_API_KEY as string[]) || 'fake-api-key',
  authDomain: firstEnv(...envMap.FIREBASE_AUTH_DOMAIN as string[]) || 'fake-project.firebaseapp.com',
  projectId: firstEnv(...envMap.FIREBASE_PROJECT_ID as string[]) || 'fake-project',
  storageBucket: firstEnv(...envMap.FIREBASE_STORAGE_BUCKET as string[]) || 'fake-project.appspot.com',
  messagingSenderId: firstEnv(...envMap.FIREBASE_MESSAGING_SENDER_ID as string[]) || '123456789',
  appId: firstEnv(...envMap.FIREBASE_APP_ID as string[]) || '1:123456789:web:fake',
  ...(measurementId ? { measurementId } : {}),
  ...(databaseURL ? { databaseURL } : {})
};

// Export admin-specific configuration
export const firebaseAdminConfig = {
  projectId: firstEnv(...envMap.FIREBASE_PROJECT_ID as string[]),
  databaseURL: firstEnv(...envMap.FIREBASE_DATABASE_URL as string[]),
  clientEmail: firstEnv(...envMap.FIREBASE_CLIENT_EMAIL as string[]),
  privateKey: firstEnv(...envMap.FIREBASE_PRIVATE_KEY as string[])
};
