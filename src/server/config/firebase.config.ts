const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
] as const;

// Check for missing environment variables but don't fail startup
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.warn('⚠️  Missing Firebase environment variables:', missingVars.join(', '));
  console.warn('   Some Firebase features may not work properly.');
}

export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'fake-api-key',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'fake-project.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'fake-project',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'fake-project.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_APP_ID || '1:123456789:web:fake',
  ...(process.env.FIREBASE_MEASUREMENT_ID && { measurementId: process.env.FIREBASE_MEASUREMENT_ID })
};
