import { firebaseAdminService, getAdminDatabase, getAdminAuth, getAdminFirestore } from '../services/firebase-admin.service';

export interface FirebaseHealthStatus {
  initialized: boolean;
  database: boolean;
  auth: boolean;
  firestore: boolean;
  error?: string;
}

/**
 * Perform a health check on Firebase Admin SDK services
 */
export async function checkFirebaseHealth(): Promise<FirebaseHealthStatus> {
  const status: FirebaseHealthStatus = {
    initialized: false,
    database: false,
    auth: false,
    firestore: false
  };

  try {
    // Check if Firebase Admin is initialized
    status.initialized = firebaseAdminService.isInitialized();
    
    if (!status.initialized) {
      const error = firebaseAdminService.getInitializationError();
      status.error = error?.message || 'Firebase Admin not initialized';
      return status;
    }

    // Test database connection
    try {
      const db = getAdminDatabase();
      await db.ref('.info/connected').once('value');
      status.database = true;
    } catch (error) {
      console.warn('Database health check failed:', error);
    }

    // Test auth service
    try {
      const auth = getAdminAuth();
      // Just check if we can access the auth service without making actual calls
      if (auth && typeof auth.listUsers === 'function') {
        status.auth = true;
      }
    } catch (error) {
      console.warn('Auth health check failed:', error);
    }

    // Test Firestore connection
    try {
      const firestore = getAdminFirestore();
      // Just check if we can access the firestore service
      if (firestore && typeof firestore.collection === 'function') {
        status.firestore = true;
      }
    } catch (error) {
      console.warn('Firestore health check failed:', error);
    }

  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown error during health check';
  }

  return status;
}

/**
 * Log Firebase health status to console
 */
export async function logFirebaseHealth(): Promise<void> {
  console.log('🔍 Checking Firebase Admin SDK health...');
  
  const health = await checkFirebaseHealth();
  
  if (health.initialized) {
    console.log('✅ Firebase Admin SDK initialized');
    console.log(`   Database: ${health.database ? '✅' : '❌'}`);
    console.log(`   Auth: ${health.auth ? '✅' : '❌'}`);
    console.log(`   Firestore: ${health.firestore ? '✅' : '❌'}`);
  } else {
    console.log('❌ Firebase Admin SDK not initialized');
    if (health.error) {
      console.log(`   Error: ${health.error}`);
    }
  }
}