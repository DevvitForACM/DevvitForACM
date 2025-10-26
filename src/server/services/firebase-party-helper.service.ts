import { adminDb, admin as firebaseAdmin } from './firebase-admin.service.js';

export const admin = {
  async initialize() {
    return Promise.resolve();
  },

  async setRealtimeData(path, data) {
    await adminDb.ref(path).set(data);
  },

  async setFirestoreDoc(collection, docId, data) {
    if (firebaseAdmin && firebaseAdmin.apps && firebaseAdmin.apps.length > 0) {
      await firebaseAdmin.firestore().collection(collection).doc(docId).set(data);
    }
  },

  async updateRealtimeData(path, updates) {
    await adminDb.ref(path).update(updates);
  },

  async updateFirestoreDoc(collection, docId, updates) {
    if (firebaseAdmin && firebaseAdmin.apps && firebaseAdmin.apps.length > 0) {
      await firebaseAdmin.firestore().collection(collection).doc(docId).update(updates);
    }
  },

  async getRealtimeData(path) {
    const snapshot = await adminDb.ref(path).get();
    return snapshot.val();
  },

  async queryFirestore(collection, field, operator, value) {
    if (firebaseAdmin && firebaseAdmin.apps && firebaseAdmin.apps.length > 0) {
      let query = firebaseAdmin.firestore().collection(collection);
      
      if (field && operator && value !== undefined) {
        query = query.where(field, operator, value);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
  }
};