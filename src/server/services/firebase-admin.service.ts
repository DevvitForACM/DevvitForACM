// Load environment variables first if not already loaded
if (!process.env.FIREBASE_DATABASE_URL && typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (err) {
    console.warn('dotenv not available, continuing without it');
  }
}

// Helper to accept either uppercase or camelCase env keys
function firstEnv(...names: string[]) {
  for (const n of names) {
    if (typeof process.env[n] !== 'undefined' && process.env[n] !== '') return process.env[n];
  }
  return undefined;
}

import * as admin from 'firebase-admin';
// no filesystem imports needed; credentials come from environment variables

// Build service account credentials from environment variables if provided.
// Required fields for a service account credential are project_id, client_email and private_key.
let serviceAccount: admin.ServiceAccount | undefined;
const saProjectId = firstEnv('FIREBASE_PROJECT_ID', 'firebaseProjectId');
const saClientEmail = firstEnv('FIREBASE_CLIENT_EMAIL', 'FIREBASE_CLIENT_EMAIL', 'firebaseClientEmail');
const saPrivateKeyRaw = firstEnv('FIREBASE_PRIVATE_KEY', 'firebasePrivateKey');
if (saClientEmail && saPrivateKeyRaw && saProjectId) {
  // Private key in env commonly contains literal "\\n" sequences. Replace them with actual newlines.
  const privateKey = saPrivateKeyRaw.includes('\\n') ? saPrivateKeyRaw.replace(/\\n/g, '\n') : saPrivateKeyRaw;
  serviceAccount = {
    projectId: saProjectId,
    clientEmail: saClientEmail,
    privateKey,
  } as admin.ServiceAccount;
  console.log('✅ Using Firebase service account from environment variables');
} else {
  console.log('⚠️  Firebase service account environment variables not fully provided (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
  console.log('   Falling back to application default credentials or limited test mode.');
}

let firebaseInitialized = false;

if (!admin.apps.length) {
  const options: admin.AppOptions = {};

  // Always set database URL if available
  const databaseUrl = firstEnv('FIREBASE_DATABASE_URL', 'firebaseDatabaseUrl');
  if (databaseUrl) {
    options.databaseURL = databaseUrl;
    console.log('Using Firebase Database URL:', databaseUrl);
  }

  // Set project ID from environment
  if (saProjectId) {
    options.projectId = saProjectId;
    console.log('✅ Using Firebase Project ID:', saProjectId);
  }

  if (serviceAccount) {
  options.credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
  console.log('✅ Using service account (from env) for Firebase Admin');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  options.credential = admin.credential.applicationDefault();
  console.log('✅ Using application default credentials for Firebase Admin');
  } else {
    // For development/testing, initialize without credentials but with project info
    console.log('⚠️  No service account provided, initializing Firebase Admin for database-only access');
    console.log('   User authentication will work in limited mode.');
  }

  try {
    admin.initializeApp(options);
    console.log('Firebase Admin initialized');
    firebaseInitialized = true;
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err);
    console.log('   Will run in test mode. Some features may not work.');
    // Don't throw - allow server to start for testing
  }
}

// Export a guarded adminDb to provide a clearer error when the DB isn't available or not initialized.
export const adminDb = (() => {
  try {
    if (firebaseInitialized && admin.apps && admin.apps.length > 0) {
      // Try to use real database if Firebase is initialized
      if (typeof (admin as any).database === 'function') {
        console.log('Using real Firebase Realtime Database');
        return (admin as any).database();
      }
    }
    
    console.warn('Using mock database - data will not persist');
    return {
      ref: (path: string) => ({
        set: (data: any) => {
          console.log(`Mock DB SET ${path}:`, JSON.stringify(data, null, 2));
          return Promise.resolve();
        },
        get: () => Promise.resolve({ val: () => null })
      })
    } as any;
  } catch (err: any) {
    console.warn('Database initialization failed, using mock:', err.message);
    return {
      ref: (path: string) => ({
        set: (data: any) => {
          console.log(`Mock DB SET ${path}:`, JSON.stringify(data, null, 2));
          return Promise.resolve();
        },
        get: () => Promise.resolve({ val: () => null })
      })
    } as any;
  }
})();

// Safe wrapper for admin.auth() that handles initialization errors
export const safeAdminAuth = () => {
  try {
    if (!firebaseInitialized || !admin.apps || !admin.apps.length) {
      throw new Error('Firebase Admin not initialized - running in test mode');
    }
    // Try to get auth, but it might fail without proper credentials
    return admin.auth();
  } catch (err: any) {
    console.warn('Firebase Admin Auth not available:', err.message);
    console.warn('Running in limited mode - user creation will be simulated');
    // Return a mock auth object that simulates successful operations
    return {
      getUser: (uid: string) => Promise.reject(new Error(`User ${uid} not found in test mode`)),
      createUser: (userData: any) => Promise.resolve({ uid: userData.uid || 'test-uid', displayName: userData.displayName })
    } as any;
  }
};

export {admin};
