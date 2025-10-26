// Load environment variables first if not already loaded
if (!process.env.FIREBASE_DATABASE_URL && typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (err) {
    console.warn('dotenv not available, continuing without it');
  }
}

import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Look for serviceAccountKey.json in project root (E:\devvit\DevvitForACM\serviceAccountKey.json)
// This works for both dev and built code since we use an absolute path from cwd
const projectRoot = process.cwd();
const serviceAccountPath = path.join(projectRoot, 'serviceAccountKey.json');
let serviceAccount: any | undefined;

if (fs.existsSync(serviceAccountPath)) {
  // Load local service account if present (convenience for local dev)
  // Keep this file out of source control.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as any;
  console.log('Loaded service account from:', serviceAccountPath);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as any;
    console.log('Loaded service account from environment variable');
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
  }
} else {
  console.log('serviceAccountKey.json not found at:', serviceAccountPath);
  console.log('   Place your Firebase service account JSON at the project root, or set GOOGLE_APPLICATION_CREDENTIALS env var');
}

let firebaseInitialized = false;

if (!admin.apps.length) {
  const options: any = {};

  // Always set database URL if available
  const databaseUrl = process.env.FIREBASE_DATABASE_URL;
  if (databaseUrl) {
    options.databaseURL = databaseUrl;
    console.log('Using Firebase Database URL:', databaseUrl);
  }

  // Set project ID from environment
  if (process.env.FIREBASE_PROJECT_ID) {
    options.projectId = process.env.FIREBASE_PROJECT_ID;
    console.log('Using Firebase Project ID:', process.env.FIREBASE_PROJECT_ID);
  }

  if (serviceAccount) {
    options.credential = (admin as any).credential.cert(serviceAccount as any);
    console.log('Using service account for Firebase Admin');

  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.credential = (admin as any).credential.applicationDefault();
    console.log('Using application default credentials for Firebase Admin');

  } else {
    // For development/testing, initialize without credentials but with project info
    console.log('No service account found, initializing Firebase Admin for database-only access');
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

export { admin };
