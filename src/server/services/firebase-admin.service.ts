// Load environment variables first if not already loaded
if (!process.env.FIREBASE_DATABASE_URL && typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (err) {
    console.warn('dotenv not available, continuing without it');
  }
}

import * as admin from 'firebase-admin';

// Helper to accept either uppercase or camelCase env keys
function firstEnv(...names: string[]) {
  for (const n of names) {
    if (typeof process.env[n] !== 'undefined' && process.env[n] !== '') return process.env[n];
  }
  return undefined;
}

// Validate required environment variables
function validateEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    { key: 'FIREBASE_PROJECT_ID', aliases: ['FIREBASE_PROJECT_ID', 'firebaseProjectId'] },
    { key: 'FIREBASE_DATABASE_URL', aliases: ['FIREBASE_DATABASE_URL', 'firebaseDatabaseUrl'] },
    { key: 'FIREBASE_CLIENT_EMAIL', aliases: ['FIREBASE_CLIENT_EMAIL', 'firebaseClientEmail'] },
    { key: 'FIREBASE_PRIVATE_KEY', aliases: ['FIREBASE_PRIVATE_KEY', 'firebasePrivateKey'] }
  ];

  const missingVars: string[] = [];

  for (const { key, aliases } of requiredVars) {
    if (!firstEnv(...aliases)) {
      missingVars.push(key);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Initialize Firebase Admin SDK
class FirebaseAdminService {
  private static instance: FirebaseAdminService;
  private initialized = false;
  private initializationError: Error | null = null;

  constructor() {
    if (FirebaseAdminService.instance) {
      return FirebaseAdminService.instance;
    }

    this.initializeFirebaseAdmin();
    FirebaseAdminService.instance = this;
  }

  private initializeFirebaseAdmin(): void {
    try {
      // Skip initialization if already initialized
      if (admin.apps.length > 0) {
        console.log('✅ Firebase Admin already initialized');
        this.initialized = true;
        return;
      }

      // Validate environment variables
      const { isValid, missingVars } = validateEnvironmentVariables();

      if (!isValid) {
        const errorMsg = `Missing required Firebase environment variables: ${missingVars.join(', ')}`;
        console.error('❌ Firebase Admin initialization failed:', errorMsg);
        console.error('   Please check your .env file and ensure all required variables are set.');
        this.initializationError = new Error(errorMsg);
        return;
      }

      // Build service account credentials from environment variables
      const saProjectId = firstEnv('FIREBASE_PROJECT_ID', 'firebaseProjectId')!;
      const saClientEmail = firstEnv('FIREBASE_CLIENT_EMAIL', 'firebaseClientEmail')!;
      const saPrivateKeyRaw = firstEnv('FIREBASE_PRIVATE_KEY', 'firebasePrivateKey')!;
      const databaseUrl = firstEnv('FIREBASE_DATABASE_URL', 'firebaseDatabaseUrl')!;

      // Private key in env commonly contains literal "\\n" sequences. Replace them with actual newlines.
      const privateKey = saPrivateKeyRaw.includes('\\n')
        ? saPrivateKeyRaw.replace(/\\n/g, '\n')
        : saPrivateKeyRaw;

      const serviceAccount: admin.ServiceAccount = {
        projectId: saProjectId,
        clientEmail: saClientEmail,
        privateKey,
      };

      const options: admin.AppOptions = {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseUrl,
        projectId: saProjectId,
      };

      admin.initializeApp(options);

      console.log('✅ Firebase Admin SDK initialized successfully');
      console.log(`   Project ID: ${saProjectId}`);
      console.log(`   Database URL: ${databaseUrl}`);
      console.log(`   Service Account: ${saClientEmail}`);

      this.initialized = true;
    } catch (error) {
      const errorMsg = `Firebase Admin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌', errorMsg);
      this.initializationError = new Error(errorMsg);
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getInitializationError(): Error | null {
    return this.initializationError;
  }

  public throwIfNotInitialized(): void {
    if (!this.initialized) {
      throw this.initializationError || new Error('Firebase Admin SDK not initialized');
    }
  }
}

// Create singleton instance
const firebaseAdminService = new FirebaseAdminService();

// Export Firebase Admin Database with proper error handling
export const getAdminDatabase = () => {
  firebaseAdminService.throwIfNotInitialized();

  try {
    return admin.database();
  } catch (error) {
    throw new Error(`Failed to get Firebase Admin Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export Firebase Admin Auth with proper error handling
export const getAdminAuth = (): admin.auth.Auth => {
  firebaseAdminService.throwIfNotInitialized();

  try {
    return admin.auth();
  } catch (error) {
    throw new Error(`Failed to get Firebase Admin Auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export Firebase Admin Firestore with proper error handling
export const getAdminFirestore = () => {
  firebaseAdminService.throwIfNotInitialized();

  try {
    return admin.firestore();
  } catch (error) {
    throw new Error(`Failed to get Firebase Admin Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Legacy exports for backward compatibility
export const adminDb = (() => {
  try {
    if (firebaseAdminService.isInitialized()) {
      return getAdminDatabase();
    }

    console.warn('⚠️  Firebase Admin not initialized, using mock database');
    return {
      ref: (path: string) => ({
        set: (data: any) => {
          console.log(`💾 Mock DB SET ${path}:`, JSON.stringify(data, null, 2));
          return Promise.resolve();
        },
        get: () => Promise.resolve({ val: () => null }),
        push: () => ({ key: 'mock-key' }),
        remove: () => Promise.resolve(),
        update: (_data: any) => Promise.resolve(),
        once: () => Promise.resolve({ val: () => null }),
        on: () => () => { },
        off: () => { }
      })
    } as any;
  } catch (err: any) {
    console.warn('⚠️  Database initialization failed, using mock:', err.message);
    return {
      ref: (path: string) => ({
        set: (data: any) => {
          console.log(`💾 Mock DB SET ${path}:`, JSON.stringify(data, null, 2));
          return Promise.resolve();
        },
        get: () => Promise.resolve({ val: () => null })
      })
    } as any;
  }
})();

export const safeAdminAuth = () => {
  try {
    return getAdminAuth();
  } catch (err: any) {
    console.warn('Firebase Admin Auth not available:', err.message);
    console.warn('Running in limited mode - user operations will be simulated');
    // Return a mock auth object that simulates successful operations
    return {
      getUser: (uid: string) => Promise.reject(new Error(`User ${uid} not found in test mode`)),
      createUser: (userData: any) => Promise.resolve({ uid: userData.uid || 'test-uid', displayName: userData.displayName }),
      updateUser: (uid: string, userData: any) => Promise.resolve({ uid, ...userData }),
      deleteUser: (_uid: string) => Promise.resolve(),
      listUsers: () => Promise.resolve({ users: [] })
    } as any;
  }
};

// Export the service instance and admin for advanced usage
export { firebaseAdminService, admin };
