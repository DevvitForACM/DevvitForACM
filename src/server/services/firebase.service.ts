import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  query,
  orderByChild,
  limitToLast,
  limitToFirst,
  startAt,
  endAt,
  onValue,
  DataSnapshot,
  Database,
} from 'firebase/database';
import { firebaseConfig } from '../config/firebase.config';

interface QueryOptions {
  orderBy?: string;
  limitToLast?: number;
  limitToFirst?: number;
  startAt?: any;
  endAt?: any;
}

export class FirebaseService {
  private database!: Database;
  private static instance: FirebaseService;

  constructor() {
    if (FirebaseService.instance) {
      return FirebaseService.instance;
    }

    this.initializeFirebase();
    FirebaseService.instance = this;
  }

  private initializeFirebase() {
    try {
      const app = initializeApp(firebaseConfig);
      this.database = getDatabase(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw new Error('Firebase initialization failed');
    }
  }

  async set(path: string, data: any): Promise<void> {
    try {
      const dbRef = ref(this.database, path);
      await set(dbRef, data);
    } catch (error) {
      console.error(`Error setting data at path ${path}:`, error);
      throw error;
    }
  }

  async get(path: string): Promise<DataSnapshot> {
    try {
      const dbRef = ref(this.database, path);
      return await get(dbRef);
    } catch (error) {
      console.error(`Error getting data from path ${path}:`, error);
      throw error;
    }
  }

  async query(path: string, options: QueryOptions): Promise<DataSnapshot> {
    try {
      let dbQuery = query(ref(this.database, path));

      if (options.orderBy) {
        dbQuery = query(dbQuery, orderByChild(options.orderBy));
      }

      if (options.limitToLast) {
        dbQuery = query(dbQuery, limitToLast(options.limitToLast));
      }

      if (options.limitToFirst) {
        dbQuery = query(dbQuery, limitToFirst(options.limitToFirst));
      }

      if (options.startAt !== undefined) {
        dbQuery = query(dbQuery, startAt(options.startAt));
      }

      if (options.endAt !== undefined) {
        dbQuery = query(dbQuery, endAt(options.endAt));
      }

      return await get(dbQuery);
    } catch (error) {
      console.error(`Error querying data from path ${path}:`, error);
      throw error;
    }
  }

  onValue(
    path: string,
    options: QueryOptions,
    callback: (snapshot: DataSnapshot) => void
  ): () => void {
    try {
      let dbQuery = query(ref(this.database, path));

      if (options.orderBy) {
        dbQuery = query(dbQuery, orderByChild(options.orderBy));
      }

      if (options.limitToLast) {
        dbQuery = query(dbQuery, limitToLast(options.limitToLast));
      }

      if (options.limitToFirst) {
        dbQuery = query(dbQuery, limitToFirst(options.limitToFirst));
      }

      if (options.startAt !== undefined) {
        dbQuery = query(dbQuery, startAt(options.startAt));
      }

      if (options.endAt !== undefined) {
        dbQuery = query(dbQuery, endAt(options.endAt));
      }

      const unsubscribe = onValue(dbQuery, callback);
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up listener for path ${path}:`, error);
      throw error;
    }
  }
}
