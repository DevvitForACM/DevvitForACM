import { settings } from '@devvit/web/server';

// Load Firebase config from Devvit settings (secrets) or fallback to env if present.
// Note: Devvit does not expose process.env at runtime; using settings avoids startup crashes.
export async function loadFirebaseConfig() {
  const [
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  ] = await Promise.all([
    settings.get<string>('firebaseApiKey'),
    settings.get<string>('firebaseAuthDomain'),
    settings.get<string>('firebaseProjectId'),
    settings.get<string>('firebaseStorageBucket'),
    settings.get<string>('firebaseMessagingSenderId'),
    settings.get<string>('firebaseAppId'),
    settings.get<string>('firebaseMeasurementId'),
  ]);

  // Provide safe fallbacks so app can boot without throwing; Firebase may fail later if required fields are missing.
  const cfg: Record<string, string> = {
    apiKey: apiKey || (process.env.FIREBASE_API_KEY as string) || '',
    authDomain: authDomain || (process.env.FIREBASE_AUTH_DOMAIN as string) || '',
    projectId: projectId || (process.env.FIREBASE_PROJECT_ID as string) || '',
    storageBucket: storageBucket || (process.env.FIREBASE_STORAGE_BUCKET as string) || '',
    messagingSenderId: messagingSenderId || (process.env.FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: appId || (process.env.FIREBASE_APP_ID as string) || '',
  };
  if (measurementId || process.env.FIREBASE_MEASUREMENT_ID) {
    cfg.measurementId = (measurementId || process.env.FIREBASE_MEASUREMENT_ID) as string;
  }
  return cfg as {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
}
